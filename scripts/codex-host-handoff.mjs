import { spawn } from 'node:child_process';
import { lstat, readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const presentationTool = 'openmotion_show_template_recommendations';
const languages = ['zh', 'en', 'ja', 'ko', 'fr', 'es', 'pt'];

// Connect only to an existing host. Starting `codex app-server` would verify a
// different process and would leave the calling chat's tool catalog unchanged.
async function hostClient({ codex, socketPath, timeoutMs, env }) {
  const info = await lstat(socketPath);
  if (!info.isSocket() || info.isSymbolicLink() || process.getuid && info.uid !== process.getuid()) throw new Error('HOST_CONTROL_UNAVAILABLE');
  const javascriptCli = /\.[cm]?js$/i.test(codex);
  const child = spawn(javascriptCli ? process.execPath : codex,
    [...(javascriptCli ? [codex] : []), 'app-server', 'proxy', '--sock', socketPath],
    { env, stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true });
  let buffer = '', nextId = 0;
  const pending = new Map();
  function fail(error) {
    for (const entry of pending.values()) { clearTimeout(entry.timer); entry.reject(error); }
    pending.clear();
  }
  child.on('error', fail);
  child.stdin.on('error', fail);
  child.on('exit', () => fail(new Error('HOST_CONTROL_CLOSED')));
  child.stderr.resume(); // Host logs can contain private context; never forward them.
  child.stdout.setEncoding('utf8');
  child.stdout.on('data', chunk => {
    buffer += chunk;
    if (Buffer.byteLength(buffer) > 4 * 1024 * 1024) { fail(new Error('HOST_RESPONSE_TOO_LARGE')); child.kill(); return; }
    let newline;
    while ((newline = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, newline); buffer = buffer.slice(newline + 1);
      if (!line.trim()) continue;
      let message;
      try { message = JSON.parse(line); } catch { fail(new Error('HOST_PROTOCOL_INVALID')); child.kill(); return; }
      const entry = pending.get(message.id);
      if (!entry) continue;
      pending.delete(message.id); clearTimeout(entry.timer);
      if (message.error) entry.reject(Object.assign(new Error('HOST_REQUEST_REJECTED'), { code: message.error.code }));
      else entry.resolve(message.result);
    }
  });
  const request = (method, params) => new Promise((resolve, reject) => {
    const id = ++nextId;
    const timer = setTimeout(() => { pending.delete(id); reject(new Error('HOST_REQUEST_TIMEOUT')); }, timeoutMs);
    pending.set(id, { resolve, reject, timer });
    child.stdin.write(JSON.stringify({ id, method, params }) + '\n', error => {
      if (error) { clearTimeout(timer); pending.delete(id); reject(error); }
    });
  });
  const close = () => { fail(new Error('HOST_CONTROL_CLOSED')); child.stdin.end(); child.kill(); };
  try {
    await request('initialize', { clientInfo: { name: 'openmotion_installer', version: '1' }, capabilities: { experimentalApi: true } });
    child.stdin.write(JSON.stringify({ method: 'initialized' }) + '\n');
    return { request, close };
  } catch (error) { close(); throw error; }
}

export async function prepareCodexHostHandoff(options = {}) {
  const env = options.env ?? process.env;
  const threadId = options.threadId ?? env.CODEX_THREAD_ID ?? env.CODEX_SESSION_ID;
  const language = options.language ?? env.OPENMOTION_ONBOARDING_LANGUAGE ?? 'en';
  const presentation = { tool: presentationTool, arguments: {
    templateIds: ['product-promo', 'nyt-graph', 'decision-tree'], onboarding: true,
    language: languages.includes(language) ? language : 'en',
  }, prerequisite: 'Visibly open the template library, then invoke this tool natively in the calling chat. Do not call the presentation through a shell probe.' };
  const base = { hostSessionVerified: false, presentationVerified: false, presentation };
  const hostRequests = [
    { method: 'config/mcpServer/reload', params: null },
    { method: 'mcpServerStatus/list', params: { threadId, serverName: 'openmotion', detail: 'toolsAndAuthOnly' } },
  ];
  const required = reason => ({ ...base, status: 'host_action_required', reason, hostRequests,
    nextAction: 'Have the existing host reload MCP configuration and verify OpenMotion in this same chat. Registration and an independent probe do not complete onboarding. Do not reinstall, start another app-server, create a project, or claim native presentation succeeded.' });
  if (!threadId) return required('CURRENT_CHAT_UNKNOWN');
  if (!options.dataDirectory) return required('EXPECTED_WORKSPACE_UNKNOWN');
  let client;
  let request = options.request;
  try {
    if (!request) {
      const socketPath = options.socketPath ?? env.OPENMOTION_CODEX_SOCKET
        ?? path.join(env.CODEX_HOME || path.join(os.homedir(), '.codex'), 'app-server-control/app-server-control.sock');
      if (!path.isAbsolute(socketPath)) return required('HOST_CONTROL_UNAVAILABLE');
      try { client = await hostClient({ codex: options.codex ?? 'codex', socketPath, timeoutMs: options.timeoutMs ?? 10_000, env }); }
      catch { return required('HOST_CONTROL_UNAVAILABLE'); }
      request = client.request;
    }
    // Refuse a reachable but unrelated daemon before requesting any refresh.
    let cursor, loaded = false;
    for (let page = 0; page < 20; page++) {
      const list = await request('thread/loaded/list', { ...(cursor ? { cursor } : {}), limit: 100 });
      if (list.data?.includes(threadId)) { loaded = true; break; }
      cursor = list.nextCursor;
      if (!cursor) break;
    }
    if (!loaded) return required('CURRENT_CHAT_NOT_LOADED');
    if (!options.verifyOnly) await request('config/mcpServer/reload', null);
    const inventory = await request('mcpServerStatus/list', hostRequests[1].params);
    const server = inventory.data?.find(item => item.name === 'openmotion');
    if (server?.toolsError) return required('HOST_TOOL_DISCOVERY_FAILED');
    if (!server?.tools?.[presentationTool] || !server.tools.openmotion_get_project) {
      if (options.verifyOnly) return required('NATIVE_PRESENTATION_UNAVAILABLE');
      return { ...base, status: 'refresh_requested', hostRequests: hostRequests.slice(1),
        nextAction: 'Allow the current host step to finish, then verify this same chat once with --verify-only. A queued refresh is not a connected or displayed onboarding.' };
    }
    if (options.expectedVersion && server.serverInfo?.version !== options.expectedVersion) return required('HOST_VERSION_MISMATCH');
    const project = await request('mcpServer/tool/call', { threadId, server: 'openmotion', tool: 'openmotion_get_project', arguments: {} });
    if (project.isError) return required('HOST_WORKSPACE_READ_FAILED');
    const directory = project.structuredContent?.dataDirectory;
    if (typeof directory !== 'string' || path.resolve(directory) !== path.resolve(options.dataDirectory)) return required('HOST_WORKSPACE_MISMATCH');
    return { ...base, status: 'ready_for_presentation', hostSessionVerified: true, threadId,
      nextAction: 'Open the template library visibly and invoke the natively discovered presentation tool with onboarding:true and the latest user-request language. Confirm the welcome and three video cards; presentation is still unverified.' };
  } catch { return required('HOST_REQUEST_FAILED'); }
  finally { client?.close(); }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { WorkspaceStore } = await import('../workspace.ts');
  const result = await prepareCodexHostHandoff({ dataDirectory: new WorkspaceStore().directory,
    expectedVersion: JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8')).version,
    verifyOnly: process.argv.includes('--verify-only'), language: process.argv.find(value => value.startsWith('--language='))?.slice(11) });
  console.log(JSON.stringify(result, null, 2));
}
