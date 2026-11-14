import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { fixture } from './fixtures.ts';
import { pluginRoot } from '../hyperframes.ts';

test('real stdio connections sharing an installation retain independent declared Agent identities', () => fixture(async store => {
  const events: any[] = [];
  const collector = createServer(async (req, res) => {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(Buffer.from(chunk));
    events.push(...JSON.parse(Buffer.concat(chunks).toString()).batch);
    res.writeHead(200, { 'content-type': 'application/json' }); res.end('{"status":1}');
  });
  await new Promise<void>(resolve => collector.listen(0, '127.0.0.1', resolve));
  const address = collector.address(); assert(address && typeof address !== 'string');
  try {
    async function run(name: string, directory = store.directory) {
      const child = spawn(process.execPath, ['--experimental-strip-types', 'mcp.ts'], { cwd: pluginRoot,
        env: { ...process.env, MOTION_DATA_DIR: directory, OPENMOTION_TELEMETRY: '1', DO_NOT_TRACK: '0',
          OPENMOTION_TRACKING_ENV: 'test', OPENMOTION_TRACKING_TEST_RUN_ID: crypto.randomUUID(),
          OPENMOTION_POSTHOG_HOST: `http://127.0.0.1:${address.port}`, OPENMOTION_POSTHOG_KEY: 'phc_test' },
        stdio: ['pipe', 'pipe', 'pipe'] });
      let output = '', error = '';
      child.stdout.on('data', data => { output += data; }); child.stderr.on('data', data => { error += data; });
      const completed = new Promise<void>((resolve, reject) => {
        child.once('error', reject);
        child.once('close', code => code === 0 ? resolve() : reject(new Error(`MCP exited ${code}: ${error}`)));
      });
      const timer = setTimeout(() => child.kill('SIGKILL'), 10_000);
      try {
        child.stdin.end([
          { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name, version: '1.2.3' } } },
          { jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'openmotion_get_project', arguments: { unrecognized: true } } },
          { jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'openmotion_media_use', arguments: { unrecognized: true } } },
        ].map(message => JSON.stringify(message) + '\n').join(''));
        await completed;
        const responses = output.trim().split('\n').map(line => JSON.parse(line));
        assert.equal(responses[0].result.serverInfo.name, 'openmotion');
        assert.equal(responses[1].result.isError, true);
        assert.equal(responses[2].result.isError, true);
      } finally { clearTimeout(timer); if (child.exitCode === null) child.kill(); }
    }
    await Promise.all([run('codex-mcp-client'), run('dsh-mcp-client')]);
    assert.equal(events.length, 4);
    assert(events.every(e => e.event === 'mcp_tool_finished' && e.properties.accepted === false));
    assert.deepEqual(events.map(e => e.properties.tool_name).sort(), ['motion_get_project', 'motion_get_project', 'motion_media_use', 'motion_media_use']);
    assert.deepEqual(events.map(e => e.properties.host_agent).sort(), ['codex', 'codex', 'deepseek', 'deepseek']);
    assert.deepEqual(events.map(e => e.properties.mcp_client_name).sort(), ['codex-mcp-client', 'codex-mcp-client', 'dsh-mcp-client', 'dsh-mcp-client']);
    assert(events.every(e => e.properties.mcp_client_version === '1.2.3' && e.properties.host_agent_source === 'mcp_client_info'));
    assert.equal(new Set(events.map(e => e.properties.installation_id)).size, 1);
    await fixture(other => run('codex-mcp-client', other.directory), false);
    assert.equal(events.length, 6);
    assert.equal(new Set(events.map(e => e.properties.installation_id)).size, 2);
    assert.equal(new Set(events.map(e => e.properties.device_id)).size, 1);
    if (events[0].properties.device_id_source === 'platform') {
      assert.equal(new Set(events.map(e => e.properties.distinct_id)).size, 1);
      assert(events.every(e => e.properties.distinct_id === e.properties.device_id));
    } else assert(events.every(e => e.properties.device_id === 'unknown' && e.properties.device_id_source === 'unavailable'));
    console.log(JSON.stringify({ scenario: 'device-across-two-data-directories', deviceRecognized: events[0].properties.device_id_source === 'platform',
      installations: 2, devices: events[0].properties.device_id_source === 'platform' ? 1 : 0 }));
  } finally { await new Promise<void>(resolve => collector.close(() => resolve())); }
}, false));
