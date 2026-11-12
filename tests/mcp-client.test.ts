import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { installedTool } from '../scripts/mcp-client.mjs';

async function fixture(t: any, options: { version?: string; wrongDirectory?: boolean; toolError?: boolean } = {}) {
  const directory = await mkdtemp(path.join(tmpdir(), 'motion-direct-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  await mkdir(path.join(directory, 'shared'));
  const names = ['openmotion_get_project', 'openmotion_edit_project'], log = path.join(directory, 'calls.jsonl');
  await writeFile(path.join(directory, 'shared/mcp-profiles.json'), JSON.stringify({ phase1: { tools: names } }));
  const state = { version: '1.2.3', appRoot: directory, dataDirectory: path.join(directory, 'data'), launcher: path.join(directory, 'run-mcp.mjs') };
  await writeFile(state.launcher, `
    import { createInterface } from 'node:readline';
    import { appendFileSync } from 'node:fs';
    let initialized = false;
    for await (const line of createInterface({ input: process.stdin })) {
      const m = JSON.parse(line);
      appendFileSync(${JSON.stringify(log)}, JSON.stringify(m) + '\\n');
      if (m.method === 'notifications/initialized') { initialized = true; continue; }
      let result;
      if (m.method === 'initialize') result = { serverInfo: { version: ${JSON.stringify(options.version || state.version)} } };
      else if (!initialized) { console.log(JSON.stringify({ jsonrpc: '2.0', id: m.id, error: { code: -1, message: 'Not initialized' } })); continue; }
      else if (m.method === 'tools/list') result = { tools: ${JSON.stringify(names.map(name => ({ name, inputSchema: { type: 'object' } })))} };
      else if (m.params.name === 'openmotion_get_project') result = { structuredContent: { dataDirectory: ${JSON.stringify(options.wrongDirectory ? directory : state.dataDirectory)} } };
      else result = ${JSON.stringify(options.toolError ? { isError: true, structuredContent: { error: { code: 'VERSION_CONFLICT', applied: false } } } : { structuredContent: { received: 'tool arguments' } })};
      console.log(JSON.stringify({ jsonrpc: '2.0', id: m.id, result }));
    }
  `);
  return { state, connection: { transport: { type: 'stdio', command: process.execPath, args: [state.launcher], cwd: directory, env: { FIXTURE_ENV: 'registered' } } }, calls: async () => (await readFile(log, 'utf8')).trim().split('\n').map(line => JSON.parse(line)) };
}

test('direct access lists schemas and verifies the saved workspace before each requested operation', async t => {
  const { state, connection, calls } = await fixture(t);
  assert.deepEqual((await installedTool(state, connection)).tools.map(tool => tool.name), ['openmotion_get_project', 'openmotion_edit_project']);
  const args = { projectId: 'original-project', expectedRevision: 'original-revision', files: [{ path: 'index.html', content: '用户内容 $() `literal`' }] };
  await installedTool(state, connection, 'openmotion_edit_project', args);
  const messages = await calls(), requested = messages.filter(message => message.method === 'tools/call');
  assert.deepEqual(requested.map(message => message.params.name), ['openmotion_get_project', 'openmotion_get_project', 'openmotion_edit_project']);
  assert.deepEqual(requested[2].params.arguments, args);
});

test('version and workspace mismatches stop before a mutation is sent', async t => {
  for (const options of [{ version: 'wrong' }, { wrongDirectory: true }]) {
    const { state, connection, calls } = await fixture(t, options);
    await assert.rejects(installedTool(state, connection, 'openmotion_edit_project'), /mismatch/);
    assert(!(await calls()).some(message => message.params?.name === 'openmotion_edit_project'));
  }
});

test('hidden tools and invalid arguments are rejected, while tool failures keep their evidence without retrying', async t => {
  const { state, connection, calls } = await fixture(t, { toolError: true });
  await assert.rejects(installedTool(state, connection, 'motion_write_files'), /MCP_TOOL_NOT_EXPOSED/);
  await assert.rejects(installedTool(state, connection, 'openmotion_edit_project', []), /JSON object/);
  const failure = await installedTool(state, connection, 'openmotion_edit_project', { requestId: 'keep-me' });
  assert.equal(failure.isError, true);
  assert.equal(failure.structuredContent.error.code, 'VERSION_CONFLICT');
  assert.equal((await calls()).filter(message => message.params?.name === 'openmotion_edit_project').length, 1);
});

test('an unresponsive runtime fails within the check deadline and closes its owned transport', async t => {
  const { state, connection } = await fixture(t);
  await writeFile(state.launcher, 'process.stdin.resume();');
  await assert.rejects(installedTool(state, connection, 'openmotion_get_project', {}, 50), /timed out/);
});


test('disabled servers/tools are refused before starting the transport', async t => {
  const { state, connection } = await fixture(t);
  for (const restricted of [{ ...connection, enabled: false },
    { ...connection, disabled_tools: ['openmotion_edit_project'] },
    { ...connection, enabled_tools: ['openmotion_edit_project'] }]) {
    await assert.rejects(installedTool(state, restricted, 'openmotion_edit_project'), /disabled/i);
  }
  await assert.rejects(readFile(path.join(state.appRoot, 'calls.jsonl')), { code: 'ENOENT' });
});

test('registered cwd/env are used and startup secrets are redacted', async t => {
  const { state, connection } = await fixture(t);
  await writeFile(state.launcher, "console.error(process.env.API_TOKEN + ' ' + process.env.FIXTURE_ENV + ' ' + process.cwd());process.exit(1)");
  await assert.rejects(installedTool(state, { ...connection, transport: { ...connection.transport, env: { ...connection.transport.env, API_TOKEN: 'private-test-secret' } } }), error => {
    assert.match(error.message, /registered/);
    assert(error.message.includes(state.appRoot));
    assert.doesNotMatch(error.message, /private-test-secret/);
    return true;
  });
});
