import { trackMotion } from '../studio/src/motion/tracking.ts';

// Compile-only calls: this function must never execute or emit events.
function studioContract() {
  void trackMotion('ui_click', { page_name: 'home', area: 'workspace', element: 'new_creation' });
  // @ts-expect-error Node-only events are not part of the Studio API.
  void trackMotion('mcp_tool_started', { tool_name: 'motion_get_project', call_id: '', accepted: true });
  // @ts-expect-error Required semantic fields remain required.
  void trackMotion('ui_click', { page_name: 'home' });
  // @ts-expect-error Enums remain closed.
  void trackMotion('ui_click', { page_name: 'private', area: 'workspace', element: 'new_creation' });
}
void studioContract;
