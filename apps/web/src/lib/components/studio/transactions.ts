import type { Clip, ClipEdit, NativeValues } from "@open-motion/motion/contract";
import type { Source } from "@open-motion/motion/project";
import type { Resource } from "@open-motion/workspace/contract";
import type { Client } from "../../../api.js";
import type { Binding, CompositionContext } from "./context.js";
/** A gesture belongs to the exact source projection that produced its native animation identity. */
export function retimeKey(
  context: CompositionContext,
  client: Client,
  id: string,
  time: number,
  source: string | undefined,
) {
  if (!source) throw Error("时间轴投影已过期");
  const key = JSON.parse(id) as { animationId: string; percentage: number; elementId: string };
  const commit = context.transaction(
    (html) =>
      client.animateMotion({
        action: "retime",
        html,
        id: key.elementId,
        animationId: key.animationId,
        percentage: key.percentage,
        time,
      }),
    source,
  );
  return async () => {
    await commit();
    return key.elementId;
  };
}

export async function patchClip(
  client: Client,
  files: Source[],
  instance: string | null,
  clip: Clip,
  values: NativeValues,
  html: string,
  file: string,
) {
  if (!clip.host) return client.patchMotion(html, clip.id, values);
  if (clip.host.reason) throw Error(clip.host.reason);
  if (Object.keys(values).some((key) => !["start", "duration"].includes(key)))
    throw Error("合成宿主只允许修改窗口起点与时长");
  const start = values.start ?? clip.start,
    duration = values.duration ?? clip.duration;
  if (start === null || duration === null) throw Error("合成宿主时序不可解析");
  const changed = await client.retimeHost(files, instance, clip.id, start, duration);
  if (changed.file !== file) throw Error("宿主父文件身份不一致");
  return changed;
}
export function commitClip(
  context: CompositionContext,
  client: Client,
  clip: Clip,
  start: number,
  duration: number,
  source: string | undefined,
) {
  if (!source) throw Error("时间轴投影已过期");
  const commit = context.transaction(
    (html) => patchClip(client, context.sources, context.instance, clip, { start, duration }, html, context.file),
    source,
  );
  return async () => {
    await commit();
    return clip.id;
  };
}

export async function applyClip(
  context: CompositionContext,
  client: Client,
  binding: Binding,
  clip: Clip,
  values: NativeValues,
) {
  context.capture(binding.source);
  const result = await patchClip(client, context.sources, context.instance, clip, values, binding.source, binding.file);
  context.apply(binding, result.html);
}

/** Prepare/apply one insertion; the caller retains its applied state across persistence retries. */
export async function insertResource(context: CompositionContext, client: Client, asset: Resource) {
  if (asset.type !== "image/png" && asset.type !== "audio/wav") throw Error("字体通过文本图层的字体选项应用");
  const binding = await context.prepare(),
    parts = binding.file.split("/");
  parts.pop();
  const src = "../".repeat(parts.length) + asset.path;
  const changed = await client.editMotion(
    asset.type === "image/png"
      ? { html: binding.source, action: "addImage", src, width: asset.width, height: asset.height }
      : { html: binding.source, action: "addAudio", src, duration: asset.duration },
  );
  context.apply(binding, changed.html);
  return changed;
}

/** Retain applied source and the workspace receipt across unknown save outcomes. */
export function editClip(context: CompositionContext, client: Client, input: ClipEdit, save: () => Promise<void>) {
  let applied = false;
  return async () => {
    if (!applied) {
      const binding = await context.prepare();
      const changed = await client.editMotion({ html: binding.source, ...input });
      context.apply(binding, changed.html);
      applied = true;
    }
    await save();
  };
}
