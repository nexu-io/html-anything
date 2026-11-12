import { trackMotion } from '../studio/src/motion/tracking.ts';
import { omEvents } from '../tracking/events.ts';
import type { CountAggregation } from '../tracking/core.ts';

// Compile-only calls: this function must never execute or emit events.
function studioContract() {
  void trackMotion('ui_click', { page_name: 'home', area: 'workspace', element: 'new_creation' });
  // @ts-expect-error Node-only events are not part of the Studio API.
  void trackMotion('mcp_tool_started', { tool_name: 'motion_get_project', call_id: '', accepted: true });
  // @ts-expect-error Required semantic fields remain required.
  void trackMotion('ui_click', { page_name: 'home' });
  // @ts-expect-error Enums remain closed.
  void trackMotion('ui_click', { page_name: 'private', area: 'workspace', element: 'new_creation' });
  // @ts-expect-error Summary events are produced by the reporter, never Studio callers.
  void trackMotion('ui_click_count', { page_name: 'home', area: 'workspace', element: 'new_creation', count: 1 });
}
void studioContract;
const policy = { ui_click: { windowMs: 60_000 } } satisfies CountAggregation<typeof omEvents>;
// @ts-expect-error Critical business events are not count-aggregation candidates.
const unsupported = { project_create_result: { windowMs: 60_000 } } satisfies CountAggregation<typeof omEvents>;
void policy; void unsupported;
