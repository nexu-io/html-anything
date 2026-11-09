import type { Client } from "../../../api.js";
import type { CompositionContext } from "./context.js";
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
