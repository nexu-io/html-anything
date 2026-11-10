import type { Entry, Registry } from './core.ts';

export const toolNames = ['motion_list_templates', 'motion_get_template', 'motion_create_project', 'motion_open_preview',
  'motion_import_assets', 'motion_get_project', 'motion_edit_project', 'motion_export_request', 'motion_list_versions',
  'motion_restore_version', 'motion_export_cancel'] as const;
const outcome = ['success', 'failure', 'partial', 'cancelled', 'unknown'] as const;
const tool = { tool_name: toolNames, call_id: 'uuid', operation_id: 'uuid', accepted: 'boolean' } as const;
const business = { outcome, project_id: 'uuid', operation_id: 'uuid', replayed: 'boolean', error_code: 'code' } as const;

const installation = { install_flow_id: 'uuid', attempt_id: 'uuid', host_product: ['codex', 'claude', 'deepseek', 'workbuddy'],
  operation: ['install', 'upgrade', 'add_host', 'reinstall'], attempt_source: 'code' } as const;
const installResult = { ...installation, outcome: ['success', 'failure'], duration_ms: 'integer', error_code: 'code' } as const;

export const omEvents = {
  installation_started: { producers: ['installer'], fields: installation, required: ['install_flow_id', 'attempt_id', 'host_product', 'operation'] },
  installation_step_result: { producers: ['installer'], fields: { ...installResult,
    step: ['host_preflight', 'application', 'application_asset', 'npm_runtime', 'skills', 'host_register', 'rollback', 'native_download', 'native_extract', 'native_probe'],
    component: ['browser', 'ffmpeg', 'ffprobe', 'media'], cache_hit: 'boolean', transfer_kind: ['embedded', 'local', 'network', 'cache'] }, required: ['install_flow_id', 'attempt_id', 'step', 'outcome', 'duration_ms'] },
  installation_result: { producers: ['installer'], fields: installResult, required: ['install_flow_id', 'attempt_id', 'outcome', 'duration_ms'] },
  native_prepare_started: { producers: ['installer'], fields: { ...installation, trigger: ['setup', 'app_start', 'explicit'] }, required: ['install_flow_id', 'attempt_id', 'trigger'] },
  native_prepare_result: { producers: ['installer'], fields: { ...installResult, trigger: ['setup', 'app_start', 'explicit'] }, required: ['install_flow_id', 'attempt_id', 'trigger', 'outcome', 'duration_ms'] },
  integration_check_result: { producers: ['mcp'], fields: { connection_id: 'uuid',
    stage: ['initialize', 'tools_list', 'first_tool'], outcome: ['success'] }, required: ['connection_id', 'stage', 'outcome'] },

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
  ui_click: { producers: ['studio'], fields: { page_name: ['home', 'studio'], area: ['workspace', 'templates'], element: ['new_creation', 'recent_session', 'select_template', 'copy_template'], interaction_method: ['pointer', 'keyboard'] }, required: ['page_name', 'area', 'element'] },
  template_instruction_copy_result: { producers: ['studio'], fields: { host_product: ['codex', 'claude', 'deepseek', 'chatgpt', 'mcp'], copy_status: ['clipboard_written', 'manual_fallback_shown', 'failed'] }, required: ['host_product', 'copy_status'] },
} as const satisfies Registry & Record<string, { producers: readonly Entry[] }>;

export type StudioEvent = { [E in keyof typeof omEvents]:
  'studio' extends typeof omEvents[E]['producers'][number] ? E : never
}[keyof typeof omEvents];
export const studioEvents = Object.fromEntries(Object.entries(omEvents)
  .filter(([, spec]) => (spec.producers as readonly Entry[]).includes('studio'))) as Pick<typeof omEvents, StudioEvent>;
