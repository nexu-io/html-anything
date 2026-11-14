import { isMain } from '../shared/entry.ts';
import { readFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { distributionFiles, requireDownloadedMedia } from './distribution.ts';
import { zip } from './zip.mjs';
export { zip } from './zip.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
async function main() {
  const { packageTemplateConfig } = await import('../shared/template-config.ts');
  const { releaseProfile } = await import('../shared/mcp-registry.ts');
  const flags = process.argv.slice(2);
  if (flags.length > 2 || flags.some(flag => !/^--(?:mcp-profile=(?:legacy|phase1)|template-env=(?:dev|prod))$/.test(flag))) throw new Error('Usage: package.ts [--mcp-profile=legacy|phase1] [--template-env=dev|prod]');
  const profile = flags.find(flag => flag.startsWith('--mcp-profile='))?.split('=')[1] ?? releaseProfile;
  const templateConfig = packageTemplateConfig(flags.find(flag => flag.startsWith('--template-env='))?.split('=')[1]);
  const { mcpRegistry } = await import('../mcp.ts');
  const registry = mcpRegistry(profile);
  const { checkTemplateCardsBuild } = await import('./build-template-cards.mjs');
  await checkTemplateCardsBuild();
  const { loadTemplatePresentation } = await import('../shared/mcp-template-recommendations.ts');
  // Raw packaging must not turn optional runtime degradation into a release.
  loadTemplatePresentation();
  const { check } = await import('./check.ts');
  await check();
  const manifest = JSON.parse(await readFile(path.join(root, '.codex-plugin/plugin.json'), 'utf8'));
  const files = await distributionFiles(profile);
  await requireDownloadedMedia(files);
  let commit: string | null;
  try { commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); }
  catch { commit = JSON.parse(await readFile(path.join(root, 'shared/build-info.json'), 'utf8')).commit; }
  const overrides: Record<string, unknown> = { 'shared/mcp-release.json': { profile }, 'shared/template-config.json': templateConfig,
    'shared/build-info.json': { commit } };
  const entries = await Promise.all(files.sort().map(async file => ({ name: manifest.name + '/' + file,
    data: overrides[file] ? Buffer.from(JSON.stringify(overrides[file], null, 2) + '\n') : await readFile(path.join(root, file)) })));
  await mkdir(path.join(root, 'dist'), { recursive: true });
  const output = `dist/${manifest.name}-${manifest.version}${profile === 'legacy' ? '' : '-' + profile}${templateConfig.environment === 'dev' ? '-dev' : ''}.zip`;
  await (await import('node:fs/promises')).writeFile(path.join(root, output), zip(entries));
  console.log(`${output}: ${entries.length} files, templates ${templateConfig.environment}, MCP ${profile}: ${registry.tools.length} tools (no personal media or native executables).`);
}
if (isMain(import.meta.url)) await main();
