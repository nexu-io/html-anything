import { describe, expect, it } from "vitest";
import { buildMessageFlagArgv, quoteWindowsShellArg } from "../argv";

describe("quoteWindowsShellArg", () => {
  it("leaves an argument with no whitespace unchanged", () => {
    expect(quoteWindowsShellArg("C:\\Users\\bob\\prompt.txt")).toBe("C:\\Users\\bob\\prompt.txt");
  });

  it("wraps an argument containing a space in double quotes", () => {
    expect(quoteWindowsShellArg("C:\\Users\\John Doe\\prompt.txt")).toBe(
      '"C:\\Users\\John Doe\\prompt.txt"',
    );
  });

  it("wraps an argument containing a tab or newline in double quotes", () => {
    expect(quoteWindowsShellArg("C:\\tmp\\a\tb")).toBe('"C:\\tmp\\a\tb"');
    expect(quoteWindowsShellArg("C:\\tmp\\a\nb")).toBe('"C:\\tmp\\a\nb"');
  });
});

describe("buildMessageFlagArgv", () => {
  it("uses --message-file with the (quoted) temp path on win32, not the raw prompt", () => {
    const prompt = "line one\nline two with spaces";
    const argv = buildMessageFlagArgv("win32", prompt, "C:\\Users\\John Doe\\AppData\\prompt.txt");

    expect(argv).toEqual(["--message-file", '"C:\\Users\\John Doe\\AppData\\prompt.txt"']);
    // The regression this guards against: the raw multi-line/space-containing
    // prompt must never appear as a literal argv element on Windows, since
    // Node's shell:true join has no escaping and cmd.exe would mangle it
    // (see #96 — newlines truncate the command, spaces split it).
    expect(argv).not.toContain(prompt);
  });

  it("does not quote a win32 temp path with no whitespace", () => {
    const argv = buildMessageFlagArgv("win32", "hello", "C:\\Users\\bob\\prompt.txt");
    expect(argv).toEqual(["--message-file", "C:\\Users\\bob\\prompt.txt"]);
  });

  it("keeps --message <text> unchanged on non-Windows platforms", () => {
    const prompt = "line one\nline two with spaces";
    expect(buildMessageFlagArgv("linux", prompt, "/tmp/unused")).toEqual(["--message", prompt]);
    expect(buildMessageFlagArgv("darwin", prompt, "/tmp/unused")).toEqual(["--message", prompt]);
  });
});
