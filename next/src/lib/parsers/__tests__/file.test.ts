import { describe, expect, it, vi } from "vitest";

const unpdf = vi.hoisted(() => ({
  extractText: vi.fn(),
  getDocumentProxy: vi.fn(),
}));

vi.mock("unpdf", () => unpdf);

import { parseFile } from "../file";

describe("parseFile", () => {
  it("extracts text-layer PDFs into markdown-style page sections", async () => {
    const proxy = { destroy: vi.fn() };
    unpdf.getDocumentProxy.mockResolvedValue(proxy);
    unpdf.extractText.mockResolvedValue({
      totalPages: 2,
      text: [
        "Agentic RL studies agents that learn through environment feedback.",
        "LLM RL usually optimizes language model behavior from preferences.",
      ],
    });

    const file = new File([new Uint8Array([37, 80, 68, 70])], "paper.pdf", {
      type: "application/pdf",
    });

    const parsed = await parseFile(file);

    expect(unpdf.getDocumentProxy).toHaveBeenCalledWith(expect.any(Uint8Array));
    expect(unpdf.extractText).toHaveBeenCalledWith(proxy, { mergePages: false });
    expect(proxy.destroy).toHaveBeenCalled();
    expect(parsed).toEqual({
      filename: "paper.pdf",
      format: "pdf",
      text: [
        "# PDF: paper.pdf",
        "",
        "Source: PDF",
        "Pages: 2",
        "Extraction: embedded text",
        "",
        "## Page 1",
        "Agentic RL studies agents that learn through environment feedback.",
        "",
        "## Page 2",
        "LLM RL usually optimizes language model behavior from preferences.",
      ].join("\n"),
    });
  });

  it("marks image-heavy PDFs when little text is available", async () => {
    const proxy = { destroy: vi.fn() };
    unpdf.getDocumentProxy.mockResolvedValue(proxy);
    unpdf.extractText.mockResolvedValue({
      totalPages: 3,
      text: ["", "  ", "Appendix"],
    });

    const file = new File([new Uint8Array([37, 80, 68, 70])], "scan.pdf", {
      type: "application/pdf",
    });

    const parsed = await parseFile(file);

    expect(parsed.format).toBe("pdf");
    expect(parsed.text).toContain(
      "> Note: This PDF appears to be scanned or image-heavy. Text extraction is limited.",
    );
    expect(parsed.text).toContain("Pages: 3");
    expect(parsed.text).toContain("## Page 3\nAppendix");
  });

  it("does not mark concise text-layer PDFs as limited extraction", async () => {
    const proxy = { destroy: vi.fn() };
    unpdf.getDocumentProxy.mockResolvedValue(proxy);
    unpdf.extractText.mockResolvedValue({
      totalPages: 1,
      text: ["Paid. Total: $42."],
    });

    const file = new File([new Uint8Array([37, 80, 68, 70])], "receipt.pdf", {
      type: "application/pdf",
    });

    const parsed = await parseFile(file);

    expect(parsed.format).toBe("pdf");
    expect(parsed.text).toContain("Extraction: embedded text");
    expect(parsed.text).not.toContain("Text extraction is limited");
    expect(parsed.text).toContain("## Page 1\nPaid. Total: $42.");
  });
});
