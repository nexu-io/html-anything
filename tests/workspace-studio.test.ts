import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, copyFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { startWorkspaceStudio } from '../shared/workspace-studio.ts';
import { request } from 'node:http';
import { fixture } from './fixtures.ts';
import { pluginRoot } from '../hyperframes.ts';

test('Studio rejects decimal uploads above 500 MB before saving and still accepts normal uploads', () => fixture(async store => {
  const studio = await startWorkspaceStudio(pluginRoot, store.directory, store.projectDirectory, 0);
  const url = `${studio.origin}/api/projects/${store.projectId}/upload?dir=assets`;
  const assets = path.join(store.projectDirectory, 'assets');
  const before = await readdir(assets);
  try {
    for (const size of [500_000_001, 500_500_000, 524_288_000]) {
      const response = await new Promise<{ status: number; body: string }>((resolve, reject) => {
        const req = request(url, { method: 'POST', headers: { Origin: studio.origin, 'Content-Length': size, Connection: 'close' } }, res => {
          let body = '';
          res.setEncoding('utf8'); res.on('data', chunk => { body += chunk; });
          res.on('error', reject);
          res.on('end', () => { resolve({ status: res.statusCode!, body }); req.destroy(); });
        });
        req.on('error', reject); req.setTimeout(5000, () => req.destroy(new Error('Upload limit response timed out')));
        req.end();
      });
      assert.equal(response.status, 413);
      assert.equal(JSON.parse(response.body).maxBytes, 500_000_000);
      assert.deepEqual(await readdir(assets), before);
    }
    const form = new FormData();
    form.append('file', new Blob([Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==', 'base64')], { type: 'image/png' }), 'clip.png');
    const response = await fetch(url, { method: 'POST', headers: { Origin: studio.origin }, body: form });
    assert.equal(response.status, 201, await response.clone().text());
    assert.deepEqual((await response.json()).files, ['assets/clip.png']);
    assert.equal((await fetch(studio.origin + '/api/projects')).status, 200);
  } finally { await studio.close(); }
}));

test('the shipped history availability module loads without plugin-local node_modules', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'motion-history-module-'));
  try {
    const module = path.join(root, 'history.ts');
    await copyFile(new URL('../shared/studio-history-availability.ts', import.meta.url), module);
    const detached = await import(pathToFileURL(module).href);
    assert.equal(typeof detached.withAvailableHistorySteps, 'function');
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('workspace host refuses unsupported, missing, ambiguous and incompatible native factories before serving', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'motion-host-contract-'));
  const cli = path.join(root, 'node_modules/hyperframes');
  const manifest = path.join(cli, 'package.json');
  try {
    await mkdir(path.join(cli, 'dist'), { recursive: true });
    const writeVersion = version => writeFile(manifest, JSON.stringify({ name: 'hyperframes', type: 'module', version }));
    await writeVersion('0.9.8');
    await assert.rejects(startWorkspaceStudio(root, root, root, 0), /Unsupported/);
    await writeVersion('0.9.7');
    await assert.rejects(startWorkspaceStudio(root, root, root, 0), /missing or ambiguous/);
    await writeFile(path.join(cli, 'dist/studioServer-first.js'), 'export const other = true;');
    await assert.rejects(startWorkspaceStudio(root, root, root, 0), /factory is unavailable/);
    await writeFile(path.join(cli, 'dist/studioServer-second.js'), 'export const other = true;');
    await assert.rejects(startWorkspaceStudio(root, root, root, 0), /missing or ambiguous/);
  } finally { await rm(root, { recursive: true, force: true }); }
});
