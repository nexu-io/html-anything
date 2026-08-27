import { createHash, randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';

const DEFAULT_API_BASE_URL = 'https://api.temp.md';
const CLIENT_IDENTITY = 'html-anything/0.1.0';
const MAX_HTML_BYTES = 10 * 1024 * 1024;
const STATE_VERSION = 1 as const;

type PreviewRecord = {
  tempId: string;
  canonicalUrl: string;
  updateToken: string;
  expiresAt: string | null;
  updatedAt: string;
};

type PendingPreview = {
  sessionId: string;
  uploadToken: string;
  idempotencyKey: string;
  operation: 'create' | 'update';
  manifestHash: string;
  tempId: string;
  expiresAt: string;
};

type PreviewState = {
  schemaVersion: typeof STATE_VERSION;
  taskId: string;
  current?: PreviewRecord;
  pending?: PendingPreview;
};

type UploadTarget = {
  path: string;
  status: 'expected' | 'uploaded';
  url: string;
};

type PublishSession = {
  sessionId: string;
  tempId: string;
  operation: 'create' | 'update';
  status: 'pending' | 'ready' | 'failed' | 'expired';
  uploadToken: string;
  uploads: UploadTarget[];
  expiresAt: string;
};

type FinalizedPublish = {
  success: true;
  tempId: string;
  versionId: string;
  canonicalUrl: string;
  status: 'ready';
  expiresAt: string | null;
  updateToken?: string;
};

export type PublicTempmdPreview = {
  hasPreview: boolean;
  canonicalUrl?: string;
  expiresAt?: string | null;
  updatedAt?: string;
};

export type PublishTempmdPreviewResult = {
  operation: 'create' | 'update';
  preview: PublicTempmdPreview;
};

export type TempmdShareDependencies = {
  fetch?: typeof fetch;
  apiBaseUrl?: string;
  stateDir?: string;
  createId?: () => string;
  now?: () => Date;
};

export type PublicTempmdShareError = {
  status: number;
  body: {
    error: string;
    code: string;
    requestId?: string;
    retryAfter?: number;
  };
};

export class TempmdShareError extends Error {
  readonly name = 'TempmdShareError';

  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
    readonly requestId?: string,
    readonly retryAfter?: number,
  ) {
    super(message);
  }
}

export async function getTempmdPreview(
  taskId: string,
  dependencies: TempmdShareDependencies = {},
): Promise<PublicTempmdPreview> {
  const state = await readState(taskId, dependencies);
  return toPublicPreview(state?.current);
}

export async function publishTempmdPreview(
  input: { taskId: string; html: string },
  dependencies: TempmdShareDependencies = {},
): Promise<PublishTempmdPreviewResult> {
  validateTaskId(input.taskId);
  const html = ensureFullHtmlDocument(input.html);
  const bytes = Buffer.byteLength(html);
  if (!html.trim()) {
    throw new TempmdShareError('Empty HTML. Run Convert first.', 400, 'empty_html');
  }
  if (bytes > MAX_HTML_BYTES) {
    throw new TempmdShareError(
      'The generated HTML exceeds the 10 MB temporary preview limit.',
      413,
      'html_too_large',
    );
  }

  const contentHash = sha256(html);
  const manifestHash = sha256(
    JSON.stringify({
      files: [
        {
          path: 'index.html',
          size: bytes,
          contentType: 'text/html',
          hash: contentHash,
        },
      ],
      title: null,
      spaMode: false,
    }),
  );
  const existing = await readState(input.taskId, dependencies);
  const operation = existing?.current ? 'update' : 'create';
  let session = await resumeMatchingSession(existing, manifestHash, dependencies);

  if (!session) {
    session = await createSession(
      {
        bytes,
        contentHash,
        current: existing?.current,
      },
      dependencies,
    );
    const state: PreviewState = {
      schemaVersion: STATE_VERSION,
      taskId: input.taskId,
      ...(existing?.current ? { current: existing.current } : {}),
      pending: {
        sessionId: session.sessionId,
        uploadToken: session.uploadToken,
        idempotencyKey: session.idempotencyKey,
        operation: session.operation,
        manifestHash,
        tempId: session.tempId,
        expiresAt: session.expiresAt,
      },
    };
    await writeState(state, dependencies);
  }

  if (session.status === 'failed' || session.status === 'expired') {
    throw new TempmdShareError(
      `The temp.md publish session is ${session.status}. Try sharing again.`,
      409,
      `session_${session.status}`,
    );
  }

  const outstanding = session.uploads.filter(
    (upload) => upload.status === 'expected' && upload.path === 'index.html',
  );
  if (outstanding.length > 1) {
    throw new TempmdShareError(
      'temp.md returned an invalid upload plan.',
      502,
      'invalid_upload_plan',
    );
  }
  if (outstanding[0]) {
    await uploadHtml(outstanding[0], session.uploadToken, html, dependencies);
  }

  const finalized = await finalizeSession(session, dependencies);
  const currentToken = existing?.current?.updateToken;
  const updateToken = finalized.updateToken ?? currentToken;
  if (!updateToken) {
    throw new TempmdShareError(
      'temp.md did not return an update capability.',
      502,
      'missing_update_capability',
    );
  }

  const now = dependencies.now?.() ?? new Date();
  const current: PreviewRecord = {
    tempId: finalized.tempId,
    canonicalUrl: finalized.canonicalUrl,
    updateToken,
    expiresAt: finalized.expiresAt,
    updatedAt: now.toISOString(),
  };
  await writeState(
    {
      schemaVersion: STATE_VERSION,
      taskId: input.taskId,
      current,
    },
    dependencies,
  );
  return { operation, preview: toPublicPreview(current) };
}

