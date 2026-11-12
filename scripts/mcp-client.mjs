import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import assert from 'node:assert/strict';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { validateTransport, redact } from './check-installed-mcp.mjs';

function protocolClient(transport, env, timeout) {
  const child = spawn(transport.command, transport.args, { cwd: transport.cwd, env, stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true });
  let seq = 0, stderr = ''; const pending = new Map();
  child.stderr.on('data', chunk => { stderr = (stderr + chunk).slice(-4000); });
  const failPending = error => {
    for (const { reject, timer } of pending.values()) { clearTimeout(timer); reject(error); }
    pending.clear();
  };
  child.on('error', failPending);
  child.on('close', code => failPending(new Error(`MCP exited ${code}: ${stderr}`)));
  child.stdin.on('error', failPending);
  createInterface({ input: child.stdout }).on('line', line => {
    try { const value = JSON.parse(line); if (value.jsonrpc !== '2.0') throw new Error('Invalid MCP response'); pending.get(value.id)?.resolve(value); }
    catch (error) { failPending(error); }
  });
  const rpc = (method, params) => new Promise((resolve, reject) => {
    if (child.exitCode !== null || child.signalCode !== null || child.stdin.destroyed) return reject(new Error('MCP transport is closed'));
    const id = ++seq, timer = setTimeout(() => { pending.delete(id); reject(new Error(`${method} timed out; an operation may still be running. Read its state before retrying. ${stderr}`)); }, timeout);
    pending.set(id, { reject, timer, resolve: reply => { clearTimeout(timer); pending.delete(id); reply.error ? reject(new Error(JSON.stringify(reply.error))) : resolve(reply.result); } });
    child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
  });
  return { child, rpc };
}

// Use the installed transport and public contract; never a second implementation of project operations.
export async function installedTool(state, connection, name, args = {}, timeout = 180_000) {
  assert(args && typeof args === 'object' && !Array.isArray(args), 'Tool arguments must be a JSON object');
  const transport = validateTransport(connection);
  const allowed = tool => (!connection.enabled_tools || connection.enabled_tools.includes(tool)) && !connection.disabled_tools?.includes(tool);
  assert(allowed('openmotion_get_project') && (name === undefined || allowed(name)), 'MCP_TOOL_DISABLED: requested tool or workspace read is disabled in this host');
  const expected = JSON.parse(await readFile(path.join(state.appRoot, 'shared/mcp-profiles.json'), 'utf8')).phase1.tools;
  assert(name === undefined || expected.includes(name), 'MCP_TOOL_NOT_EXPOSED: ' + name);
  const { child, rpc } = protocolClient(transport, { ...process.env, ...(transport.env || {}) }, timeout);
  try {
    const hello = await rpc('initialize', { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'openmotion-cli', version: '1' } });
    assert.equal(hello.serverInfo?.version, state.version, 'Installed MCP version mismatch');
    child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n');
    const { tools } = await rpc('tools/list', {});
    assert(Array.isArray(tools) && tools.length === expected.length && expected.every(name => tools.some(tool => tool.name === name)), 'Installed MCP tool contract mismatch');
    const read = await rpc('tools/call', { name: 'openmotion_get_project', arguments: {} });
    assert(!read.isError && typeof read.structuredContent?.dataDirectory === 'string'
      && path.resolve(read.structuredContent.dataDirectory) === path.resolve(state.dataDirectory), 'Installed MCP data directory mismatch; no requested operation was applied');
    if (name === undefined) return { serverInfo: hello.serverInfo, dataDirectory: state.dataDirectory, tools: tools.filter(tool => allowed(tool.name)) };
    return name === 'openmotion_get_project' && Object.keys(args).length === 0 ? read : await rpc('tools/call', { name, arguments: args });
  } catch (error) {
    throw new Error(redact(error.message, { ...process.env, ...(transport.env || {}) }));
  } finally {
    const timer = setTimeout(() => child.kill(), 2000);
    child.stdin.end();
    if (child.exitCode === null && child.signalCode === null) await new Promise(resolve => child.once('close', resolve));
    clearTimeout(timer);
  }
}
