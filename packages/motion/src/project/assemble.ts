import { posix } from "node:path";
import {
  type BundledHostCompositionIdentity,
  emitMountedModuleScripts,
  emitRootCompositionVariableStyles,
  emitVariablesByCompScript,
  ensureExternalLinkTag,
  ensureExternalScriptTag,
  inlineSubCompositions,
  parseHostVariableValues,
  parseHTMLContent,
  prepareFlattenedInnerRoot,
  readDeclaredDefaults,
  styleElementsFor,
} from "@hyperframes/core/compiler";
import { type Instance, prepareProject, type Source } from "./graph.js";

/** The canonical compiler clones source DOMs. Resolve those clones through SDK host-chain identity. */
class Identities extends Map<Element, BundledHostCompositionIdentity> {
  private instances: Map<string, Instance>;
  constructor(instances: Instance[]) {
    super();
    this.instances = new Map(instances.map((instance) => [instance.id, instance]));
  }
  override get(host: Element): BundledHostCompositionIdentity {
    const cached = super.get(host);
    if (cached) return cached;
    const parent = host.parentElement
      ?.closest("[data-open-motion-instance]")
      ?.getAttribute("data-open-motion-instance");
    const id = [parent, host.getAttribute("data-hf-id")].filter(Boolean).join("/");
    const instance = this.instances.get(id);
    if (!instance) throw Error(`unresolved composition instance: ${id}`);
    host.setAttribute("data-open-motion-instance", id);
    host.setAttribute("data-composition-id", instance.runtimeCompositionId);
    if (instance.runtimeCompositionId !== instance.authoredCompositionId)
      host.setAttribute("data-hf-original-composition-id", instance.authoredCompositionId);
    const identity = {
      authoredCompositionId: instance.authoredCompositionId,
      runtimeCompositionId: instance.runtimeCompositionId,
    };
    this.set(host, identity);
    return identity;
  }
}

/** Pure snapshot assembly: no filesystem, network, engine process or persisted derived source. */
export function assembleProject(sources: readonly Source[], resourcePaths: readonly string[] = []) {
  const assets = new Set(resourcePaths);
  const { graph, definitions, files } = prepareProject(sources);
  const document = parseHTMLContent(definitions.get(graph.entry)?.html ?? "");
  const result = inlineSubCompositions(document, [...document.querySelectorAll("[data-composition-src]")], {
    resolveHtml: (path) => definitions.get(path)?.html ?? null,
    parseHtml: parseHTMLContent,
    hostIdentityMap: new Identities(graph.instances),
    flattenInnerRoot: prepareFlattenedInnerRoot,
    rewriteInlineStyles: true,
    assetExists: (path) => files.has(path) || assets.has(path),
    readProjectScript: (path) => files.get(path) ?? null,
    readVariableDefaults: readDeclaredDefaults,
    parseHostVariables: parseHostVariableValues,
    onMissingComposition: (path, reason) => {
      throw Error(`cannot assemble composition ${path}: ${reason ?? "missing source"}`);
    },
  });
  if (document.querySelector("[data-composition-src]")) throw Error("composition assembly left unresolved mounts");
  for (const style of styleElementsFor(document, result.styles, (sheets) => sheets.join("\n")))
    document.head.appendChild(style);
  for (const link of result.externalLinks) ensureExternalLinkTag(document, link);
  emitVariablesByCompScript(document, result.variablesByComp);
  for (const item of result.scriptItems) {
    if (item.kind === "external") ensureExternalScriptTag(document, item.src, item);
    else {
      const script = document.createElement("script");
      script.textContent = item.content;
      document.body.appendChild(script);
    }
  }
  emitMountedModuleScripts(document, result.importMaps, result.moduleScripts);
  emitRootCompositionVariableStyles(document, result.variablesByComp);
  for (const element of document.querySelectorAll("img[src],audio[src],video[src],source[src]")) {
    const src = element.getAttribute("src") ?? "";
    if (src.startsWith("data:") && element.tagName.toLowerCase() === "img") continue;
    let decoded: string;
    try {
      decoded = decodeURIComponent(src.split(/[?#]/)[0] ?? "");
    } catch {
      throw Error(`unsupported media reference: ${src}`);
    }
    if (!decoded || /[\\%:\p{Cc}]/u.test(decoded) || decoded.startsWith("/"))
      throw Error(`unsupported media reference: ${src}`);
    const path = posix.normalize(decoded);
    if (path === ".." || path.startsWith("../") || (!files.has(path) && !assets.has(path)))
      throw Error(`missing media resource: ${src}`);
  }
  const html = document.toString();
  if (Buffer.byteLength(html) > 32 * 1024 * 1024) throw Error("assembled composition exceeds 32 MiB");
  return { html, graph };
}
