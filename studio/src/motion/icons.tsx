import { iconSprite } from "../../../packages/design-system/index.js";
export function MotionIcon({ name, size = 16 }: { name: string; size?: number }) {
  return <svg width={size} height={size} className="motion-icon" aria-hidden="true"><use href={`${iconSprite}#icon-${name}`} /></svg>;
}
