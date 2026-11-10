import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const [runtimeRoot, directory] = process.argv.slice(2);
if (!runtimeRoot || !directory) throw new Error('Usage: node scripts/lint-project.mjs RUNTIME_ROOT PROJECT_DIRECTORY');
const coreRoot = path.resolve(runtimeRoot, 'node_modules/@hyperframes/core');
const core = JSON.parse(await readFile(path.join(coreRoot, 'package.json'), 'utf8'));
const { lintProject } = await import(pathToFileURL(path.join(coreRoot, core.exports['./lint'].import)).href);
const checked = await lintProject(path.resolve(directory), undefined, { host: 'studio' });
const result = { ok: checked.totalErrors === 0, errorCount: checked.totalErrors, warningCount: checked.totalWarnings,
  infoCount: checked.totalInfos, findings: checked.results.flatMap(entry => entry.result.findings), filesScanned: checked.results.length };
process.stdout.write(JSON.stringify(result) + '\n');
process.exitCode = result.ok ? 0 : 1;
