import assert from 'node:assert/strict';
import { access, cp, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { canonical, readJSON, runFile, withLock, writeJSON } from './runtime-assets.mjs';

export const hosts = ['codex', 'claude', 'deepseek', 'workbuddy'];

export function hostConnectionInstructions(host) {
  const recovery = host === 'codex'
    ? 'Follow the official Codex MCP setup flow: in Codex desktop, ask the user to restart the desktop app manually and return to this same chat. In the Codex IDE extension, restart the extension; in the CLI, restart the client and resume this task. Do not change Codex startup settings or start another App Server.'
    : host === 'claude'
      ? 'Open /mcp in the current Claude Code session and select Reconnect for openmotion. If a newly registered server is not listed, use the host\'s supported configuration reload first.'
      : `Use the supported MCP refresh or reconnect control in the current ${host} host, keeping the selected profile.`;
  return 'The Agent must automatically call motion_get_project through the active chat and confirm the installation data directory and original project/version before continuing existing work. Do not ask the user to check connectivity or copy a verification prompt. Registration and an independent probe do not verify this chat. If this chat lacks Motion tools: '
    + recovery + ' Keep the chosen template and task in this conversation; do not ask the user to choose again. Do not reinstall OpenMotion or restart the host automatically.';
}

// Keep ownership stable so earlier local installations remain upgradable.
const owner = '@openmotion/installer';
const bundleName = 'dsh-plugin-openmotion-local';
const equalTransport = (actual, expected) => actual?.command === expected.command && JSON.stringify(actual.args) === JSON.stringify(expected.args);

export async function hostPlan(options, home, launcher, previous) {
  const host = options.host || 'codex';
  assert(hosts.includes(host), 'Supported hosts: ' + hosts.join(', '));
  const transport = { type: 'stdio', command: process.execPath, args: [launcher] };
  const saved = previous?.hosts?.[host] || (host === 'codex' && previous?.skillsDirectory ? { skillsDirectory: previous.skillsDirectory } : null);
  const defaultSkills = host === 'claude' ? path.join(process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude'), 'skills')
    : host === 'workbuddy' ? path.join(process.env.WORKBUDDY_CONFIG_DIR || path.join(os.homedir(), '.workbuddy'), 'skills')
      : path.join(os.homedir(), '.agents/skills');
  const skillsDirectory = await canonical(options.skillsDirectory || defaultSkills);
  const metadata = { skillsDirectory, layout: host === 'codex' ? 'bundle' : 'flat' };
  if (host === 'codex') {
    const codex = options.codex || 'codex';
    const cli = args => /\.[cm]?js$/i.test(codex) ? runFile(process.execPath, [codex, ...args]) : runFile(codex, args);
    let current;
    try { current = JSON.parse(await cli(['mcp', 'get', 'openmotion', '--json'])); }
    catch (error) { if (!/No MCP server named ['"]openmotion['"] found/.test(error.message)) throw error; }
    assert(!current || (saved && equalTransport(current.transport, transport)), 'Existing openmotion MCP configuration is not owned by this installation');
    return { host, ...metadata, metadata, connection: current, register: async () => { if (!current) await cli(['mcp', 'add', 'openmotion', '--', process.execPath, launcher]); } };
  }
  if (host === 'claude') {
    const claude = options.claude || 'claude';
    const configFile = await canonical(process.env.CLAUDE_CONFIG_DIR ? path.join(process.env.CLAUDE_CONFIG_DIR, '.claude.json') : path.join(os.homedir(), '.claude.json'));
    const settings = await readJSON(configFile);
    assert(settings === null || (typeof settings === 'object' && !Array.isArray(settings)), 'Invalid Claude configuration');
    assert(settings?.mcpServers === undefined || (settings.mcpServers && typeof settings.mcpServers === 'object' && !Array.isArray(settings.mcpServers)), 'Invalid Claude mcpServers');
    const current = settings?.mcpServers?.openmotion;
    assert(!current || (saved?.configFile === configFile && equalTransport(current, transport)), 'Existing Claude openmotion MCP is not owned by this installation');
    metadata.configFile = configFile;
    return { host, ...metadata, metadata, connection: current && { transport: current }, register: async () => {
      if (!current) await runFile(claude, ['mcp', 'add-json', '-s', 'user', 'openmotion', JSON.stringify(transport)]);
    } };
  }
  if (host === 'workbuddy') {
    const configFile = path.join(await canonical(process.env.WORKBUDDY_CONFIG_DIR || path.join(os.homedir(), '.workbuddy')), 'mcp.json');
    const check = config => {
      assert(config === null || (typeof config === 'object' && !Array.isArray(config)), 'Invalid WorkBuddy configuration');
      assert(config?.mcpServers === undefined || (config.mcpServers && typeof config.mcpServers === 'object' && !Array.isArray(config.mcpServers)), 'Invalid WorkBuddy mcpServers');
      const current = config?.mcpServers?.openmotion;
      assert(!current || (saved?.configFile === configFile && equalTransport(current, transport)), 'Existing WorkBuddy openmotion MCP is not owned by this installation');
    };
    const configured = await readJSON(configFile);
    check(configured); metadata.configFile = configFile;
    return { host, ...metadata, metadata, connection: configured?.mcpServers?.openmotion && { transport: configured.mcpServers.openmotion }, register: async () => {
      await withLock(configFile + '.openmotion.lock', async () => {
        const config = await readJSON(configFile) || {}; check(config);
        await writeJSON(configFile, { ...config, mcpServers: { ...config.mcpServers, openmotion: transport } });
      });
    } };
  }
  const profile = options.profile || 'web';
  assert(/^[a-zA-Z0-9_-]+$/.test(profile), 'Use a simple DeepSeek Harness profile name');
  const dshHome = await canonical(process.env.DSH_HOME || path.join(os.homedir(), '.dsh'));
  const configFile = path.join(dshHome, 'profiles', profile, 'package.json');
  const current = await readJSON(configFile);
  assert(current === null || (typeof current === 'object' && !Array.isArray(current)), 'Invalid Harness package configuration');
  assert(current?.dependencies === undefined || (current.dependencies && typeof current.dependencies === 'object' && !Array.isArray(current.dependencies)), 'Invalid Harness dependencies');
  const bundleDirectory = path.join(home, 'hosts', 'deepseek');
  const dependency = current?.dependencies?.[bundleName];
  const dependencyPath = dependency && /^(file|link):/.test(dependency) ? await canonical(path.resolve(path.dirname(configFile), dependency.replace(/^(file|link):/, ''))) : null;
  assert(!dependency || (saved?.configFile === configFile && dependencyPath === bundleDirectory), 'Existing Harness OpenMotion bundle is not owned by this installation');
  assert(!saved || saved.configFile === configFile, 'This Harness install already targets another profile; use a separate installation for that profile');
  let dsh = options.dsh || 'dsh';
  if (!options.dsh && process.platform === 'darwin') {
    const desktop = '/Applications/DeepSeek Harness.app/Contents/Resources/runtime/cli/bin/dsh';
    try { await access(desktop); dsh = desktop; } catch {}
  }
  metadata.configFile = configFile; metadata.profile = profile; metadata.bundleDirectory = bundleDirectory; metadata.skillsDirectory = path.join(bundleDirectory, 'skills'); metadata.layout = 'deepseek';
  return { host, skillsDirectory: path.join(bundleDirectory, 'skills'), layout: 'deepseek', metadata,
    readConnection: async () => {
      if (!dependency) return null;
      const patch = await readJSON(path.join(bundleDirectory, 'cordis.patch.yml'));
      assert(patch === null || Array.isArray(patch), 'Invalid managed Harness MCP bundle. Run setup for the same host, home and profile to repair it.');
      const configured = patch?.flatMap(item => item.insert || []).find(item => item.id === 'mcp-openmotion')?.config;
      return configured && { transport: { ...configured, type: configured.transport } };
    }, register: async () => {
    await runFile(dsh, ['plugin', '--profile', profile, 'add', bundleDirectory, '--ignore-scripts'], { env: { ...process.env, DSH_HOME: dshHome } });
  }, writeBundle: async (stage, appRoot, version) => {
    await writeJSON(path.join(stage, 'package.json'), { name: bundleName, version, private: true, type: 'module', files: ['cordis.patch.yml'], dsh: { bundle: { patch: './cordis.patch.yml' } } });
    const entries = [{ id: 'mcp-openmotion', name: '@deepseek-ai/dsh-mcp-client', config: { serverName: 'openmotion', transport: 'stdio', command: transport.command, args: transport.args, cwd: home, failOnStartupError: true, toolCallTimeoutMs: 180000 } },
      { id: 'openmotion-skills', name: '@deepseek-ai/dsh-skill-filesystem', config: { providerName: 'openmotion', includeDefaultRoots: false, customSkillDirs: [path.join(bundleDirectory, 'skills')] } }];
    await writeJSON(path.join(stage, 'cordis.patch.yml'), [{ insert: entries }]);
  } };
}

export async function skillTargets(plan, appRoot) {
  if (plan.layout === 'bundle') return [path.join(plan.skillsDirectory, 'openmotion')];
  if (plan.layout === 'deepseek') return [plan.metadata.bundleDirectory];
  return (await readdir(path.join(appRoot, 'skills'), { withFileTypes: true })).filter(entry => entry.isDirectory() && !entry.name.startsWith('.')).map(entry => path.join(plan.skillsDirectory, entry.name));
}

export async function obsoleteSkills(plan, home, targets) {
  if (plan.layout !== 'flat') return [];
  const entries = await readdir(plan.skillsDirectory, { withFileTypes: true }).catch(error => { if (error.code !== 'ENOENT') throw error; return []; });
  const obsolete = [];
  for (const entry of entries) {
    const target = path.join(plan.skillsDirectory, entry.name);
    if (!entry.isDirectory() || entry.name.startsWith('.') || targets.includes(target)) continue;
    let scope;
    try { scope = await readJSON(path.join(target, 'openmotion-install.json')); }
    catch (error) { if (error instanceof SyntaxError) continue; throw error; }
    if (scope?.managedBy === owner && scope.installHome === home && scope.host === plan.host) obsolete.push(target);
  }
  return obsolete;
}

export async function checkSkillOwner(target, home, host, layout) {
  const scope = await readJSON(path.join(target, layout === 'flat' ? 'openmotion-install.json' : 'scope.json'));
  const existing = await readdir(target).catch(error => { if (error.code !== 'ENOENT') throw error; return null; });
  assert(!existing || (scope?.managedBy === owner && scope.installHome === home && (!scope.host || scope.host === host)), 'Existing openmotion Skills are not owned by this installation: ' + target);
  return existing !== null;
}

export async function copyHostSkills(stage, target, appRoot, plan, home, version, dataDirectory) {
  const scope = { managedBy: owner, installHome: home, runtimeRoot: appRoot, version, dataDirectory, host: plan.host };
  if (plan.layout !== 'flat') {
    for (const name of ['skills', 'docs', 'README.md', 'AGENTS.md', 'CLAUDE.md']) await cp(path.join(appRoot, name), path.join(stage, name), { recursive: true });
    await writeJSON(path.join(stage, 'scope.json'), scope);
    if (plan.writeBundle) await plan.writeBundle(stage, appRoot, version);
    return;
  }
  const source = path.join(appRoot, 'skills', path.basename(target));
  await cp(source, stage, { recursive: true });
  await writeJSON(path.join(stage, 'openmotion-install.json'), scope);
  async function rewrite(directory, original) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const filename = path.join(directory, entry.name), originalFile = path.join(original, entry.name);
      if (entry.isDirectory()) await rewrite(filename, originalFile);
      else if (entry.name.endsWith('.md')) {
        const content = await readFile(filename, 'utf8');
        const updated = content.replace(/\]\((\.\.[^)#]+)(#[^)]*)?\)/g, (match, relative, hash = '') => {
          const resolved = path.resolve(path.dirname(originalFile), relative);
          return resolved.startsWith(path.join(appRoot, 'docs') + path.sep) ? '](<' + resolved + hash + '>)' : match;
        });
        if (updated !== content) await writeFile(filename, updated);
      }
    }
  }
  await rewrite(stage, source);
}
