import { expect, it } from "vitest";
import { initialFiles } from "@";
import { digest, sources } from "@/native.js";

it("hashes canonical source and native Studio data, independent of request order", () => {
  const files = [...initialFiles(), { path: ".hyperframes/studio-motion.json", content: '{"keyframes":[]}' }];
  expect(digest(files)).toBe(digest([...files].reverse()));
  expect(digest(files)).not.toBe(
    digest([...files.slice(0, -1), { path: ".hyperframes/studio-motion.json", content: '{"keyframes":[1]}' }]),
  );
  expect(digest(files)).not.toBe(digest(initialFiles()));
});
it.each([
  "../secret",
  "/absolute",
  "C:/path",
  "src/../x",
  "src//x",
  ".hyperframes/cache.json",
  "node_modules/a.js",
  "renders/out.mp4",
  "dist/a.js",
  "src/hidden/.key",
  "image.png",
])("rejects unmanaged native source path %s", (path) => {
  expect(() => sources([...initialFiles(), { path, content: "x" }])).toThrow();
});
it("rejects duplicate sources and snapshots missing the native entry", () => {
  expect(() => sources([...initialFiles(), ...initialFiles()])).toThrow("duplicate");
  expect(() => sources([{ path: "notes.md", content: "x" }])).toThrow("index.html");
});
