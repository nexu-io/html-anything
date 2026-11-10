import { posix } from "node:path";
import { canonical, digest } from "@odsuite/protocol";
import { Fault } from "@open-motion/workspace/contract";
import {
  adapterVersion,
  type Discovery,
  type DiscoveryCatalog,
  type PrismConfig,
  type Publication,
  type PublishedTemplate,
  prismConfig,
  publication,
} from "./contract.js";

export type { Discovery, DiscoveryCatalog, PrismConfig, Publication, PublishedTemplate } from "./contract.js";
export { adapterVersion } from "./contract.js";
export { materialize } from "./source.js";

const extensions = new Set([
  ".html",
  ".css",
  ".js",
  ".mjs",
  ".json",
  ".svg",
  ".txt",
  ".md",
  ".vtt",
  ".srt",
  ".glsl",
  ".vert",
  ".frag",
]);
export function configuration(value: unknown): PrismConfig {
  const data = prismConfig.parse(value),
    url = new URL(data.origin);
  if (
    url.origin !== data.origin ||
    url.username ||
    url.password ||
    (url.protocol !== "https:" &&
      !(url.protocol === "http:" && ["127.0.0.1", "[::1]", "localhost"].includes(url.hostname) && url.port))
  )
    throw new Fault("invalid", "Prism origin must be HTTPS or explicit loopback HTTP");
  return data;
}
export const catalogAddress = (config: PrismConfig) =>
  `${config.origin}/resources/${config.resourceId}/channels/${config.channel}/main.json`;
export function decode(bytes: Uint8Array): unknown {
  if (bytes.byteLength > 4 * 1024 ** 2) throw new Fault("invalid", "Prism document exceeds 4 MiB");
  try {
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch {
    throw new Fault("invalid", "Prism document must be valid UTF-8 JSON");
  }
}
export function parsePublication(value: unknown, config: PrismConfig): Publication {
  const result = publication.safeParse(value);
  if (!result.success) throw new Fault("invalid", "Prism publication does not match the finite contract");
  const data = result.data;
  if (
    data.resourceId !== config.resourceId ||
    data.environment !== config.environment ||
    data.channel !== config.channel ||
    !data.content[config.locale]
  )
    throw new Fault("invalid", "Prism publication identity or locale mismatch");
  const ids = new Set<string>();
  for (const item of data.content[config.locale]!.templates) {
    if (ids.has(item.templateId)) throw new Fault("invalid", "duplicate Prism template identity");
    ids.add(item.templateId);
    if (
      !item.original.templateName?.trim() ||
      item.original.templateName.length > 120 ||
      Object.keys(item.original).length > 32
    )
      throw new Fault("invalid", "invalid Prism template metadata");
    const paths = new Set<string>();
    for (const file of item.files) {
      const parts = file.path.split("/"),
        key = file.path.normalize("NFC").toLowerCase(),
        url = new URL(file.url);
      if (
        parts.some(
          (part) =>
            !part || part.startsWith(".") || ["node_modules", "dist", "renders", "output", "cache"].includes(part),
        ) ||
        /[\\%:\p{Cc}]/u.test(file.path) ||
        paths.has(key) ||
        key === "template.json"
      )
        throw new Fault("invalid", "unsafe or colliding Prism file path");
      paths.add(key);
      if (
        url.origin !== config.origin ||
        !url.pathname.startsWith("/files/") ||
        url.username ||
        url.password ||
        url.search ||
        url.hash
      )
        throw new Fault("invalid", "Prism file origin or address rejected");
    }
  }
  return data;
}
export function provenance(
  config: PrismConfig,
  data: Publication,
  item: PublishedTemplate,
  publicationHash = digest(canonical(data)),
) {
  return {
    adapterVersion,
    publication: {
      ...config,
      publicationId: data.publicationId,
      defaultLocale: data.defaultLocale,
      contentHash: publicationHash,
    },
    template: item,
  };
}
export function discover(config: PrismConfig, data: Publication): DiscoveryCatalog {
  const publicationHash = digest(canonical(data));
  const entries = [...data.content[config.locale]!.templates]
    .sort((a, b) => a.sortOrder - b.sortOrder || a.templateId.localeCompare(b.templateId))
    .map((item): Discovery => {
      const paths = new Set(item.files.map((file) => file.path));
      const reason =
        item.files.length >= 128
          ? "Native source plus provenance exceeds workspace file count"
          : !paths.has("index.html") || !paths.has("hyperframes.json")
            ? "Missing index.html or native hyperframes.json"
            : item.files.some((file) => !extensions.has(posix.extname(file.path).toLowerCase()))
              ? "Resource format is outside the current text-source contract"
              : item.files.some((file) => file.bytes > 1024 ** 2) ||
                  item.files.reduce((n, file) => n + file.bytes, 0) > 4 * 1024 ** 2
                ? "Native text source exceeds workspace bounds"
                : undefined;
      return {
        id: `prism-${digest(item.templateId).slice(7)}`,
        upstreamId: item.templateId,
        contentHash: digest(canonical(provenance(config, data, item, publicationHash))),
        title: item.original.templateName!,
        description: item.original.summary ?? "",
        source: item.original.sourceUrl ?? catalogAddress(config),
        license: item.original.license ?? "unspecified",
        files: item.files.map((file) => ({ path: file.path, bytes: file.bytes, digest: `sha256:${file.sha256}` })),
        availability: reason ? "unsupported" : "source-required",
        ...(reason ? { reason } : {}),
      };
    });
  return {
    publicationId: data.publicationId,
    environment: config.environment,
    resourceId: config.resourceId,
    channel: config.channel,
    locale: config.locale,
    contentHash: publicationHash,
    stale: false,
    entries,
  };
}
