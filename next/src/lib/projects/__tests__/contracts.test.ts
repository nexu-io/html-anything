import { describe, expect, it } from "vitest";
import {
  parseCreateProjectInput,
  parsePatchProjectInput,
  ProjectError,
  validateProjectId,
  validateSlug,
} from "../contracts";

const validCreateInput = () => ({
  projectId: "AbCdEfGhIjKlMnOpQrStUg",
  workspaceRoot: "/workspace",
  slug: "q2-report",
  name: "Q2 report",
  instruction: "Create a report.",
  content: "# Q2",
  sourceFiles: [
    { path: "docs/q2.md", bytes: 4, sha256: "a".repeat(64) },
  ],
  templateId: "data-report",
  format: "markdown",
  agent: "codex",
});

describe("parseCreateProjectInput", () => {
  it("accepts the exact bounded creation shape", () => {
    const value = parseCreateProjectInput(validCreateInput());

    expect(value.slug).toBe("q2-report");
    expect(value.sourceFiles).toEqual([
      { path: "docs/q2.md", bytes: 4, sha256: "a".repeat(64) },
    ]);
  });

  it.each([
    ["bad id", { projectId: "short" }],
    ["oversize instruction", { instruction: "x".repeat(65_537) }],
    [
      "too many sources",
      {
        sourceFiles: Array.from({ length: 11 }, (_, index) => ({
          path: `f${index}.md`,
          bytes: 0,
          sha256: "a".repeat(64),
        })),
      },
    ],
  ])("rejects %s", (_label, patch) => {
    expect(() =>
      parseCreateProjectInput({ ...validCreateInput(), ...patch }),
    ).toThrow(ProjectError);
  });

  it("counts instruction and content limits in UTF-8 bytes", () => {
    expect(() =>
      parseCreateProjectInput({
        ...validCreateInput(),
        instruction: "🙂".repeat(16_385),
      }),
    ).toThrowError(expect.objectContaining({ code: "limit_exceeded" }));
    expect(() =>
      parseCreateProjectInput({
        ...validCreateInput(),
        content: "🙂".repeat(262_145),
      }),
    ).toThrowError(expect.objectContaining({ code: "limit_exceeded" }));
  });

  it.each([
    ["non-object", null],
    ["array", []],
    ["unknown field", { ...validCreateInput(), unexpected: true }],
    ["empty workspace", { ...validCreateInput(), workspaceRoot: "" }],
    ["empty name", { ...validCreateInput(), name: "" }],
    ["controlled name", { ...validCreateInput(), name: "bad\u007f" }],
    ["empty instruction", { ...validCreateInput(), instruction: "" }],
    ["empty content", { ...validCreateInput(), content: "" }],
    ["invalid template", { ...validCreateInput(), templateId: "bad/template" }],
    ["invalid format", { ...validCreateInput(), format: "bad format" }],
    ["invalid agent", { ...validCreateInput(), agent: "-codex" }],
    ["empty model", { ...validCreateInput(), model: "" }],
    ["controlled model", { ...validCreateInput(), model: "x\u0000" }],
    [
      "invalid source bytes",
      {
        ...validCreateInput(),
        sourceFiles: [{ path: "a.md", bytes: -1, sha256: "a".repeat(64) }],
      },
    ],
    [
      "invalid source hash",
      {
        ...validCreateInput(),
        sourceFiles: [{ path: "a.md", bytes: 1, sha256: "A".repeat(64) }],
      },
    ],
    [
      "oversize declared sources",
      {
        ...validCreateInput(),
        sourceFiles: [
          { path: "a.md", bytes: 262_145, sha256: "a".repeat(64) },
        ],
      },
    ],
  ])("rejects malformed creation input: %s", (_label, value) => {
    expect(() => parseCreateProjectInput(value)).toThrow(ProjectError);
  });

  it("counts display names and models in Unicode code points", () => {
    const parsed = parseCreateProjectInput({
      ...validCreateInput(),
      name: "🙂".repeat(120),
      model: "模型".repeat(60),
    });

    expect(Array.from(parsed.name)).toHaveLength(120);
    expect(Array.from(parsed.model ?? "")).toHaveLength(120);
    expect(() =>
      parseCreateProjectInput({
        ...validCreateInput(),
        name: "🙂".repeat(121),
      }),
    ).toThrowError(expect.objectContaining({ code: "limit_exceeded" }));
  });
});

describe("parsePatchProjectInput", () => {
  it("accepts each supported patch field", () => {
    expect(
      parsePatchProjectInput({
        content: "",
        html: "<html></html>",
        templateId: "data-report",
      }),
    ).toEqual({
      content: "",
      html: "<html></html>",
      templateId: "data-report",
    });
  });

  it.each([
    ["non-object", null],
    ["empty object", {}],
    ["unknown field", { html: "<html></html>", extra: true }],
    ["wrong content type", { content: 1 }],
    ["wrong html type", { html: false }],
    ["bad template", { templateId: "../template" }],
  ])("rejects malformed patches: %s", (_label, value) => {
    expect(() => parsePatchProjectInput(value)).toThrow(ProjectError);
  });

  it("enforces patch file limits in UTF-8 bytes", () => {
    expect(() =>
      parsePatchProjectInput({ content: "🙂".repeat(262_145) }),
    ).toThrowError(expect.objectContaining({ code: "limit_exceeded" }));
    expect(() =>
      parsePatchProjectInput({ html: "🙂".repeat(2_097_153) }),
    ).toThrowError(expect.objectContaining({ code: "limit_exceeded" }));
  });
});

describe("identifier validation", () => {
  it("accepts only canonical 16-byte base64url project IDs", () => {
    expect(validateProjectId("AbCdEfGhIjKlMnOpQrStUg")).toBe(
      "AbCdEfGhIjKlMnOpQrStUg",
    );

    for (const value of [
      "AbCdEfGhIjKlMnOpQrStUh",
      "AbCdEfGhIjKlMnOpQrStU=",
      "short",
      42,
    ]) {
      expect(() => validateProjectId(value)).toThrow(ProjectError);
    }
  });

  it("accepts only bounded lowercase ASCII slugs", () => {
    expect(validateSlug("q2-report")).toBe("q2-report");

    for (const value of [
      "Q2-report",
      "two_words",
      "éclair",
      "x".repeat(49),
      "con",
      "prn",
      "aux",
      "nul",
      "com1",
      "com9",
      "lpt1",
      "lpt9",
      "",
      42,
    ]) {
      expect(() => validateSlug(value)).toThrow(ProjectError);
    }
  });
});

describe("ProjectError", () => {
  it.each([
    ["invalid_request", 400],
    ["loopback_required", 403],
    ["project_not_found", 404],
    ["source_changed", 409],
    ["limit_exceeded", 413],
    ["generation_failed", 422],
    ["storage_failed", 500],
    ["generation_timeout", 504],
  ] as const)("maps %s to HTTP %i", (code, httpStatus) => {
    expect(new ProjectError(code, "safe")).toMatchObject({ code, httpStatus });
  });
});
