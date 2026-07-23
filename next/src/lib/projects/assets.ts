import { randomBytes } from "node:crypto";
import { constants as fsConstants, type BigIntStats } from "node:fs";
import {
  lstat,
  link,
  mkdir,
  open,
  realpath,
  unlink,
} from "node:fs/promises";
import path from "node:path";
import {
  PROJECT_ASSET_MAX_BYTES,
  PROJECT_ASSET_NAME_MAX_BYTES,
  PROJECT_ASSET_NAME_MAX_CODE_POINTS,
  PROJECT_ASSET_STEM_MAX_LENGTH,
  ProjectError,
  type ProjectAsset,
  type ProjectAssetMediaType,
} from "./contracts";
import type { ArtifactPaths } from "./paths";
import { hasRequiredMode } from "./permissions";

type ProjectAssetExtension = "png" | "jpg" | "gif" | "webp";

const INVALID_ORIGINAL_NAME_MESSAGE = "Invalid project asset original name";
const INVALID_IMAGE_MESSAGE = "Unsupported project image";
const INVALID_FILENAME_MESSAGE = "Invalid project asset filename";
const INVALID_METADATA_MESSAGE = "Invalid project asset metadata";
const EMPTY_ASSET_MESSAGE = "Project asset is empty";
const OVERSIZED_ASSET_MESSAGE = "Project asset exceeds its limit";
const STORAGE_MESSAGE = "Project storage operation failed.";
const NOT_FOUND_MESSAGE = "Project was not found.";
const encoder = new TextEncoder();
const DIRECTORY_MODE = 0o700;
const FILE_MODE = 0o600;

const DEVICE_STEM_PATTERN = /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])$/;
const SAFE_STEM_PATTERN = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;
const SAFE_FILENAME_PATTERN =
  /^([a-z0-9](?:[a-z0-9-]{0,78}[a-z0-9])?)\.(png|jpg|gif|webp)$/;

const EXTENSION_MEDIA_TYPES = {
  png: "image/png",
  jpg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
} as const satisfies Record<ProjectAssetExtension, ProjectAssetMediaType>;

const PNG_SIGNATURE = Uint8Array.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);
const PNG_IEND_TRAILER = Uint8Array.from([
  0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44,
  0xae, 0x42, 0x60, 0x82,
]);

function invalidRequest(message: string): never {
  throw new ProjectError("invalid_request", message);
}

function matchesAt(
  bytes: Uint8Array,
  expected: Uint8Array | readonly number[],
  offset: number,
): boolean {
  if (offset < 0 || offset + expected.length > bytes.length) {
    return false;
  }

  return expected.every((value, index) => bytes[offset + index] === value);
}

function matchesAscii(bytes: Uint8Array, value: string, offset: number): boolean {
  if (offset < 0 || offset + value.length > bytes.length) {
    return false;
  }

  for (let index = 0; index < value.length; index += 1) {
    if (bytes[offset + index] !== value.charCodeAt(index)) {
      return false;
    }
  }
  return true;
}

function isDeviceStem(value: string): boolean {
  return DEVICE_STEM_PATTERN.test(value);
}

function isSafeStem(value: string): boolean {
  return (
    value.length <= PROJECT_ASSET_STEM_MAX_LENGTH &&
    SAFE_STEM_PATTERN.test(value) &&
    !isDeviceStem(value)
  );
}

export function validateProjectAssetOriginalName(value: unknown): string {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value === "." ||
    value === ".." ||
    value.includes("/") ||
    value.includes("\\") ||
    /[\u0000-\u001f\u007f]/.test(value) ||
    Array.from(value).length > PROJECT_ASSET_NAME_MAX_CODE_POINTS ||
    encoder.encode(value).byteLength > PROJECT_ASSET_NAME_MAX_BYTES
  ) {
    invalidRequest(INVALID_ORIGINAL_NAME_MESSAGE);
  }

  return value;
}

export function detectProjectAsset(bytes: Uint8Array): {
  mediaType: ProjectAssetMediaType;
  extension: ProjectAssetExtension;
} {
  if (
    matchesAt(bytes, PNG_SIGNATURE, 0) &&
    matchesAt(bytes, PNG_IEND_TRAILER, bytes.length - PNG_IEND_TRAILER.length)
  ) {
    return { mediaType: "image/png", extension: "png" };
  }

  if (
    matchesAt(bytes, [0xff, 0xd8, 0xff], 0) &&
    matchesAt(bytes, [0xff, 0xd9], bytes.length - 2)
  ) {
    return { mediaType: "image/jpeg", extension: "jpg" };
  }

  if (
    (matchesAscii(bytes, "GIF87a", 0) || matchesAscii(bytes, "GIF89a", 0)) &&
    bytes.length >= 7 &&
    bytes[bytes.length - 1] === 0x3b
  ) {
    return { mediaType: "image/gif", extension: "gif" };
  }

  if (
    bytes.length >= 16 &&
    matchesAscii(bytes, "RIFF", 0) &&
    matchesAscii(bytes, "WEBP", 8) &&
    new DataView(bytes.buffer, bytes.byteOffset + 4, 4).getUint32(0, true) ===
      bytes.length - 8 &&
    ["VP8 ", "VP8L", "VP8X"].some((chunk) =>
      matchesAscii(bytes, chunk, 12),
    )
  ) {
    return { mediaType: "image/webp", extension: "webp" };
  }

  invalidRequest(INVALID_IMAGE_MESSAGE);
}

