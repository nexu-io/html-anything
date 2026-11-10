import test from 'node:test';
import assert from 'node:assert/strict';
import { cp, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { startServer } from '../server.ts';
import { fixture } from './fixtures.ts';

test('one native service keeps both projects editable, scoped and recoverable after restart', { timeout: 120_000 }, () => fixture(async store => {
  const a = store.projectId, b = crypto.randomUUID();
  await cp(store.projectDirectory, store.projectDirectoryFor(b), { recursive: true });
  await store.selectProject(b, { id: b, title: 'Second' });
  await store.selectProject(a);
  let running = await startServer(store, 0);
  const base = () => `http://127.0.0.1:${(running.server.address() as { port: number }).port}`;
  const source = async (id: string) => {
    const response = await fetch(`${base()}/api/projects/${id}/files/index.html`);
    assert.equal(response.status, 200, await response.clone().text());
    return response.json();
  };
  const open = async (id: string) => {
    const current = await store.status();
    const response = await fetch(`${base()}/motion-api/projects/${id}/open`, { method: 'POST', headers: { Origin: base(), 'Content-Type': 'application/json' }, body: JSON.stringify({ expectedRevision: current.revision, expectedProjectId: current.projectId }) });
    assert.equal(response.status, 200, await response.clone().text());
  };
  const call = async (name: string, args: Record<string, unknown>) => {
    const response = await fetch(`${base()}/motion-api/phase1/call`, {
      method: 'POST', headers: { Origin: base(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, arguments: args }),
    });
    assert.equal(response.status, 200, await response.clone().text());
    return response.json();
  };
  try {
    const initialStudio = running.studio, initialIdentity = await (await fetch(new URL('/__hyperframes_config', initialStudio.url))).json();
    const fileA = await source(a);
    await open(b);
    assert.equal(running.studio.url, initialStudio.url, 'opening B must retain the same native service');
    assert.ok(initialStudio.alive(), 'opening B must not close A service');
    const identity = await (await fetch(new URL('/__hyperframes_config', running.studio.url))).json();
    assert.equal(identity.pid, initialIdentity.pid);
    assert.equal((await fetch(new URL('/api/events', initialStudio.url))).status, 400, 'unbound multi-project events cannot choose a recent project');
    assert.equal((await fetch(`${base()}/api/projects/${a}/files/index.html?projectId=${b}`)).status, 400, 'conflicting identities must be rejected');
    assert.equal((await fetch(new URL(`/api/projects/${a}/files/blocked.txt`, initialStudio.url), { method: 'PUT', headers: { Origin: 'http://foreign.example', 'If-None-Match': '*' }, body: 'blocked' })).status, 403);
    assert.equal((await source(a)).content, fileA.content);
    const files = await Promise.all([a, b].map(source));
    await Promise.all([a, b].map(async (id, i) => {
      const response = await fetch(`${base()}/api/projects/${id}/files/notes.txt`, { method: 'PUT', headers: { Origin: base(), 'If-None-Match': '*' }, body: `Owned by ${id}` });
      assert.equal(response.status, 200, await response.clone().text());
      const status = await (await fetch(`${base()}/motion-api/project/status?projectId=${id}`)).json();
      assert.equal(status.projectId, id, 'status must resolve the requested project');
      const preview = await fetch(`${base()}/api/projects/${id}/preview`);
      assert.equal(preview.status, 200, await preview.clone().text());
      assert.match(await preview.text(), /data-composition-id/);
      assert.equal(await readFile(path.join(store.projectDirectoryFor(id), 'notes.txt'), 'utf8'), `Owned by ${id}`);
    }));
    const writes = await Promise.all([0, 1].map(i => fetch(`${base()}/api/projects/${a}/files/index.html`, { method: 'PUT', headers: { Origin: base(), 'If-Match': files[0].version }, body: files[0].content.replace('<title>', `<title>Writer ${i} `) })));
    assert.deepEqual(writes.map(response => response.status).sort(), [200, 409], 'same-project stale writes remain protected');
    assert.equal((await source(b)).content, files[1].content, 'B source must remain untouched');
    for (const id of [a, b]) {
      const history = await fetch(`${base()}/api/projects/${id}/history`);
      assert.equal(history.status, 200, await history.clone().text());
      const project = await call('motion_get_project', { projectId: id });
      const edit = await call('motion_edit_project', {
        projectId: id, requestId: crypto.randomUUID(), expectedRevision: project.revision,
        expectedVersionId: project.currentVersionId, presentation: 'background',
        files: [{ path: 'agent-notes.txt', content: `Edited in ${id}` }],
      });
      assert.equal(edit.changed, true);
      assert.equal(await readFile(path.join(store.projectDirectoryFor(id), 'agent-notes.txt'), 'utf8'), `Edited in ${id}`);
    }
    for (const id of [crypto.randomUUID(), '..%2Fescape']) {
      assert.ok([400, 404].includes((await fetch(`${base()}/api/projects/${id}/files/index.html`)).status));
      assert.equal((await fetch(`${base()}/motion-api/project/status?projectId=${id}`)).status, 400);
    }
    await running.close();
    running = await startServer(store, 0);
    assert.match((await source(a)).content, /Writer [01]/);
    assert.equal((await source(b)).content, files[1].content);
  } finally { await running.close(); }
}));

test('file notification streams remain attached to their own project', { timeout: 45_000 }, () => fixture(async store => {
  const a = store.projectId, b = crypto.randomUUID();
  await cp(store.projectDirectory, store.projectDirectoryFor(b), { recursive: true });
  await store.selectProject(b, { id: b, title: 'B' });
  const running = await startServer(store, 0), origin = `http://127.0.0.1:${(running.server.address() as { port: number }).port}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20_000);
  try {
    const pending = fetch(`${origin}/api/events?projectId=${a}`, { signal: controller.signal });
    // Native SSE sends headers with the first file event.
    const trigger = setInterval(() => { void writeFile(path.join(store.projectDirectoryFor(a), 'only-a.txt'), String(Date.now())); }, 250);
    try {
      const response = await pending; assert.equal(response.status, 200);
      const { value } = await response.body!.getReader().read();
      const event = new TextDecoder().decode(value);
      assert.match(event, new RegExp(`"projectId":"${a}"`));
      assert.doesNotMatch(event, new RegExp(`"projectId":"${b}"`));
    } finally { clearInterval(trigger); }
  } finally { clearTimeout(timer); controller.abort(); await running.close(); }
}));

test('a cold bookmark opens its named project without stamping another selected project', { timeout: 30_000 }, () => fixture(async store => {
  const a = store.projectId, b = crypto.randomUUID();
  await cp(store.projectDirectory, store.projectDirectoryFor(b), { recursive: true });
  await store.selectProject(b, { id: b, title: 'B' });
  const bFile = path.join(store.projectDirectoryFor(b), 'index.html');
  const beforeB = await readFile(bFile, 'utf8');
  const running = await startServer(store, 0, { editor: false });
  const origin = `http://127.0.0.1:${(running.server.address() as { port: number }).port}`;
  try {
    assert.equal((await fetch(`${origin}/?project=${crypto.randomUUID()}`)).status, 200);
    assert.equal(running.studio, undefined, 'an invalid bookmark must not open another project');
    assert.equal((await fetch(`${origin}/#project/${a}`)).status, 200);
    assert.equal(running.studio, undefined, 'a hash-only bookmark must wait for the client to bind its project');
    const opened = await fetch(`${origin}/motion-api/preview/open?projectId=${a}`, { method: 'POST', headers: { Origin: origin } });
    assert.equal(opened.status, 200, await opened.clone().text());
    const preview = await opened.json();
    assert.equal(preview.projectId, a);
    assert.equal(new URL(preview.studioUrl).hash, `#project/${a}`);
    assert.equal((await fetch(`${origin}/?project=${a}#project/${a}`)).status, 200);
    assert.equal(await readFile(bFile, 'utf8'), beforeB, 'opening A must not stamp B source');
    assert.equal((await fetch(`${origin}/api/projects/${a}/files/index.html`)).status, 200);
    assert.equal(store.projectCatalog().activeId, b, 'bookmark must not replace the remembered project');
  } finally { await running.close(); }
}));
