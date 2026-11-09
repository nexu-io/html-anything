import { posix } from "node:path";
import {
  assignBundledRuntimeCompositionIds,
  checkSubCompositionUsability,
  compileTimingAttrs,
  parseHTMLContent,
  stripEmbeddedRuntimeScripts,
} from "@hyperframes/core/compiler";
import { ensureHfIds } from "@hyperframes/parsers/hf-ids";
import { resolveSubCompositionContent } from "@hyperframes/parsers/sub-composition-validity";

export interface Source {
  path: string;
  content: string;
}
export interface Instance {
  /** SDK host-chain scoped identity; the entry document itself opens no scope. */
  id: string;
  parent: string | null;
  file: string;
  hostFile: string;
  hostId: string;
  authoredCompositionId: string;
  runtimeCompositionId: string;
  /** Authored local timing is retained verbatim; expressions are not guessed. */
  start: string | null;
  duration: string | null;
}
export interface Graph {
  entry: string;
  files: string[];
  instances: Instance[];
}
export interface Definition {
  document: Document;
  html: string;
  hosts: Element[];
}

/** References are local files, resolved relative to their declaring source, never host paths. */
export function resolveReference(from: string, value: string): string {
  if (!value || /[\\%?#:\p{Cc}]/u.test(value) || value.startsWith("/"))
    throw Error(`invalid composition reference in ${from}: ${value}`);
  const path = posix.normalize(posix.join(posix.dirname(from), value));
  if (path === ".." || path.startsWith("../") || !path.endsWith(".html"))
    throw Error(`composition reference escapes the project or is not HTML: ${value}`);
  return path;
}

export function projectGraph(sources: readonly Source[], entry = "index.html"): Graph {
  return prepareProject(sources, entry).graph;
}

export function prepareProject(sources: readonly Source[], entry = "index.html") {
  const files = new Map<string, string>();
  let bytes = 0;
  for (const source of sources) {
    if (
      files.has(source.path) ||
      /[\\%?#:\p{Cc}]/u.test(source.path) ||
      source.path.split("/").some((part) => !part || part === "." || part === "..")
    )
      throw Error(`invalid or duplicate project path: ${source.path}`);
    files.set(source.path, source.content);
    bytes += Buffer.byteLength(source.content);
  }
  if (files.size > 128 || bytes > 4 * 1024 * 1024) throw Error("project snapshot exceeds preview limits");
  const definitions = new Map<string, Definition>();
  const definition = (path: string, nested: boolean): Definition => {
    const existing = definitions.get(path);
    if (existing) return existing;
    const raw = files.get(path);
    if (raw === undefined) throw Error(`missing composition: ${path}`);
    if (nested) {
      const usable = checkSubCompositionUsability(raw, parseHTMLContent);
      if (!usable.ok) throw Error(`invalid composition ${path}: ${usable.detail}`);
    }
    const rawDocument = parseHTMLContent(raw);
    const resolved = resolveSubCompositionContent(raw, rawDocument);
    // Match the canonical mounted-content choice; ignore a template file's outer head.
    let effective = resolved.hasTemplate ? resolved.contentHtml : raw;
    if (resolved.hasTemplate) {
      const content = parseHTMLContent(effective),
        variables = rawDocument.documentElement?.getAttribute("data-composition-variables");
      if (variables) content.documentElement.setAttribute("data-composition-variables", variables);
      effective = content.toString();
    }
    const original = parseHTMLContent(effective),
      ids = new Set<string>();
    if (original.querySelector("[data-open-motion-instance]")) throw Error(`reserved preview identity in ${path}`);
    for (const element of original.querySelectorAll("[data-hf-id]")) {
      const id = element.getAttribute("data-hf-id") ?? "";
      if (!id || id.length > 128 || id.includes("/") || ids.has(id))
        throw Error(`ambiguous local element identity in ${path}: ${id}`);
      ids.add(id);
    }
    const document = parseHTMLContent(compileTimingAttrs(stripEmbeddedRuntimeScripts(ensureHfIds(effective))).html);
    const roots = [...document.querySelectorAll("[data-composition-id]")].filter(
      (node) => !node.parentElement?.closest("[data-composition-id]"),
    );
    if (roots.length > 1) throw Error(`ambiguous composition roots in ${path}`);
    for (const node of document.querySelectorAll("[data-composition-id]:not([data-composition-src])")) {
      if (node.parentElement?.closest("[data-composition-id]"))
        throw Error(`embedded composition requires an explicit file boundary in ${path}`);
    }
    const hosts = [...document.querySelectorAll("[data-composition-src]")];
    for (const host of hosts) {
      // External file mounts are explicit boundaries; anonymous instances cannot carry stable scope.
      if (!host.getAttribute("data-composition-id")) throw Error(`composition host requires an identity in ${path}`);
      if (host.parentElement?.closest("[data-composition-src]"))
        throw Error(`composition fallback contains another mount in ${path}`);
      host.setAttribute(
        "data-composition-src",
        resolveReference(path, host.getAttribute("data-composition-src") ?? ""),
      );
    }
    const result = { document, hosts, html: document.toString() };
    definitions.set(path, result);
    return result;
  };
  const root = definition(entry, false),
    instances: Instance[] = [],
    placeholders: Element[] = [];
  let expandedBytes = Buffer.byteLength(root.html);
  const visit = (file: string, parent: string | null, ancestry: string[]) => {
    if (ancestry.includes(file)) throw Error(`circular composition reference: ${[...ancestry, file].join(" -> ")}`);
    if (ancestry.length > 20) throw Error("composition nesting exceeds 20 levels");
    const source = definition(file, parent !== null);
    for (const host of source.hosts) {
      const hostId = host.getAttribute("data-hf-id") ?? "",
        id = parent ? `${parent}/${hostId}` : hostId;
      if (!hostId || id.length > 512 || instances.some((instance) => instance.id === id))
        throw Error(`ambiguous composition instance: ${id}`);
      if (instances.length >= 256) throw Error("composition instance count exceeds 256");
      const target = host.getAttribute("data-composition-src") ?? "";
      expandedBytes += Buffer.byteLength(definition(target, true).html);
      if (expandedBytes > 16 * 1024 * 1024) throw Error("expanded composition source exceeds 16 MiB");
      const instance: Instance = {
        id,
        parent,
        file: target,
        hostFile: file,
        hostId,
        authoredCompositionId: host.getAttribute("data-composition-id") ?? "",
        runtimeCompositionId: "",
        start: host.getAttribute("data-start"),
        duration: host.getAttribute("data-duration"),
      };
      instances.push(instance);
      placeholders.push(host.cloneNode(true) as Element);
      visit(target, id, [...ancestry, file]);
    }
  };
  visit(entry, null, []);
  const counts = new Map<string, number>();
  const rootIds = [...root.document.querySelectorAll("[data-composition-id]:not([data-composition-src])")].map(
    (node) => node.getAttribute("data-composition-id") ?? "",
  );
  for (const id of [...rootIds, ...instances.map((instance) => instance.authoredCompositionId)])
    counts.set(id, (counts.get(id) ?? 0) + 1);
  const identities = assignBundledRuntimeCompositionIds(placeholders, counts),
    seen = new Set(rootIds);
  instances.forEach((instance, index) => {
    const runtime = identities.get(placeholders[index] as Element)?.runtimeCompositionId;
    if (!runtime || seen.has(runtime)) throw Error("ambiguous runtime composition identity");
    seen.add(runtime);
    instance.runtimeCompositionId = runtime;
  });
  return { graph: { entry, files: [...definitions.keys()], instances } satisfies Graph, definitions, files };
}
