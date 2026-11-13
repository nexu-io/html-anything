import test from 'node:test';
import assert from 'node:assert/strict';
import { rpc, mcpRegistry } from '../mcp.ts';
import { fixture } from './fixtures.ts';
import { spawnSync } from 'node:child_process';
import { cp, mkdtemp, readFile, rm, writeFile, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createToolRegistry } from '../shared/mcp-registry.ts';
import { loadTemplatePresentation } from '../shared/mcp-template-recommendations.ts';
import { inlineVideoUri } from '../shared/inline-video.ts';

const name = 'openmotion_show_template_recommendations';
const ids = ['decision-tree', 'product-promo', 'nyt-graph'];
const capabilities = { extensions: { 'io.modelcontextprotocol/ui': { mimeTypes: ['text/html;profile=mcp-app'] } } };
let nextId = 0;
const message = (method: string, params: any = {}) => ({ jsonrpc: '2.0', id: ++nextId, method, params });

test('a negotiated native presentation is discoverable, readable and project-free', () => fixture(async store => {
  const state: any = {};
  const call = (method: string, params: any = {}) => (rpc as any)(message(method, params), store, mcpRegistry(), undefined, state);
  const before = await store.get();
  await call('initialize', { protocolVersion: '2025-06-18', capabilities });
  const listed = await call('tools/list');
  assert.equal(listed.result.tools.length, 13);
  const definition = listed.result.tools.find((tool: any) => tool.name === name);
  assert.equal(definition.annotations.readOnlyHint, true);
  const shown = await call('tools/call', { name, arguments: { templateIds: ids } });
  assert.equal(shown.result.isError, undefined);
  assert.deepEqual(shown.result.structuredContent.cards.map((card: any) => card.templateId), ids);
  for (const card of shown.result.structuredContent.cards) {
    assert.equal(card.createArgs.requestId, card.actionRequestId);
    assert.equal(card.createArgs.projectType, 'template');
    assert.equal(card.createArgs.sessionId, undefined);
  }
  const uri = definition._meta.ui.resourceUri;
  const resources = (await call('resources/list')).result.resources;
  assert(resources.some((resource: any) => resource.uri === inlineVideoUri), 'Keep the existing video-progress component available');
  assert(resources.some((resource: any) => resource.uri === uri), 'The recommendation resource is additive');
  const inline = await call('resources/read', { uri: inlineVideoUri });
  assert.equal(inline.result.contents[0].mimeType, 'text/html;profile=mcp-app');
  const resource = await call('resources/read', { uri });
  const content = resource.result.contents[0];
  assert.equal(content.mimeType, 'text/html;profile=mcp-app');
  assert.deepEqual(content._meta.ui.csp.resourceDomains, ['blob:']);
  assert.match(content.text, /__OPENMOTION_TEMPLATE_CARDS__/);
  assert.ok(Buffer.byteLength(JSON.stringify(resource)) < 1.5 * 1024 * 1024);
  assert.deepEqual(await store.get(), before);
}));

