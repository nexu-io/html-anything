import { canonical, digest } from "@odsuite/protocol";
import { initialFiles } from "@open-motion/workspace/contract";
import { expect, it } from "vitest";
import {
  configuration,
  decode,
  discover,
  materialize,
  type PrismConfig,
  type Publication,
  parsePublication,
} from "@/prism/index.js";

const config: PrismConfig = {
  origin: "https://r.open-design.ai",
  environment: "prod",
  resourceId: "1500c9af-186b-457f-b74d-a58113f657d8",
  channel: "default",
  locale: "zh-CN",
};
function fixture() {
  const sources = initialFiles();
  const data: Publication = {
    resourceId: config.resourceId,
    environment: config.environment,
    channel: config.channel,
    publicationId: "generation-one",
    defaultLocale: "zh-CN",
    content: {
      "zh-CN": {
        templates: [
          {
            templateId: "example-one",
            sortOrder: 1,
            original: {
              templateName: "Native template",
              summary: "Declared title is source identity",
              durationSeconds: "999",
              license: "Apache-2.0",
              sourceUrl: "https://example.com/original",
            },
            files: sources.map((file) => ({
              path: file.path,
              url: `${config.origin}/files/${digest(file.content).slice(7)}`,
              bytes: Buffer.byteLength(file.content),
              sha256: digest(file.content).slice(7),
            })),
          },
        ],
      },
    },
  };
  return { sources, data, bytes: sources.map((file) => Buffer.from(file.content)) };
}
it("discovers bounded publisher claims without invented dimensions and derives native facts only from verified source", () => {
  const { sources, data, bytes } = fixture(),
    parsed = parsePublication(data, config),
    catalog = discover(config, parsed),
    entry = catalog.entries[0]!;
  expect(entry.availability).toBe("source-required");
  expect(entry).not.toHaveProperty("width");
  const ready = materialize(config, parsed, parsed.content[config.locale]!.templates[0]!, entry, bytes);
  expect(ready.template).toMatchObject({ width: 1920, height: 1080, duration: 5, license: "Apache-2.0" });
  expect(ready.files.filter((file) => file.path !== "template.json")).toEqual(
    sources.sort((a, b) => a.path.localeCompare(b.path)),
  );
  const provenance = JSON.parse(ready.files.find((file) => file.path === "template.json")!.content);
  expect(digest(canonical(provenance.origin))).toBe(entry.contentHash);
  for (const file of ready.files)
    expect(ready.template.files.find((item) => item.path === file.path)).toEqual({
      path: file.path,
      bytes: Buffer.byteLength(file.content),
      digest: digest(file.content),
    });
  const changed = structuredClone(parsed);
  changed.content[config.locale]!.templates[0]!.original.license = "different";
  expect(discover(config, changed).entries[0]!.contentHash).not.toBe(entry.contentHash);
});
it("rejects conflicting identities, traversal/collisions and untrusted file origins before any download", () => {
  expect(() => configuration({ ...config, origin: "https://example.com/path" })).toThrow("origin");
  for (const mutate of [
    (d: Publication) => {
      d.resourceId = "00000000-0000-4000-8000-000000000000";
    },
    (d: Publication) => {
      d.content[config.locale]!.templates.push(structuredClone(d.content[config.locale]!.templates[0]!));
    },
    (d: Publication) => {
      d.content[config.locale]!.templates[0]!.files[0]!.path = "../escape.html";
    },
    (d: Publication) => {
      d.content[config.locale]!.templates[0]!.files.push({
        ...d.content[config.locale]!.templates[0]!.files[0]!,
        path: "INDEX.HTML",
      });
    },
    (d: Publication) => {
      d.content[config.locale]!.templates[0]!.files[0]!.url = "https://other.invalid/files/source";
    },
  ]) {
    const { data } = fixture();
    mutate(data);
    expect(() => parsePublication(data, config)).toThrow();
  }
  expect(() => decode(Uint8Array.of(0xff))).toThrow("UTF-8");
  const { data } = fixture();
  data.content[config.locale]!.templates[0]!.files.push({
    path: "photo.jpg",
    url: `${config.origin}/files/photo`,
    bytes: 2,
    sha256: "0".repeat(64),
  });
  expect(discover(config, parsePublication(data, config)).entries[0]).toMatchObject({
    availability: "unsupported",
    reason: expect.stringContaining("format"),
  });
});
it("rejects corrupt bytes, missing configuration/dependencies and unsupported native engine imports", () => {
  for (const alter of [
    (files: ReturnType<typeof initialFiles>) => {
      files.push({ path: "untrusted.css", content: '@import "https://other.invalid/style.css";' });
    },
    (files: ReturnType<typeof initialFiles>) => {
      files[0]!.content = files[0]!.content.replace("<head>", '<head><script src="missing.js"></script>');
    },
    (files: ReturnType<typeof initialFiles>) => {
      files[1]!.content = "{}";
    },
    (files: ReturnType<typeof initialFiles>) => {
      files[0]!.content = files[0]!.content.replace(
        "<head>",
        '<head><script src="https://example.com/gsap.js"></script>',
      );
    },
    (files: ReturnType<typeof initialFiles>) => {
      files[0]!.content = files[0]!.content.replace('data-width="1920"', 'data-width="0"');
    },
  ]) {
    const { sources, data } = fixture();
    alter(sources);
    const item = data.content[config.locale]!.templates[0]!;
    item.files = sources.map((file) => ({
      path: file.path,
      url: `${config.origin}/files/${digest(file.content).slice(7)}`,
      bytes: Buffer.byteLength(file.content),
      sha256: digest(file.content).slice(7),
    }));
    const entry = discover(config, parsePublication(data, config)).entries[0]!;
    expect(() =>
      materialize(
        config,
        data,
        item,
        entry,
        sources.map((file) => Buffer.from(file.content)),
      ),
    ).toThrow();
  }
  const { data, bytes } = fixture(),
    item = data.content[config.locale]!.templates[0]!,
    entry = discover(config, parsePublication(data, config)).entries[0]!;
  bytes[0] = Buffer.from("corrupt");
  expect(() => materialize(config, data, item, entry, bytes)).toThrow("bytes");
});
