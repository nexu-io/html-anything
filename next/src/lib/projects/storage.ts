import { randomBytes } from "node:crypto";
import { constants as fsConstants, type BigIntStats } from "node:fs";
import {
  lstat,
  link,
  mkdir,
  open,
  realpath,
  rename,
  unlink,
} from "node:fs/promises";
import path from "node:path";
import {
  PROJECT_CONTENT_MAX_BYTES,
  PROJECT_DIAGNOSTIC_MAX_BYTES,
  PROJECT_HTML_MAX_BYTES,
  PROJECT_PROMPT_MAX_BYTES,
  ProjectError,
  type CreateProjectInput,
  type PatchProjectInput,
  type ProjectDocument,
  type ProjectSnapshot,
  type ReadyProjectResponse,
  type RegistryRecord,
  type SourceRecord,
  parseCreateProjectInput,
  parsePatchProjectInput,
  validateProjectId,
} from "./contracts";
import {
  type ArtifactPaths,
  resolveArtifactPaths,
  resolveWorkspaceRoot,
  validateSourceRecords,
} from "./paths";

const DIRECTORY_MODE = 0o700;
const FILE_MODE = 0o600;
const PROJECT_DOCUMENT_MAX_BYTES = 256 * 1024;
const REGISTRY_RECORD_MAX_BYTES = 16 * 1024;
const encoder = new TextEncoder();
const decoder = new TextDecoder("utf-8", { fatal: true });

export type PreparedProject = Readonly<{
  input: Readonly<Omit<CreateProjectInput, "sourceFiles">> & {
    readonly sourceFiles: readonly SourceRecord[];
  };
  paths: Readonly<ArtifactPaths>;
  project: Readonly<Omit<ProjectDocument, "sources">> & {
    readonly sources: readonly SourceRecord[];
  };
}>;

export type ProjectStore = {
  prepare(input: CreateProjectInput, prompt: string): Promise<PreparedProject>;
  markReady(
    prepared: PreparedProject,
    html: string,
  ): Promise<ReadyProjectResponse>;
  markFailed(prepared: PreparedProject, diagnostic: string): Promise<void>;
  get(id: string): Promise<ProjectSnapshot>;
  patch(id: string, patch: PatchProjectInput): Promise<ProjectSnapshot>;
  unregister(id: string): Promise<void>;
  findReadyCreation(
    input: CreateProjectInput,
  ): Promise<ReadyProjectResponse | null>;
};

export type ProjectStoreOptions = {
  registryRoot: string;
  publicBaseUrl: string;
  now: () => Date;
};

type RegisteredProject = {
  registryPath: string;
  registryBytes: Buffer;
  registryIdentity: BigIntStats;
  registry: RegistryRecord;
  paths: ArtifactPaths;
  project: ProjectDocument;
  content: string;
  html: string;
};

type SafeFileState = {
  bytes: Buffer;
  identity: BigIntStats;
};

