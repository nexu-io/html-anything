import type { Entry, Registry } from './core.ts';

export const toolNames = ['motion_list_templates', 'motion_get_template', 'motion_create_project', 'motion_open_preview',
  'motion_import_assets', 'motion_get_project', 'motion_edit_project', 'motion_export_request', 'motion_list_versions',
  'motion_restore_version', 'motion_export_cancel'] as const;
const outcome = ['success', 'failure', 'partial', 'cancelled', 'unknown'] as const;
const tool = { tool_name: toolNames, call_id: 'uuid', operation_id: 'uuid', accepted: 'boolean' } as const;
// Studio project ids are UUIDs except the built-in local project, whose id is the literal `project`.
const project = { project_id: 'uuid', project_scope: ['default', 'managed', 'other'] } as const;
const exportSettings = { origin: ['header', 'export_panel', 'composition_card'], format: ['mp4', 'webm', 'mov', 'gif'],
  quality: ['draft', 'standard', 'high'], resolution: ['auto', '1080p', '4k'], fps: ['24', '30', '60', 'other'] } as const;
// A template is identified by its catalogue id only; titles, authors and URLs are never fields.
const template = { template_id: 'slug' } as const;
// Template library browsing. Names follow the shared OpenMotion tracking sheet so website and editor funnels line up.
const hosts = ['codex', 'claude', 'deepseek', 'chatgpt', 'mcp'] as const;
const sortOrder = ['recommended', 'name', 'reverse'] as const;
const templateDetail = { detail_view_id: 'uuid', detail_mode: ['modal'], resource_kind: ['reference', 'editable_project', 'motion_guide'],
  instruction_kind: ['template_use', 'reference_recreate'] } as const;
const templateList = { result_count: 'integer', search_id: 'uuid', sort: sortOrder, applied_filter_count: 'integer' } as const;
const countBucket = ['0', '1_5', '6_20', '21_50', 'gt_50', 'unknown'] as const;
const projectScale = { clip_count_bucket: countBucket, asset_count_bucket: countBucket,
  composition_count_bucket: ['1', '2_5', '6_20', 'gt_20', 'unknown'] } as const;
const videoDuration = { video_duration_bucket: ['lt_15s', '15_60s', '1_3min', '3_10min', 'gt_10min', 'unknown'] } as const;
const business = { outcome, project_id: 'uuid', operation_id: 'uuid', replayed: 'boolean', error_code: 'code' } as const;

