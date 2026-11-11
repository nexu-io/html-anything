import { expect, it } from "vitest";
import { changeSources, initialFiles, validateSourcePath } from "@/contract.js";
import { sources } from "@/native.js";

it("changes logical source membership without rewriting authored references or input", () => {
  const before = [...initialFiles(), { path: "scene.html", content: '<main data-composition-id="scene"></main>' }],
    original = structuredClone(before),
    renamed = changeSources(before, { kind: "rename", path: "scene.html", target: "scenes/card.html" }),
    duplicated = changeSources(renamed, { kind: "duplicate", path: "scenes/card.html", target: "copy.html" }),
    added = changeSources(duplicated, { kind: "create", path: "captions/title.srt" }),
    removed = changeSources(added, { kind: "remove", path: "copy.html" });
  expect(before).toEqual(original);
  expect(renamed.find((f) => f.path === "scenes/card.html")?.content).toBe(original.at(-1)?.content);
  expect(removed.find((f) => f.path === "captions/title.srt")?.content).toBe("");
  expect(removed.some((f) => f.path === "scene.html" || f.path === "copy.html")).toBe(false);
  expect(removed.find((f) => f.path === "index.html")).toEqual(before[0]);
});
it("protects entry/managed metadata, finite paths, destinations and the source count", () => {
  for (const path of [
    "../x.html",
    "/x.html",
    "a\\b.js",
    "http:x.js",
    "cache/x.js",
    ".hidden/x.js",
    "a/./x.js",
    "a//x.js",
    "x.png",
    "x.exe",
    "x\u0000.html",
    "a".repeat(240) + ".js",
  ]) {
    expect(() => validateSourcePath(path)).toThrow();
    expect(() => sources([...initialFiles(), { path, content: "" }])).toThrow();
  }
  const files = initialFiles();
  for (const kind of ["rename", "remove"] as const)
    expect(() => changeSources(files, { kind, path: "index.html", target: "other.html" })).toThrow("protected");
  expect(() => changeSources(files, { kind: "create", path: "index.html" })).toThrow("exists");
  expect(() => changeSources(files, { kind: "rename", path: "missing.html", target: "other.html" })).toThrow("missing");
  expect(() => changeSources(files, { kind: "create", path: "index.html/child.js" })).toThrow("overlaps");
  expect(() => sources([...files, { path: "index.html/child.js", content: "" }])).toThrow("overlapping");
  const managed = { path: ".hyperframes/studio-motion.json", content: "{}" };
  expect(sources([...files, managed])).toContainEqual(managed);
  expect(() => changeSources([...files, managed], { kind: "remove", path: managed.path })).toThrow("reserved");
  const full = [...files, ...Array.from({ length: 126 }, (_, i) => ({ path: `${i}.txt`, content: "" }))];
  expect(() => changeSources(full, { kind: "create", path: "overflow.js" })).toThrow("128");
  expect(changeSources(full, { kind: "rename", path: "0.txt", target: "renamed.txt" })).toHaveLength(128);
});