export function createProjectStore(options: ProjectStoreOptions): ProjectStore {
  const registryRoot = validateRegistryRoot(options.registryRoot);
  const publicBaseUrl = validatePublicBaseUrl(options.publicBaseUrl);
  if (typeof options.now !== "function") {
    throw configurationError("Project storage clock is not configured.");
  }
  const preparedProjects = new WeakSet<object>();
  const mutationTails = new Map<string, Promise<void>>();

  function serializeProjectMutation<T>(
    projectId: string,
    operation: () => Promise<T>,
  ): Promise<T> {
    const previous = mutationTails.get(projectId) ?? Promise.resolve();
    const result = previous.then(operation);
    const tail = result.then(
      () => undefined,
      () => undefined,
    );
    mutationTails.set(projectId, tail);
    void tail.then(() => {
      if (mutationTails.get(projectId) === tail) mutationTails.delete(projectId);
    });
    return result;
  }

  return {
    async prepare(input, prompt) {
      const parsed = parseCreateProjectInput(input);
      validateBoundedString(prompt, PROJECT_PROMPT_MAX_BYTES, "prompt");

      return serializeProjectMutation(parsed.projectId, async () => {
        let paths = await resolveArtifactPaths(parsed.workspaceRoot, parsed.slug);
        const sources = await validateSourceRecords(
          paths.workspaceRoot,
          parsed.sourceFiles,
        );
        paths = await resolveArtifactPaths(paths.workspaceRoot, parsed.slug);
        const canonicalInput: CreateProjectInput = {
          ...parsed,
          workspaceRoot: paths.workspaceRoot,
          sourceFiles: sources,
        };
        const timestamp = timestampNow(options.now);
        const project: ProjectDocument = {
          schemaVersion: 1,
          projectId: canonicalInput.projectId,
          slug: canonicalInput.slug,
          name: canonicalInput.name,
          instruction: canonicalInput.instruction,
          templateId: canonicalInput.templateId,
          format: canonicalInput.format,
          agent: canonicalInput.agent,
          sources,
          status: "generating",
          createdAt: timestamp,
          updatedAt: timestamp,
          ...(canonicalInput.model === undefined
            ? {}
            : { model: canonicalInput.model }),
        };

        try {
          await createRegistryDirectory(registryRoot);
          await createArtifactParents(paths);
          paths = await resolveArtifactPaths(
            paths.workspaceRoot,
            pathsToSlug(paths),
          );
          await createProjectDirectory(paths.artifactDirectory);
          await atomicReplace(paths.promptPath, encode(prompt), paths);
          await atomicReplace(
            paths.contentPath,
            encode(canonicalInput.content),
            paths,
          );
          await atomicReplace(paths.projectPath, serializeJson(project), paths);
        } catch (error) {
          if (isAlreadyExists(error)) {
            throw new ProjectError(
              "project_exists",
              "Project artifacts already exist.",
            );
          }
          if (error instanceof ProjectError) throw error;
          throw storageError();
        }

        const prepared: PreparedProject = Object.freeze({
          input: Object.freeze({
            ...canonicalInput,
            sourceFiles: Object.freeze([...sources]),
          }),
          paths: Object.freeze({ ...paths }),
          project: Object.freeze({
            ...project,
            sources: Object.freeze([...sources]),
          }),
        });
        preparedProjects.add(prepared);
        return prepared;
      });
    },

    async markReady(prepared, html) {
      parsePatchProjectInput({ html });
      assertOwnedPrepared(preparedProjects, prepared);
      return serializeProjectMutation(prepared.input.projectId, async () => {
        try {
          const current = await readPreparedProject(prepared);
          assertGeneratingProject(current, prepared);
          await atomicReplace(
            prepared.paths.htmlPath,
            encode(html),
            prepared.paths,
          );

          const readyProject: ProjectDocument = {
            ...current,
            status: "ready",
            updatedAt: timestampNow(options.now),
          };
          delete readyProject.diagnostic;
          await atomicReplace(
            prepared.paths.projectPath,
            serializeJson(readyProject),
            prepared.paths,
          );

          const registryPath = await prepareRegistryPath(
            registryRoot,
            prepared.input.projectId,
            true,
          );
          const registry: RegistryRecord = {
            schemaVersion: 1,
            projectId: prepared.input.projectId,
            workspaceRoot: prepared.paths.workspaceRoot,
            artifactDirectory: prepared.paths.artifactDirectory,
            registeredAt: timestampNow(options.now),
          };
          await publishRegistry(
            registryPath,
            serializeJson(registry),
            registryRoot,
          );

          const registered = await loadRegisteredProject(
            registryRoot,
            prepared.input.projectId,
          );
          return readyResponse(registered, publicBaseUrl);
        } catch (error) {
          if (error instanceof ProjectError && error.code === "project_exists") {
            throw error;
          }
          throw asStorageError(error);
        }
      });
    },

    async markFailed(prepared, diagnostic) {
      if (typeof diagnostic !== "string") {
        throw new ProjectError("invalid_request", "Project diagnostic is invalid.");
      }
      assertOwnedPrepared(preparedProjects, prepared);
      return serializeProjectMutation(prepared.input.projectId, async () => {
        try {
          const current = await readPreparedProject(prepared);
          assertGeneratingProject(current, prepared);
          if (await pathExists(prepared.paths.htmlPath)) {
            throw storageError();
          }
          const failedProject: ProjectDocument = {
            ...current,
            status: "failed",
            updatedAt: timestampNow(options.now),
            diagnostic: truncateUtf8(diagnostic, PROJECT_DIAGNOSTIC_MAX_BYTES),
          };
          await atomicReplace(
            prepared.paths.projectPath,
            serializeJson(failedProject),
            prepared.paths,
          );
        } catch (error) {
          throw asStorageError(error);
        }
      });
    },

    async get(id) {
      const registered = await loadRegisteredProject(registryRoot, id);
      return snapshot(registered, publicBaseUrl);
    },

    async patch(id, patch) {
      const parsedPatch = parsePatchProjectInput(patch);
      const projectId = validateProjectId(id);
      return serializeProjectMutation(projectId, async () => {
        const registered = await loadRegisteredProject(registryRoot, projectId);
        try {
          if (parsedPatch.content !== undefined) {
            await assertRegisteredPathsCurrent(registryRoot, registered);
            await atomicReplace(
              registered.paths.contentPath,
              encode(parsedPatch.content),
              registered.paths,
              () => assertRegistryCapabilityCurrent(registryRoot, registered),
            );
          }
          if (parsedPatch.html !== undefined) {
            await assertRegisteredPathsCurrent(registryRoot, registered);
            await atomicReplace(
              registered.paths.htmlPath,
              encode(parsedPatch.html),
              registered.paths,
              () => assertRegistryCapabilityCurrent(registryRoot, registered),
            );
          }

          const project: ProjectDocument = {
            ...registered.project,
            ...(parsedPatch.templateId === undefined
              ? {}
              : { templateId: parsedPatch.templateId }),
            updatedAt: timestampNow(options.now),
          };
          await assertRegisteredPathsCurrent(registryRoot, registered);
          await atomicReplace(
            registered.paths.projectPath,
            serializeJson(project),
            registered.paths,
            () => assertRegistryCapabilityCurrent(registryRoot, registered),
          );
          return snapshot(
            await loadRegisteredProject(
              registryRoot,
              registered.project.projectId,
            ),
            publicBaseUrl,
          );
        } catch (error) {
          throw asStorageError(error);
        }
      });
    },

    async unregister(id) {
      const projectId = validateProjectId(id);
      return serializeProjectMutation(projectId, async () => {
        const registered = await loadRegisteredProject(registryRoot, projectId);
        try {
          await assertRegisteredPathsCurrent(registryRoot, registered);
          await assertRegistryCapabilityCurrent(registryRoot, registered);
          await unlink(registered.registryPath);
          await syncDirectory(registryRoot);
        } catch (error) {
          if (isMissing(error)) throw projectNotFound();
          throw asStorageError(error);
        }
      });
    },

    async findReadyCreation(input) {
      const parsed = parseCreateProjectInput(input);
      let registered: RegisteredProject;
      try {
        registered = await loadRegisteredProject(registryRoot, parsed.projectId);
      } catch (error) {
        if (error instanceof ProjectError && error.code === "project_not_found") {
          return null;
        }
        throw error;
      }

      let workspaceRoot: string;
      try {
        workspaceRoot = await resolveWorkspaceRoot(parsed.workspaceRoot);
      } catch {
        throw new ProjectError("project_exists", "Project ID is already in use.");
      }
      if (!sameImmutableCreation(parsed, workspaceRoot, registered)) {
        throw new ProjectError("project_exists", "Project ID is already in use.");
      }
      return readyResponse(registered, publicBaseUrl);
    },
  };
}

