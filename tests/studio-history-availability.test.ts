import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rename, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createStudioApi, openProjectHistory } from '@hyperframes/studio-server';
import type { ProjectHistory, StudioApiAdapter } from '@hyperframes/studio-server';
import { withAvailableHistorySteps } from '../shared/studio-history-availability.ts';

const who = { kind: 'person' as const, name: 'You' };

async function fixture(run: (context: {
  dir: string; root: string; history: ProjectHistory; offered: ProjectHistory; api: ReturnType<typeof createStudioApi>;
}) => Promise<void>, budgetBytes?: number) {
  const root = await mkdtemp(path.join(tmpdir(), 'motion-history-availability-'));
  const dir = path.join(root, 'project');
  await mkdir(dir);
  await writeFile(path.join(dir, 'index.html'), 'A');
  await writeFile(path.join(dir, 'clip.mp4'), 'original media');
  const history = await openProjectHistory({ projectDir: dir, historyRoot: root, budgetBytes });
  try {
    await history.flush();
    const offered = withAvailableHistorySteps(history, root);
    const api = createStudioApi({ listProjects: () => [], resolveProject: () => ({ id: 'demo', dir }),
      history: () => offered } as unknown as StudioApiAdapter);
    await run({ dir, root, history, offered, api });
  } finally {
    await history.close();
    await rm(root, { recursive: true, force: true });
  }
}

test('an unavailable media undo is omitted from the native view while execution still refuses it safely', () => fixture(async ({ dir, history, api }) => {
  const window = await history.beginWindow(who, 'Overwrite media');
  await writeFile(path.join(dir, 'clip.mp4'), 'replacement media');
  const entry = await window.close();
  assert.ok(entry);
  assert.equal(history.next('back', who)?.id, entry.id);
  const view = await (await api.request('/projects/demo/history')).json();
  assert.equal(view.back, null);
  assert.equal(view.entries.at(-1).id, entry.id, 'unavailable entries remain visible in version history');
  const response = await api.request('/projects/demo/history/step', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ direction: 'back' }) });
  assert.equal(response.status, 409);
  assert.match((await response.json()).error, /earlier version.*not kept/);
  assert.equal(await readFile(path.join(dir, 'clip.mp4'), 'utf8'), 'replacement media');
}));

test('text edits, pending edits and media-reference changes remain undoable and redoable', () => fixture(async ({ dir, history, offered }) => {
  await writeFile(path.join(dir, 'index.html'), '<video src="clip.mp4"></video>');
  await history.claim(who, 'Switch reference', ['index.html'], { coalesceKey: 'pending', idleMs: 60_000 });
  assert.equal(history.list().length, 0);
  assert.ok(offered.next('back', who));
  await history.checkpoint();
  assert.ok((await offered.step('back', who)).ok);
  assert.ok(offered.next('forward', who));
  assert.ok((await offered.step('forward', who)).ok);
  assert.equal(await readFile(path.join(dir, 'index.html'), 'utf8'), '<video src="clip.mp4"></video>');
}));

test('undoing a newly added media file preserves its redo through aside, and missing redo bytes disable it', () => fixture(async ({ dir, root, history, offered }) => {
  const window = await history.beginWindow(who, 'Add media');
  await writeFile(path.join(dir, 'new.mp4'), 'new media');
  const entry = await window.close();
  assert.ok(entry);
  assert.ok(offered.next('back', who));
  assert.ok((await offered.step('back', who)).ok);
  assert.ok(offered.next('forward', who));
  assert.ok((await offered.step('forward', who)).ok);
  assert.equal(await readFile(path.join(dir, 'new.mp4'), 'utf8'), 'new media');
  await offered.step('back', who);
  const hash = entry.files.find(file => file.path === 'new.mp4')!.after!;
  await rm(path.join(root, history.projectId, 'aside', hash.slice(0, 2), hash));
  assert.ok(history.next('forward', who));
  assert.equal(offered.next('forward', who), undefined);
}));

test('a later writer changing the same file disables the conflicting step', () => fixture(async ({ dir, history, offered }) => {
  const first = await history.beginWindow(who, 'Person edit');
  await writeFile(path.join(dir, 'index.html'), 'B'); await first.close();
  const agent = await history.beginWindow({ kind: 'agent', name: 'Agent' }, 'Agent edit');
  await writeFile(path.join(dir, 'index.html'), 'C'); await agent.close();
  assert.ok(history.next('back', who));
  assert.equal(offered.next('back', who), undefined);
}));

test('media renames remain available because undo and redo can set the moved file aside first', () => fixture(async ({ dir, history, offered }) => {
  const window = await history.beginWindow(who, 'Rename media');
  await rename(path.join(dir, 'clip.mp4'), path.join(dir, 'renamed.mp4'));
  await window.close();
  assert.ok(offered.next('back', who));
  await offered.step('back', who);
  assert.equal(await readFile(path.join(dir, 'clip.mp4'), 'utf8'), 'original media');
  assert.ok(offered.next('forward', who));
  await offered.step('forward', who);
  assert.equal(await readFile(path.join(dir, 'renamed.mp4'), 'utf8'), 'original media');
}));

test('a pruned history has no offered undo or redo', () => fixture(async ({ dir, history, offered }) => {
  const window = await history.beginWindow(who, 'Oversized edit');
  await writeFile(path.join(dir, 'index.html'), 'B'); await window.close();
  assert.equal(history.list().length, 0);
  assert.equal(offered.next('back', who), undefined);
  assert.equal(offered.next('forward', who), undefined);
}, 0));
