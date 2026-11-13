import { execFileSync, spawnSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { checkDocument } from '../../scripts/check-readme-resources.mjs';
import { validateMediaManifest } from '../../shared/repository-media.ts';

// Only presentation pages qualify; Skills, installation guides and examples are product inputs.
const presentationDocs = new Set([
  'README.md', 'README.zh-CN.md', 'README.REVERSE-ENGINEERING.md',
  'docs/README.md', 'docs/README.zh-CN.md', 'docs/README.ja.md',
]);

export function classifyChanges(files) {
  return {
    full: files.length === 0 || files.some(file => !presentationDocs.has(file)),
    maintainability: files.length === 0 || files.some(file =>
      /\.[cm]?[jt]sx?$/.test(file) || /(?:^|\/)tsconfig(?:\.[^/]+)?\.json$/.test(file)
      || ['package.json', 'package-lock.json'].includes(file) || file.startsWith('.github/maintainability/')
      || file === '.github/workflows/ci.yml'),
    documents: files.filter(file => presentationDocs.has(file)),
  };
}

export function documentationContract(text) {
  const protectedLines = [];
  let fence = '';
  let section = 0;
  for (const line of text.split('\n')) {
    const heading = !fence && line.match(/^(#{1,6})\s+(.*)/);
    if (heading && heading[1].length <= section) section = 0;
    if (heading && /install|setup|quick.?start|安装|快速开始|インストール|セットアップ/i.test(heading[2])) section = heading[1].length;
    const marker = line.match(/^\s*(`{3,}|~{3,})/);
    if (fence || marker || section || /install|setup|\b(?:npm|npx|curl|powershell)\b/i.test(line)) protectedLines.push(line);
    if (marker) {
      if (!fence) fence = marker[1];
      else if (marker[1][0] === fence[0] && marker[1].length >= fence.length) fence = '';
    }
  }
  return protectedLines.join('\n');
}

export async function checkDocs(files) {
  const media = validateMediaManifest(JSON.parse(await readFile('repository-media.json', 'utf8')));
  for (const file of files) {
    if (!presentationDocs.has(file)) throw new Error(`Not a presentation document: ${file}`);
    await checkDocument(file, new Set(media.files.map(entry => entry.url)),
      new Map(media.files.map(entry => [entry.url, entry.bytes])));
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv[2] === '--check-docs') {
    await checkDocs(JSON.parse(process.env.CHANGED_DOCS));
  } else {
    let scope = classifyChanges([]);
    const base = process.env.GITHUB_EVENT_NAME === 'pull_request'
      ? execFileSync('git', ['rev-parse', 'HEAD^1'], { encoding: 'utf8' }).trim()
      : process.env.BASE_SHA;
    if (process.env.GITHUB_EVENT_NAME !== 'workflow_dispatch' && /^[a-f0-9]{40}$/.test(base ?? '') && !/^0+$/.test(base)) {
      const available = spawnSync('git', ['cat-file', '-e', `${base}^{commit}`]).status === 0;
      const files = available ? execFileSync('git', ['diff', '--name-only', '--no-renames', '-z', base, 'HEAD'], { encoding: 'utf8' })
        .split('\0').filter(Boolean) : [];
      scope = classifyChanges(files);
      if (!scope.full) {
        for (const file of scope.documents) {
          const previous = spawnSync('git', ['show', `${base}:${file}`], { encoding: 'utf8' });
          const current = await readFile(file, 'utf8').catch(error => {
            if (error.code === 'ENOENT') return '';
            throw error;
          });
          if (previous.status !== 0 || documentationContract(previous.stdout) !== documentationContract(current)) scope.full = true;
        }
      }
      if (!scope.full) execFileSync('git', ['diff', '--check', base, 'HEAD'], { stdio: 'inherit' });
    }
    for (const [key, value] of Object.entries(scope)) {
      appendFileSync(process.env.GITHUB_OUTPUT, `${key}=${JSON.stringify(value)}\n`);
    }
    console.log(JSON.stringify(scope));
  }
}