async function readPreparedProject(
  prepared: PreparedProject,
): Promise<ProjectDocument> {
  await revalidateArtifactPaths(prepared.paths, true);
  await assertArtifactFile(prepared.paths, prepared.paths.promptPath);
  await assertArtifactFile(prepared.paths, prepared.paths.contentPath);
  const project = parseProjectDocument(
    await readSafeFile(
      prepared.paths.projectPath,
      PROJECT_DOCUMENT_MAX_BYTES,
      FILE_MODE,
    ),
  );
  return project;
}

async function assertRegisteredPathsCurrent(
  registryRoot: string,
  registered: RegisteredProject,
): Promise<void> {
  await assertRegistryCapabilityCurrent(registryRoot, registered);
  await revalidateArtifactPaths(registered.paths, true);
  for (const filePath of [
    registered.paths.promptPath,
    registered.paths.contentPath,
    registered.paths.projectPath,
    registered.paths.htmlPath,
  ]) {
    await assertRealFile(filePath, registered.paths.workspaceRoot, FILE_MODE);
  }
}

async function assertRegistryCapabilityCurrent(
  registryRoot: string,
  registered: RegisteredProject,
): Promise<void> {
  await assertRegistryFile(registryRoot, registered.registryPath);
  const current = await readSafeFileState(
    registered.registryPath,
    REGISTRY_RECORD_MAX_BYTES,
    FILE_MODE,
  );
  parseRegistryRecord(current.bytes, registered.registry.projectId);
  if (
    !isSameFile(current.identity, registered.registryIdentity) ||
    !current.bytes.equals(registered.registryBytes)
  ) {
    throw storageError();
  }
}

