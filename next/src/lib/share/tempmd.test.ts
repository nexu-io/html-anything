import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getTempmdPreview,
  publishTempmdPreview,
  revokeTempmdPreview,
  tempmdPreviewStatePath,
  TempmdShareError,
  toPublicTempmdShareError,
  type TempmdShareDependencies,
} from './tempmd';

const API_BASE_URL = 'https://api.temp.test';
const TASK_ID = 'task-private-preview';

describe('temp.md temporary preview lifecycle', () => {
  let stateDir: string;

  beforeEach(async () => {
    stateDir = await fs.mkdtemp(path.join(os.tmpdir(), 'html-anything-tempmd-'));
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await fs.rm(stateDir, { recursive: true, force: true });
  });

  it('keeps capabilities in an atomic server file while returning only safe fields', async () => {
    const createRequests: RequestInit[] = [];
    let publishNumber = 0;
    const fetcher = vi.fn<typeof fetch>(async (input, init = {}) => {
      const url = String(input);
      if (url.endsWith('/finalize')) {
        return jsonResponse({
          success: true,
          tempId: 'temp-1',
          versionId: `version-${publishNumber}`,
          canonicalUrl: 'https://temp.md/example',
          status: 'ready',
          expiresAt: '2026-09-03T00:00:00.000Z',
          ...(publishNumber === 1 ? { updateToken: 'update-secret' } : {}),
        });
      }
      if (url.endsWith('/publish-sessions') && init.method === 'POST') {
        publishNumber += 1;
        createRequests.push(init);
        return jsonResponse({
          sessionId: `session-${publishNumber}`,
          tempId: 'temp-1',
          operation: publishNumber === 1 ? 'create' : 'update',
          status: 'pending',
          uploadToken: `upload-secret-${publishNumber}`,
          uploads: [
            {
              path: 'index.html',
              status: 'expected',
              url: `${API_BASE_URL}/publish-sessions/session-${publishNumber}/files/index`,
            },
          ],
          expiresAt: '2026-08-28T00:00:00.000Z',
        });
      }
      if (init.method === 'PUT') return new Response(null, { status: 204 });
      throw new Error(`Unexpected request: ${init.method ?? 'GET'} ${url}`);
    });
    const dependencies: TempmdShareDependencies = {
      stateDir,
      apiBaseUrl: API_BASE_URL,
      fetch: fetcher,
      now: () => new Date('2026-08-27T00:00:00.000Z'),
    };

    const created = await publishTempmdPreview(
      { taskId: TASK_ID, html: '<main>first</main>' },
      dependencies,
    );
    expect(created.operation).toBe('create');
    expect(created.preview).toEqual({
      hasPreview: true,
      canonicalUrl: 'https://temp.md/example',
      expiresAt: '2026-09-03T00:00:00.000Z',
      updatedAt: '2026-08-27T00:00:00.000Z',
    });
    expect(JSON.stringify(created)).not.toMatch(/uploadToken|updateToken|secret/i);

    const file = tempmdPreviewStatePath(TASK_ID, dependencies);
    const saved = await fs.readFile(file, 'utf8');
    expect(saved).toContain('update-secret');
    expect(saved).not.toContain('upload-secret');
    expect((await fs.stat(file)).mode & 0o777).toBe(0o600);

    const updated = await publishTempmdPreview(
      { taskId: TASK_ID, html: '<main>second</main>' },
      dependencies,
    );
    expect(updated.operation).toBe('update');
    expect(JSON.stringify(updated)).not.toMatch(/uploadToken|updateToken|secret/i);
    expect(new Headers(createRequests[1].headers).get('Authorization')).toBe(
      'Bearer update-secret',
    );
    expect(JSON.parse(String(createRequests[1].body))).toMatchObject({
      tempId: 'temp-1',
    });
    expect(JSON.parse(String(createRequests[0].body))).not.toHaveProperty(
      'externalSubjectId',
    );
  });

  it('resumes a matching pending upload without creating another session', async () => {
    let createCount = 0;
    let getCount = 0;
    let failFirstUpload = true;
    const fetcher = vi.fn<typeof fetch>(async (input, init = {}) => {
      const url = String(input);
      if (url.endsWith('/finalize')) {
        return jsonResponse({
          success: true,
          tempId: 'temp-resume',
          versionId: 'version-resume',
          canonicalUrl: 'https://temp.md/resumed',
          status: 'ready',
          expiresAt: '2026-09-03T00:00:00.000Z',
          updateToken: 'resume-update-secret',
        });
      }
      if (url.endsWith('/publish-sessions') && init.method === 'POST') {
        createCount += 1;
        return sessionResponse('session-resume', 'temp-resume', 'resume-upload-secret');
      }
      if (url.endsWith('/publish-sessions/session-resume') && !init.method) {
        getCount += 1;
        return sessionResponse('session-resume', 'temp-resume', 'resume-upload-secret');
      }
      if (init.method === 'PUT') {
        if (failFirstUpload) {
          failFirstUpload = false;
          return jsonResponse({ error: 'temporary failure' }, 503);
        }
        return new Response(null, { status: 204 });
      }
      throw new Error(`Unexpected request: ${init.method ?? 'GET'} ${url}`);
    });
    const dependencies = { stateDir, apiBaseUrl: API_BASE_URL, fetch: fetcher };
    const input = { taskId: TASK_ID, html: '<main>resume me</main>' };

    await expect(publishTempmdPreview(input, dependencies)).rejects.toMatchObject({
      status: 503,
    });
    await expect(publishTempmdPreview(input, dependencies)).resolves.toMatchObject({
      preview: { canonicalUrl: 'https://temp.md/resumed' },
    });
    expect(createCount).toBe(1);
    expect(getCount).toBe(1);
  });

  it('removes local authority after a successful revoke', async () => {
    const fetcher = lifecycleFetcher();
    const dependencies = { stateDir, apiBaseUrl: API_BASE_URL, fetch: fetcher };
    await publishTempmdPreview(
      { taskId: TASK_ID, html: '<main>revoke me</main>' },
      dependencies,
    );

    await expect(revokeTempmdPreview(TASK_ID, dependencies)).resolves.toEqual({
      ok: true,
      preview: { hasPreview: false },
    });
    await expect(getTempmdPreview(TASK_ID, dependencies)).resolves.toEqual({
      hasPreview: false,
    });
    expect(fetcher).toHaveBeenCalledWith(
      `${API_BASE_URL}/temps/temp-1`,
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  it('does not relay token-shaped upstream error fields or messages', async () => {
    const fetcher = vi.fn<typeof fetch>(async () =>
      jsonResponse(
        {
          error: 'updateToken update-secret was rejected',
          code: 'upload_token_rejected',
          updateToken: 'update-secret',
          nested: { uploadToken: 'upload-secret' },
        },
        401,
        { 'X-Request-Id': 'update-secret' },
      ),
    );
    const dependencies = { stateDir, apiBaseUrl: API_BASE_URL, fetch: fetcher };

    let failure: TempmdShareError | undefined;
    try {
      await publishTempmdPreview(
        { taskId: TASK_ID, html: '<main>private</main>' },
        dependencies,
      );
    } catch (error) {
      failure = error as TempmdShareError;
    }
    expect(failure).toBeInstanceOf(TempmdShareError);
    const publicError = toPublicTempmdShareError(failure);
    expect(publicError).toEqual({
      status: 401,
      body: {
        error: 'The temp.md request failed.',
        code: 'request_failed',
      },
    });
    expect(JSON.stringify(publicError)).not.toMatch(/token|authorization|secret/i);
    expect(failure).not.toHaveProperty('body');
  });
});

function lifecycleFetcher(): ReturnType<typeof vi.fn<typeof fetch>> {
  return vi.fn<typeof fetch>(async (input, init = {}) => {
    const url = String(input);
    if (url.endsWith('/publish-sessions') && init.method === 'POST') {
      return sessionResponse('session-1', 'temp-1', 'upload-secret');
    }
    if (url.endsWith('/finalize')) {
      return jsonResponse({
        success: true,
        tempId: 'temp-1',
        versionId: 'version-1',
        canonicalUrl: 'https://temp.md/example',
        status: 'ready',
        expiresAt: '2026-09-03T00:00:00.000Z',
        updateToken: 'update-secret',
      });
    }
    if (init.method === 'PUT') return new Response(null, { status: 204 });
    if (url.endsWith('/temps/temp-1') && init.method === 'DELETE') {
      return jsonResponse({ ok: true });
    }
    throw new Error(`Unexpected request: ${init.method ?? 'GET'} ${url}`);
  });
}

function sessionResponse(sessionId: string, tempId: string, uploadToken: string): Response {
  return jsonResponse({
    sessionId,
    tempId,
    operation: 'create',
    status: 'pending',
    uploadToken,
    uploads: [
      {
        path: 'index.html',
        status: 'expected',
        url: `${API_BASE_URL}/publish-sessions/${sessionId}/files/index`,
      },
    ],
    expiresAt: '2026-08-28T00:00:00.000Z',
  });
}

function jsonResponse(
  body: unknown,
  status = 200,
  headers: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}
