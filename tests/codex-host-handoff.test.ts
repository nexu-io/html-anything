import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, rm, copyFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { prepareCodexHostHandoff } from '../scripts/codex-host-handoff.mjs';

const threadId = 'current-chat';
const dataDirectory = '/workspace/openmotion-data';
function host({ tools = true, directory = dataDirectory, loaded = true, denied = false } = {}) {
  const calls: any[] = [];
  const request = async (method: string, params: any) => {
    calls.push({ method, params });
    if (method === 'thread/loaded/list') return { data: loaded ? [threadId] : [], nextCursor: null };
    if (method === 'config/mcpServer/reload') return {};
    if (method === 'mcpServerStatus/list') return { data: [{ name: 'openmotion',
      tools: tools ? { openmotion_get_project: {}, openmotion_show_template_recommendations: {} } : {},
      serverInfo: { name: 'openmotion', version: '0.0.1' } }], nextCursor: null };
    if (method === 'mcpServer/tool/call') {
      if (denied) throw Object.assign(new Error('Host denied the read'), { code: -32000 });
      return { content: [], structuredContent: { dataDirectory: directory } };
    }
    throw new Error('Unexpected method: ' + method);
  };
  return { calls, request };
}

test('CLI handoff refreshes the existing host and verifies this chat before native presentation', async () => {
  const { request, calls } = host();
  const result = await prepareCodexHostHandoff({ threadId, dataDirectory, expectedVersion: '0.0.1', request, language: 'zh' });
  assert.equal(result.status, 'ready_for_presentation');
  assert.equal(result.hostSessionVerified, true);
  assert.equal(result.presentationVerified, false);
  assert.deepEqual(calls.map(call => call.method), ['thread/loaded/list', 'config/mcpServer/reload',
    'mcpServerStatus/list', 'mcpServer/tool/call']);
  assert.equal(calls[2].params.threadId, threadId);
  assert.equal(calls[3].params.threadId, threadId);
  assert.equal(calls[3].params.tool, 'openmotion_get_project');
  assert.deepEqual(result.presentation.arguments, { templateIds: ['product-promo', 'nyt-graph', 'decision-tree'],
    onboarding: true, language: 'zh' });
});

test('queued refresh is incomplete; a later verification never reloads or presents again', async () => {
  const first = host({ tools: false });
  const result = await prepareCodexHostHandoff({ threadId, dataDirectory, request: first.request });
  assert.equal(result.status, 'refresh_requested');
  assert.equal(result.hostSessionVerified, false);
  assert.equal(first.calls.some(call => call.method === 'mcpServer/tool/call'), false);
  const second = host();
  const verified = await prepareCodexHostHandoff({ threadId, dataDirectory, verifyOnly: true, request: second.request });
  assert.equal(verified.status, 'ready_for_presentation');
  assert.equal(second.calls.some(call => call.method === 'config/mcpServer/reload'), false);
});

test('an unrelated daemon must not be refreshed or receive project calls', async () => {
  const { request, calls } = host({ loaded: false });
  const result = await prepareCodexHostHandoff({ threadId, dataDirectory, request });
  assert.equal(result.status, 'host_action_required');
  assert.equal(result.reason, 'CURRENT_CHAT_NOT_LOADED');
  assert.deepEqual(calls.map(call => call.method), ['thread/loaded/list']);
});

test('missing native host access remains explicit and never starts another app-server', async () => {
  const result = await prepareCodexHostHandoff({ threadId, dataDirectory,
    socketPath: '/nonexistent/openmotion-host.sock', env: {} });
  assert.equal(result.status, 'host_action_required');
  assert.equal(result.reason, 'HOST_CONTROL_UNAVAILABLE');
  assert.equal(result.hostSessionVerified, false);
  assert.equal(result.presentationVerified, false);
  assert.equal(result.hostRequests[0].method, 'config/mcpServer/reload');
  assert.equal(result.hostRequests[1].params.threadId, threadId);
});

