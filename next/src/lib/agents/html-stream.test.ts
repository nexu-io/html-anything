import { describe, expect, it } from "vitest";
import { createAgentOutputFilter, HtmlStreamExtractor } from "./html-stream";

describe("HtmlStreamExtractor", () => {
  it("suppresses prose before the HTML document starts", () => {
    const stream = new HtmlStreamExtractor();

    expect(stream.push("I will create the page first.\n")).toBe("");
    expect(stream.push("<!DOCTYPE html><html><body>Ready</body></html>")).toBe(
      "<!DOCTYPE html><html><body>Ready</body></html>",
    );
  });

  it("keeps partial HTML streaming after the document starts", () => {
    const stream = new HtmlStreamExtractor();

    expect(stream.push("prefix <ht")).toBe("");
    expect(stream.push("ml><body>One")).toBe("<html><body>One");
    expect(stream.push(" two")).toBe(" two");
    expect(stream.push("</body></html> trailing text")).toBe("</body></html>");
    expect(stream.push("ignored")).toBe("");
  });

  it("bounds preamble buffering before the HTML start appears", () => {
    const stream = new HtmlStreamExtractor(8);

    expect(stream.push("0123456789")).toBe("");
    expect(stream.state()).toEqual({
      started: false,
      completed: false,
      bufferedChars: 8,
    });
  });

  it("passes plain text through in text mode", () => {
    const filter = createAgentOutputFilter("text");

    expect(filter("### draft title")).toBe("### draft title");
    expect(filter("plain markdown")).toBe("plain markdown");
  });

  it("filters preamble in html mode", () => {
    const filter = createAgentOutputFilter("html");

    expect(filter("I will build this first.\n")).toBe("");
    expect(filter("<html><body>Ready</body></html> Done")).toBe("<html><body>Ready</body></html>");
  });
});
