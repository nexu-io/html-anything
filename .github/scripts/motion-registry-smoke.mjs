import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import { access, mkdir, mkdtemp, readFile, readdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runFile, sha256, writeJSON } from '../../scripts/runtime-assets.mjs';

export function consumerEnvironment(work, source = process.env) {
  // Consumer code receives OS basics only, never CI credentials or Agent/browser IPC capabilities.
  const allowed = /^(?:PATH|HOME|USERPROFILE|APPDATA|LOCALAPPDATA|TMPDIR|TMP|TEMP|SystemRoot|windir|ComSpec|PATHEXT|ProgramFiles(?:\(x86\))?|ProgramData|LANG|LC_ALL|TZ)$/i;
  const env = Object.fromEntries(Object.entries(source).filter(([key]) => allowed.test(key)));
  return { ...env, CODEX_HOME: path.join(work, 'codex'), npm_config_cache: path.join(work, 'npm-cache'),
    npm_config_userconfig: path.join(work, 'user.npmrc'), npm_config_globalconfig: path.join(work, 'global.npmrc'),
    npm_config_registry: 'https://registry.npmjs.org/', npm_config_ignore_scripts: 'true',
    OPENMOTION_TELEMETRY: '0', HYPERFRAMES_NO_TELEMETRY: '1' };
}

async function discover(transport, env, version, tools) {
  const child = spawn(transport.command, transport.args, { env, stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true });
  const waiting = new Map(); let sequence = 0;
  const fail = error => { for (const p of waiting.values()) { clearTimeout(p.timer); p.reject(error); } waiting.clear(); };
  child.on('error', fail); child.on('exit', code => fail(new Error('MCP exited: ' + code)));
  child.stderr.resume();
  createInterface({ input: child.stdout }).on('line', line => {
    try { const result = JSON.parse(line), p = waiting.get(result.id); if (p) { waiting.delete(result.id); clearTimeout(p.timer); result.error ? p.reject(new Error('MCP error')) : p.resolve(result.result); } }
    catch { fail(new Error('Invalid MCP JSON')); }
  });
  const rpc = (method, params) => new Promise((resolve, reject) => {
    const id = ++sequence, timer = setTimeout(() => { waiting.delete(id); reject(new Error('MCP timed out: ' + method)); }, 120_000);
    waiting.set(id, { resolve, reject, timer }); child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
  });
  try {
    const hello = await rpc('initialize', { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'motion-registry-acceptance', version: '1' } });
    assert.equal(hello.serverInfo.version, version);
    child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n');
    assert.deepEqual((await rpc('tools/list', {})).tools.map(t => t.name), tools);
    await rpc('resources/read', { uri: 'motion://workflow/production/start' });
    await rpc('resources/read', { uri: 'motion://engine/SKILL.md' });
  } finally { child.stdin.end(); child.kill(); fail(new Error('MCP session closed')); }
}

