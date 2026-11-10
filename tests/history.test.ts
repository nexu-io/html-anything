import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { startServer } from '../server.ts';
import { fixture } from './fixtures.ts';

test('the workspace Studio host hides an unrecoverable media step and retains native write validation', { timeout: 60_000 }, () => fixture(async store => {
  const file = path.join(store.projectDirectory, 'clip.mp4');
  await writeFile(file, 'original media');
  const running = await startServer(store, 0);
  const address = running.server.address(); assert.ok(address && typeof address !== 'string');
  const base = `http://127.0.0.1:${address.port}`;
  const request = (action = '', body?: object) => fetch(`${base}/api/projects/project/history${action}`, {
    ...(body ? { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: base }, body: JSON.stringify(body) } : {}),
  });
  try {
    assert.equal((await request()).status, 200);
    await writeFile(file, 'replacement media');
    assert.equal((await request('/checkpoint', {})).status, 200);
    const view = await (await request()).json();
    assert.ok(view.entries.some(entry => entry.files.some(file => file.path === 'clip.mp4')));
    assert.equal(view.back, null);
    assert.equal(view.forward, null);
    assert.equal((await request('/step', { direction: 'back' })).status, 409);
    assert.equal(await readFile(file, 'utf8'), 'replacement media');
  } finally { await running.close(); }
}));

test('native history retains pinned versions across restart and restores without losing later edits', { timeout: 60_000 }, () => fixture(async store => {
  let running = await startServer(store, 0);
  let base = '';
  const connect = () => {
    const address = running.server.address(); assert.ok(address && typeof address !== 'string');
    base = `http://127.0.0.1:${address.port}`;
  };
  const request = async (action = '', body?: object) => {
    const response = await fetch(`${base}/api/projects/project/history${action}`, {
      ...(body ? { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: base }, body: JSON.stringify(body) } : {}),
    });
    assert.equal(response.status, 200, await response.clone().text());
    return response.json();
  };
  connect();
  try {
    await request(); // Establish the native history baseline before any edit.
    await store.writeFiles((await store.get()).revision, [{ path: 'version-check.txt', content: 'first version' }]);
    await request('/checkpoint', {});
    const first = (await request()).entries.at(-1); assert.ok(first);
    await request('/pin', { entryId: first.id, pinned: true });
    await store.writeFiles((await store.get()).revision, [{ path: 'version-check.txt', content: 'second version' }]);
    await request('/checkpoint', {});
    const second = (await request()).entries.at(-1); assert.notEqual(second.id, first.id);
    await running.close();
    running = await startServer(store, 0); connect();
    assert.equal((await request()).entries.find(entry => entry.id === first.id).pinned, true);
    await request('/restore', { point: first.id });
    assert.equal((await store.readFile('version-check.txt')).content, 'first version');
    const restored = await request();
    assert.ok(restored.entries.some(entry => entry.id === second.id));
    assert.equal(restored.entries.at(-1).restoredTo, first.id);
    await request('/step', { direction: 'back' });
    assert.equal((await store.readFile('version-check.txt')).content, 'second version');
  } finally { await running.close(); }
}));