async function loadRegisteredProject(
  registryRoot: string,
  id: string,
): Promise<RegisteredProject> {
  const projectId = validateProjectId(id);
  let registryPath: string;
  let registryState: SafeFileState;
  try {
    registryPath = await prepareRegistryPath(registryRoot, projectId, false);
    registryState = await readSafeFileState(
      registryPath,
      REGISTRY_RECORD_MAX_BYTES,
      FILE_MODE,
    );
  } catch (error) {
    if (isMissing(error)) throw projectNotFound();
    throw asStorageError(error);
  }
  const registry = parseRegistryRecord(registryState.bytes, projectId);

  let paths: ArtifactPaths;
  try {
    const workspaceRoot = await resolveWorkspaceRoot(registry.workspaceRoot);
    if (workspaceRoot !== registry.workspaceRoot) throw storageError();
    await assertRealDirectory(registry.artifactDirectory, workspaceRoot, DIRECTORY_MODE);
    paths = await resolveArtifactPaths(
      workspaceRoot,
      path.basename(registry.artifactDirectory),
    );
    if (paths.artifactDirectory !== registry.artifactDirectory) {
      throw storageError();
    }
  } catch (error) {
    if (isMissing(error)) throw projectNotFound();
    if (error instanceof ProjectError && error.code === "project_not_found") {
      throw error;
    }
    throw asStorageError(error);
  }

  try {
    await revalidateArtifactPaths(paths, true);
    await assertArtifactFile(paths, paths.promptPath);
    const [projectBytes, contentBytes, htmlBytes] = await Promise.all([
      readSafeFile(paths.projectPath, PROJECT_DOCUMENT_MAX_BYTES, FILE_MODE),
      readSafeFile(paths.contentPath, PROJECT_CONTENT_MAX_BYTES, FILE_MODE),
      readSafeFile(paths.htmlPath, PROJECT_HTML_MAX_BYTES, FILE_MODE),
    ]);
    const project = parseProjectDocument(projectBytes);
    if (
      project.projectId !== projectId ||
      project.slug !== pathsToSlug(paths) ||
      project.status !== "ready"
    ) {
      throw storageError();
    }
    return {
      registryPath,
      registryBytes: registryState.bytes,
      registryIdentity: registryState.identity,
      registry,
      paths,
      project,
      content: decode(contentBytes),
      html: decode(htmlBytes),
    };
  } catch (error) {
    if (isMissing(error)) throw projectNotFound();
    throw asStorageError(error);
  }
}

function snapshot(
  registered: RegisteredProject,
  publicBaseUrl: string,
): ProjectSnapshot {
  return {
    project: registered.project,
    content: registered.content,
    html: registered.html,
    url: projectUrl(publicBaseUrl, registered.project.projectId),
    artifactDirectory: relativeArtifactDirectory(registered.project.slug),
  };
}

function readyResponse(
  registered: RegisteredProject,
  publicBaseUrl: string,
): ReadyProjectResponse {
  return {
    status: "ready",
    projectId: registered.project.projectId,
    url: projectUrl(publicBaseUrl, registered.project.projectId),
    artifactDirectory: relativeArtifactDirectory(registered.project.slug),
    sourcePaths: registered.project.sources.map((source) => source.path),
  };
}

function sameImmutableCreation(
  input: CreateProjectInput,
  workspaceRoot: string,
  registered: RegisteredProject,
): boolean {
  const project = registered.project;
  return (
    input.projectId === project.projectId &&
    workspaceRoot === registered.registry.workspaceRoot &&
    input.slug === project.slug &&
    input.name === project.name &&
    input.instruction === project.instruction &&
    input.format === project.format &&
    input.agent === project.agent &&
    input.model === project.model &&
    JSON.stringify(input.sourceFiles) === JSON.stringify(project.sources)
  );
}

function assertGeneratingProject(
  current: ProjectDocument,
  prepared: PreparedProject,
): void {
  if (
    current.status !== "generating" ||
    current.projectId !== prepared.project.projectId ||
    JSON.stringify(current) !== JSON.stringify(prepared.project)
  ) {
    throw storageError();
  }
}

function assertOwnedPrepared(
  preparedProjects: WeakSet<object>,
  prepared: PreparedProject,
): void {
  if (
    typeof prepared !== "object" ||
    prepared === null ||
    !preparedProjects.has(prepared)
  ) {
    throw new ProjectError("invalid_request", "Prepared project is invalid.");
  }
}

async function createArtifactParents(paths: ArtifactPaths): Promise<void> {
  const artifacts = path.join(paths.workspaceRoot, "artifacts");
  await createContainedDirectory(artifacts, paths.workspaceRoot);
  await createContainedDirectory(paths.artifactParent, paths.workspaceRoot);
}

async function createContainedDirectory(
  directory: string,
  workspaceRoot: string,
): Promise<void> {
  let created = false;
  try {
    await mkdir(directory, { mode: DIRECTORY_MODE });
    created = true;
  } catch (error) {
    if (!isAlreadyExists(error)) throw error;
  }
  await assertRealDirectory(directory, workspaceRoot, DIRECTORY_MODE);
  if (created) await syncDirectory(path.dirname(directory));
}

async function createProjectDirectory(directory: string): Promise<void> {
  await mkdir(directory, { mode: DIRECTORY_MODE });
  await assertRealDirectory(
    directory,
    path.dirname(path.dirname(path.dirname(directory))),
    DIRECTORY_MODE,
  );
  await syncDirectory(path.dirname(directory));
}

