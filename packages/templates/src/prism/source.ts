import { posix } from "node:path";
import { parseHTMLContent } from "@hyperframes/core/compiler";
import { canonical, digest } from "@odsuite/protocol";
import { assembleProject } from "@open-motion/motion/project";
import { Fault, type SourceFile } from "@open-motion/workspace/contract";
import type { Descriptor } from "../contract.js";
import type { Discovery, PrismConfig, Publication, PublishedTemplate } from "./contract.js";
import { provenance } from "./index.js";

/** Verify exact publisher bytes before producing editable native content; never execute author scripts. */
export function materialize(
  config: PrismConfig,
  publication: Publication,
  item: PublishedTemplate,
  entry: Discovery,
  contents: Uint8Array[],
) {
  if (entry.availability !== "source-required")
    throw new Fault("invalid", entry.reason ?? "Prism template is unsupported");
  if (contents.length !== item.files.length) throw new Fault("integrity", "Prism source file count mismatch");
  const files: SourceFile[] = item.files
    .map((file, index) => {
      const bytes = contents[index]!;
      if (bytes.byteLength !== file.bytes || digest(bytes) !== `sha256:${file.sha256}`)
        throw new Fault("integrity", "Prism source bytes do not match publication claims");
      let content: string;
      try {
        content = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
      } catch {
        throw new Fault("invalid", "Prism source is not valid UTF-8 text");
      }
      return { path: file.path, content };
    })
    .sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  const paths = new Set(files.map((file) => file.path));
  for (const file of files) {
    if (/\b(?:import|require)\s*(?:\(|[^;]*?from\s*)["'](?:gsap|@hyperframes\/)/.test(file.content))
      throw new Fault("invalid", "Native engine imports must use the injected pinned runtime");
    if (/\.(?:css|html|svg)$/.test(file.path)) {
      for (const match of file.content.matchAll(/(?:url\(\s*["']?([^"')\s]+)|@import\s+["']([^"']+)["'])/gi)) {
        const address = match[1] ?? match[2] ?? "";
        if (address.startsWith("data:") || address.startsWith("#")) continue;
        let local: string;
        try {
          local = decodeURIComponent(address);
        } catch {
          throw new Fault("invalid", "Invalid native stylesheet dependency");
        }
        if (
          !local ||
          /[\\%:\p{Cc}?#]/u.test(local) ||
          local.startsWith("/") ||
          !paths.has(posix.normalize(posix.join(posix.dirname(file.path), local)))
        )
          throw new Fault("invalid", "Remote or missing native stylesheet dependency");
      }
    }
    if (!file.path.endsWith(".html")) continue;
    const document = parseHTMLContent(file.content);
    for (const element of document.querySelectorAll("script[src],link[href]")) {
      const value = element.getAttribute(element.tagName.toLowerCase() === "script" ? "src" : "href") ?? "";
      let relative: string;
      try {
        relative = decodeURIComponent(value);
      } catch {
        throw new Fault("invalid", "Invalid native dependency URL");
      }
      if (!relative || /[\\%:\p{Cc}?#]/u.test(relative) || relative.startsWith("/"))
        throw new Fault("invalid", "Remote or ambiguous native dependencies are unsupported");
      const target = posix.normalize(posix.join(posix.dirname(file.path), relative));
      if (!paths.has(target)) throw new Fault("invalid", "Missing native source dependency");
      if (
        element.tagName.toLowerCase() === "script" &&
        /(?:^|\/)(?:gsap|hyperframes|__runtime)(?:[.-]|$)/i.test(posix.basename(target))
      )
        throw new Fault("invalid", "Unknown embedded native engine import");
    }
  }
  const native = files.find((file) => file.path === "hyperframes.json");
  let nativeConfig: unknown;
  try {
    nativeConfig = JSON.parse(native?.content ?? "");
  } catch {
    throw new Fault("invalid", "Missing or invalid native hyperframes.json");
  }
  const configRecord = nativeConfig as { $schema?: unknown; paths?: Record<string, unknown> };
  if (
    !nativeConfig ||
    typeof nativeConfig !== "object" ||
    Array.isArray(nativeConfig) ||
    Object.keys(nativeConfig).sort().join() !== "$schema,paths" ||
    configRecord.$schema !== "https://hyperframes.heygen.com/schema/hyperframes.json" ||
    !configRecord.paths ||
    typeof configRecord.paths !== "object" ||
    Array.isArray(configRecord.paths) ||
    Object.keys(configRecord.paths).sort().join() !== "assets,blocks,components" ||
    Object.values(configRecord.paths).some(
      (path) =>
        typeof path !== "string" ||
        !path ||
        path.length > 240 ||
        /[\\%:\p{Cc}]/u.test(path) ||
        path.split("/").some((part) => !part || part.startsWith(".")),
    )
  )
    throw new Fault("invalid", "Unsupported or escaping native project configuration");
  let assembled: ReturnType<typeof assembleProject>;
  try {
    assembled = assembleProject(files);
  } catch {
    throw new Fault("invalid", "Prism source is not a supported complete native graph");
  }
  const root = parseHTMLContent(assembled.html).querySelector("[data-composition-id]"),
    width = Number(root?.getAttribute("data-width")),
    height = Number(root?.getAttribute("data-height")),
    duration = Number(root?.getAttribute("data-duration"));
  if (
    !Number.isInteger(width) ||
    width < 1 ||
    width > 4096 ||
    !Number.isInteger(height) ||
    height < 1 ||
    height > 4096 ||
    !Number.isFinite(duration) ||
    duration <= 0 ||
    duration > 600
  )
    throw new Fault("invalid", "Prism source must declare supported native dimensions and duration");
  const origin = provenance(config, publication, item);
  if (digest(canonical(origin)) !== entry.contentHash)
    throw new Fault("integrity", "Prism claimed-source identity mismatch");
  files.push({
    path: "template.json",
    content: canonical({
      schema: 1,
      id: entry.id,
      contentHash: entry.contentHash,
      origin,
      identity: "claimed-source-manifest",
      spec: { width, height, duration },
      adaptations: [],
    }),
  });
  if (files.length > 128 || files.reduce((n, file) => n + Buffer.byteLength(file.content), 0) > 4 * 1024 ** 2)
    throw new Fault("invalid", "Prism source plus provenance exceeds workspace bounds");
  const template: Descriptor = {
    id: entry.id,
    title: entry.title,
    description: entry.description,
    source: entry.source,
    license: entry.license,
    contentHash: entry.contentHash,
    width,
    height,
    duration,
    adaptations: [],
    files: files.map((file) => ({
      path: file.path,
      bytes: Buffer.byteLength(file.content),
      digest: digest(file.content),
    })),
  };
  return { template, files };
}
