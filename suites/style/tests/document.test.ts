import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { expect, it } from "vitest";
import { documentStyles } from "@";

it("composes public CSS exports into generated HTML without rewriting the source", async () => {
  const root = await mkdtemp(join(tmpdir(), "style-document-"));
  try {
    const source = join(root, "source.html"),
      output = join(root, "index.html");
    const css = join(root, "theme.css");
    const html = "<html><head></head><body></body></html>";
    await writeFile(source, html);
    await writeFile(css, ":root { --om-text: red }");
    await documentStyles({ source, output, styles: [pathToFileURL(css)] });
    expect(await readFile(source, "utf8")).toBe(html);
    expect(await readFile(output, "utf8")).toContain('href="./style.css"');
    expect(await readFile(join(root, "style.css"), "utf8")).toBe(":root { --om-text: red }");
    await expect(documentStyles({ source, output, styles: [new URL("https://example.com/a.css")] })).rejects.toThrow(
      "local",
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
