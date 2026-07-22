import { describe, expect, it } from "vitest";
import {
  detectProjectAsset,
  projectAssetFilename,
  projectAssetRecord,
  projectAssetStem,
  validateProjectAssetFilename,
  validateProjectAssetOriginalName,
} from "../assets";
import {
  PROJECT_ASSET_MAX_BYTES,
  PROJECT_ASSET_NAME_MAX_BYTES,
  PROJECT_ASSET_NAME_MAX_CODE_POINTS,
  PROJECT_ASSET_STEM_MAX_LENGTH,
  ProjectError,
  type ProjectAssetMediaType,
} from "../contracts";

const ascii = (value: string) => new TextEncoder().encode(value);

const png = Uint8Array.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44,
  0xae, 0x42, 0x60, 0x82,
]);
const jpeg = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0xff, 0xd9]);
const gif87a = Uint8Array.from([...ascii("GIF87a"), 0x00, 0x3b]);
const gif89a = Uint8Array.from([...ascii("GIF89a"), 0x00, 0x3b]);

const webp = (chunk: "VP8 " | "VP8L" | "VP8X") => {
  const value = Uint8Array.from([
    ...ascii("RIFF"),
    0x08, 0x00, 0x00, 0x00,
    ...ascii("WEBP"),
    ...ascii(chunk),
  ]);
  return value;
};

const expectInvalidRequest = (operation: () => unknown) => {
  expect(operation).toThrowError(
    expect.objectContaining({ code: "invalid_request" }),
  );
};

const mutateEach = (value: Uint8Array, indexes: number[]) =>
  indexes.map((index) => {
    const mutation = value.slice();
    mutation[index] ^= 0xff;
    return mutation;
  });

describe("project asset contracts", () => {
  it("publishes the approved bounds", () => {
    expect(PROJECT_ASSET_MAX_BYTES).toBe(10_485_760);
    expect(PROJECT_ASSET_NAME_MAX_CODE_POINTS).toBe(255);
    expect(PROJECT_ASSET_NAME_MAX_BYTES).toBe(1_024);
    expect(PROJECT_ASSET_STEM_MAX_LENGTH).toBe(80);
  });
});

