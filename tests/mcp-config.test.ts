import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkTransport } from '../scripts/check-installed-mcp.mjs';
import { VERSION } from '../preview.ts';

const root = fileURLToPath(new URL('../', import.meta.url));
test('packaged relative cwd launches exactly as the Codex host resolves it, without placeholder substitution', async () => {
  const config = JSON.parse(await readFile(new URL('../.mcp.json', import.meta.url), 'utf8')).mcpServers.motion;
  assert.equal(config.cwd, '.'); assert.ok(!JSON.stringify(config).includes('${'));
  const resolved = { enabled: true, transport: { ...config, cwd: path.resolve(root, config.cwd) } };
  const checked = checkTransport(resolved, VERSION);
  for (const name of ['motion_create_project', 'motion_open_preview', 'motion_edit_project', 'motion_import_assets', 'motion_list_versions', 'motion_restore_version', 'motion_export_request', 'motion_export_cancel']) assert.ok(checked.tools.includes(name));
  assert.equal(checked.tools.length, 11);
});
test('installation check catches the exact installed placeholder bug before reporting success', () => {
  assert.throws(() => checkTransport({ enabled: true, transport: { type: 'stdio', command: 'node',
    args: ['--experimental-strip-types', '${PLUGIN_ROOT}/mcp.ts'], cwd: path.join(root, '${PLUGIN_ROOT}') } }, VERSION), /unexpanded placeholder/);
});

test('transport diagnostics distinguish configuration, startup, protocol and workspace failures without leaking credentials', async t => {
  const directory = await mkdtemp(path.join(tmpdir(), 'motion-mcp-diagnose-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const filename = path.join(directory, 'server.mjs');
  await writeFile(filename, `import {createInterface} from 'node:readline';
if(process.env.PROBE_FAILURE){console.error('startup rejected: '+process.env.API_TOKEN);process.exit(1)}
for await(const line of createInterface({input:process.stdin})){
 const q=JSON.parse(line);if(q.id===undefined)continue;
 const result=q.id===1?{serverInfo:{version:'1.2.3'}}:q.id===2?{tools:[{name:'motion_get_project'}]}:{structuredContent:{dataDirectory:process.env.PROBE_DIRECTORY}};
 console.log(JSON.stringify({jsonrpc:'2.0',id:q.id,result}));
}`);
  const config = { enabled: true, transport: { type: 'stdio', command: process.execPath, args: [filename], env: { PROBE_DIRECTORY: directory } } };
  const options = { expectedTools: ['motion_get_project'], dataDirectory: directory };
  assert.equal(checkTransport(config, '1.2.3', options).dataDirectory, directory);
  assert.deepEqual(checkTransport({ transport: { ...config.transport, cwd: null, env: null } }, '1.2.3', { expectedTools: options.expectedTools }).tools, ['motion_get_project']);
  assert.throws(() => checkTransport(null, '1.2.3', options), { code: 'MCP_NOT_REGISTERED' });
  assert.throws(() => checkTransport({ ...config, enabled: false }, '1.2.3', options), { code: 'MCP_DISABLED' });
  assert.throws(() => checkTransport({ ...config, transport: { ...config.transport, cwd: path.join(directory, 'missing') } }, '1.2.3', options), { code: 'MCP_CONFIG_INVALID' });
  assert.throws(() => checkTransport({ ...config, transport: { ...config.transport, command: path.join(directory, 'missing-node') } }, '1.2.3', options), { code: 'MCP_STARTUP_FAILED' });
  assert.throws(() => checkTransport(config, '9.9.9', options), { code: 'MCP_VERSION_MISMATCH' });
  assert.throws(() => checkTransport(config, '1.2.3', { ...options, expectedTools: ['missing_tool'] }), { code: 'MCP_TOOLS_MISMATCH' });
  assert.throws(() => checkTransport(config, '1.2.3', { ...options, dataDirectory: path.join(directory, 'other') }), { code: 'MCP_WORKSPACE_MISMATCH' });
  assert.throws(() => checkTransport({ ...config, transport: { ...config.transport, env: { PROBE_FAILURE: '1', API_TOKEN: 'fixture-secret-value' } } }, '1.2.3', options), error => {
    assert.equal(error.code, 'MCP_STARTUP_FAILED');
    assert.match(error.message, /startup rejected/);
    assert.doesNotMatch(error.message, /fixture-secret-value/);
    return true;
  });
  await writeFile(filename, 'console.log("non-protocol log");');
  assert.throws(() => checkTransport(config, '1.2.3', options), { code: 'MCP_PROTOCOL_INVALID' });
  await writeFile(filename, 'console.error(\'API_KEY="embedded-fixture-secret"\');process.exit(1);');
  assert.throws(() => checkTransport(config, '1.2.3', options), error => {
    assert.doesNotMatch(error.message, /embedded-fixture-secret/);
    return true;
  });
});

test('an unresponsive MCP probe times out without retrying or waiting indefinitely', { timeout: 20_000 }, () => {
  assert.throws(() => checkTransport({ transport: { type: 'stdio', command: process.execPath, args: ['-e', 'setInterval(()=>{},1000)'] } }, '1.2.3', { expectedTools: ['motion_get_project'] }), { code: 'MCP_PROBE_TIMEOUT' });
});