export function projectAssetStem(originalName: string): string {
  const validatedName = validateProjectAssetOriginalName(originalName);
  const finalDot = validatedName.lastIndexOf(".");
  const originalStem =
    finalDot > 0 ? validatedName.slice(0, finalDot) : validatedName;
  let stem = originalStem
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, PROJECT_ASSET_STEM_MAX_LENGTH)
    .replace(/-+$/g, "");

  if (stem.length === 0) {
    stem = "image";
  } else if (isDeviceStem(stem)) {
    stem = `image-${stem}`;
  }

  return stem;
}

export function projectAssetFilename(
  stem: string,
  extension: string,
  ordinal: number,
): string {
  if (
    !isSafeStem(stem) ||
    !(extension in EXTENSION_MEDIA_TYPES) ||
    !Number.isSafeInteger(ordinal) ||
    ordinal < 1
  ) {
    invalidRequest(INVALID_FILENAME_MESSAGE);
  }

  const suffix = ordinal === 1 ? "" : `-${ordinal}`;
  const base = stem
    .slice(0, PROJECT_ASSET_STEM_MAX_LENGTH - suffix.length)
    .replace(/-+$/g, "");
  return validateProjectAssetFilename(`${base}${suffix}.${extension}`);
}

export function validateProjectAssetFilename(value: unknown): string {
  if (typeof value !== "string") {
    invalidRequest(INVALID_FILENAME_MESSAGE);
  }

  const match = SAFE_FILENAME_PATTERN.exec(value);
  if (match === null || isDeviceStem(match[1])) {
    invalidRequest(INVALID_FILENAME_MESSAGE);
  }

  return value;
}

export function projectAssetRecord(
  originalName: string,
  filename: string,
  bytes: number,
  mediaType: ProjectAssetMediaType,
): ProjectAsset {
  const validatedOriginalName = validateProjectAssetOriginalName(originalName);
  const validatedFilename = validateProjectAssetFilename(filename);
  const extension = validatedFilename.slice(
    validatedFilename.lastIndexOf(".") + 1,
  ) as ProjectAssetExtension;

  if (
    !Number.isSafeInteger(bytes) ||
    bytes < 1 ||
    EXTENSION_MEDIA_TYPES[extension] !== mediaType
  ) {
    invalidRequest(INVALID_METADATA_MESSAGE);
  }

  return {
    path: `assets/${validatedFilename}`,
    filename: validatedFilename,
    originalName: validatedOriginalName,
    bytes,
    mediaType,
  };
}

type RevalidateCapability = () => Promise<void>;

type SafeAssetFile = {
  bytes: Buffer;
  identity: BigIntStats;
};

