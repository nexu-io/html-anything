import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const failure = (code, message) => Object.assign(new Error(message), { code });
export function redact(message, environment) {
  for (const [key, value] of Object.entries(environment)) {
    if (/token|secret|password|authorization|api.?key/i.test(key) && typeof value === 'string' && value.length >= 4) message = message.replaceAll(value, '[redacted]');
  }
  return message.replace(/Bearer\s+\S+/gi, 'Bearer [redacted]')
    .replace(/([\w-]*(?:token|secret|password|authorization|api.?key)[\w-]*["']?\s*[:=]\s*)("(?:\\.|[^"\\])*"|'[^']*'|[^\s,;}]+)/gi, '$1[redacted]').slice(-1500);
}

export function checkTransport(config, expectedVersion, { expectedTools, dataDirectory } = {}) {
  if (!config) throw failure('MCP_NOT_REGISTERED', 'OpenMotion MCP is not registered in this host. Run setup for the selected host.');
  if (config.enabled === false) throw failure('MCP_DISABLED', 'OpenMotion MCP is disabled. Enable it in the selected host before reconnecting.');
  if (config.transport?.type !== 'stdio') throw failure('MCP_CONFIG_INVALID', 'OpenMotion requires a local stdio MCP connection.');
  const transport = config.transport;
  if (transport.cwd != null && typeof transport.cwd !== 'string') throw failure('MCP_CONFIG_INVALID', 'MCP working directory must be a string.');
  if (transport.env != null && (typeof transport.env !== 'object' || Array.isArray(transport.env) || Object.values(transport.env).some(value => typeof value !== 'string'))) throw failure('MCP_CONFIG_INVALID', 'MCP environment overrides must contain string values.');
  if (JSON.stringify([transport.command, transport.cwd, transport.args]).includes('${')) throw failure('MCP_CONFIG_INVALID', 'The resolved MCP command contains an unexpanded placeholder. Fix the host configuration.');
  if (typeof transport.command !== 'string' || !transport.command || !Array.isArray(transport.args) || transport.args.some(arg => typeof arg !== 'string')) throw failure('MCP_CONFIG_INVALID', 'MCP requires an executable command and string arguments.');
  if (transport.cwd && (!path.isAbsolute(transport.cwd) || !fs.existsSync(transport.cwd) || !fs.statSync(transport.cwd).isDirectory())) throw failure('MCP_CONFIG_INVALID', 'The resolved MCP working directory does not exist or is not absolute.');
  const messages = [
    { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'motion-install-check', version: '1' } } },
    { jsonrpc: '2.0', method: 'notifications/initialized' },
    { jsonrpc: '2.0', id: 2, method: 'tools/list' },
  ];
  if (dataDirectory) messages.push({ jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'motion_get_project', arguments: {} } });
  const environment = { ...process.env, ...(transport.env || {}) };
  const result = spawnSync(transport.command, transport.args, { cwd: transport.cwd,
    env: environment, encoding: 'utf8', timeout: 15_000, maxBuffer: 4 * 1024 * 1024,
    input: messages.map(message => JSON.stringify(message)).join('\n') + '\n' });
  if (result.error || result.status !== 0) throw failure(result.error?.code === 'ETIMEDOUT' ? 'MCP_PROBE_TIMEOUT' : 'MCP_STARTUP_FAILED',
    'MCP probe failed: ' + redact(result.error?.message || result.stderr || `exit ${result.status}`, environment));
  let responses;
  try {
    responses = result.stdout.trim().split('\n').filter(Boolean).map(line => JSON.parse(line));
    if (responses.some(response => !response || response.jsonrpc !== '2.0')) throw new Error('Invalid MCP response');
  }
  catch { throw failure('MCP_PROTOCOL_INVALID', 'MCP stdout contains invalid JSON. Keep diagnostic logs on stderr.'); }
  const initialization = responses.find(response => response.id === 1)?.result;
  const listed = responses.find(response => response.id === 2)?.result?.tools;
  if (!initialization?.serverInfo) throw failure('MCP_INITIALIZATION_FAILED', 'The MCP process did not complete initialization. Inspect its startup output in the host.');
  if (initialization.serverInfo.version !== expectedVersion) throw failure('MCP_VERSION_MISMATCH', 'The MCP application version does not match this installation.');
  const names = Array.isArray(listed) ? listed.map(tool => tool?.name) : [];
  const expected = expectedTools || JSON.parse(fs.readFileSync(new URL('../shared/mcp-profiles.json', import.meta.url), 'utf8')).phase1.tools;
  if (names.length !== expected.length || !expected.every(name => names.includes(name))) throw failure('MCP_TOOLS_MISMATCH', 'The MCP tool list does not match this installation. Refresh the host tool discovery after correcting the installation.');
  if (dataDirectory) {
    const read = responses.find(response => response.id === 3);
    if (!read?.result || read.error || read.result.isError) throw failure('MCP_READ_FAILED', 'motion_get_project failed: ' + redact(JSON.stringify(read?.error || read?.result?.structuredContent || read?.result?.content || 'No result returned'), environment));
    const directory = read?.result?.structuredContent?.dataDirectory;
    if (typeof directory !== 'string' || path.resolve(directory) !== path.resolve(dataDirectory)) throw failure('MCP_WORKSPACE_MISMATCH', 'motion_get_project did not confirm the installation data directory. Do not switch workspaces or create a replacement project.');
  }
  return { version: expectedVersion, cwd: transport.cwd, tools: names, ...(dataDirectory ? { dataDirectory } : {}) };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const root = fileURLToPath(new URL('../', import.meta.url));
    const version = JSON.parse(fs.readFileSync(path.join(root, '.codex-plugin/plugin.json'), 'utf8')).version;
    const result = spawnSync('codex', ['mcp', 'get', 'motion', '--json'], { encoding: 'utf8', timeout: 15_000 });
    if (result.error || result.status !== 0) throw new Error('无法读取 Codex 实际 MCP 配置：' + (result.error?.message || result.stderr.slice(-500)));
    const checked = checkTransport(JSON.parse(result.stdout), version);
    console.log('安装预检通过：Codex 解析后的真实启动命令可完成 MCP 握手并列出工具。');
    console.log(JSON.stringify(checked, null, 2));
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
