import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { createToolRegistry } from '../shared/mcp-registry.ts';
import { tools, publicTools, rpc, mcpRegistry } from '../mcp.ts';
import { fixture } from './fixtures.ts';
import { workflowEntryGuide, phase1Skills } from '../shared/workflow.ts';

const phase1 = JSON.parse(readFileSync(new URL('../shared/mcp-profiles.json', import.meta.url), 'utf8')).phase1;
const target: string[] = phase1.tools;

test('phase-one target is explicit, unique, and distinct from the legacy implementation list', () => {
  assert.deepEqual(publicTools.map(tool => tool.name), target);
  assert.deepEqual(mcpRegistry('legacy').tools.map(tool => tool.name), tools.map(tool => tool.name));
  assert.throws(() => createToolRegistry(tools, 'unknown'), /Unknown MCP release profile/);
  assert.throws(() => createToolRegistry([...tools, tools[0]], 'legacy'), /Duplicate MCP implementation/);
  assert.throws(() => createToolRegistry(tools, 'phase1'), /MCP_PROFILE_INCOMPLETE.*openmotion_list_versions/);
});

test('one registry governs discovery and rejects hidden calls before the existing handler', () => fixture(async store => {
  // These definitions exercise the protocol gate, not phase-one business acceptance.
  const registry = createToolRegistry(target.map(name => ({ ...tools[0], name })), 'phase1');
  const list: any = await rpc({ jsonrpc: '2.0', id: 1, method: 'tools/list' }, store, registry);
  assert.deepEqual(list.result.tools.map((tool: any) => tool.name), target);
  const initial = await store.get();
  const call: any = await rpc({ jsonrpc: '2.0', id: 2, method: 'tools/call', params: {
    name: 'openmotion_write_files', arguments: { expectedRevision: initial.revision, files: [{ path: 'notes.md', content: 'must not persist' }] },
  } }, store, registry);
  assert.equal(call.result.isError, true);
  assert.match(call.result.content[0].text, /MCP_TOOL_NOT_EXPOSED/);
  assert.deepEqual(await store.get(), initial);
  assert.equal(existsSync(path.join(store.projectDirectory, 'notes.md')), false);
  const initialized: any = await rpc({ jsonrpc: '2.0', id: 3, method: 'initialize' }, store, registry);
  assert.equal(initialized.result.instructions, workflowEntryGuide + ' ' + phase1.instructions);
  assert.ok(!initialized.result.instructions.includes('openmotion_get_workflow'));
}));

test('a missing implementation cannot produce a partial public registry', () => {
  assert.throws(() => createToolRegistry(publicTools.filter(tool => tool.name !== 'openmotion_create_project'), 'phase1'), /MCP_PROFILE_INCOMPLETE.*openmotion_create_project/);
  assert.deepEqual(mcpRegistry('phase1').tools.map(tool => tool.name), target);
});

test('phase1 Skills reference only publicly callable Tool names', () => {
  for (const skill of phase1Skills) {
    const root = new URL('../skills/' + skill + '/', import.meta.url);
    for (const filename of readdirSync(root, { recursive: true }) as string[]) {
      if (!filename.endsWith('.md')) continue;
      const document = readFileSync(new URL(filename, root), 'utf8');
      for (const match of document.matchAll(/\b(?:openmotion|motion|design)_[a-z_]+\b/g)) assert.ok(target.includes(match[0]), `${skill}/${filename} calls hidden ${match[0]}`);
    }
  }
});
