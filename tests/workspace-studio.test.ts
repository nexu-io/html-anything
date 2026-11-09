import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { startWorkspaceStudio } from '../shared/workspace-studio.ts';

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
