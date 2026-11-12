import { posix } from "node:path";
import {
  type BundledHostCompositionIdentity,
  deferScriptsUntilFonts,
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
import { type FontResource, resourceFontFamily } from "@open-motion/workspace/contract";
import { parse as parseCss } from "postcss";
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

export type MediaFact =
  | { path: string; type: "image/png" }
  | { path: string; type: "audio/wav"; duration: number }
  | Pick<FontResource, "path" | "type" | "digest" | "weight" | "slant">;

/** Pure snapshot assembly: no filesystem, network, engine process or persisted derived source. */
export function assembleProject(sources: readonly Source[], resources: readonly MediaFact[] = []) {
  const assets = new Map(resources.map((resource) => [resource.path, resource]));
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
  const faces = new Map<string, string>();
  for (const asset of resources) {
    if (!asset.type.startsWith("font/")) continue;
    if (
      !("weight" in asset) ||
      !/^assets\/[a-zA-Z0-9][a-zA-Z0-9._-]*\.(ttf|otf|woff|woff2)$/i.test(asset.path) ||
      !["normal", "italic"].includes(asset.slant) ||
      asset.weight.length !== 2 ||
      asset.weight.some((weight) => !Number.isFinite(weight) || weight < 1 || weight > 1000) ||
      asset.weight[0] > asset.weight[1] ||
      `font/${asset.path.split(".").at(-1)?.toLowerCase()}` !== asset.type
    )
      throw Error("invalid project font fact");
    const family = resourceFontFamily(asset.digest);
    if (!faces.has(family))
      faces.set(
        family,
        `@font-face{font-family:"${family}";src:url("${asset.path}");font-weight:${asset.weight.join(" ")};font-style:${asset.slant};font-display:block;}`,
      );
  }
  const requiredFonts = new Set<string>();
  const validateFonts = (sheet: string) => {
    if (!sheet.includes("OpenMotionFont_")) return;
    parseCss(sheet).walkDecls((declaration) => {
      if (!["font", "font-family"].includes(declaration.prop.toLowerCase()) && !declaration.prop.startsWith("--"))
        return;
      for (const match of declaration.value.matchAll(/\bOpenMotionFont_[a-f0-9]{64}\b/g)) {
        if (!faces.has(match[0])) throw Error(`missing project font: ${match[0]}`);
        requiredFonts.add(match[0]);
      }
    });
  };
  for (const element of document.querySelectorAll("style")) validateFonts(element.textContent ?? "");
  for (const element of document.querySelectorAll("[style]")) validateFonts(`a{${element.getAttribute("style")}}`);
  for (const [path, css] of files) if (path.toLowerCase().endsWith(".css")) validateFonts(css);
  for (const sheet of styleElementsFor(
    document,
    faces.size ? [{ css: [...faces.values()].join("\n"), media: null, title: null }] : [],
    (sheets) => sheets.join("\n"),
  ))
    document.head.appendChild(sheet);
  document.documentElement.setAttribute("data-open-motion-fonts", JSON.stringify([...requiredFonts]));
  if (requiredFonts.size) deferScriptsUntilFonts(document);
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
    const tag =
        element.tagName.toLowerCase() === "source"
          ? element.parentElement?.tagName.toLowerCase()
          : element.tagName.toLowerCase(),
      asset = assets.get(path);
    if (asset) {
      if (
        tag === "img" || tag === "picture" ? asset.type !== "image/png" : tag !== "audio" || asset.type !== "audio/wav"
      )
        throw Error(`media type does not match source: ${src}`);
      if (asset.type === "audio/wav") {
        const declared =
          (element.tagName.toLowerCase() === "source" ? element.parentElement : element)?.getAttribute(
            "data-source-duration",
          ) ?? null;
        if (
          declared !== null &&
          (!declared.trim() || !Number.isFinite(Number(declared)) || Math.abs(Number(declared) - asset.duration) > 1e-8)
        )
          throw Error(`audio source duration does not match verified resource: ${src}`);
      }
    } else if ((tag !== "img" && tag !== "picture") || !path.toLowerCase().endsWith(".svg"))
      throw Error(`unsupported text media source: ${src}`);
  }
  const html = document.toString();
  if (Buffer.byteLength(html) > 32 * 1024 * 1024) throw Error("assembled composition exceeds 32 MiB");
  return { html, graph };
}