async function revalidateArtifactPaths(
  expected: ArtifactPaths,
  requireDirectory: boolean,
): Promise<void> {
  const actual = await resolveArtifactPaths(expected.workspaceRoot, pathsToSlug(expected));
  if (!sameArtifactPaths(actual, expected)) throw storageError();
  await assertRealDirectory(
    path.join(expected.workspaceRoot, "artifacts"),
    expected.workspaceRoot,
    DIRECTORY_MODE,
  );
  await assertRealDirectory(
    expected.artifactParent,
    expected.workspaceRoot,
    DIRECTORY_MODE,
  );
  if (requireDirectory) {
    await assertRealDirectory(
      expected.artifactDirectory,
      expected.workspaceRoot,
      DIRECTORY_MODE,
    );
  }
}

function sameArtifactPaths(left: ArtifactPaths, right: ArtifactPaths): boolean {
  return (Object.keys(left) as Array<keyof ArtifactPaths>).every(
    (key) => left[key] === right[key],
  );
}

function pathsToSlug(paths: ArtifactPaths): string {
  return path.basename(paths.artifactDirectory);
}

async function assertArtifactFile(
  paths: ArtifactPaths,
  filePath: string,
): Promise<void> {
  await revalidateArtifactPaths(paths, true);
  await assertRealFile(filePath, paths.workspaceRoot, FILE_MODE);
}

async function publishRegistry(
  registryPath: string,
  bytes: Uint8Array,
  registryRoot: string,
): Promise<void> {
  if (path.dirname(registryPath) !== registryRoot) throw storageError();
  await assertRegistryDirectory(registryRoot);
  const temporaryPath = path.join(
    registryRoot,
    `.${path.basename(registryPath)}.tmp-${randomBytes(16).toString("hex")}`,
  );
  let handle: Awaited<ReturnType<typeof open>> | undefined;
  let temporaryIdentity: BigIntStats | undefined;
  let temporaryRemoved = false;
  try {
    handle = await open(
      temporaryPath,
      fsConstants.O_WRONLY |
        fsConstants.O_CREAT |
        fsConstants.O_EXCL |
        fsConstants.O_NOFOLLOW,
      FILE_MODE,
    );
    temporaryIdentity = await handle.stat({ bigint: true });
    await handle.writeFile(bytes);
    await handle.sync();
    await handle.close();
    handle = undefined;

    await assertRegistryDirectory(registryRoot);
    try {
      await link(temporaryPath, registryPath);
    } catch (error) {
      if (isAlreadyExists(error)) {
        throw new ProjectError("project_exists", "Project is already registered.");
      }
      throw error;
    }
    await syncDirectory(registryRoot);

    const readback = await readSafeFileState(
      registryPath,
      bytes.byteLength,
      FILE_MODE,
    );
    if (
      !isSameFile(readback.identity, temporaryIdentity) ||
      !readback.bytes.equals(Buffer.from(bytes))
    ) {
      throw storageError();
    }
    await unlink(temporaryPath);
    temporaryRemoved = true;
    await syncDirectory(registryRoot);
  } finally {
    await handle?.close().catch(() => undefined);
    if (!temporaryRemoved && temporaryIdentity !== undefined) {
      await removeOwnedTemporary(temporaryPath, temporaryIdentity);
    }
  }
}

async function atomicReplace(
  targetPath: string,
  bytes: Uint8Array,
  artifactPaths: ArtifactPaths,
  beforeRename?: () => Promise<void>,
): Promise<void> {
  const directory = path.dirname(targetPath);
  await revalidateArtifactPaths(artifactPaths, true);
  await assertOptionalTarget(targetPath, artifactPaths.workspaceRoot);

  const temporaryPath = path.join(
    directory,
    `.${path.basename(targetPath)}.tmp-${randomBytes(16).toString("hex")}`,
  );
  let handle: Awaited<ReturnType<typeof open>> | undefined;
  let temporaryIdentity: BigIntStats | undefined;
  let renamed = false;
  try {
    handle = await open(
      temporaryPath,
      fsConstants.O_WRONLY |
        fsConstants.O_CREAT |
        fsConstants.O_EXCL |
        fsConstants.O_NOFOLLOW,
      FILE_MODE,
    );
    temporaryIdentity = await handle.stat({ bigint: true });
    await handle.writeFile(bytes);
    await handle.sync();
    await handle.close();
    handle = undefined;

    await revalidateArtifactPaths(artifactPaths, true);
    await assertOptionalTarget(targetPath, artifactPaths.workspaceRoot);
    await beforeRename?.();
    await rename(temporaryPath, targetPath);
    renamed = true;
    await syncDirectory(directory);

    const readback = await readSafeFile(targetPath, bytes.byteLength, FILE_MODE);
    if (!readback.equals(Buffer.from(bytes))) throw storageError();
  } finally {
    await handle?.close().catch(() => undefined);
    if (!renamed && temporaryIdentity !== undefined) {
      await removeOwnedTemporary(temporaryPath, temporaryIdentity);
    }
  }
}