export async function revokeTempmdPreview(
  taskId: string,
  dependencies: TempmdShareDependencies = {},
): Promise<{ ok: true; preview: PublicTempmdPreview }> {
  const state = await readState(taskId, dependencies);
  if (!state?.current) {
    throw new TempmdShareError(
      'This task does not have a temporary preview.',
      404,
      'preview_not_found',
    );
  }
  await requestJson(
    `/temps/${encodeURIComponent(state.current.tempId)}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${state.current.updateToken}` },
    },
    dependencies,
  );
  await deleteState(taskId, dependencies);
  return { ok: true, preview: { hasPreview: false } };
}

export function toPublicTempmdShareError(error: unknown): PublicTempmdShareError {
  if (error instanceof TempmdShareError) {
    const code = safePublicCode(error.code);
    return {
      status: error.status,
      body: {
        error: safeRemoteMessage(error.message, 'Temporary preview failed.'),
        code,
        ...(safeRequestId(error.requestId) ? { requestId: error.requestId } : {}),
        ...(error.retryAfter !== undefined ? { retryAfter: error.retryAfter } : {}),
      },
    };
  }
  return {
    status: 500,
    body: { error: 'Temporary preview failed.', code: 'internal_error' },
  };
}

export function tempmdPreviewStatePath(
  taskId: string,
  dependencies: TempmdShareDependencies = {},
): string {
  validateTaskId(taskId);
  const stateDir =
    dependencies.stateDir ??
    process.env.HTML_ANYTHING_USER_STATE_DIR ??
    path.join(homedir(), '.html-anything');
  return path.join(stateDir, 'tempmd-previews', `${sha256(taskId)}.json`);
}

async function createSession(
  input: {
    bytes: number;
    contentHash: string;
    current?: PreviewRecord;
  },
  dependencies: TempmdShareDependencies,
): Promise<PublishSession & { idempotencyKey: string }> {
  const idempotencyKey = dependencies.createId?.() ?? randomUUID();
  const result = await requestJson(
    '/publish-sessions',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
        ...(input.current
          ? { Authorization: `Bearer ${input.current.updateToken}` }
          : {}),
      },
      body: JSON.stringify({
        files: [
          {
            path: 'index.html',
            size: input.bytes,
            contentType: 'text/html',
            hash: input.contentHash,
          },
        ],
        ...(input.current ? { tempId: input.current.tempId } : {}),
        spaMode: false,
      }),
    },
    dependencies,
  );
  return { ...parseSession(result), idempotencyKey };
}