test('presentation capability is connection-local and cleared by reinitialization', () => fixture(async store => {
  const a: any = {}, b: any = {};
  const call = (state: any, method: string, params: any = {}, registry = mcpRegistry()) =>
    (rpc as any)(message(method, params), store, registry, undefined, state);
  await call(a, 'initialize', { capabilities });
  const toolsA = await call(a, 'tools/list');
  assert.equal(toolsA.result.tools.length, 13);
  const uri = toolsA.result.tools.find((tool: any) => tool.name === name)._meta.ui.resourceUri;
  assert.equal((await call(b, 'tools/list')).result.tools.length, 12);
  const denied = await call(b, 'tools/call', { name, arguments: { templateIds: ids } });
  assert.equal(denied.result.structuredContent.error.code, 'MCP_TOOL_NOT_EXPOSED');
  assert.equal(denied.result.structuredContent.error.applied, false);
  assert.equal((await call(b, 'resources/read', { uri })).error.code, -32602);
  assert.equal((await call(a, 'tools/list', {}, mcpRegistry('legacy'))).result.tools.length, 28);
  const baseResources = await call(b, 'resources/list');
  assert.ok(baseResources.result.resources.some((item: any) => item.uri.startsWith('openmotion://workflow/')));
  for (const invalid of [{}, { extensions: { 'io.modelcontextprotocol/ui': { mimeTypes: ['text/html+skybridge'] } } }, { extensions: { 'io.modelcontextprotocol/ui': { mimeTypes: 'text/html;profile=mcp-app' } } }]) {
    await call(a, 'initialize', { capabilities });
    assert.equal((await call(a, 'tools/list')).result.tools.length, 13);
    await call(a, 'initialize', { capabilities: invalid });
    assert.equal((await call(a, 'tools/list')).result.tools.length, 12);
    assert.equal((await call(a, 'resources/read', { uri })).error.code, -32602);
  }
}));

test('invalid presentation input cannot change the workspace or silently substitute templates', () => fixture(async store => {
  const state: any = {};
  const call = (method: string, params: any = {}) => (rpc as any)(message(method, params), store, mcpRegistry(), undefined, state);
  await call('initialize', { capabilities });
  const before = await store.get();
  for (const args of [
    {}, { templateIds: [] }, { templateIds: ids.slice(0, 2) },
    { templateIds: ['product-promo', 'product-promo', 'nyt-graph'] },
    { templateIds: ['unknown', 'product-promo', 'nyt-graph'] },
    { templateIds: ids, projectId: 'foreign-project' },
    { templateIds: ids, url: 'https://example.com/unapproved.mp4' },
    { templateIds: ids, language: 'de' }, { templateIds: ids, language: 123 },
  ]) {
    const rejected = await call('tools/call', { name, arguments: args });
    assert.equal(rejected.result.isError, true);
    assert.equal(rejected.result.structuredContent.error.code, 'INVALID_ARGUMENT');
    assert.equal(rejected.result.structuredContent.error.applied, false);
  }
  const first = (await call('tools/call', { name, arguments: { templateIds: ids } })).result.structuredContent;
  const second = (await call('tools/call', { name, arguments: { templateIds: [...ids].reverse() } })).result.structuredContent;
  assert.deepEqual(first.cards.map((card: any) => card.templateId), ids);
  assert.deepEqual(second.cards.map((card: any) => card.templateId), [...ids].reverse());
  assert.notEqual(first.recommendationId, second.recommendationId);
  assert.equal(new Set([...first.cards, ...second.cards].map((card: any) => card.actionRequestId)).size, 6);
  assert.deepEqual(await store.get(), before);
}));

test('onboarding is an explicit read-only presentation mode and ordinary calls remain unchanged', () => fixture(async store => {
  const state: any = {};
  const call = (method: string, params: any = {}) => (rpc as any)(message(method, params), store, mcpRegistry(), undefined, state);
  const before = await store.get();
  await call('initialize', { protocolVersion: '2025-06-18', capabilities });
  const regular = (await call('tools/call', { name, arguments: { templateIds: ids } })).result;
  assert.equal('onboarding' in regular.structuredContent, false);
  const welcome = (await call('tools/call', { name, arguments: { templateIds: ids, onboarding: true } })).result;
  assert.equal(welcome.isError, undefined);
  assert.equal(welcome.structuredContent.onboarding, true);
  assert.deepEqual(welcome.structuredContent.cards.map((card: any) => card.templateId), ids);
  assert.match(welcome.content[0].text, /Do not append/);
  const invalid = await call('tools/call', { name, arguments: { templateIds: ids, onboarding: 'true' } });
  assert.equal(invalid.result.isError, true);
  assert.deepEqual(await store.get(), before);
}));