export async function registrySmoke(directory) {
  const c = JSON.parse(await readFile(path.join(directory, 'candidate.json')));
  const platform = process.platform + '-' + process.arch;
  assert(['darwin-arm64', 'win32-x64'].includes(platform), 'Use a supported native runner');
  const file = path.join(directory, `registry-${platform}.json`);
  let phase = 'registry-download';
  const checkpoint = async next => { phase = next; await writeJSON(file, { status: 'running', phase, version: c.version, platform, tgzSHA256: c.tgzSHA256 }); };
  await checkpoint(phase);
  try {
  const work = await mkdtemp(path.join(os.tmpdir(), 'om-registry-')), env = consumerEnvironment(work);
  for (const name of ['user.npmrc', 'global.npmrc']) await writeFile(path.join(work, name), '');
  const project = path.join(work, 'project'), host = path.join(work, 'host');
  await mkdir(project); await mkdir(env.CODEX_HOME);
  await writeFile(path.join(env.CODEX_HOME, 'config.toml'), '[mcp_servers.unrelated]\ncommand = "keep-this-server"\n');
  const npm = path.join(path.dirname(process.execPath), process.platform === 'win32' ? 'node_modules/npm/bin/npm-cli.js' : '../lib/node_modules/npm/bin/npm-cli.js');
  const cli = args => runFile(process.execPath, [npm, ...args], { cwd: project, env, timeout: 20 * 60_000 });
  console.log('Fetching the exact version anonymously from the public registry');
  let metadata;
  for (let attempt = 0; attempt < 30; attempt++) {
    const response = await fetch('https://registry.npmjs.org/@openmotion%2fapp/' + c.version, { signal: AbortSignal.timeout(30_000) });
    if (response.ok) { metadata = await response.json(); break; }
    assert.equal(response.status, 404, 'Registry lookup failed');
    await new Promise(resolve => setTimeout(resolve, 10_000));
  }
  assert(metadata, 'Registry version did not become visible'); assert.equal(metadata.dist.integrity, c.integrity);
  const [packed] = JSON.parse(await cli(['pack', `${c.packageName}@${c.version}`, '--ignore-scripts', '--json', '--pack-destination', work]));
  assert.equal(path.basename(packed.filename), packed.filename);
  const tgz = path.join(work, packed.filename), bytes = await readFile(tgz);
  assert.equal(await sha256(tgz), c.tgzSHA256); assert.equal('sha512-' + createHash('sha512').update(bytes).digest('base64'), c.integrity);
  await checkpoint('host-install');
  console.log('Installing the pinned test host in an isolated prefix');
  await cli(['install', '--prefix', host, '--no-save', '--ignore-scripts', '--no-audit', '--no-fund', '@openai/codex@0.166.0']);
  const codex = path.join(host, 'node_modules/@openai/codex/bin/codex.js');
  const home = path.join(work, 'app'), data = path.join(work, 'data'), skills = path.join(project, '.agents/skills');
  const command = ['exec', '--yes', '--package', tgz, '--', 'openmotion'];
  const setup = [...command, 'setup', '--host', 'codex', '--home', home, '--data-dir', data, '--skills-dir', skills, '--codex', codex];
  console.log('Running fresh and repeated setup with isolated data, Skills and host settings');
  await checkpoint('setup');
  const first = JSON.parse(await cli(setup)), second = JSON.parse(await cli(setup));
  assert.equal(first.appRoot, second.appRoot); assert.equal((await readdir(path.join(home, 'apps'))).length, 1);
  assert.match(await readFile(path.join(env.CODEX_HOME, 'config.toml'), 'utf8'), /keep-this-server/);
  const manifest = JSON.parse(await readFile(path.join(directory, 'release-npm.json')));
  assert.equal(manifest.templateEnvironment, 'dev');
  const state = JSON.parse(await readFile(path.join(home, 'install.json')));
  assert.equal(state.templateEnvironment, manifest.templateEnvironment);
  const templateConfig = JSON.parse(await readFile(path.join(first.appRoot, 'shared/template-config.json')));
  assert.equal(templateConfig.environment, manifest.templateEnvironment);
  for (const skill of manifest.skills) await access(path.join(skills, 'openmotion/skills', skill, 'SKILL.md'));
  console.log('Preparing the checksum-pinned browser, FFmpeg and ffprobe');
  await checkpoint('native-prepare');
  await cli([...command, 'prepare', '--home', home]);
  const installed = JSON.parse(await runFile(process.execPath, [codex, 'mcp', 'get', 'openmotion', '--json'], { cwd: project, env }));
  assert.equal(installed.transport.command, process.execPath); assert.deepEqual(installed.transport.args, [first.launcher]);
  console.log('Checking the actual registered MCP transport and resources');
  await checkpoint('mcp-discovery');
  await discover(installed.transport, env, c.version, manifest.mcp.tools);
  const report = { status: 'passed', platform, version: c.version, sourceCommit: c.sourceCommit, tgzSHA256: c.tgzSHA256,
    node: process.version, codex: '0.166.0', templateEnvironment: templateConfig.environment, registryColdInstall: 'passed', repeatSetup: 'passed', unrelatedSettings: 'preserved',
    nativePreparation: 'passed', mcpTools: manifest.mcp.tools.length, skills: manifest.skills.length, resources: 'passed',
    realModelTurn: 'not-run', humanPlayback: 'not-run', windowsDesktopAcceptance: 'not-run' };
  await writeJSON(file, report); return report;
  } catch (error) {
    await writeJSON(file, { status: 'failed', phase, platform, version: c.version, tgzSHA256: c.tgzSHA256, error: 'REGISTRY_ACCEPTANCE_FAILED' });
    throw error;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await registrySmoke(path.resolve(process.argv[2]));