async function resumeMatchingSession(
  state: PreviewState | null,
  manifestHash: string,
  dependencies: TempmdShareDependencies,
): Promise<(PublishSession & { idempotencyKey: string }) | null> {
  if (!state?.pending || state.pending.manifestHash !== manifestHash) return null;
  try {
    const result = await requestJson(
      `/publish-sessions/${encodeURIComponent(state.pending.sessionId)}`,
      {
        headers: { Authorization: `Bearer ${state.pending.uploadToken}` },
      },
      dependencies,
    );
    const session = parseSession(result);
    if (
      session.sessionId !== state.pending.sessionId ||
      session.tempId !== state.pending.tempId ||
      session.operation !== state.pending.operation ||
      session.status === 'failed' ||
      session.status === 'expired'
    ) {
      return null;
    }
    return { ...session, idempotencyKey: state.pending.idempotencyKey };
  } catch (error) {
    if (error instanceof TempmdShareError && [404, 409, 410].includes(error.status)) {
      return null;
    }
    throw error;
  }
}

async function uploadHtml(
  target: UploadTarget,
  uploadToken: string,
  html: string,
  dependencies: TempmdShareDependencies,
): Promise<void> {
  assertUploadTarget(target.url, dependencies);
  const fetcher = dependencies.fetch ?? fetch;
  const response = await fetcher(target.url, {
    method: 'PUT',
    headers: requestHeaders({
      Authorization: `Bearer ${uploadToken}`,
      'Content-Type': 'text/html',
    }),
    body: html,
  });
  if (!response.ok) {
    throw await toShareError(response, 'The temporary preview upload failed.');
  }
}

