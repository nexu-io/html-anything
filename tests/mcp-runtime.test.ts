import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdir, mkdtemp, readFile, readdir, realpath, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
import { editorBuild, editorDirectory, sharedEditorEnabled } from '../editor-runtime.ts';
import { pluginRoot } from '../hyperframes.ts';
import { rpc } from '../mcp.ts';
import { copyRuntimeFixture } from './fixtures.ts';
import { WorkspaceStore } from '../workspace.ts';
import { openPreview } from '../preview.ts';

async function incompatibleEditor(directory: string, changed: Record<string, unknown>, toolError?: string) {
  const { data, runtime } = await editorDirectory(directory);
  const requests: string[] = [];
  const registry = { service: 'opendesign-editor', protocol: 1, version: JSON.parse(await readFile(path.join(pluginRoot, 'package.json'), 'utf8')).version,
    build: editorBuild, dataDirectory: data, instanceId: 'test-instance', pid: process.pid, token: 'a'.repeat(64), endpoint: '' };
  const health = { ...registry, ...changed, token: undefined };
  const calls: any[] = [];
  const server = createServer(async (req, res) => {
    requests.push(req.url!);
    res.setHeader('Content-Type', 'application/json');
    if (req.url === '/editor-api/preview') return res.end(JSON.stringify({ previewUrl: registry.endpoint, studioUrl: 'http://127.0.0.1:59999/', editorReady: true, ready: true, dataDirectory: data }));
    if (req.url === '/motion-api/phase1/call') {
      let body = ''; for await (const chunk of req) body += chunk;
      calls.push(JSON.parse(body));
      if (toolError) { res.statusCode = 400; return res.end(JSON.stringify({ error: toolError, applied: false })); }
      return res.end(JSON.stringify({ projectId: 'project', sessionId: 'project', authority: 'compatible-backend', job: { id: 'existing-export' } }));
    }
    res.end(JSON.stringify(health));
  });
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  registry.endpoint = `http://127.0.0.1:${(server.address() as any).port}/`;
  await writeFile(path.join(runtime, 'runtime.json'), JSON.stringify(registry), { mode: 0o600 });
  return { requests, calls, health, registry, close: async () => {
    server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve()));
  } };
}

const exportCall = { jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'motion_export_request', arguments: {
  projectId: 'project', requestId: 'must-not-export', expectedRevision: '0'.repeat(64), versionId: 'unavailable', audio: 'silent',
} } };

test('a compatible older shared backend cannot hand off its internal Studio URL', { skip: !sharedEditorEnabled }, async () => {
  const directory = await realpath(await mkdtemp(path.join(tmpdir(), 'motion-old-preview-url-')));
  const editor = await incompatibleEditor(directory, { build: 'older-build', mcp: { protocol: 1, tools: ['motion_open_preview'] } });
  try {
    const opened = await openPreview(new WorkspaceStore(directory), undefined, { editor: true, mcpTool: 'motion_open_preview' });
    assert.equal(new URL(opened.studioUrl!).origin, new URL(editor.registry.endpoint).origin);
    assert.equal(new URL(opened.studioUrl!).hash, '#project/project');
  } finally { await editor.close(); await rm(directory, { recursive: true, force: true }); }
});

test('MCP reports unavailable historical files as not applied', { skip: !sharedEditorEnabled }, async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'motion-unavailable-version-'));
  const message = 'VERSION_NOT_RESTORABLE: Historical files are missing, unreadable or corrupt: assets/audio.wav';
  const editor = await incompatibleEditor(directory, { mcp: { protocol: 1, tools: ['motion_restore_version'] } }, message);
  try {
    const response: any = await rpc({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'motion_restore_version', arguments: {
      projectId: 'project', requestId: 'missing-media', versionId: 'unavailable', expectedVersionId: 'current', expectedRevision: '0'.repeat(64),
    } } }, new WorkspaceStore(directory));
    assert.equal(response.result.isError, true);
    assert.deepEqual(response.result.structuredContent.error, { code: 'VERSION_NOT_RESTORABLE', message, applied: false });
  } finally { await editor.close(); await rm(directory, { recursive: true, force: true }); }
});

