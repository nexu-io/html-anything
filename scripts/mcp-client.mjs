import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import assert from 'node:assert/strict';
import path from 'node:path';
import { readFile } from 'node:fs/promises';

export function protocolClient(transport, env, timeout = 240_000) {
  const child = spawn(transport.command, transport.args, { cwd: transport.cwd, env, stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true });
  let seq = 0, stderr = ''; const pending = new Map();
  child.stderr.on('data', chunk => { stderr = (stderr + chunk).slice(-4000); });
  const listeners = new Map();
  const failPending = error => {
    for (const { reject, timer } of pending.values()) { clearTimeout(timer); reject(error); }
    pending.clear(); listeners.clear();
  };
  child.on('error', failPending);
  child.on('close', code => failPending(new Error(`MCP exited ${code}: ${stderr}`)));
  child.stdin.on('error', failPending);
  createInterface({ input: child.stdout }).on('line', line => {
    try { const value = JSON.parse(line); listeners.get(value.id)?.(value); }
    catch (error) { failPending(error); }
  });
  const rpc = (method, params) => new Promise((resolve, reject) => {
    if (child.exitCode !== null || child.signalCode !== null || child.stdin.destroyed) return reject(new Error('MCP transport is closed'));
    const id = ++seq, timer = setTimeout(() => { listeners.delete(id); pending.delete(id); reject(new Error(`${method} timed out; an operation may still be running. Read its state before retrying. ${stderr}`)); }, timeout);
    pending.set(id, { reject, timer });
    listeners.set(id, reply => { clearTimeout(timer); listeners.delete(id); pending.delete(id); reply.error ? reject(new Error(JSON.stringify(reply.error))) : resolve(reply.result); });
    child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
  });
  return { child, rpc, getStderr: () => stderr };
}

// Use the installed transport and public contract; never a second implementation of project operations.
export async function installedTool(state, name, args = {}, timeout = 600_000) {
  assert(args && typeof args === 'object' && !Array.isArray(args), 'Tool arguments must be a JSON object');
  const expected = JSON.parse(await readFile(path.join(state.appRoot, 'shared/mcp-profiles.json'), 'utf8')).phase1.tools;
  assert(name === undefined || expected.includes(name), 'MCP_TOOL_NOT_EXPOSED: ' + name);
  const { child, rpc } = protocolClient({ command: process.execPath, args: [state.launcher] }, process.env, timeout);
  try {
    const hello = await rpc('initialize', { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'openmotion-cli', version: '1' } });
    assert.equal(hello.serverInfo?.version, state.version, 'Installed MCP version mismatch');
    child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n');
    const { tools } = await rpc('tools/list', {});
    assert(Array.isArray(tools) && tools.length === expected.length && expected.every(name => tools.some(tool => tool.name === name)), 'Installed MCP tool contract mismatch');
    if (name === undefined) return { serverInfo: hello.serverInfo, tools };
    const read = await rpc('tools/call', { name: 'motion_get_project', arguments: {} });
    assert(!read.isError && typeof read.structuredContent?.dataDirectory === 'string'
      && path.resolve(read.structuredContent.dataDirectory) === path.resolve(state.dataDirectory), 'Installed MCP data directory mismatch; no requested operation was applied');
    return name === 'motion_get_project' && Object.keys(args).length === 0 ? read : await rpc('tools/call', { name, arguments: args });
  } finally {
    const timer = setTimeout(() => child.kill(), 2000);
    child.stdin.end();
    if (child.exitCode === null && child.signalCode === null) await new Promise(resolve => child.once('close', resolve));
    clearTimeout(timer);
  }
}

