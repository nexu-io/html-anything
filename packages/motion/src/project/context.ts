import { parseNumeric } from "@hyperframes/parsers/composition";
import { contextInput } from "./input.js";

export { contextInput } from "./input.js";

import { type Clip, Motion } from "../index.js";
import { type Graph, type Instance, prepareProject } from "./graph.js";
import { describeHosts } from "./host.js";

export interface EditingContext {
  instance: string | null;
  invalidated: boolean;
  file: string;
  trail: Instance[];
  graph: Graph;
  offset: number | null;
  duration: number | null;
  clockReason: string | null;
}
export interface ContextModel {
  html: string;
  clips: Clip[];
  context: EditingContext;
}

/** File definitions own edits; instance ancestry owns navigation and local-to-global time. */
export async function inspectContext(input: unknown): Promise<ContextModel> {
  const { files: sources, instance: requested } = contextInput.parse(input);
  const { graph, files, definitions } = prepareProject(sources);
  const instance = graph.instances.find((node) => node.id === requested);
  const trail: Instance[] = [];
  for (let node = instance; node; node = graph.instances.find((parent) => parent.id === node?.parent))
    trail.unshift(node);
  const file = instance?.file ?? graph.entry;
  const length = (path: string) =>
    parseNumeric(definitions.get(path)?.document.querySelector("[data-composition-id]")?.getAttribute("data-duration"));
  let offset = 0,
    end = length(graph.entry) ?? Number.POSITIVE_INFINITY,
    clockReason: string | null = null;
  for (const node of trail) {
    const start = node.start === null ? 0 : parseNumeric(node.start),
      duration = node.duration === null ? length(node.file) : parseNumeric(node.duration);
    if (start === null || start < 0 || duration === null || duration <= 0) {
      clockReason = "合成时钟包含未解析表达式或缺少有效时长；保留源码，只读查看";
      break;
    }
    offset += start;
    end = Math.min(end, offset + duration);
  }
  const duration = Math.min(length(file) ?? Number.POSITIVE_INFINITY, end - offset);
  if (duration <= 0) clockReason = "合成实例不在父合成的有效时间窗内";
  const context: EditingContext = {
    instance: instance?.id ?? null,
    invalidated: requested !== null && !instance,
    file,
    trail,
    graph,
    offset: clockReason ? null : offset,
    duration: Number.isFinite(duration) && duration > 0 ? duration : null,
    clockReason,
  };
  const html = files.get(file);
  if (html === undefined) throw Error("editing source is missing");
  const model = await Motion.open(html);
  try {
    const hosts = describeHosts(graph, definitions, file, context.instance, html);
    return { html, clips: model.clips.map((clip) => ({ ...clip, ...hosts.get(clip.id) })), context };
  } finally {
    model.dispose();
  }
}
