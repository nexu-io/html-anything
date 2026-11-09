import { parseGsapScript } from "@hyperframes/core/gsap-parser";
import { parseNumeric } from "@hyperframes/parsers/composition";
import { buildDocument, openComposition } from "@hyperframes/sdk";
import { z } from "zod";
import type { Clip } from "../contract.js";
import { type Definition, type Graph, prepareProject } from "./graph.js";
import { contextInput } from "./input.js";

export const hostTimingInput = contextInput.extend({
  id: z.string().min(1).max(128),
  start: z.number().finite().nonnegative(),
  duration: z.number().finite().positive(),
});
export interface HostChange {
  file: string;
  html: string;
}
/** A host's visible window belongs to the parent source; child source time never stretches. */
export function describeHosts(
  graph: Graph,
  definitions: Map<string, Definition>,
  file: string,
  parent: string | null,
  html: string,
) {
  const document = definitions.get(file)?.document;
  const length = (path: string) =>
    parseNumeric(definitions.get(path)?.document.querySelector("[data-composition-id]")?.getAttribute("data-duration"));
  const parentLength = length(file),
    script = buildDocument(html).gsapScript;
  const animations = script ? parseGsapScript(script).animations : [];
  const result = new Map<string, { start: number | null; duration: number | null; host: NonNullable<Clip["host"]> }>();
  for (const node of graph.instances.filter((node) => node.parent === parent && node.hostFile === file)) {
    const start = node.start === null ? 0 : parseNumeric(node.start),
      maximum = length(node.file),
      duration = node.duration === null ? maximum : parseNumeric(node.duration);
    let reason: string | null = null;
    if (
      start === null ||
      duration === null ||
      maximum === null ||
      parentLength === null ||
      start < 0 ||
      duration <= 0 ||
      maximum <= 0 ||
      duration > maximum + 1e-8 ||
      start + duration > parentLength + 1e-8
    )
      reason = "宿主窗口需要有效的数值起点、时长及父子合成边界";
    else if (document?.querySelector("[data-link]")) reason = "链接时序需通过独立契约管理，当前只读";
    else if (animations.some((animation) => animation.hasUnresolvedSelector || animation.hasPartialSelector))
      reason = "父合成包含动态选择器，无法证明窗口修改的影响范围";
    else if (
      animations.some((animation) => {
        if (animation.targetSelector === "dwell/hold") return false;
        try {
          return [...(document?.querySelectorAll(animation.targetSelector) ?? [])].some(
            (element) => element.getAttribute("data-hf-id") === node.hostId,
          );
        } catch {
          return true;
        }
      })
    )
      reason = "宿主动画与窗口时序的联动尚未验证，当前只读";
    result.set(node.hostId, { start, duration, host: { instance: node.id, source: node.file, maximum, reason } });
  }
  return result;
}

export async function retimeHost(input: unknown): Promise<HostChange> {
  const value = hostTimingInput.parse(input),
    prepared = prepareProject(value.files);
  const parent = value.instance === null ? null : prepared.graph.instances.find((node) => node.id === value.instance);
  if (value.instance !== null && !parent) throw Error("宿主编辑上下文已过期");
  const file = parent?.file ?? prepared.graph.entry,
    html = prepared.files.get(file);
  if (html === undefined) throw Error("宿主父文件已移除");
  const composition = await openComposition(html, { history: false });
  try {
    if (!composition.getElement(value.id)) throw Error("宿主元素不存在");
    const host = describeHosts(prepared.graph, prepared.definitions, file, value.instance, html).get(value.id)?.host;
    if (!host || host.reason) throw Error(host?.reason ?? "目标不是当前父合成中的外部宿主");
    const parentLength = parseNumeric(
      prepared.definitions.get(file)?.document.querySelector("[data-composition-id]")?.getAttribute("data-duration"),
    );
    if (
      parentLength === null ||
      value.start + value.duration > parentLength + 1e-8 ||
      host.maximum === null ||
      value.duration > host.maximum + 1e-8
    )
      throw Error("宿主窗口超出父合成或共享子合成边界");
    const operation = { type: "setTiming" as const, target: value.id, start: value.start, duration: value.duration };
    const allowed = composition.can(operation);
    if (!allowed.ok) throw Error(allowed.message);
    composition.dispatch(operation);
    const changed = composition.serialize({ stripRuntime: true });
    const projected = prepareProject(
      value.files.map((source) => (source.path === file ? { ...source, content: changed } : source)),
    ).graph.instances.find((node) => node.id === host.instance);
    if (
      !projected ||
      !(Math.abs((parseNumeric(projected.start) ?? Number.NaN) - value.start) <= 1e-8) ||
      !(Math.abs((parseNumeric(projected.duration) ?? Number.NaN) - value.duration) <= 1e-8)
    )
      throw Error("原生变换未写入目标宿主窗口");
    return { file, html: changed };
  } finally {
    composition.dispose();
  }
}
