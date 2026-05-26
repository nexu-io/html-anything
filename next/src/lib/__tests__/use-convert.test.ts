import { describe, expect, it } from "vitest";
import { isDiffEditRun, nextFirstOutputWaitLog } from "../use-convert";

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

describe("nextFirstOutputWaitLog", () => {
  it("emits staged wait messages before the first output byte arrives", () => {
    expect(nextFirstOutputWaitLog(14_999, 0, false)).toBeNull();
    expect(nextFirstOutputWaitLog(15_000, 0, false)).toContain("首个 HTML");
    expect(nextFirstOutputWaitLog(60_000, 1, false)).toContain("还没有首个 HTML");
    expect(nextFirstOutputWaitLog(120_000, 2, false)).toContain("超过 2 分钟");
  });

  it("stops wait messages once output has started", () => {
    expect(nextFirstOutputWaitLog(120_000, 0, true)).toBeNull();
  });
});
