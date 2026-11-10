import { createHash } from "node:crypto";
import { assembleProject } from "@open-motion/motion/project";
import { expect, it } from "vitest";
import { list, read } from "@";

it("closes every built-in over verified offline source, licensed fonts and an explicit composition graph", () => {
  const catalog = list();
  expect(catalog.templates.map((entry) => entry.id)).toEqual(["product-promo", "nyt-graph", "decision-tree"]);
  for (const descriptor of catalog.templates) {
    const entry = read(descriptor),
      assembly = assembleProject(entry.files);
    expect(assembly.graph.instances).toHaveLength(descriptor.id === "product-promo" ? 4 : 1);
    expect(assembly.html).not.toMatch(/(?:src|href)=["']https:\/\//);
    expect(entry.files.find((file) => file.path === "assets/fonts.css")?.content).toContain("data:font/woff2;base64,");
    expect(entry.files.find((file) => file.path === "licenses/fonts.txt")?.content).toContain("SIL OPEN FONT LICENSE");
    expect(entry.files.find((file) => file.path === "licenses/templates.txt")?.content).toContain("Apache License");
    const provenance = JSON.parse(entry.files.find((file) => file.path === "template.json")!.content);
    expect(provenance.contentHash).toBe(descriptor.contentHash);
    for (const file of entry.files) {
      const expected = descriptor.files.find((item) => item.path === file.path)!;
      expect(expected.bytes).toBe(Buffer.byteLength(file.content));
      expect(expected.digest).toBe(`sha256:${createHash("sha256").update(file.content).digest("hex")}`);
      expect(expected.bytes).toBeLessThanOrEqual(1048576);
    }
    expect(entry.files.reduce((n, file) => n + Buffer.byteLength(file.content), 0)).toBeLessThan(4 * 1024 ** 2);
  }
});
it("rejects unknown versions and returns isolated copies rather than mutable catalog authority", () => {
  const descriptor = list().templates[0]!;
  expect(() => read({ ...descriptor, contentHash: `sha256:${"0".repeat(64)}` })).toThrow("changed");
  expect(() => read({ ...descriptor, id: "unknown" })).toThrow("finite catalog");
  const selected = read(descriptor);
  selected.files[0]!.content = "mutated";
  selected.template.title = "mutated";
  expect(read(descriptor).files[0]!.content).not.toBe("mutated");
  expect(list().templates[0]!.title).toBe("Product Promo");
});