test('workspace mismatch and host policy rejection cannot become onboarding success', async () => {
  for (const fixture of [host({ directory: '/other-workspace' }), host({ denied: true })]) {
    const result = await prepareCodexHostHandoff({ threadId, dataDirectory, request: fixture.request });
    assert.equal(result.status, 'host_action_required');
    assert.equal(result.hostSessionVerified, false);
    assert.equal(result.presentationVerified, false);
    assert.equal(fixture.calls.filter(call => call.method === 'mcpServer/tool/call').length, 1);
  }
});

test('without a current chat, no host is mutated and the welcome language follows the request', async () => {
  const { request, calls } = host();
  const result = await prepareCodexHostHandoff({ env: {}, dataDirectory, request, language: 'ja' });
  assert.equal(result.status, 'host_action_required');
  assert.equal(result.reason, 'CURRENT_CHAT_UNKNOWN');
  assert.equal(calls.length, 0);
  assert.equal(result.presentation.arguments.language, 'ja');
});

test('the CLI proxy transport initializes the existing host and closes without starting another server', async t => {
  if (process.platform === 'win32') { t.skip('Unix control socket adapter'); return; }
  const directory = await mkdtemp(path.join(tmpdir(), 'om-host-'));
  const socketPath = path.join(directory, 'control.sock');
  const socket = createServer();
  await new Promise<void>((resolve, reject) => { socket.once('error', reject); socket.listen(socketPath, resolve); });
  const log = path.join(directory, 'calls.jsonl');
  const codex = path.join(directory, 'codex');
  await writeFile(codex, `#!${process.execPath}
import fs from 'node:fs';
import readline from 'node:readline';
fs.appendFileSync(${JSON.stringify(log)}, JSON.stringify({argv:process.argv.slice(2)})+'\\n');
for await (const line of readline.createInterface({input:process.stdin})) {
  const call=JSON.parse(line);
  fs.appendFileSync(${JSON.stringify(log)}, JSON.stringify({method:call.method})+'\\n');
  if(call.id===undefined) continue;
  let result={};
  if(call.method==='thread/loaded/list') result={data:[${JSON.stringify(threadId)}]};
  if(call.method==='mcpServerStatus/list') result={data:[{name:'openmotion',serverInfo:{version:'0.0.1'},tools:{openmotion_get_project:{},openmotion_show_template_recommendations:{}}}]};
  if(call.method==='mcpServer/tool/call') result={content:[],structuredContent:{dataDirectory:${JSON.stringify(dataDirectory)}}};
  process.stdout.write(JSON.stringify({id:call.id,result})+'\\n');
}
`, { mode: 0o755 });
  try {
    const javascriptCli = path.join(directory, 'codex.mjs');
    await copyFile(codex, javascriptCli);
    for (const executable of [codex, javascriptCli]) {
      await writeFile(log, '');
      const result = await prepareCodexHostHandoff({ threadId, dataDirectory, codex: executable, socketPath,
        expectedVersion: '0.0.1', language: 'zh', timeoutMs: 5000 });
      assert.equal(result.status, 'ready_for_presentation', JSON.stringify({ result, log: await readFile(log, 'utf8').catch(() => '') }));
      const calls = (await readFile(log, 'utf8')).trim().split('\n').map(line => JSON.parse(line));
      assert.deepEqual(calls[0].argv, ['app-server', 'proxy', '--sock', socketPath]);
      assert.deepEqual(calls.slice(1).map(call => call.method), ['initialize', 'initialized', 'thread/loaded/list',
        'config/mcpServer/reload', 'mcpServerStatus/list', 'mcpServer/tool/call']);
      assert.equal(calls.some(call => call.method === 'openmotion_show_template_recommendations'), false);
    }
  } finally {
    await new Promise<void>(resolve => socket.close(() => resolve()));
    await rm(directory, { recursive: true, force: true });
  }
});