test('presentation carries every supported conversation language without changing canonical template identities', () => fixture(async store => {
  const state: any = {};
  const call = (method: string, params: any = {}) => (rpc as any)(message(method, params), store, mcpRegistry(), undefined, state);
  await call('initialize', { capabilities });
  const before = await store.get();
  const definition = (await call('tools/list')).result.tools.find((tool: any) => tool.name === name);
  const languages = ['zh', 'en', 'ja', 'ko', 'fr', 'es', 'pt'];
  assert.deepEqual(definition.inputSchema.properties.language.enum, languages);
  assert.match(definition.description, /latest user request/);
  for (const language of languages) {
    const shown = (await call('tools/call', { name, arguments: { templateIds: ids, onboarding: true, language } })).result;
    assert.equal(shown.isError, undefined);
    assert.equal(shown.structuredContent.language, language);
    assert.deepEqual(shown.structuredContent.cards.map((card: any) => card.templateId), ids);
  }
  assert.deepEqual(await store.get(), before);
}));

test('actual stdio preserves negotiated UI state and the disabled path stays exactly twelve', () => fixture(async store => {
  const requests = [message('initialize', { protocolVersion: '2025-06-18', capabilities }), message('tools/list'),
    message('tools/call', { name, arguments: { templateIds: ids } })];
  const input = requests.map(item => JSON.stringify(item)).join('\n') + '\n';
  for (const disabled of [false, true]) {
    const child = spawnSync(process.execPath, ['--experimental-strip-types', 'mcp.ts'], {
      input, encoding: 'utf8', timeout: 10_000,
      env: { ...process.env, MOTION_DATA_DIR: store.directory, OPENMOTION_TELEMETRY: '0',
        OPENMOTION_TEMPLATE_CARDS: disabled ? '0' : '1' },
    });
    assert.equal(child.status, 0, child.stderr);
    const responses = child.stdout.trim().split('\n').map(line => JSON.parse(line));
    assert.equal(responses[1].result.tools.length, disabled ? 12 : 13);
    if (disabled) assert.equal(responses[2].result.structuredContent.error.code, 'MCP_TOOL_NOT_EXPOSED');
    else assert.deepEqual(responses[2].result.structuredContent.cards.map((card: any) => card.templateId), ids);
  }
}));

test('optional registry entries retain collision and exposure checks', () => {
  const registry = mcpRegistry();
  assert.throws(() => createToolRegistry(registry.tools, 'phase1', [{ name: 'unregistered_ui_tool' }]), /Unknown MCP optional extension/);
  assert.throws(() => createToolRegistry(registry.tools, 'phase1', [{ name }, { name }]), /Duplicate MCP optional extensions/);
  assert.throws(() => createToolRegistry([...registry.tools, { name }], 'phase1', [{ name }]), /shadows/);
  assert.throws(() => createToolRegistry(mcpRegistry('legacy').tools, 'legacy', [{ name }]), /phase-one/);
});

test('old resource bytes survive asset replacement and invalid assets are rejected', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'openmotion-ui-assets-'));
  const source = fileURLToPath(new URL('../mcp-ui/template-recommendations/', import.meta.url));
  try {
    await cp(source, directory, { recursive: true });
    const old = loadTemplatePresentation({ directory });
    const original = old.content.text;
    const script = path.join(directory, 'build/app.js');
    await writeFile(script, await readFile(script, 'utf8') + '\n/* next build */');
    const next = loadTemplatePresentation({ directory });
    assert.notEqual(next.uri, old.uri);
    assert.equal(old.content.text, original);
    assert.ok(Object.isFrozen(old.content));
    const state = { presentation: old };
    const served: any = await (rpc as any)(message('resources/read', { uri: old.uri }), undefined, mcpRegistry(), undefined, state);
    assert.equal(served.result.contents[0].text, original);
    await rm(script);
    await symlink(path.join(source, 'build/app.js'), script);
    assert.throws(() => loadTemplatePresentation({ directory }), /symbolic/);
    assert.equal(old.content.text, original);
  } finally { await rm(directory, { recursive: true, force: true }); }
});
