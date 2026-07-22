import { homedir } from "node:os";
import path from "node:path";
import { invokeAgent } from "../agents/invoke";
import { loadSkill } from "../templates/loader";
import {
  PROJECT_GENERATION_DEADLINE_MS,
  ProjectError,
  type CreateProjectInput,
  type CreateProjectResult,
  type PatchProjectInput,
  type ProjectAsset,
  type ProjectSnapshot,
} from "./contracts";
import {
  generateAndStoreProject,
  type GenerateProjectDependencies,
} from "./generate";
import { createProjectStore } from "./storage";

export type ProjectService = {
  create(input: CreateProjectInput): Promise<CreateProjectResult>;
  get(id: string): Promise<ProjectSnapshot>;
  patch(id: string, patch: PatchProjectInput): Promise<ProjectSnapshot>;
  putAsset(
    id: string,
    originalName: string,
    bytes: Uint8Array,
  ): Promise<ProjectAsset>;
  getAsset(
    id: string,
    filename: string,
  ): Promise<{ asset: ProjectAsset; bytes: Uint8Array }>;
  unregister(id: string): Promise<void>;
};

export function createProjectService(
  deps: GenerateProjectDependencies,
): ProjectService {
  const inFlightCreations = new Map<string, InFlightCreation>();

  function create(input: CreateProjectInput): Promise<CreateProjectResult> {
    const existing = inFlightCreations.get(input.projectId);
    if (existing !== undefined) {
      if (!sameImmutableCreation(existing.input, input)) {
        return Promise.reject(
          new ProjectError("project_exists", "Project ID is already in use."),
        );
      }
      return existing.result.then(({ response }) => ({
        response,
        created: false,
      }));
    }

    const result = generateAndStoreProject(input, deps);
    const inFlight: InFlightCreation = {
      input: immutableCreation(input),
      result,
    };
    inFlightCreations.set(input.projectId, inFlight);
    void result.then(
      () => clearInFlightCreation(input.projectId, inFlight),
      () => clearInFlightCreation(input.projectId, inFlight),
    );
    return result;
  }

  function clearInFlightCreation(
    projectId: string,
    completed: InFlightCreation,
  ): void {
    if (inFlightCreations.get(projectId) === completed) {
      inFlightCreations.delete(projectId);
    }
  }

  return {
    create,
    get: (id) => deps.store.get(id),
    patch: (id, patch) => deps.store.patch(id, patch),
    putAsset: (id, originalName, bytes) =>
      deps.store.putAsset(id, originalName, bytes),
    getAsset: (id, filename) => deps.store.getAsset(id, filename),
    unregister: (id) => deps.store.unregister(id),
  };
}

type ImmutableCreation = Omit<CreateProjectInput, "content" | "templateId">;

type InFlightCreation = {
  input: ImmutableCreation;
  result: Promise<CreateProjectResult>;
};

function immutableCreation(input: CreateProjectInput): ImmutableCreation {
  const {
    content: _content,
    templateId: _templateId,
    sourceFiles,
    ...immutable
  } = input;
  return {
    ...immutable,
    sourceFiles: sourceFiles.map((source) => ({ ...source })),
  };
}

function sameImmutableCreation(
  left: ImmutableCreation,
  right: CreateProjectInput,
): boolean {
  return (
    left.projectId === right.projectId &&
    left.workspaceRoot === right.workspaceRoot &&
    left.slug === right.slug &&
    left.name === right.name &&
    left.instruction === right.instruction &&
    left.format === right.format &&
    left.agent === right.agent &&
    left.model === right.model &&
    JSON.stringify(left.sourceFiles) === JSON.stringify(right.sourceFiles)
  );
}

let configuredService: ProjectService | undefined;

function getConfiguredService(): ProjectService {
  if (configuredService !== undefined) return configuredService;

  const publicBaseUrl = process.env.HTML_ANYTHING_PUBLIC_BASE_URL;
  if (publicBaseUrl === undefined || publicBaseUrl === "") {
    throw new ProjectError(
      "configuration_missing",
      "Public project base URL is not configured.",
    );
  }
  const configuredRegistryRoot =
    process.env.HTML_ANYTHING_PROJECT_REGISTRY_DIR;
  const managedRegistryBoundary = path.join(
    homedir(),
    ".local",
    "share",
    "html-anything",
  );
  const registryRoot =
    configuredRegistryRoot ??
    path.join(managedRegistryBoundary, "project-registry");
  const store = createProjectStore({
    registryRoot,
    ...(configuredRegistryRoot === undefined
      ? { managedRegistryBoundary }
      : {}),
    publicBaseUrl,
    now: () => new Date(),
  });
  configuredService = createProjectService({
    store,
    publicBaseUrl,
    loadSkill,
    invokeAgent,
    deadlineMs: PROJECT_GENERATION_DEADLINE_MS,
  });
  return configuredService;
}

export const projectService: ProjectService = {
  async create(input) {
    return getConfiguredService().create(input);
  },
  async get(id) {
    return getConfiguredService().get(id);
  },
  async patch(id, patch) {
    return getConfiguredService().patch(id, patch);
  },
  async putAsset(id, originalName, bytes) {
    return getConfiguredService().putAsset(id, originalName, bytes);
  },
  async getAsset(id, filename) {
    return getConfiguredService().getAsset(id, filename);
  },
  async unregister(id) {
    return getConfiguredService().unregister(id);
  },
};
