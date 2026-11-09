import type { Clip, NativeValues } from "@open-motion/motion/contract";
import type { Source } from "@open-motion/motion/project";
import type { Client } from "../../../api.js";
import type { Binding, CompositionContext } from "./context.js";
/** A gesture belongs to the exact source projection that produced its native animation identity. */
export async function retimeKey(
  context: CompositionContext,
  client: Client,
  id: string,
  time: number,
  source: string | undefined,
) {
  if (!source) throw Error("时间轴投影已过期");
  const key = JSON.parse(id) as { animationId: string; percentage: number; elementId: string };
  await context.transform(
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
  return key.elementId;
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
export async function commitClip(
  context: CompositionContext,
  client: Client,
  clip: Clip,
  start: number,
  duration: number,
  source: string | undefined,
) {
  if (!source) throw Error("时间轴投影已过期");
  await context.transform(
    (html) => patchClip(client, context.sources, context.instance, clip, { start, duration }, html, context.file),
    source,
  );
  return clip.id;
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