export const omEvents = {
  mcp_tool_started: { producers: ['mcp'], fields: tool, required: ['tool_name', 'call_id', 'accepted'] },
  mcp_tool_finished: { producers: ['mcp'], fields: { ...tool, outcome, duration_ms: 'integer', error_code: 'code', replayed: 'boolean' },
    required: ['tool_name', 'call_id', 'accepted', 'outcome', 'duration_ms'] },
  project_create_result: { producers: ['mcp'], fields: { ...business, creation_route: ['natural_language', 'template', 'existing_project'], effect_status: ['applied', 'not_applied', 'unknown'] }, required: ['outcome'] },
  project_open_result: { producers: ['mcp'], fields: { ...business, opened_by_host_status: ['unknown', 'opened', 'not_opened'] }, required: ['outcome'] },
  project_edit_result: { producers: ['mcp'], fields: { ...business, changed_file_count: 'integer' }, required: ['outcome'] },
  version_restore_result: { producers: ['mcp'], fields: business, required: ['outcome'] },
  asset_import_result: { producers: ['mcp'], fields: { ...business, requested_count: 'integer', added_count: 'integer', reused_count: 'integer', failed_count: 'integer' }, required: ['outcome'] },
  export_request_result: { producers: ['mcp'], fields: { ...business, job_id: 'uuid', queue_state: ['pending', 'running', 'cancelling', 'cancelled', 'completed', 'failed'] }, required: ['outcome'] },
  export_cancel_result: { producers: ['mcp'], fields: { ...business, job_id: 'uuid', state_after: ['pending', 'running', 'cancelling', 'cancelled', 'completed', 'failed'] }, required: ['outcome'] },
  export_result: { producers: ['worker'], fields: { job_id: 'uuid', job_state: ['completed', 'failed', 'cancelled'], duration_ms: 'integer', technical_check: ['passed', 'failed', 'unknown'] }, required: ['job_id', 'job_state', 'duration_ms', 'technical_check'] },
  page_view: { producers: ['studio'], fields: { page_name: ['home', 'studio'], view_id: 'uuid', embedded: 'boolean', has_project: 'boolean' }, required: ['page_name', 'view_id', 'embedded', 'has_project'] },
  studio_load_result: { producers: ['studio'], fields: { load_id: 'uuid', outcome, duration_ms: 'integer', embedded: 'boolean', ...project, ...projectScale, ...template }, required: ['load_id', 'outcome', 'duration_ms', 'embedded'] },
  ui_click: { producers: ['studio'], fields: { page_name: ['home', 'studio'],
    area: ['workspace', 'templates', 'header', 'project_drawer', 'left_panel', 'right_panel', 'clips', 'assets', 'catalog',
      'preview', 'properties', 'layers', 'timeline', 'export_panel',
      'template_card', 'template_detail', 'template_instruction', 'template_discovery'],
    element: ['new_creation', 'recent_session', 'select_template', 'copy_template',
      'export', 'template_library', 'open_project_drawer', 'new_project', 'switch_project', 'project_search', 'theme_toggle',
      'language_change', 'privacy_settings', 'usage_data_toggle',
      'tab_clips', 'tab_assets', 'tab_catalog', 'tab_properties', 'tab_layers', 'tab_export',
      'select_clip', 'asset_search', 'asset_filter', 'catalog_search', 'catalog_filter',
      'select_element', 'play', 'pause', 'seek', 'speed_change', 'loop_toggle', 'expand_preview', 'restore_preview', 'locate_layer',
      'tool_select', 'tool_split', 'copy', 'snap_toggle', 'zoom_in', 'zoom_out', 'zoom_fit', 'zoom_selection', 'ruler_seek', 'fx_badge',
      'start_export', 'cancel_render', 'download_render', 'delete_render', 'ffmpeg_recheck', 'copy_install_command',
      'ask_agent_element', 'ask_agent_clip', 'ask_agent_time_range', 'ask_agent_playhead', 'ask_agent_catalog_item',
      'preview_template', 'use_template', 'template_category', 'template_search',
      'open_detail', 'start_use', 'copy_instruction', 'category_select', 'category_more', 'filter_open', 'filter_apply', 'filter_clear',
      'filter_option', 'sort_option', 'download_guide', 'download_project', 'view_full_page'],
    // The chosen value of a control with a small fixed set of choices; never free text.
    option: ['on', 'off', 'light', 'dark', 'en', 'zh-CN', 'ja', 'ko', 'de', 'fr', 'ru', 'es', 'pt-BR', 'it', 'tr',
      'all', 'images', 'video', 'audio', 'fonts',
      'captions', 'code-animation', 'vfx', 'transitions', 'effects', 'text-effects', 'social', 'data', 'scenes',
      '0.25', '0.5', '1', '1.5', '2', 'featured', 'ads', 'clone', 'motion', 'script', 'other'],
    interaction_method: ['pointer', 'keyboard'], ...project, ...template,
    placement: ['popular', 'catalog'], position: 'integer', template_action: ['recreate', 'open_edit'], target_agent: hosts,
    copy_attempt_id: 'uuid', download_attempt_id: 'uuid',
    filter_group: ['brand', 'uses', 'styles', 'industries', 'creationModels', 'colors', 'ratio', 'duration'], filter_value: 'slug',
    selected: 'boolean', expanded: 'boolean', previous_sort: sortOrder, changed: 'boolean', ...templateDetail, ...templateList },
    required: ['page_name', 'area', 'element'] },
  // A surface that became visible: the library, a template card, one template's detail, or the instruction to copy.
  // A card counts once it is at least half visible for a second, once per result set and placement.
  surface_view: { producers: ['studio'], fields: { page_name: ['home', 'studio'], area: ['template_library', 'template_card', 'template_detail', 'template_instruction'],
    element: ['library', 'card', 'detail', 'instruction'], placement: ['popular', 'catalog'], position: 'integer', ...templateList, ...templateDetail, ...project, ...template },
    required: ['page_name', 'area', 'element'] },
  // One per settled query, never per keystroke. `search_keyword` is the only free-text field in this registry.
  template_search_result: { producers: ['studio'], fields: { page_name: ['home', 'studio'], area: ['template_discovery'],
    search_keyword: 'text', query_length: 'integer', outcome: ['success', 'failure'], ...templateList, ...project },
    required: ['search_id', 'query_length', 'result_count', 'outcome'] },
  template_filter_result: { producers: ['studio'], fields: { page_name: ['home', 'studio'], area: ['template_discovery'],
    action: ['category_select', 'filter_apply', 'filter_clear', 'sort_change'], outcome: ['success', 'failure'], ...templateList, ...project },
    required: ['action', 'result_count', 'outcome'] },
  // `browser_save_requested` means the save was handed to the browser; nothing confirms the file reached disk.
  resource_download_result: { producers: ['studio'], fields: { page_name: ['home', 'studio'], resource_kind: ['motion_guide'], download_attempt_id: 'uuid',
    delivery_status: ['browser_save_requested', 'fetch_failed', 'unknown'], error_code: 'code', detail_view_id: 'uuid', detail_mode: ['modal'], ...project, ...template },
    required: ['resource_kind', 'download_attempt_id', 'delivery_status'] },
  template_instruction_copy_result: { producers: ['studio'], fields: { host_product: hosts, copy_status: ['clipboard_written', 'manual_fallback_shown', 'failed'],
    page_name: ['home', 'studio'], copy_attempt_id: 'uuid', ...templateDetail, ...project, ...template }, required: ['host_product', 'copy_status'] },
  // Studio UI exports run in the editor's own render pipeline, not the worker that owns export_result.
  studio_export_request_result: { producers: ['studio'], fields: { export_id: 'uuid', outcome: ['accepted', 'rejected'], ...exportSettings,
    error_code: ['FFMPEG_MISSING', 'SERVER_UNREACHABLE', 'SERVICE_UNAVAILABLE', 'REQUEST_REJECTED', 'SERVER_ERROR', 'INVALID_RESPONSE', 'RUNTIME_NOT_READY'], ...videoDuration, ...projectScale, ...project, ...template },
    required: ['export_id', 'outcome', 'origin', 'format', 'quality', 'resolution', 'fps'] },
  studio_export_result: { producers: ['studio'], fields: { export_id: 'uuid', job_state: ['completed', 'failed', 'cancelled'], duration_ms: 'integer',
    ...exportSettings, error_code: ['RENDER_FAILED', 'CONNECTION_LOST'], ...videoDuration, ...project, ...template },
    required: ['export_id', 'job_state', 'duration_ms', 'origin', 'format', 'quality', 'resolution', 'fps'] },
  studio_notice_shown: { producers: ['studio'], fields: { notice: ['ffmpeg_missing', 'external_file_conflict', 'project_unreachable'], ...project }, required: ['notice'] },
  // One per committed manual change; failures come from Studio's save-failure reporter.
  studio_edit_result: { producers: ['studio'], fields: { outcome: ['success', 'failure'],
    edit_kind: ['move', 'resize', 'rotate', 'crop', 'text', 'font_family', 'font_size', 'text_color', 'text_align', 'fill', 'opacity', 'style',
      'timing', 'layer_order', 'visibility', 'group', 'delete', 'duplicate', 'paste',
      'timeline_move', 'timeline_trim', 'timeline_split', 'add_asset', 'add_catalog_item', 'add_composition', 'keyframe', 'animation',
      'project_rename', 'asset_rename', 'asset_delete', 'other'],
    surface: ['header', 'canvas', 'properties', 'layers', 'timeline', 'assets', 'catalog', 'other'],
    error_code: ['CONFLICT', 'REQUEST_REJECTED', 'SERVER_ERROR', 'UNKNOWN'], ...project },
    required: ['outcome', 'edit_kind', 'surface'] },
  studio_history_step_result: { producers: ['studio'], fields: { action: ['undo', 'redo'], outcome: ['success', 'unavailable', 'failure'],
    interaction_method: ['pointer', 'keyboard'], ...project }, required: ['action', 'outcome'] },
  studio_asset_import_result: { producers: ['studio'], fields: { outcome: ['success', 'partial', 'failure'],
    entry_point: ['assets_button', 'assets_drop', 'timeline_button', 'timeline_drop', 'properties', 'other'],
    requested_count: 'integer', added_count: 'integer', failed_count: 'integer',
    error_category: ['too_large', 'unsupported_format', 'unreadable', 'runtime_not_ready', 'other'], ...project },
    required: ['outcome', 'entry_point', 'requested_count', 'added_count', 'failed_count'] },
} as const satisfies Registry & Record<string, { producers: readonly Entry[] }>;

export type StudioEvent = { [E in keyof typeof omEvents]:
  'studio' extends typeof omEvents[E]['producers'][number] ? E : never
}[keyof typeof omEvents];
export const studioEvents = Object.fromEntries(Object.entries(omEvents)
  .filter(([, spec]) => (spec.producers as readonly Entry[]).includes('studio'))) as Pick<typeof omEvents, StudioEvent>;
