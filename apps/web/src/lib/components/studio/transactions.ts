import type { Client } from "../../../api.js";
import type { Editor } from "../../editor.js";
/** A gesture belongs to the exact source projection that produced its native animation identity. */
export async function retimeKey(editor: Editor, client: Client, id: string, time: number, source: string | undefined) {
  await editor.save();
  if (!source || source !== editor.draft) throw new Error("时间轴投影已过期");
  const owner = editor.project?.artifactId,
    key = JSON.parse(id) as { animationId: string; percentage: number; elementId: string };
  const result = await client.animateMotion({
    action: "retime",
    html: source,
    id: key.elementId,
    animationId: key.animationId,
    percentage: key.percentage,
    time,
  });
  if (owner !== editor.project?.artifactId || source !== editor.draft) throw new Error("关键帧编辑上下文已过期");
  editor.edit(result.html);
  await editor.save();
  return key.elementId;
}
