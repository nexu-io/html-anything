import type { Entry, Registry } from './core.ts';
import { studioUsageEvents } from './studio-events.ts';

export const toolNames = ['motion_media_use', 'motion_list_templates', 'motion_get_template', 'motion_create_project', 'motion_open_preview',
  'motion_import_assets', 'motion_get_project', 'motion_edit_project', 'motion_export_request', 'motion_list_versions',
  'motion_restore_version', 'motion_export_cancel'] as const;
const outcome = ['success', 'failure', 'partial', 'cancelled', 'unknown'] as const;
const tool = { tool_name: toolNames, call_id: 'uuid', operation_id: 'uuid', accepted: 'boolean' } as const;
const business = { outcome, project_id: 'uuid', operation_id: 'uuid', replayed: 'boolean', error_code: 'code' } as const;
// A template is identified by its catalogue id only; titles, authors and URLs are never fields.
const template = { template_id: 'slug' } as const;
// Template library browsing. Names follow the shared OpenMotion tracking sheet so website and editor funnels line up.
const hosts = ['codex', 'claude', 'deepseek', 'chatgpt', 'mcp'] as const;
const sortOrder = ['recommended', 'name', 'reverse', 'duration'] as const;
// Where a card or detail came from: the gallery, the related strip, random discovery or previous/next in the detail.
const placement = ['popular', 'catalog', 'related', 'random', 'navigation'] as const;
const templateDetail = { detail_view_id: 'uuid', detail_mode: ['modal'], resource_kind: ['reference', 'editable_project', 'motion_guide'],
  instruction_kind: ['template_use', 'reference_recreate', 'recreate_submit'] } as const;
const templateList = { result_count: 'integer', search_id: 'uuid', sort: sortOrder, applied_filter_count: 'integer' } as const;

export const omEvents = {
  ...studioUsageEvents,
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
  studio_load_result: { producers: ['studio'], fields: { load_id: 'uuid', outcome, duration_ms: 'integer', embedded: 'boolean' }, required: ['load_id', 'outcome', 'duration_ms', 'embedded'] },
  ui_click: { producers: ['studio'], fields: { page_name: ['home', 'studio'],
    area: ['workspace', 'templates', 'template_card', 'template_detail', 'template_instruction', 'template_discovery'],
    element: ['new_creation', 'recent_session', 'open_project', 'select_template', 'copy_template',
      'open_detail', 'start_use', 'copy_instruction', 'expand_instruction', 'category_select', 'filter_open', 'filter_clear',
      'filter_option', 'sort_option', 'surprise_me', 'submit_video', 'detail_previous', 'detail_next',
      'download_guide', 'download_project', 'view_full_page', 'view_repository', 'view_source'],
    interaction_method: ['pointer', 'keyboard'], ...template,
    placement, position: 'integer', template_action: ['recreate', 'recreate_submit', 'open_edit'], target_agent: hosts,
    copy_attempt_id: 'uuid', download_attempt_id: 'uuid',
    filter_group: ['brand', 'uses', 'styles', 'industries', 'creationModels', 'colors', 'ratio', 'duration', 'editable'], filter_value: 'slug',
    selected: 'boolean', expanded: 'boolean', previous_sort: sortOrder, changed: 'boolean', ...templateDetail, ...templateList },
    required: ['page_name', 'area', 'element'] },
  // A surface that became visible: the library, a template card, one template's detail, or the instruction to copy.
  // A card counts once it is at least half visible for a second, once per result set.
  surface_view: { producers: ['studio'], fields: { page_name: ['home', 'studio'], area: ['template_library', 'template_card', 'template_detail', 'template_instruction'],
    element: ['library', 'card', 'detail', 'instruction'], placement, position: 'integer', ...templateList, ...templateDetail, ...template },
    required: ['page_name', 'area', 'element'] },
  // One per settled query, never per keystroke. `search_keyword` is the only free-text field in this registry.
  template_search_result: { producers: ['studio'], fields: { page_name: ['home', 'studio'], area: ['template_discovery'],
    search_keyword: 'text', query_length: 'integer', outcome: ['success', 'failure'], ...templateList },
    required: ['search_id', 'query_length', 'result_count', 'outcome'] },
  template_filter_result: { producers: ['studio'], fields: { page_name: ['home', 'studio'], area: ['template_discovery'],
    action: ['category_select', 'filter_apply', 'filter_clear', 'sort_change'], outcome: ['success', 'failure'], ...templateList },
    required: ['action', 'result_count', 'outcome'] },
  // `browser_save_requested` means the save was handed to the browser; nothing confirms the file reached disk.
  resource_download_result: { producers: ['studio'], fields: { page_name: ['home', 'studio'], resource_kind: ['motion_guide'], download_attempt_id: 'uuid',
    delivery_status: ['browser_save_requested', 'fetch_failed', 'unknown'], error_code: 'code', detail_view_id: 'uuid', detail_mode: ['modal'], ...template },
    required: ['resource_kind', 'download_attempt_id', 'delivery_status'] },
  template_instruction_copy_result: { producers: ['studio'], fields: { host_product: hosts, copy_status: ['clipboard_written', 'manual_fallback_shown', 'failed'],
    page_name: ['home', 'studio'], copy_attempt_id: 'uuid', ...templateDetail, ...template }, required: ['host_product', 'copy_status'] },
} as const satisfies Registry & Record<string, { producers: readonly Entry[] }>;

export type StudioEvent = { [E in keyof typeof omEvents]:
  'studio' extends typeof omEvents[E]['producers'][number] ? E : never
}[keyof typeof omEvents];
export const studioEvents = Object.fromEntries(Object.entries(omEvents)
  .filter(([, spec]) => (spec.producers as readonly Entry[]).includes('studio'))) as Pick<typeof omEvents, StudioEvent>;
