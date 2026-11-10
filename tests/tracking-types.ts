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
  void trackMotion('ui_click', { page_name: 'studio', area: 'project_drawer', element: 'language_change', option: 'zh-CN' });
  void trackMotion('studio_edit_result', { outcome: 'success', edit_kind: 'font_size', surface: 'properties', project_scope: 'default' });
  void trackMotion('studio_export_request_result', { export_id: '', outcome: 'rejected', origin: 'header', format: 'mp4',
    quality: 'standard', resolution: 'auto', fps: '30', error_code: 'FFMPEG_MISSING' });
  // @ts-expect-error The worker's export terminal event is not a Studio event.
  void trackMotion('export_result', { job_id: '', job_state: 'completed', duration_ms: 1, technical_check: 'unknown' });
  // @ts-expect-error Edit kinds remain a closed set; a history label is not one.
  void trackMotion('studio_edit_result', { outcome: 'success', edit_kind: 'Edit layer style', surface: 'properties' });
  // @ts-expect-error A project is reported by id and scope, never by name.
  void trackMotion('studio_edit_result', { outcome: 'success', edit_kind: 'move', surface: 'canvas', project_name: 'x' });
  // @ts-expect-error Export settings are bucketed; a raw frame rate number is not accepted.
  void trackMotion('studio_export_result', { export_id: '', job_state: 'completed', duration_ms: 1, origin: 'header', format: 'mp4', quality: 'high', resolution: 'auto', fps: 30 });
  void trackMotion('ui_click', { page_name: 'studio', area: 'templates', element: 'preview_template', template_id: 'hf-moment-M1147' });
  void trackMotion('studio_load_result', { load_id: '', outcome: 'success', duration_ms: 1, embedded: false, clip_count_bucket: 'unknown', composition_count_bucket: '2_5' });
  // @ts-expect-error Video length is a bucket; seconds are not accepted.
  void trackMotion('studio_export_result', { export_id: '', job_state: 'completed', duration_ms: 1, origin: 'header', format: 'mp4', quality: 'high', resolution: 'auto', fps: '30', video_duration_bucket: 42 });
  // @ts-expect-error Project size is a bucket; a raw count is not accepted.
  void trackMotion('studio_load_result', { load_id: '', outcome: 'success', duration_ms: 1, embedded: false, clip_count_bucket: 12 });
}
void studioContract;