async function removeOwnedTemporary(
  temporaryPath: string,
  identity: BigIntStats,
): Promise<void> {
  try {
    const current = await lstat(temporaryPath, { bigint: true });
    if (isSameFile(current, identity) && current.isFile()) {
      await unlink(temporaryPath);
      await syncDirectory(path.dirname(temporaryPath));
    }
  } catch {
    // Never remove anything that cannot be proven to be this operation's file.
  }
}

async function readSafeFile(
  filePath: string,
  maxBytes: number,
  requiredMode: number,
): Promise<Buffer> {
  return (await readSafeFileState(filePath, maxBytes, requiredMode)).bytes;
}

async function readSafeFileState(
  filePath: string,
  maxBytes: number,
  requiredMode: number,
): Promise<SafeFileState> {
  let handle: Awaited<ReturnType<typeof open>> | undefined;
  try {
    handle = await open(filePath, fsConstants.O_RDONLY | fsConstants.O_NOFOLLOW);
    const before = await handle.stat({ bigint: true });
    if (
      !before.isFile() ||
      Number(before.mode & BigInt(0o777)) !== requiredMode ||
      before.size > BigInt(maxBytes)
    ) {
      throw storageError();
    }
    const bytes = await handle.readFile();
    const after = await handle.stat({ bigint: true });
    if (!isStableFile(before, after) || bytes.byteLength !== Number(after.size)) {
      throw storageError();
    }
    const named = await lstat(filePath, { bigint: true });
    if (named.isSymbolicLink() || !isStableFile(after, named)) {
      throw storageError();
    }
    return { bytes, identity: after };
  } finally {
    await handle?.close().catch(() => undefined);
  }
}

async function assertOptionalTarget(
  targetPath: string,
  containmentRoot: string,
): Promise<void> {
  if (!isContained(containmentRoot, targetPath)) throw storageError();
  try {
    await assertRealFile(targetPath, containmentRoot, FILE_MODE);
  } catch (error) {
    if (!isMissing(error)) throw error;
  }
}

async function assertRealFile(
  filePath: string,
  containmentRoot: string,
  requiredMode: number,
): Promise<void> {
  const metadata = await lstat(filePath);
  if (
    metadata.isSymbolicLink() ||
    !metadata.isFile() ||
    (metadata.mode & 0o777) !== requiredMode
  ) {
    throw storageError();
  }
  const resolved = await realpath(filePath);
  if (!isContained(containmentRoot, resolved)) throw storageError();
}

async function assertRealDirectory(
  directory: string,
  containmentRoot: string,
  requiredMode?: number,
): Promise<void> {
  const metadata = await lstat(directory);
  if (
    metadata.isSymbolicLink() ||
    !metadata.isDirectory() ||
    (requiredMode !== undefined && (metadata.mode & 0o777) !== requiredMode)
  ) {
    throw storageError();
  }
  const resolved = await realpath(directory);
  if (!isContained(containmentRoot, resolved)) throw storageError();
}

async function prepareRegistryPath(
  registryRoot: string,
  id: string,
  createRoot: boolean,
): Promise<string> {
  validateProjectId(id);
  if (createRoot) await createRegistryDirectory(registryRoot);
  else await assertRegistryDirectory(registryRoot);
  return path.join(registryRoot, `${id}.json`);
}

async function createRegistryDirectory(registryRoot: string): Promise<void> {
  const managedParent = path.dirname(registryRoot);
  const missingDirectories: string[] = [];
  let nearestExistingAncestor = registryRoot;

  while (true) {
    try {
      const metadata = await lstat(nearestExistingAncestor);
      if (metadata.isSymbolicLink() || !metadata.isDirectory()) {
        throw storageError();
      }
      break;
    } catch (error) {
      if (!isMissing(error)) throw error;
      missingDirectories.unshift(nearestExistingAncestor);
      const parent = path.dirname(nearestExistingAncestor);
      if (parent === nearestExistingAncestor) throw storageError();
      nearestExistingAncestor = parent;
    }
  }

  await inspectAbsoluteSegments(nearestExistingAncestor, false);
  await assertRealDirectory(
    nearestExistingAncestor,
    nearestExistingAncestor,
  );
  if (!missingDirectories.includes(managedParent)) {
    await inspectAbsoluteSegments(managedParent, false);
    await assertRealDirectory(managedParent, managedParent, DIRECTORY_MODE);
  }

  for (const directory of missingDirectories) {
    const parent = path.dirname(directory);
    await inspectAbsoluteSegments(parent, false);
    await assertRealDirectory(
      parent,
      nearestExistingAncestor,
      parent === managedParent || missingDirectories.includes(parent)
        ? DIRECTORY_MODE
        : undefined,
    );
    try {
      await mkdir(directory, { mode: DIRECTORY_MODE });
    } catch (error) {
      if (!isAlreadyExists(error)) throw error;
    }
    await inspectAbsoluteSegments(directory, false);
    await assertRealDirectory(
      directory,
      nearestExistingAncestor,
      DIRECTORY_MODE,
    );
    await syncDirectory(parent);
  }

  await assertRegistryDirectory(registryRoot);
}