describe("validateProjectAssetOriginalName", () => {
  it("accepts punctuation and the exact Unicode and UTF-8 boundaries", () => {
    expect(validateProjectAssetOriginalName("[hero] (final)!.PNG")).toBe(
      "[hero] (final)!.PNG",
    );
    expect(validateProjectAssetOriginalName("🙂".repeat(255))).toBe(
      "🙂".repeat(255),
    );
  });

  it.each([
    ["non-string", null],
    ["empty", ""],
    ["dot", "."],
    ["dot-dot", ".."],
    ["forward slash", "hero/image.png"],
    ["backslash", "hero\\image.png"],
    ["first C0 control", "bad\u0000.png"],
    ["last C0 control", "bad\u001f.png"],
    ["delete control", "bad\u007f.png"],
    ["too many code points", "a".repeat(256)],
    ["combined code-point and byte overflow", "🙂".repeat(257)],
  ])("rejects %s without echoing the value", (_label, value) => {
    try {
      validateProjectAssetOriginalName(value);
      throw new Error("expected validation to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(ProjectError);
      expect(error).toMatchObject({ code: "invalid_request" });
      if (String(value).length > 0) {
        expect((error as Error).message).not.toContain(String(value));
      }
    }
  });
});

describe("detectProjectAsset", () => {
  it.each([
    [png, { mediaType: "image/png", extension: "png" }],
    [jpeg, { mediaType: "image/jpeg", extension: "jpg" }],
    [gif87a, { mediaType: "image/gif", extension: "gif" }],
    [gif89a, { mediaType: "image/gif", extension: "gif" }],
    [webp("VP8 "), { mediaType: "image/webp", extension: "webp" }],
    [webp("VP8L"), { mediaType: "image/webp", extension: "webp" }],
    [webp("VP8X"), { mediaType: "image/webp", extension: "webp" }],
  ] as const)("detects supported bytes instead of trusting a filename", (bytes, result) => {
    expect(detectProjectAsset(bytes)).toEqual(result);
  });

  it("requires the complete PNG signature and canonical IEND trailer", () => {
    const markerIndexes = [
      ...Array.from({ length: 8 }, (_, index) => index),
      ...Array.from({ length: 12 }, (_, index) => png.length - 12 + index),
    ];

    for (const value of [png.slice(0, 19), ...mutateEach(png, markerIndexes)]) {
      expectInvalidRequest(() => detectProjectAsset(value));
    }
  });

  it("requires complete JPEG and GIF start and end markers", () => {
    const malformed = [
      ...mutateEach(jpeg, [0, 1, 2, jpeg.length - 2, jpeg.length - 1]),
      ...mutateEach(gif89a, [0, 1, 2, 3, 4, 5, gif89a.length - 1]),
    ];

    for (const value of malformed) {
      expectInvalidRequest(() => detectProjectAsset(value));
    }
  });

  it("requires RIFF size, WEBP form, and a supported first WebP chunk", () => {
    const valid = webp("VP8 ");
    const markerIndexes = Array.from({ length: 16 }, (_, index) => index);

    for (const value of mutateEach(valid, markerIndexes)) {
      expectInvalidRequest(() => detectProjectAsset(value));
    }
  });

  it.each([
    new Uint8Array(),
    ascii("<svg></svg>"),
    Uint8Array.from([0x42, 0x4d, 0x00, 0x00]),
  ])("rejects unsupported or empty content", (value) => {
    expectInvalidRequest(() => detectProjectAsset(value));
  });

  it("leaves the byte-size ceiling to transport and storage", () => {
    const oversized = new Uint8Array(PROJECT_ASSET_MAX_BYTES + 1);
    oversized.set(png.slice(0, 8), 0);
    oversized.set(png.slice(-12), oversized.length - 12);

    expect(detectProjectAsset(oversized)).toEqual({
      mediaType: "image/png",
      extension: "png",
    });
  });
});

describe("projectAssetStem", () => {
  it.each([
    ["Product Photo.PNG", "product-photo"],
    ["Résumé.final.PNG", "re-sume-final"],
    ["Ｐｈｏｔｏ １２.webp", "photo-12"],
    ["产品 图.png", "image"],
    ["....png", "image"],
    ["CON.png", "image-con"],
    ["PrN.png", "image-prn"],
    ["AUX.jpg", "image-aux"],
    ["nul.webp", "image-nul"],
    ["COM1.gif", "image-com1"],
    ["com9.gif", "image-com9"],
    ["LPT1.gif", "image-lpt1"],
    ["lPt9.gif", "image-lpt9"],
  ])("derives a portable stem from %s", (originalName, expected) => {
    expect(projectAssetStem(originalName)).toBe(expected);
  });

  it("caps stems at 80 characters without a trailing separator", () => {
    expect(projectAssetStem(`${"a".repeat(79)}--tail.png`)).toBe(
      "a".repeat(79),
    );
    expect(projectAssetStem(`${"a".repeat(100)}.png`)).toBe(
      "a".repeat(80),
    );
  });
});

describe("projectAssetFilename", () => {
  it("uses no suffix for the first file and deterministic ordinals thereafter", () => {
    expect(projectAssetFilename("product-photo", "png", 1)).toBe(
      "product-photo.png",
    );
    expect(projectAssetFilename("product-photo", "jpg", 2)).toBe(
      "product-photo-2.jpg",
    );
  });

  it("reserves ordinal suffix space inside the 80-character stem bound", () => {
    const stem = "a".repeat(80);

    expect(projectAssetFilename(stem, "webp", 1)).toBe(`${stem}.webp`);
    expect(projectAssetFilename(stem, "webp", 2)).toBe(
      `${"a".repeat(78)}-2.webp`,
    );
    expect(projectAssetFilename(stem, "gif", 123)).toBe(
      `${"a".repeat(76)}-123.gif`,
    );
  });

  it.each([
    ["empty stem", "", "png", 1],
    ["unsafe stem", "hero/photo", "png", 1],
    ["leading separator", "-hero", "png", 1],
    ["device stem", "con", "png", 1],
    ["unsupported extension", "hero", "jpeg", 1],
    ["zero ordinal", "hero", "png", 0],
    ["fractional ordinal", "hero", "png", 1.5],
  ])("rejects %s", (_label, stem, extension, ordinal) => {
    expectInvalidRequest(() =>
      projectAssetFilename(stem, extension, ordinal),
    );
  });
});

describe("validateProjectAssetFilename", () => {
  it.each(["hero.png", "product-photo-2.jpg", "image.gif", "hero.webp"])(
    "accepts a canonical flat filename: %s",
    (value) => {
      expect(validateProjectAssetFilename(value)).toBe(value);
    },
  );

  it.each([
    null,
    "",
    "../hero.png",
    "assets/hero.png",
    "hero\\photo.png",
    "Hero.png",
    "hero photo.png",
    "hero.jpeg",
    "-hero.png",
    "hero-.png",
    "con.png",
    `${"a".repeat(81)}.png`,
  ])("rejects unsafe or non-canonical filename %s", (value) => {
    expectInvalidRequest(() => validateProjectAssetFilename(value));
  });
});

describe("projectAssetRecord", () => {
  it("builds the exact metadata shape and assets-relative path", () => {
    expect(
      projectAssetRecord(
        "[Hero] Final.PNG",
        "hero-final.png",
        png.byteLength,
        "image/png",
      ),
    ).toEqual({
      path: "assets/hero-final.png",
      filename: "hero-final.png",
      originalName: "[Hero] Final.PNG",
      bytes: png.byteLength,
      mediaType: "image/png",
    });
  });

  it("does not enforce the transport and storage size ceiling", () => {
    expect(
      projectAssetRecord(
        "hero.png",
        "hero.png",
        PROJECT_ASSET_MAX_BYTES + 1,
        "image/png",
      ).bytes,
    ).toBe(PROJECT_ASSET_MAX_BYTES + 1);
  });

  it.each([
    ["bad original name", "../hero.png", "hero.png", 20, "image/png"],
    ["bad filename", "hero.png", "../hero.png", 20, "image/png"],
    ["zero bytes", "hero.png", "hero.png", 0, "image/png"],
    ["fractional bytes", "hero.png", "hero.png", 1.5, "image/png"],
    ["bad media type", "hero.png", "hero.png", 20, "image/svg+xml"],
    ["media mismatch", "hero.png", "hero.jpg", 20, "image/png"],
  ])(
    "rejects %s",
    (_label, originalName, filename, bytes, mediaType) => {
      expectInvalidRequest(() =>
        projectAssetRecord(
          originalName,
          filename,
          bytes,
          mediaType as ProjectAssetMediaType,
        ),
      );
    },
  );
});