export async function publishProjectAsset(
  paths: Readonly<ArtifactPaths>,
  revalidateCapability: RevalidateCapability,
  originalName: string,
  bytes: Uint8Array,
): Promise<ProjectAsset> {
  const validatedOriginalName = validateProjectAssetOriginalName(originalName);
  if (!(bytes instanceof Uint8Array) || bytes.byteLength === 0) {
    invalidRequest(EMPTY_ASSET_MESSAGE);
  }
  if (bytes.byteLength > PROJECT_ASSET_MAX_BYTES) {
    throw new ProjectError("limit_exceeded", OVERSIZED_ASSET_MESSAGE);
  }
  const detected = detectProjectAsset(bytes);
  const stem = projectAssetStem(validatedOriginalName);
  const assetsDirectory = assetDirectoryPath(paths);

  let handle: Awaited<ReturnType<typeof open>> | undefined;
  let temporaryPath: string | undefined;
  let temporaryIdentity: BigIntStats | undefined;
  let temporaryRemoved = false;
  let directoryIdentity: BigIntStats | undefined;
  let targetPath: string | undefined;
  let published = false;
  try {
    await revalidateAssetCapability(revalidateCapability);
    directoryIdentity = await ensureAssetDirectory(paths, assetsDirectory);
    temporaryPath = path.join(
      assetsDirectory,
      `.asset.tmp-${randomBytes(16).toString("hex")}`,
    );
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

    let ordinal = 1;
    let filename: string;
    while (true) {
      filename = projectAssetFilename(stem, detected.extension, ordinal);
      const candidatePath = assetFilePath(assetsDirectory, filename);
      await revalidateAssetCapability(revalidateCapability);
      await assertAssetDirectory(paths, assetsDirectory, directoryIdentity);
      try {
        await link(temporaryPath, candidatePath);
        targetPath = candidatePath;
        break;
      } catch (error) {
        if (!hasErrorCode(error, "EEXIST")) throw error;
        if (ordinal === Number.MAX_SAFE_INTEGER) throw assetStorageError();
        ordinal += 1;
      }
    }
    if (targetPath === undefined) throw assetStorageError();

    await syncAssetDirectory(assetsDirectory);
    await revalidateAssetCapability(revalidateCapability);
    await assertAssetDirectory(paths, assetsDirectory, directoryIdentity);
    const readback = await readSafeAssetFile(targetPath, PROJECT_ASSET_MAX_BYTES);
    if (
      !sameFile(readback.identity, temporaryIdentity) ||
      !readback.bytes.equals(Buffer.from(bytes))
    ) {
      throw assetStorageError();
    }
    const readbackType = detectProjectAsset(readback.bytes);
    if (
      readbackType.mediaType !== detected.mediaType ||
      readbackType.extension !== detected.extension
    ) {
      throw assetStorageError();
    }

    await unlink(temporaryPath);
    temporaryRemoved = true;
    await syncAssetDirectory(assetsDirectory);
    published = true;
    return projectAssetRecord(
      validatedOriginalName,
      filename,
      readback.bytes.byteLength,
      detected.mediaType,
    );
  } catch (error) {
    if (error instanceof ProjectError) throw error;
    throw assetStorageError();
  } finally {
    await handle?.close().catch(() => undefined);
    if (
      !published &&
      targetPath !== undefined &&
      temporaryIdentity !== undefined &&
      directoryIdentity !== undefined
    ) {
      await removeOwnedPublishedAsset(
        paths,
        assetsDirectory,
        directoryIdentity,
        targetPath,
        temporaryIdentity,
      );
    }
    if (
      !temporaryRemoved &&
      temporaryPath !== undefined &&
      temporaryIdentity !== undefined
    ) {
      await removeOwnedAssetTemporary(temporaryPath, temporaryIdentity);
    }
  }
}

async function removeOwnedPublishedAsset(
  paths: Readonly<ArtifactPaths>,
  assetsDirectory: string,
  directoryIdentity: BigIntStats,
  targetPath: string,
  targetIdentity: BigIntStats,
): Promise<void> {
  try {
    await assertAssetDirectory(paths, assetsDirectory, directoryIdentity);
    const current = await lstat(targetPath, { bigint: true });
    if (current.isFile() && sameFile(current, targetIdentity)) {
      await unlink(targetPath);
      await syncAssetDirectory(assetsDirectory);
    }
  } catch {
    // Never remove anything that cannot be proven to be this operation's link.
  }
}

export async function readProjectAsset(
  paths: Readonly<ArtifactPaths>,
  revalidateCapability: RevalidateCapability,
  filename: string,
): Promise<{ asset: ProjectAsset; bytes: Uint8Array }> {
  const validatedFilename = validateProjectAssetFilename(filename);
  const assetsDirectory = assetDirectoryPath(paths);
  const targetPath = assetFilePath(assetsDirectory, validatedFilename);

  try {
    await revalidateAssetCapability(revalidateCapability);
    const directoryIdentity = await assertAssetDirectory(
      paths,
      assetsDirectory,
    );
    await revalidateAssetCapability(revalidateCapability);
    await revalidateCapturedAssetDirectory(
      paths,
      assetsDirectory,
      directoryIdentity,
    );
    let readback: SafeAssetFile;
    try {
      readback = await readSafeAssetFile(targetPath, PROJECT_ASSET_MAX_BYTES);
    } catch (error) {
      await revalidateAssetCapability(revalidateCapability);
      await revalidateCapturedAssetDirectory(
        paths,
        assetsDirectory,
        directoryIdentity,
      );
      throw error;
    }
    await revalidateAssetCapability(revalidateCapability);
    await revalidateCapturedAssetDirectory(
      paths,
      assetsDirectory,
      directoryIdentity,
    );
    const detected = detectProjectAsset(readback.bytes);
    const result = {
      asset: projectAssetRecord(
        validatedFilename,
        validatedFilename,
        readback.bytes.byteLength,
        detected.mediaType,
      ),
      bytes: readback.bytes,
    };
    await revalidateAssetCapability(revalidateCapability);
    await revalidateCapturedAssetDirectory(
      paths,
      assetsDirectory,
      directoryIdentity,
    );
    return result;
  } catch (error) {
    if (error instanceof ProjectError) throw error;
    if (hasErrorCode(error, "ENOENT")) {
      throw new ProjectError("project_not_found", NOT_FOUND_MESSAGE);
    }
    throw assetStorageError();
  }
}