async function assertRegistryDirectory(registryRoot: string): Promise<void> {
  await inspectAbsoluteSegments(registryRoot, false);
  await assertRealDirectory(registryRoot, registryRoot, DIRECTORY_MODE);
}

async function assertRegistryFile(
  registryRoot: string,
  registryPath: string,
): Promise<void> {
  await assertRegistryDirectory(registryRoot);
  if (path.dirname(registryPath) !== registryRoot) throw storageError();
  await assertRealFile(registryPath, registryRoot, FILE_MODE);
}

async function inspectAbsoluteSegments(
  absolutePath: string,
  allowMissing: boolean,
): Promise<void> {
  const root = path.parse(absolutePath).root;
  let current = root;
  for (const segment of absolutePath.slice(root.length).split(path.sep).filter(Boolean)) {
    current = path.join(current, segment);
    try {
      if ((await lstat(current)).isSymbolicLink()) throw storageError();
    } catch (error) {
      if (allowMissing && isMissing(error)) return;
      throw error;
    }
  }
}

async function syncDirectory(directory: string): Promise<void> {
  const handle = await open(directory, fsConstants.O_RDONLY);
  try {
    await handle.sync();
  } finally {
    await handle.close();
  }
}

function parseRegistryRecord(bytes: Uint8Array, id: string): RegistryRecord {
  const value = parseJsonObject(bytes);
  if (
    !hasExactKeys(value, [
      "schemaVersion",
      "projectId",
      "workspaceRoot",
      "artifactDirectory",
      "registeredAt",
    ]) ||
    value.schemaVersion !== 1 ||
    value.projectId !== id ||
    typeof value.workspaceRoot !== "string" ||
    !path.isAbsolute(value.workspaceRoot) ||
    typeof value.artifactDirectory !== "string" ||
    !path.isAbsolute(value.artifactDirectory) ||
    !isIsoTimestamp(value.registeredAt)
  ) {
    throw storageError();
  }
  return value as RegistryRecord;
}

function parseProjectDocument(bytes: Uint8Array): ProjectDocument {
  const value = parseJsonObject(bytes);
  const allowed = [
    "schemaVersion",
    "projectId",
    "slug",
    "name",
    "instruction",
    "templateId",
    "format",
    "agent",
    "sources",
    "status",
    "createdAt",
    "updatedAt",
    ...(Object.hasOwn(value, "model") ? ["model"] : []),
    ...(Object.hasOwn(value, "diagnostic") ? ["diagnostic"] : []),
  ];
  if (
    !hasExactKeys(value, allowed) ||
    value.schemaVersion !== 1 ||
    !["generating", "ready", "failed"].includes(String(value.status)) ||
    !isIsoTimestamp(value.createdAt) ||
    !isIsoTimestamp(value.updatedAt) ||
    (Object.hasOwn(value, "diagnostic") &&
      (typeof value.diagnostic !== "string" ||
        encode(value.diagnostic).byteLength > PROJECT_DIAGNOSTIC_MAX_BYTES))
  ) {
    throw storageError();
  }
  try {
    const validated = parseCreateProjectInput({
      projectId: value.projectId,
      workspaceRoot: "/",
      slug: value.slug,
      name: value.name,
      instruction: value.instruction,
      content: "stored",
      sourceFiles: value.sources,
      templateId: value.templateId,
      format: value.format,
      agent: value.agent,
      ...(Object.hasOwn(value, "model") ? { model: value.model } : {}),
    });
    return {
      schemaVersion: 1,
      projectId: validated.projectId,
      slug: validated.slug,
      name: validated.name,
      instruction: validated.instruction,
      templateId: validated.templateId,
      format: validated.format,
      agent: validated.agent,
      sources: validated.sourceFiles,
      status: value.status as ProjectDocument["status"],
      createdAt: value.createdAt as string,
      updatedAt: value.updatedAt as string,
      ...(validated.model === undefined ? {} : { model: validated.model }),
      ...(Object.hasOwn(value, "diagnostic")
        ? { diagnostic: value.diagnostic as string }
        : {}),
    };
  } catch {
    throw storageError();
  }
}

