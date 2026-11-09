import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { cp, mkdir, mkdtemp, readFile, readdir, rename, rm, symlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
import { editorBuild, editorDirectory, sharedEditorEnabled } from '../editor-runtime.ts';
import { pluginRoot } from '../hyperframes.ts';
import { rpc } from '../mcp.ts';
import { WorkspaceStore } from '../workspace.ts';

async function incompatibleEditor(directory: string, changed: Record<string, unknown>) {
  const { data, runtime } = await editorDirectory(directory);
  const requests: string[] = [];
  const registry = { service: 'opendesign-editor', protocol: 1, version: JSON.parse(await readFile(path.join(pluginRoot, 'package.json'), 'utf8')).version,
    build: editorBuild, dataDirectory: data, instanceId: 'test-instance', pid: process.pid, token: 'a'.repeat(64), endpoint: '' };
  const health = { ...registry, ...changed, token: undefined };
  const server = createServer((req, res) => {
    requests.push(req.url!);
    res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(health));
  });
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  registry.endpoint = `http://127.0.0.1:${(server.address() as any).port}/`;
  await writeFile(path.join(runtime, 'runtime.json'), JSON.stringify(registry), { mode: 0o600 });
  return { requests, health, registry, close: async () => {
    server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve()));
  } };
}

const exportCall = { jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'motion_export_request', arguments: {
  projectId: 'project', requestId: 'must-not-export', expectedRevision: '0'.repeat(64), versionId: 'unavailable', audio: 'silent',
} } };

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

test('a replaced or removed plugin directory tells a live stdio MCP client to reload before dispatch', async t => {
  for (const replaced of [true, false]) await t.test(replaced ? 'replaced' : 'removed', async () => {
    const temporary = await mkdtemp(path.join(tmpdir(), 'motion-stale-plugin-'));
    const app = path.join(temporary, 'app'), directory = path.join(temporary, 'data');
    await cp(pluginRoot, app, { recursive: true, filter: source => !['.git', 'node_modules', 'studio', 'dist', '.artifacts'].includes(path.relative(pluginRoot, source).split(path.sep)[0]) });
    await symlink(path.join(pluginRoot, 'node_modules'), path.join(app, 'node_modules'), 'dir');
    const editor = await incompatibleEditor(directory, { protocol: 999 });
    const { Client } = await import(pathToFileURL(path.join(app, 'tests/shared-editor-client.mjs')).href);
    const client = new Client(directory);
    try {
      await client.initialize();
      await rename(app, path.join(temporary, 'previous'));
      if (replaced) await mkdir(app);
      for (const params of [{ name: 'motion_get_project', arguments: {} }, exportCall.params]) {
        const response = await client.rpc('tools/call', params);
        assert.equal(response.structuredContent.error.code, 'MCP_RUNTIME_RELOAD_REQUIRED');
        assert.equal(response.structuredContent.error.applied, false);
        assert.match(response.structuredContent.error.message, /reload/i);
      }
      assert.deepEqual(editor.requests, []);
      assert.deepEqual(await readdir(directory), ['.editor-runtime']);
    } finally { await client.close(); await editor.close(); await rm(temporary, { recursive: true, force: true }); }
  });
});
