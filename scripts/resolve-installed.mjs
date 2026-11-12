import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

export function resolveInstalled(projectRoot, codexDirectory = process.env.CODEX_HOME || path.join(os.homedir(), '.codex')) {
  const version = JSON.parse(fs.readFileSync(path.join(projectRoot, '.codex-plugin/plugin.json'), 'utf8')).version;
  const caches = ['openmotion-local/openmotion', 'openmotion-test/openmotion', 'motion-local/motion'].map(name => path.join(codexDirectory, 'plugins/cache', name));
  for (const candidate of caches.flatMap(cache => [path.join(cache, version), path.join(cache, 'local')])) {
    try {
      const manifest = JSON.parse(fs.readFileSync(path.join(candidate, '.codex-plugin/plugin.json'), 'utf8'));
      if (['openmotion', 'motion'].includes(manifest.name) && manifest.version === version && fs.existsSync(path.join(candidate, 'server.ts'))) return candidate;
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  throw new Error(`未找到 OpenMotion ${version} 的已安装副本，请先安装该版本。`);
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { console.log(resolveInstalled(process.argv[2] || fileURLToPath(new URL('../', import.meta.url)))); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
