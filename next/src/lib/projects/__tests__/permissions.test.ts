import { describe, expect, it } from "vitest";
import { hasRequiredMode } from "../permissions";

describe("project permission checks", () => {
  it("enforces exact POSIX modes", () => {
    expect(hasRequiredMode(BigInt(0o100600), 0o600, "linux")).toBe(true);
    expect(hasRequiredMode(BigInt(0o100644), 0o600, "linux")).toBe(false);
  });

  it("does not interpret Windows mode bits as POSIX permissions", () => {
    expect(hasRequiredMode(0, 0o600, "win32")).toBe(true);
  });
});
