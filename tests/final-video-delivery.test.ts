import test from 'node:test';
import assert from 'node:assert/strict';
import { rpc, mcpRegistry } from '../mcp.ts';
import { fixture } from './fixtures.ts';
import { Phase1Service } from '../phase1.ts';
import { pluginRoot } from '../hyperframes.ts';
import { cancelExport } from '../server.ts';

const capabilities = { extensions: { 'io.modelcontextprotocol/ui': { mimeTypes: ['text/html;profile=mcp-app'] } } };
test('only final video presentation mounts a chat component, never production or editor operations', () => fixture(async store => {
  const state: any = {};
  const call = (method: string, params: any = {}) => rpc({ jsonrpc: '2.0', id: crypto.randomUUID(), method, params }, store, mcpRegistry(), undefined, state) as Promise<any>;
  await call('initialize', { capabilities });
  const tools = (await call('tools/list')).result.tools;
  const final = tools.find((t: any) => t.name === 'openmotion_show_video');
  assert.ok(final, 'A final-only presentation entry must be discoverable');
  assert.ok(final._meta.ui.resourceUri);
  for (const tool of tools.filter((t: any) => !['openmotion_show_video', 'openmotion_show_template_recommendations'].includes(t.name)))
    assert.equal(tool._meta?.ui?.resourceUri, undefined, tool.name + ' must not mount a chat preview');
  const plain = (await rpc({ jsonrpc: '2.0', id: 'plain', method: 'tools/list' }, store) as any).result.tools;
  assert.equal(plain.length, 12, 'Non-App clients retain their existing contract');
  await call('initialize', { capabilities: {} });
  assert.ok(!(await call('tools/list')).result.tools.some((tool: any) => tool.name === 'openmotion_show_video'), 'Reinitialization must clear the previous App capability');
}, false));

test('saving an active production round defers the editor until the film is ready', () => fixture(async store => {
  const service = new Phase1Service(store, pluginRoot, {
    origin: () => 'http://127.0.0.1:4173', nativeUrl: () => undefined,
    openProject: async () => {}, mutation: async task => task(), cancel: (p, j) => cancelExport(store, p, j),
  });
  const p = await service.call('openmotion_create_project', { requestId: 'create', projectType: 'natural_language', title: 'Final delivery', requirements: 'Silent short film' });
  const begin = await service.call('openmotion_open_preview', { action: 'begin', projectId: p.projectId, requestId: 'begin', mode: 'create' });
  const saved = await service.call('openmotion_edit_project', { projectId: p.projectId, workId: begin.inlineWork.id,
    requestId: 'save', expectedRevision: p.revision, expectedVersionId: p.currentVersionId, files: [{ path: 'note.txt', content: 'Authoring in progress' }] });
  assert.equal(saved.previewHandoff.state, 'deferred');
  assert.equal(saved.previewHandoff.hostActionRequired, false);
  assert.equal(saved.previewHandoff.nextAction, null);
  assert.match(saved.previewHandoff.instructions, /ready|complete/i);
}, false));