async function finalizeSession(
  session: PublishSession,
  dependencies: TempmdShareDependencies,
): Promise<FinalizedPublish> {
  const result = await requestJson(
    `/publish-sessions/${encodeURIComponent(session.sessionId)}/finalize`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.uploadToken}` },
    },
    dependencies,
  );
  if (!isRecord(result) || result.success !== true || result.status !== 'ready') {
    throw new TempmdShareError(
      'temp.md returned an invalid finalization response.',
      502,
      'invalid_finalize_response',
    );
  }
  const tempId = requireString(result.tempId, 'tempId');
  const versionId = requireString(result.versionId, 'versionId');
  const canonicalUrl = requireHttpsUrl(result.canonicalUrl, 'canonicalUrl');
  return {
    success: true,
    status: 'ready',
    tempId,
    versionId,
    canonicalUrl,
    expiresAt: typeof result.expiresAt === 'string' ? result.expiresAt : null,
    ...(typeof result.updateToken === 'string'
      ? { updateToken: result.updateToken }
      : {}),
  };
}

async function requestJson(
  requestPath: string,
  init: RequestInit,
  dependencies: TempmdShareDependencies,
): Promise<unknown> {
  const fetcher = dependencies.fetch ?? fetch;
  const response = await fetcher(`${apiBaseUrl(dependencies)}${requestPath}`, {
    ...init,
    headers: requestHeaders(init.headers),
  });
  if (!response.ok) {
    throw await toShareError(response, 'The temp.md request failed.');
  }
  try {
    return await response.json();
  } catch {
    throw new TempmdShareError(
      'temp.md returned an invalid response.',
      502,
      'invalid_response',
    );
  }
}

async function toShareError(
  response: Response,
  fallback: string,
): Promise<TempmdShareError> {
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    body = undefined;
  }
  const record = isRecord(body) ? body : undefined;
  const candidate =
    typeof record?.message === 'string'
      ? record.message
      : typeof record?.error === 'string'
        ? record.error
        : undefined;
  const message = safeRemoteMessage(candidate, fallback);
  const code = safePublicCode(
    typeof record?.code === 'string' ? record.code : undefined,
    'request_failed',
  );
  const requestId = safeRequestId(response.headers.get('X-Request-Id') ?? undefined);
  const retryHeader = response.headers.get('Retry-After');
  const retryAfter = retryHeader ? Number(retryHeader) : undefined;
  return new TempmdShareError(
    message,
    response.status,
    code,
    requestId,
    Number.isFinite(retryAfter) ? retryAfter : undefined,
  );
}

function parseSession(value: unknown): PublishSession {
  if (!isRecord(value) || !Array.isArray(value.uploads)) {
    throw new TempmdShareError(
      'temp.md returned an invalid publish session.',
      502,
      'invalid_session_response',
    );
  }
  const operation = value.operation;
  const status = value.status;
  if (operation !== 'create' && operation !== 'update') {
    throw new TempmdShareError(
      'temp.md returned an invalid publish operation.',
      502,
      'invalid_session_response',
    );
  }
  if (!['pending', 'ready', 'failed', 'expired'].includes(String(status))) {
    throw new TempmdShareError(
      'temp.md returned an invalid publish status.',
      502,
      'invalid_session_response',
    );
  }
  const uploads = value.uploads.map((upload) => {
    if (!isRecord(upload)) {
      throw new TempmdShareError(
        'temp.md returned an invalid upload target.',
        502,
        'invalid_session_response',
      );
    }
    const uploadStatus = upload.status;
    if (uploadStatus !== 'expected' && uploadStatus !== 'uploaded') {
      throw new TempmdShareError(
        'temp.md returned an invalid upload target status.',
        502,
        'invalid_session_response',
      );
    }
    return {
      path: requireString(upload.path, 'upload.path'),
      status: uploadStatus,
      url: requireHttpsUrl(upload.url, 'upload.url'),
    } satisfies UploadTarget;
  });
  return {
    sessionId: requireString(value.sessionId, 'sessionId'),
    tempId: requireString(value.tempId, 'tempId'),
    operation,
    status: status as PublishSession['status'],
    uploadToken: requireString(value.uploadToken, 'uploadToken'),
    uploads,
    expiresAt: requireString(value.expiresAt, 'expiresAt'),
  };
}

async function readState(
  taskId: string,
  dependencies: TempmdShareDependencies,
): Promise<PreviewState | null> {
  const file = tempmdPreviewStatePath(taskId, dependencies);
  try {
    const value = JSON.parse(await fs.readFile(file, 'utf8')) as unknown;
    if (!isPreviewState(value, taskId)) {
      throw new TempmdShareError(
        'The saved temporary preview state is invalid.',
        500,
        'invalid_saved_state',
      );
    }
    return value;
  } catch (error) {
    if (isEnoent(error)) return null;
    if (error instanceof TempmdShareError) throw error;
    throw new TempmdShareError(
      'The saved temporary preview state could not be read.',
      500,
      'state_read_failed',
    );
  }
}

async function writeState(
  state: PreviewState,
  dependencies: TempmdShareDependencies,
): Promise<void> {
  const file = tempmdPreviewStatePath(state.taskId, dependencies);
  const directory = path.dirname(file);
  await fs.mkdir(directory, { recursive: true, mode: 0o700 });
  await fs.chmod(directory, 0o700).catch(() => undefined);
  const createId = dependencies.createId?.() ?? randomUUID();
  const temporary = `${file}.${process.pid}.${createId}.tmp`;
  try {
    const handle = await fs.open(temporary, 'wx', 0o600);
    try {
      await handle.writeFile(`${JSON.stringify(state, null, 2)}\n`, 'utf8');
      await handle.sync();
    } finally {
      await handle.close();
    }
    await fs.chmod(temporary, 0o600).catch(() => undefined);
    await fs.rename(temporary, file);
    await fs.chmod(file, 0o600).catch(() => undefined);
  } catch (error) {
    await fs.unlink(temporary).catch(() => undefined);
    throw error;
  }
}

async function deleteState(
  taskId: string,
  dependencies: TempmdShareDependencies,
): Promise<void> {
  try {
    await fs.unlink(tempmdPreviewStatePath(taskId, dependencies));
  } catch (error) {
    if (!isEnoent(error)) throw error;
  }
}

function isPreviewState(value: unknown, taskId: string): value is PreviewState {
  if (!isRecord(value) || value.schemaVersion !== STATE_VERSION || value.taskId !== taskId) {
    return false;
  }
  return (
    (value.current === undefined || isPreviewRecord(value.current)) &&
    (value.pending === undefined || isPendingPreview(value.pending))
  );
}

function isPreviewRecord(value: unknown): value is PreviewRecord {
  return (
    isRecord(value) &&
    typeof value.tempId === 'string' &&
    typeof value.canonicalUrl === 'string' &&
    typeof value.updateToken === 'string' &&
    (typeof value.expiresAt === 'string' || value.expiresAt === null) &&
    typeof value.updatedAt === 'string'
  );
}

function isPendingPreview(value: unknown): value is PendingPreview {
  return (
    isRecord(value) &&
    typeof value.sessionId === 'string' &&
    typeof value.uploadToken === 'string' &&
    typeof value.idempotencyKey === 'string' &&
    (value.operation === 'create' || value.operation === 'update') &&
    typeof value.manifestHash === 'string' &&
    typeof value.tempId === 'string' &&
    typeof value.expiresAt === 'string'
  );
}

function toPublicPreview(current?: PreviewRecord): PublicTempmdPreview {
  if (!current) return { hasPreview: false };
  return {
    hasPreview: true,
    canonicalUrl: current.canonicalUrl,
    expiresAt: current.expiresAt,
    updatedAt: current.updatedAt,
  };
}

function ensureFullHtmlDocument(html: string): string {
  if (!html.trim()) return html;
  if (/<!doctype\s+html/i.test(html) || /<html[\s>]/i.test(html)) return html;
  return [
    '<!DOCTYPE html>',
    '<html lang="en">',
    '<head>',
    '<meta charset="UTF-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
    '<title>HTML Anything</title>',
    '</head>',
    '<body>',
    html,
    '</body>',
    '</html>',
  ].join('\n');
}

function validateTaskId(taskId: string): void {
  if (
    typeof taskId !== 'string' ||
    !taskId.trim() ||
    taskId.length > 200 ||
    /[\u0000-\u001f\u007f]/.test(taskId)
  ) {
    throw new TempmdShareError('Missing or invalid taskId.', 400, 'invalid_task_id');
  }
}

function apiBaseUrl(dependencies: TempmdShareDependencies): string {
  return (dependencies.apiBaseUrl ?? process.env.TEMPMD_API_URL ?? DEFAULT_API_BASE_URL).replace(
    /\/+$/,
    '',
  );
}

function assertUploadTarget(
  value: string,
  dependencies: TempmdShareDependencies,
): void {
  const target = new URL(value);
  const base = new URL(apiBaseUrl(dependencies));
  if (
    target.protocol !== 'https:' ||
    target.origin !== base.origin ||
    !target.pathname.startsWith('/publish-sessions/')
  ) {
    throw new TempmdShareError(
      'temp.md returned an unsafe upload target.',
      502,
      'unsafe_upload_target',
    );
  }
}

function requestHeaders(input?: HeadersInit): Headers {
  const headers = new Headers(input);
  headers.set('X-Tempmd-Client', CLIENT_IDENTITY);
  return headers;
}

function safeRemoteMessage(candidate: string | undefined, fallback: string): string {
  if (
    !candidate ||
    candidate.length > 300 ||
    /token|authorization|credential|secret|bearer/i.test(candidate)
  ) {
    return fallback;
  }
  return candidate;
}

function safePublicCode(candidate: string | undefined, fallback = 'internal_error'): string {
  if (
    !candidate ||
    !/^[a-z0-9_]{1,80}$/i.test(candidate) ||
    /token|authorization|credential|secret|bearer/i.test(candidate)
  ) {
    return fallback;
  }
  return candidate;
}

function safeRequestId(candidate: string | undefined): string | undefined {
  return candidate &&
    /^[A-Za-z0-9._:-]{1,128}$/.test(candidate) &&
    !/token|authorization|credential|secret|bearer/i.test(candidate)
    ? candidate
    : undefined;
}

function requireString(value: unknown, field: string): string {
  if (typeof value === 'string' && value.length > 0) return value;
  throw new TempmdShareError(
    `temp.md omitted ${field} from its response.`,
    502,
    'invalid_response',
  );
}

function requireHttpsUrl(value: unknown, field: string): string {
  const stringValue = requireString(value, field);
  try {
    const url = new URL(stringValue);
    if (url.protocol === 'https:') return url.toString();
  } catch {
    // Fall through to the safe error below.
  }
  throw new TempmdShareError(
    `temp.md returned an invalid ${field}.`,
    502,
    'invalid_response',
  );
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isEnoent(error: unknown): error is NodeJS.ErrnoException {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as NodeJS.ErrnoException).code === 'ENOENT'
  );
}
