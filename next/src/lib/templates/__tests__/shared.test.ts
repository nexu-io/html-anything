import { describe, expect, it } from "vitest";
import {
  assemblePrompt,
  SHARED_DESIGN_DIRECTIVES,
} from "../shared";

describe("assemblePrompt", () => {
  it("keeps the canonical non-project prompt unchanged when no instruction is supplied", () => {
    expect(
      assemblePrompt({
        body: "  template body  ",
        content: "user content",
        format: "markdown",
      }),
    ).toBe(`${SHARED_DESIGN_DIRECTIVES}
template body

【输入格式】: markdown
【用户内容】:
user content
`);
  });
});
