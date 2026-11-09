import { mintLinkId } from "@hyperframes/core/media-link";
import type { EditOp } from "@hyperframes/sdk";
import type { Clip, ClipEdit, NativeValues } from "../contract.js";

function scopeOf(clip: Clip, clips: Clip[]): string | null {
  let node = clips.find((c) => c.id === clip.parent);
  const seen = new Set<string>();
  while (node && !seen.has(node.id)) {
    seen.add(node.id);
    if (node.composition) return node.id;
    node = clips.find((c) => c.id === node?.parent);
  }
  return null;
}
function eligibility(clip: Clip, dynamic: boolean): string | null {
  if (!clip.media || clip.composition || clip.id.includes("/") || dynamic || clip.animations.length)
    return "只读：链接仅支持当前源码合成中的静态 PNG/WAV 媒体";
  if (
    !/^(?:\.\.\/)*assets\/[a-zA-Z0-9][a-zA-Z0-9._-]*\.(?:png|wav)$/i.test(clip.media.src) ||
    (clip.media.kind === "audio" ? !/\.wav$/i.test(clip.media.src) : !/\.png$/i.test(clip.media.src))
  )
    return "只读：链接需要明确的本地 PNG/WAV 素材引用";
  if (clip.start === null || clip.start < 0 || clip.duration === null || clip.duration <= 0)
    return "只读：链接需要明确的片段起点与时长";
  return clip.media.audio?.reason ?? null;
}
function groupReason(members: Clip[], clips: Clip[]): string | null {
  const first = members[0];
  if (!first || members.length < 2) return "只读：链接组缺少伙伴，请先解除链接";
  if (members.some((c) => !c.media || c.media.linkReason)) return "只读：链接组包含不受支持或动态媒体";
  const scope = scopeOf(first, clips);
  if (!scope || members.some((c) => scopeOf(c, clips) !== scope)) return "只读：链接成员必须属于同一源码合成";
  if (
    members.some(
      (c) =>
        c.start === null ||
        c.duration === null ||
        first.start === null ||
        first.duration === null ||
        Math.abs(c.start - first.start) > 1e-8 ||
        Math.abs(c.duration - first.duration) > 1e-8,
    )
  )
    return "只读：链接组起点与时长未对齐，请先解除链接";
  const ids = new Set(members.map((c) => c.id));
  for (const member of members) {
    let parent = member.parent;
    while (parent) {
      if (ids.has(parent)) return "只读：链接成员不得互相嵌套";
      parent = clips.find((c) => c.id === parent)?.parent ?? null;
    }
  }
  const audio = members.flatMap((c) => (c.media?.audio ? [c.media.audio] : [])),
    a = audio[0];
  if (
    a &&
    audio.some(
      (b) =>
        a.inPoint === null ||
        b.inPoint === null ||
        a.rate === null ||
        b.rate === null ||
        Math.abs(a.inPoint - b.inPoint) > 1e-8 ||
        Math.abs(a.rate - b.rate) > 1e-8,
    )
  )
    return "只读：链接音频的源入点与倍率未对齐，请先解除链接";
  return null;
}
export function describeLinks(clips: Clip[], linkOf: (id: string) => string | undefined, dynamic: boolean): Clip[] {
  const base = clips.map((c) => (c.media ? { ...c, media: { ...c.media, linkReason: eligibility(c, dynamic) } } : c));
  const groups = new Map<string, { id: string; members: Clip[] }>(),
    keys = new Map<string, string>();
  for (const c of base) {
    const id = linkOf(c.id);
    if (id === undefined) continue;
    const key = JSON.stringify([scopeOf(c, base), id, id ? null : c.id]);
    keys.set(c.id, key);
    const group = groups.get(key) ?? { id, members: [] };
    group.members.push(c);
    groups.set(key, group);
  }
  const descriptions = new Map<string, NonNullable<Clip["link"]>>();
  for (const [key, { id, members }] of groups) {
    const reason = !/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,127}$/.test(id) ? "只读：链接组标识无效" : groupReason(members, base);
    const maxima = members.flatMap((m) =>
      m.media?.kind === "audio" && m.media.maximum !== null ? [m.media.maximum] : [],
    );
    descriptions.set(key, {
      id,
      members: members.map((m) => m.id),
      reason,
      maximum: reason || !maxima.length ? null : Math.min(...maxima),
    });
  }
  return base.map((c) => {
    const key = keys.get(c.id),
      link = key === undefined ? undefined : descriptions.get(key);
    if (!link) return c;
    return {
      ...c,
      link,
      ...(link.reason && c.media?.audio
        ? { media: { ...c.media, maximum: null, audio: { ...c.media.audio, reason: link.reason } } }
        : {}),
    };
  });
}
function selected(clips: Clip[], id: string): Clip {
  const clip = clips.find((c) => c.id === id);
  if (!clip) throw Error("native element is missing");
  return clip;
}
function membersOf(clips: Clip[], clip: Clip, validate = true): Clip[] {
  if (validate && clip.link?.reason) throw Error(clip.link.reason);
  return clip.link ? clip.link.members.map((id) => selected(clips, id)) : [clip];
}
export function linkedPatches(clips: Clip[], id: string, values: NativeValues): { id: string; values: NativeValues }[] {
  const clip = selected(clips, id),
    members = membersOf(clips, clip);
  const shared: NativeValues = {};
  if (values.start !== undefined) shared.start = values.start;
  if (values.duration !== undefined) shared.duration = values.duration;
  return members
    .map((member) => {
      if (member.id === id) return { id, values };
      const patch: NativeValues = { ...shared };
      if (member.media?.kind === "audio" && (values.audio?.inPoint !== undefined || values.audio?.rate !== undefined)) {
        patch.audio = {};
        if (values.audio.inPoint !== undefined) patch.audio.inPoint = values.audio.inPoint;
        if (values.audio.rate !== undefined) patch.audio.rate = values.audio.rate;
      }
      return { id: member.id, values: patch };
    })
    .filter((patch) => Object.keys(patch.values).length > 0);
}
export function editLinks(clips: Clip[], input: ClipEdit, taken: string[]): EditOp[] {
  const clip = selected(clips, input.id);
  if (input.action === "remove") {
    if (clip.composition) throw Error("only a content element can be removed");
    return membersOf(clips, clip).map((c) => ({ type: "removeElement", target: c.id }));
  }
  if (input.action === "unlink") {
    if (!clip.link || clip.composition) throw Error("请选择已链接的媒体");
    return membersOf(clips, clip, false).map((c) => ({
      type: "setAttribute",
      target: c.id,
      name: "data-link",
      value: null,
    }));
  }
  const partner = selected(clips, input.partner);
  if (partner.id === clip.id || partner.link) throw Error("请选择尚未链接的其他媒体伙伴");
  const members = [...membersOf(clips, clip), partner],
    reason = groupReason(members, clips);
  if (reason) throw Error(reason);
  const id = clip.link?.id ?? mintLinkId(taken);
  return members.map((c) => ({ type: "setAttribute", target: c.id, name: "data-link", value: id }));
}
