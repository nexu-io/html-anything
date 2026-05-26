import { describe, expect, it } from "vitest";
import { isDiffEditRun } from "../use-convert";

describe("isDiffEditRun", () => {
  it("keeps the existing HTML visible when a task has a changed diff-edit baseline", () => {
    expect(
      isDiffEditRun(
        {
          baseContent: "old content",
          baseHtml: "<html><body>old</body></html>",
        },
        "new content",
      ),
    ).toBe(true);
  });

  it("does not use diff-edit when the content has not changed", () => {
    expect(
      isDiffEditRun(
        {
          baseContent: "same content",
          baseHtml: "<html><body>same</body></html>",
        },
        " same content ",
      ),
    ).toBe(false);
  });
});