test('MCP reports incompatible editor identity fields without starting an export or exposing credentials', { skip: !sharedEditorEnabled }, async t => {
  for (const changed of [{ protocol: 999 }, { version: '0.0.0' }, { build: '0'.repeat(64) }]) await t.test(Object.keys(changed)[0], async () => {
    const directory = await mkdtemp(path.join(tmpdir(), 'motion-runtime-mismatch-'));
    const editor = await incompatibleEditor(directory, changed);
    try {
      const response: any = await rpc(exportCall, new WorkspaceStore(directory));
      const error = response.result.structuredContent.error;
      assert.equal(error.code, 'EDITOR_RUNTIME_INCOMPATIBLE');
      assert.equal(error.applied, false);
      assert.deepEqual(error.details.expected, { protocol: 1, version: editor.registry.version, build: editorBuild });
      assert.deepEqual(error.details.actual, { protocol: editor.health.protocol, version: editor.health.version, build: editor.health.build });
      assert.match(error.message, /Reconnect.*MCP/i);
      assert.ok(!JSON.stringify(response).includes(editor.registry.token));
      assert.deepEqual(editor.requests, ['/editor-api/health']);
      assert.deepEqual(await readdir(directory), ['.editor-runtime']);
      assert.deepEqual(await readdir(path.join(directory, '.editor-runtime')), ['runtime.json']);
    } finally { await editor.close(); await rm(directory, { recursive: true, force: true }); }
  });
});

test('a live phase1 MCP connection survives a replaced or removed plugin directory without reconnecting', { skip: !sharedEditorEnabled }, async t => {
  for (const replaced of [true, false]) await t.test(replaced ? 'replaced' : 'removed', async () => {
    const temporary = await mkdtemp(path.join(tmpdir(), 'motion-stale-plugin-'));
    const app = path.join(temporary, 'app'), directory = path.join(temporary, 'data');
    await copyRuntimeFixture(app);
    const editor = await incompatibleEditor(directory, { version: '0.6.4', build: '0'.repeat(64), mcp: { protocol: 1, tools: ['motion_get_project', 'motion_export_request'] } });
    const { Client } = await import(pathToFileURL(path.join(app, 'tests/shared-editor-client.mjs')).href);
    const client = new Client(directory);
    try {
      await client.initialize();
      const pid = client.child.pid;
      await rename(app, path.join(temporary, 'previous'));
      if (replaced) await mkdir(app);
      for (const params of [{ name: 'motion_get_project', arguments: {} }, exportCall.params]) {
        const response = await client.rpc('tools/call', params);
        assert.equal(response.isError, undefined);
        assert.equal(response.structuredContent.authority, 'compatible-backend');
      }
      assert.equal(client.child.pid, pid);
      assert.equal(client.trace.filter((item: any) => item.method === 'initialize').length, 1);
      assert.deepEqual(editor.calls, [{ name: 'motion_get_project', arguments: {} }, exportCall.params]);
      assert.ok(!editor.requests.includes('/editor-api/shutdown'));
      assert.deepEqual((await readdir(directory)).sort(), ['.editor-runtime', 'preview.json']);
    } finally { await client.close(); await editor.close(); await rm(temporary, { recursive: true, force: true }); }
  });
});

test('phase1 recovery still refuses unsupported tools, incompatible protocols and a different authority', { skip: !sharedEditorEnabled }, async t => {
  const mcp = { protocol: 1, tools: ['motion_export_request'] };
  for (const changed of [
    { version: '0.6.4', mcp: { ...mcp, tools: ['motion_get_project'] } },
    { version: '0.6.4', mcp: { ...mcp, protocol: 2 } },
    { mcp: { ...mcp, protocol: 2 } },
    { protocol: 999, mcp },
    { dataDirectory: '/other-workspace', mcp },
    { instanceId: 'another-authority', mcp },
  ]) await t.test(JSON.stringify(changed), async () => {
    const directory = await mkdtemp(path.join(tmpdir(), 'motion-unsafe-recovery-'));
    const editor = await incompatibleEditor(directory, changed);
    try {
      const response: any = await rpc(exportCall, new WorkspaceStore(directory));
      assert.equal(response.result.isError, true);
      assert.deepEqual(editor.calls, []);
      assert.deepEqual(editor.requests, ['/editor-api/health']);
      assert.ok(!JSON.stringify(response).includes(editor.registry.token));
    } finally { await editor.close(); await rm(directory, { recursive: true, force: true }); }
  });
});
