import test from 'node:test';
import assert from 'node:assert/strict';
import { rpc } from '../mcp.ts';
import { fixture } from './fixtures.ts';
import { Phase1Service } from '../phase1.ts';
import { pluginRoot } from '../hyperframes.ts';
import { phase1TransportTool } from '../shared/phase1-tools.ts';
import { publicToolResult } from '../shared/public-names.mjs';

test('default MCP discovery publishes only OpenMotion tool and resource names', async () => {
  const list: any = await rpc({ jsonrpc: '2.0', id: 1, method: 'tools/list' });

  assert.ok(list.result.tools.every((tool: any) => tool.name.startsWith('openmotion_')));
  const resources: any = await rpc({ jsonrpc: '2.0', id: 2, method: 'resources/list' });

  assert.ok(resources.result.resources.every((resource: any) => resource.uri.startsWith('openmotion://') || resource.uri === 'ui://openmotion/inline-video/v1/player.html'));
});

test('new and legacy tool names share validation, authorization and write idempotency', () => fixture(async store => {
  for (const names of [['openmotion_edit_project', 'motion_edit_project'], ['openmotion_write_files', 'motion_write_files']]) {
    const results = await Promise.all(names.map(name => rpc({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name, arguments: {} } }, store))) as any[];
    assert.equal(results[0].result.structuredContent.error.code, results[1].result.structuredContent.error.code);
    assert.equal(results[0].result.isError, true);
  }
  const service = new Phase1Service(store, pluginRoot, { origin: () => 'http://localhost:4173', nativeUrl: () => undefined,
    openProject: async () => {}, mutation: async task => task(), cancel: async () => {} });
  const input = { requestId: 'same-create', projectType: 'natural_language', title: 'Naming compatibility', requirements: 'Preserve native behavior' };
  const original = await service.call('motion_create_project', input);
  const replay = await service.call('openmotion_create_project', input);
  assert.equal(replay.projectId, original.projectId);
  assert.equal(replay.replayed, true);
  const edit = { requestId: 'same-edit', projectId: original.projectId, expectedRevision: original.revision,
    expectedVersionId: original.version.versionId, files: [{ path: 'note.txt', content: 'Same source' }] };
  const saved = await service.call('openmotion_edit_project', edit);
  const savedReplay = await service.call('motion_edit_project', edit);
  assert.equal(savedReplay.replayed, true);
  assert.equal(savedReplay.revision, saved.revision);
  assert.equal(savedReplay.version.versionId, saved.version.versionId);
  assert.equal(saved.previewHandoff.nextAction.tool, 'openmotion_open_preview');
  assert.match(saved.previewHandoff.instructions, /\bopenmotion:\/\/workflow\//);
  assert.doesNotMatch(saved.previewHandoff.instructions, /openopenmotion/);
  assert.deepEqual(await service.call('openmotion_get_project', { projectId: original.projectId }), await service.call('motion_get_project', { projectId: original.projectId }));
}, false));

test('legacy resource addresses read the same canonical workflow as OpenMotion addresses', () => fixture(async store => {
  const read = async (uri: string) => (await rpc({ jsonrpc: '2.0', id: 1, method: 'resources/read', params: { uri } }, store) as any).result.contents[0];
  assert.equal((await read('openmotion://workflow/director/start')).text, (await read('motion://workflow/director/start')).text);
} , false));

test('transport negotiation supports old and new running backends without changing the API protocol', () => {
  for (const backendName of ['motion_get_project', 'openmotion_get_project']) {
    const health = { mcp: { protocol: 1, tools: [backendName] } };
    for (const callerName of ['motion_get_project', 'openmotion_get_project']) assert.equal(phase1TransportTool(health, callerName), backendName);
  }
  assert.equal(phase1TransportTool({ mcp: { protocol: 1, tools: ['motion_write_files'] } }, 'openmotion_write_files'), undefined);
});

test('old backend hints use canonical names without changing project content or double-prefixing new URIs', () => {
  const original = { source: 'motion://user-content', previewHandoff: { nextAction: { tool: 'motion_open_preview' },
    instructions: 'Read motion://workflow/production/native or openmotion://workflow/production/native.' } };
  const normalized = publicToolResult(original);
  assert.equal(normalized.source, original.source);
  assert.equal(normalized.previewHandoff.nextAction.tool, 'openmotion_open_preview');
  assert.equal(normalized.previewHandoff.instructions, 'Read openmotion://workflow/production/native or openmotion://workflow/production/native.');
  assert.equal(original.previewHandoff.nextAction.tool, 'motion_open_preview');
  assert.deepEqual(publicToolResult(normalized), normalized);
});
