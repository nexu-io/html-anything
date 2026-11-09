import type { Registry } from './core.ts';

export const toolNames = ['motion_list_templates', 'motion_get_template', 'motion_create_project', 'motion_open_preview',
  'motion_import_assets', 'motion_get_project', 'motion_edit_project', 'motion_export_request', 'motion_list_versions',
  'motion_restore_version', 'motion_export_cancel'] as const;
const outcome = ['success', 'failure', 'partial', 'cancelled', 'unknown'] as const;
const tool = { tool_name: toolNames, call_id: 'uuid', operation_id: 'uuid', accepted: 'boolean' } as const;
const business = { outcome, project_id: 'uuid', operation_id: 'uuid', replayed: 'boolean', error_code: 'code' } as const;

export const omEvents = {
  mcp_tool_started: { fields: tool, required: ['tool_name', 'call_id', 'accepted'] },
  mcp_tool_finished: { fields: { ...tool, outcome, duration_ms: 'integer', error_code: 'code', replayed: 'boolean' },
    required: ['tool_name', 'call_id', 'accepted', 'outcome', 'duration_ms'] },
  project_create_result: { fields: { ...business, creation_route: ['natural_language', 'template', 'existing_project'], effect_status: ['applied', 'not_applied', 'unknown'] }, required: ['outcome'] },
  project_open_result: { fields: { ...business, opened_by_host_status: ['unknown', 'opened', 'not_opened'] }, required: ['outcome'] },
  project_edit_result: { fields: { ...business, changed_file_count: 'integer' }, required: ['outcome'] },
  version_restore_result: { fields: business, required: ['outcome'] },
  asset_import_result: { fields: { ...business, requested_count: 'integer', added_count: 'integer', reused_count: 'integer', failed_count: 'integer' }, required: ['outcome'] },
  export_request_result: { fields: { ...business, job_id: 'uuid', queue_state: ['pending', 'running', 'cancelling', 'cancelled', 'completed', 'failed'] }, required: ['outcome'] },
  export_cancel_result: { fields: { ...business, job_id: 'uuid', state_after: ['pending', 'running', 'cancelling', 'cancelled', 'completed', 'failed'] }, required: ['outcome'] },
  export_result: { fields: { job_id: 'uuid', job_state: ['completed', 'failed', 'cancelled'], duration_ms: 'integer', technical_check: ['passed', 'failed', 'unknown'] }, required: ['job_id', 'job_state', 'duration_ms', 'technical_check'] },
  page_view: { fields: { page_name: ['home', 'studio'], view_id: 'uuid', embedded: 'boolean', has_project: 'boolean' }, required: ['page_name', 'view_id', 'embedded', 'has_project'] },
  studio_load_result: { fields: { load_id: 'uuid', outcome, duration_ms: 'integer', embedded: 'boolean' }, required: ['load_id', 'outcome', 'duration_ms', 'embedded'] },
  ui_click: { fields: { page_name: ['home', 'studio'], area: ['workspace', 'templates'], element: ['new_creation', 'recent_session', 'select_template', 'copy_template'], interaction_method: ['pointer', 'keyboard'] }, required: ['page_name', 'area', 'element'] },
  template_instruction_copy_result: { fields: { host_product: ['codex', 'claude', 'deepseek', 'chatgpt', 'mcp'], copy_status: ['clipboard_written', 'manual_fallback_shown', 'failed'] }, required: ['host_product', 'copy_status'] },
} as const satisfies Registry;

export const browserEvents = ['page_view', 'studio_load_result', 'ui_click', 'template_instruction_copy_result'] as const;
