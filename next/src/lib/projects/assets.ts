import {
  PROJECT_ASSET_NAME_MAX_BYTES,
  PROJECT_ASSET_NAME_MAX_CODE_POINTS,
  PROJECT_ASSET_STEM_MAX_LENGTH,
  ProjectError,
  type ProjectAsset,
  type ProjectAssetMediaType,
} from "./contracts";

type ProjectAssetExtension = "png" | "jpg" | "gif" | "webp";

const INVALID_ORIGINAL_NAME_MESSAGE = "Invalid project asset original name";
const INVALID_IMAGE_MESSAGE = "Unsupported project image";
const INVALID_FILENAME_MESSAGE = "Invalid project asset filename";
const INVALID_METADATA_MESSAGE = "Invalid project asset metadata";
const encoder = new TextEncoder();

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
