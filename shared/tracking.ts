import path from 'node:path';
import { createTracker, uuid } from '../tracking/core.ts';
import type { Entry } from '../tracking/core.ts';
import { createNodeTracking, loadIdentity } from '../tracking/node.ts';
import { omEvents } from '../tracking/events.ts';
import { VERSION } from '../preview.ts';

export type OmTracking = ReturnType<typeof createTracker<typeof omEvents>>;

export async function createAppTracking(directory: string, entrypoint: Entry): Promise<OmTracking> {
  const disabled = () => createTracker({ registry: omEvents, entrypoint, enabled: false, send: async () => 'drop' });
  if (process.env.OPENMOTION_TELEMETRY !== '1' || process.env.DO_NOT_TRACK === '1'
    || !process.env.OPENMOTION_POSTHOG_KEY || !process.env.OPENMOTION_POSTHOG_HOST) return disabled();
  try {
    const env = process.env.OPENMOTION_TRACKING_ENV ?? 'production';
    if (!['development', 'test', 'production'].includes(env)) return disabled();
    return createNodeTracking({ registry: omEvents, entrypoint, enabled: true,
      identity: await loadIdentity(path.join(directory, 'tracking')), appVersion: VERSION,
      host: process.env.OPENMOTION_POSTHOG_HOST, token: process.env.OPENMOTION_POSTHOG_KEY,
      env: env as 'development' | 'test' | 'production', testRunId: process.env.OPENMOTION_TRACKING_TEST_RUN_ID });
  } catch { return disabled(); }
}

export async function closeTracking(tracking?: OmTracking) {
  if (!tracking) return;
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      (async () => { while (tracking.pending()) { if (await tracking.flush() !== 'accepted') break; } })(),
      new Promise<void>(resolve => { timer = setTimeout(resolve, 2000); }),
    ]);
  } finally { if (timer) clearTimeout(timer); tracking.close(); }
}

const errorCodes = new Set(['INVALID_ARGUMENT', 'VERSION_CONFLICT', 'PROJECT_NOT_BOUND', 'PROJECT_NOT_FOUND',
  'PROJECT_SESSION_MISMATCH', 'REQUEST_ID_CONFLICT', 'REQUEST_STATE_UNKNOWN', 'MCP_TOOL_NOT_EXPOSED',
  'EXPORT_BUSY', 'EXPORT_NOT_FOUND', 'EXPORT_NOT_COMPLETED', 'TEMPLATE_NOT_FOUND', 'TEMPLATE_NOT_EDITABLE',
  'SOURCE_BATCH_TOO_LARGE', 'INVALID_FILE_TYPE_OR_RESERVED_PATH', 'PROJECT_VALIDATION_FAILED', 'VERSION_NOT_FOUND']);
export function trackingError(error: unknown) {
  const code = error instanceof Error ? /^([A-Z_]+)(?::|$)/.exec(error.message)?.[1] : undefined;
  return code && errorCodes.has(code) ? code : 'TOOL_FAILED';
}

/** Business results follow committed domain operations, separately from transport results. */
export function trackPhase1Result(tracking: OmTracking | undefined, name: string, args: any, result: any, error?: unknown) {
  if (!tracking || args?.action === 'record_review' || result?.replayed) return;
  const outcome = error ? 'failure' : result?.status === 'partial' ? 'partial' : result?.status === 'failed' ? 'failure' : 'success';
  const fields = { outcome, ...(uuid.test(result?.projectId) ? { project_id: result.projectId } : {}),
    ...(uuid.test(args?.requestId) ? { operation_id: args.requestId } : {}), ...(error ? { error_code: trackingError(error) } : {}) } as const;
  if (name === 'motion_create_project') tracking.track('project_create_result', { ...fields, effect_status: error ? 'unknown' : 'applied' });
  if (name === 'motion_open_preview') tracking.track('project_open_result', { ...fields, opened_by_host_status: 'unknown' });
  if (name === 'motion_edit_project') tracking.track('project_edit_result', { ...fields,
    ...(!error && Array.isArray(result?.changedFiles) ? { changed_file_count: result.changedFiles.length } : {}) });
  if (name === 'motion_restore_version') tracking.track('version_restore_result', fields);
  if (name === 'motion_import_assets') tracking.track('asset_import_result', { ...fields,
    ...(Array.isArray(args?.items) ? { requested_count: args.items.length } : {}) });
  if (name === 'motion_export_request') tracking.track('export_request_result', { ...fields,
    ...(uuid.test(result?.job?.id) ? { job_id: result.job.id, queue_state: result.job.state } : {}) });
  if (name === 'motion_export_cancel') tracking.track('export_cancel_result', { ...fields,
    ...(uuid.test(result?.job?.id) ? { job_id: result.job.id, state_after: result.job.state } : {}) });
}
