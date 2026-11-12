import test from 'node:test';
import assert from 'node:assert/strict';
import { fixture } from './fixtures.ts';
import { Client } from './shared-editor-client.mjs';
import { editorRequest, readEditor, sharedEditorEnabled } from '../editor-runtime.ts';
import { stat } from 'node:fs/promises';
import path from 'node:path';

test('a stalled native project open times out and releases the other MCP client queue', { skip: !sharedEditorEnabled, timeout: 60_000 }, () => fixture(async store => {
  const clients = [new Client(store.directory), new Client(store.directory)];
  const pause = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  let nativePid: number | undefined, paused = false;
  let opening: Promise<any> | undefined, listing: Promise<any> | undefined;
  try {
    await Promise.all(clients.map(client => client.initialize()));
    const projects = [];
    for (const [i, client] of clients.entries()) {
      const created = await client.call('openmotion_create_project', { requestId: 'timeout-' + i, projectType: 'natural_language', title: 'Project ' + i, requirements: 'Project ' + i });
      projects.push(await client.call('openmotion_open_preview', { projectId: created.projectId }));
    }
    const origin = new URL(projects[0].previewUrl).origin;
    nativePid = (await (await fetch(origin + '/__hyperframes_config')).json()).pid;
    process.kill(nativePid!, 'SIGSTOP'); paused = true;
    assert.ok((await clients[1].call('openmotion_get_project')).projects.some((project: any) => project.id === projects[1].projectId), 'listing must work without the paused native service');
    const started = Date.now();
    opening = clients[0].call('openmotion_open_preview', { projectId: projects[0].projectId }).then(value => ({ value }), error => ({ error }));
    const deadline = Date.now() + 10_000;
    while (!await stat(path.join(store.directory, 'workspace.lock')).catch(() => null)) {
      assert.ok(Date.now() < deadline, 'opening must enter the workspace lock');
      await pause(20);
    }
    listing = clients[1].call('openmotion_get_project');
    const opened = await Promise.race([opening, pause(35_000).then(() => { throw new Error('Native project open exceeded its deadline'); })]);
    assert.match(String(opened.error), /timeout|timed out/i);
    const listed = await Promise.race([listing, pause(2000).then(() => { throw new Error('Other MCP client remains blocked after opening timeout'); })]);
    assert.ok(listed.projects.some((project: any) => project.id === projects[1].projectId));
    console.log(JSON.stringify({ scenario: 'native-opening-timeout', elapsedMs: Date.now() - started, otherClientListedWhileNativePaused: true }));
    process.kill(nativePid!, 'SIGCONT'); paused = false;
    assert.equal((await clients[0].call('openmotion_open_preview', { projectId: projects[0].projectId })).projectId, projects[0].projectId, 'opening can be retried after native recovery');
  } finally {
    if (paused) process.kill(nativePid!, 'SIGCONT');
    await Promise.allSettled([opening, listing]);
    await Promise.all(clients.map(client => client.close()));
  }
}, false));

test('real phase1 MCP clients share one editor while retaining explicit projects and conflict protection', { skip: !sharedEditorEnabled, timeout: 90_000 }, () => fixture(async store => {
  const clients = Array.from({ length: 3 }, () => new Client(store.directory));
  try {
    await Promise.all(clients.map(client => client.initialize()));
    const a = await clients[0].call('openmotion_create_project', { requestId: 'shared-a', projectType: 'natural_language', title: 'A', requirements: 'Project A' });
    const b = await clients[1].call('openmotion_create_project', { requestId: 'shared-b', projectType: 'natural_language', title: 'B', requirements: 'Project B' });
    const openedB = await clients[1].call('openmotion_open_preview', { projectId: b.projectId });
    const authority = (await readEditor(store.directory))!;
    const initial = await editorRequest(authority, '/editor-api/health');
    const currentA = await clients[0].call('openmotion_get_project', { projectId: a.projectId });
    const saved = await clients[0].call('openmotion_edit_project', { projectId: a.projectId, requestId: 'write-a', expectedRevision: currentA.revision, expectedVersionId: currentA.currentVersionId, files: [{ path: 'only-a.txt', content: 'owned by A' }] });
    const currentB = await clients[1].call('openmotion_get_project', { projectId: b.projectId });
    assert.equal(currentB.revision, openedB.revision);
    assert.ok(!currentB.project.files.some((file: any) => file.path === 'only-a.txt'));
    await assert.rejects(clients[2].call('openmotion_open_preview'), /PROJECT_NOT_BOUND/);
    assert.equal((await clients[0].call('openmotion_open_preview')).projectId, a.projectId);
    const sameA = await clients[2].call('openmotion_get_project', { projectId: a.projectId });
    const results = await Promise.allSettled([0, 2].map((i, j) => clients[i].call('openmotion_edit_project', { projectId: a.projectId, requestId: 'race-' + j, expectedRevision: sameA.revision, expectedVersionId: sameA.currentVersionId, files: [{ path: 'race.txt', content: String(j) }] })));
    assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
    assert.match(String((results.find(result => result.status === 'rejected') as PromiseRejectedResult).reason), /VERSION_CONFLICT/);
    const next = await clients[0].call('openmotion_get_project', { projectId: a.projectId });
    assert.ok((await clients[0].call('openmotion_list_versions', { projectId: a.projectId })).versions.some((version: any) => version.versionId === saved.version.versionId));
    assert.equal((await editorRequest(authority, '/editor-api/health')).instanceId, initial.instanceId);
    await Promise.all(clients.map(client => client.close()));
    const resumed = new Client(store.directory); clients.push(resumed); await resumed.initialize();
    assert.equal((await resumed.call('openmotion_get_project', { projectId: a.projectId })).revision, next.revision);
    assert.equal((await editorRequest(authority, '/editor-api/health')).instanceId, initial.instanceId);
  } finally { await Promise.all(clients.map(client => client.close())); }
}, false));