function assetDirectoryPath(paths: Readonly<ArtifactPaths>): string {
  const directory = path.join(paths.artifactDirectory, "assets");
  if (path.dirname(directory) !== paths.artifactDirectory) {
    throw assetStorageError();
  }
  return directory;
}

function assetFilePath(assetsDirectory: string, filename: string): string {
  const filePath = path.join(assetsDirectory, filename);
  if (path.dirname(filePath) !== assetsDirectory) throw assetStorageError();
  return filePath;
}

async function ensureAssetDirectory(
  paths: Readonly<ArtifactPaths>,
  assetsDirectory: string,
): Promise<BigIntStats> {
  try {
    await mkdir(assetsDirectory, { mode: DIRECTORY_MODE });
  } catch (error) {
    if (!hasErrorCode(error, "EEXIST")) throw error;
  }
  const identity = await assertAssetDirectory(paths, assetsDirectory);
  await syncAssetDirectory(paths.artifactDirectory);
  return identity;
}

async function revalidateAssetCapability(
  revalidateCapability: RevalidateCapability,
): Promise<void> {
  try {
    await revalidateCapability();
  } catch {
    throw assetStorageError();
  }
}

async function revalidateCapturedAssetDirectory(
  paths: Readonly<ArtifactPaths>,
  assetsDirectory: string,
  expectedIdentity: BigIntStats,
): Promise<void> {
  try {
    await assertAssetDirectory(paths, assetsDirectory, expectedIdentity);
  } catch {
    throw assetStorageError();
  }
}

async function assertAssetDirectory(
  paths: Readonly<ArtifactPaths>,
  assetsDirectory: string,
  expectedIdentity?: BigIntStats,
): Promise<BigIntStats> {
  const metadata = await lstat(assetsDirectory, { bigint: true });
  if (
    metadata.isSymbolicLink() ||
    !metadata.isDirectory() ||
    !hasRequiredMode(metadata.mode, DIRECTORY_MODE) ||
    (expectedIdentity !== undefined && !sameFile(metadata, expectedIdentity))
  ) {
    throw assetStorageError();
  }
  const resolved = await realpath(assetsDirectory);
  if (
    resolved !== assetsDirectory ||
    !isContained(paths.artifactDirectory, resolved)
  ) {
    throw assetStorageError();
  }
  return metadata;
}

async function readSafeAssetFile(
  filePath: string,
  maxBytes: number,
): Promise<SafeAssetFile> {
  let handle: Awaited<ReturnType<typeof open>> | undefined;
  try {
    handle = await open(
      filePath,
      fsConstants.O_RDONLY | fsConstants.O_NOFOLLOW | fsConstants.O_NONBLOCK,
    );
    const before = await handle.stat({ bigint: true });
    if (
      !before.isFile() ||
      !hasRequiredMode(before.mode, FILE_MODE) ||
      before.size > BigInt(maxBytes)
    ) {
      throw assetStorageError();
    }
    const bytes = await handle.readFile();
    const after = await handle.stat({ bigint: true });
    if (!stableFile(before, after) || bytes.byteLength !== Number(after.size)) {
      throw assetStorageError();
    }
    const named = await lstat(filePath, { bigint: true });
    if (named.isSymbolicLink() || !stableFile(after, named)) {
      throw assetStorageError();
    }
    return { bytes, identity: after };
  } finally {
    await handle?.close().catch(() => undefined);
  }
}

async function removeOwnedAssetTemporary(
  temporaryPath: string,
  identity: BigIntStats,
): Promise<void> {
  try {
    const current = await lstat(temporaryPath, { bigint: true });
    if (current.isFile() && sameFile(current, identity)) {
      await unlink(temporaryPath);
      await syncAssetDirectory(path.dirname(temporaryPath));
    }
  } catch {
    // Never remove anything that cannot be proven to be this operation's file.
  }
}

async function syncAssetDirectory(directory: string): Promise<void> {
  if (process.platform === "win32") return;
  const handle = await open(directory, fsConstants.O_RDONLY);
  try {
    await handle.sync();
  } finally {
    await handle.close();
  }
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

function sameFile(left: BigIntStats, right: BigIntStats): boolean {
  return left.dev === right.dev && left.ino === right.ino;
}

function stableFile(left: BigIntStats, right: BigIntStats): boolean {
  return (
    sameFile(left, right) &&
    left.size === right.size &&
    left.mtimeNs === right.mtimeNs &&
    left.ctimeNs === right.ctimeNs
  );
}

function hasErrorCode(error: unknown, code: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === code
  );
}

function assetStorageError(): ProjectError {
  return new ProjectError("storage_failed", STORAGE_MESSAGE);
}