function parseJsonObject(bytes: Uint8Array): Record<string, unknown> {
  try {
    const value: unknown = JSON.parse(decode(bytes));
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      throw storageError();
    }
    return value as Record<string, unknown>;
  } catch {
    throw storageError();
  }
}

function hasExactKeys(
  value: Record<string, unknown>,
  expected: string[],
): boolean {
  const keys = Object.keys(value);
  return keys.length === expected.length && expected.every((key) => keys.includes(key));
}

function validatePublicBaseUrl(value: string): string {
  try {
    if (typeof value !== "string" || value.trim() !== value) {
      throw configurationError("Public project base URL is invalid.");
    }
    const url = new URL(value);
    if (
      url.protocol !== "https:" ||
      url.username !== "" ||
      url.password !== "" ||
      url.pathname !== "/" ||
      url.search !== "" ||
      url.hash !== "" ||
      url.origin === "null"
    ) {
      throw configurationError("Public project base URL is invalid.");
    }
    return url.origin;
  } catch (error) {
    if (error instanceof ProjectError) throw error;
    throw configurationError("Public project base URL is invalid.");
  }
}

function validateRegistryRoot(value: string): string {
  if (typeof value !== "string" || !path.isAbsolute(value)) {
    throw configurationError("Project registry directory is invalid.");
  }
  const normalized = path.normalize(value);
  if (normalized === path.parse(normalized).root) {
    throw configurationError("Project registry directory is invalid.");
  }
  return normalized;
}

function validateBoundedString(value: unknown, maxBytes: number, label: string) {
  if (typeof value !== "string") {
    throw new ProjectError("invalid_request", `Project ${label} is invalid.`);
  }
  if (encode(value).byteLength > maxBytes) {
    throw new ProjectError("limit_exceeded", `Project ${label} exceeds its limit.`);
  }
}

function truncateUtf8(value: string, maxBytes: number): string {
  let result = "";
  let size = 0;
  for (const codePoint of value) {
    const bytes = encode(codePoint).byteLength;
    if (size + bytes > maxBytes) break;
    result += codePoint;
    size += bytes;
  }
  return result;
}

function timestampNow(now: () => Date): string {
  try {
    const value = now();
    if (!(value instanceof Date) || Number.isNaN(value.getTime())) throw storageError();
    return value.toISOString();
  } catch {
    throw storageError();
  }
}

function isIsoTimestamp(value: unknown): boolean {
  if (typeof value !== "string") return false;
  try {
    return new Date(value).toISOString() === value;
  } catch {
    return false;
  }
}

function serializeJson(value: unknown): Uint8Array {
  return encode(`${JSON.stringify(value)}\n`);
}

function encode(value: string): Uint8Array {
  return encoder.encode(value);
}

function decode(value: Uint8Array): string {
  try {
    return decoder.decode(value);
  } catch {
    throw storageError();
  }
}

function relativeArtifactDirectory(slug: string): string {
  return `artifacts/html-anything/${slug}`;
}

function projectUrl(publicBaseUrl: string, projectId: string): string {
  return `${publicBaseUrl}/projects/${projectId}`;
}

function isContained(root: string, candidate: string): boolean {
  const relative = path.relative(root, candidate);
  return (
    relative === "" ||
    (relative !== ".." &&
      !relative.startsWith(`..${path.sep}`) &&
      !path.isAbsolute(relative))
  );
}

function isSameFile(left: BigIntStats, right: BigIntStats): boolean {
  return left.dev === right.dev && left.ino === right.ino;
}

function isStableFile(left: BigIntStats, right: BigIntStats): boolean {
  return (
    isSameFile(left, right) &&
    left.size === right.size &&
    left.mtimeNs === right.mtimeNs &&
    left.ctimeNs === right.ctimeNs
  );
}

async function pathExists(candidate: string): Promise<boolean> {
  try {
    await lstat(candidate);
    return true;
  } catch (error) {
    if (isMissing(error)) return false;
    throw error;
  }
}

function isMissing(error: unknown): boolean {
  return hasErrorCode(error, "ENOENT");
}

function isAlreadyExists(error: unknown): boolean {
  return hasErrorCode(error, "EEXIST");
}

function hasErrorCode(error: unknown, code: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === code
  );
}

function projectNotFound(): ProjectError {
  return new ProjectError("project_not_found", "Project was not found.");
}

function storageError(): ProjectError {
  return new ProjectError("storage_failed", "Project storage operation failed.");
}

function configurationError(message: string): ProjectError {
  return new ProjectError("configuration_missing", message);
}

function asStorageError(error: unknown): ProjectError {
  if (
    error instanceof ProjectError &&
    ["limit_exceeded", "project_not_found"].includes(error.code)
  ) {
    return error;
  }
  return storageError();
}
