import test from 'node:test';
import assert from 'node:assert/strict';
import { fixture } from './fixtures.ts';
import { Phase1Service } from '../phase1.ts';
import { pluginRoot } from '../hyperframes.ts';
import { rpc } from '../mcp.ts';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { cancelExport } from '../server.ts';
import path from 'node:path';
import { createHash } from 'node:crypto';

function api(store: any) { return new Phase1Service(store, pluginRoot, {
  origin: () => 'http://127.0.0.1:4173', nativeUrl: () => undefined,
  openProject: async () => {}, mutation: async task => task(), cancel: (projectId, jobId) => cancelExport(store, projectId, jobId),
}); }
test('a creation round is queryable and idempotent before a film exists', () => fixture(async store => {
  const service = api(store);
  const project = await service.call('openmotion_create_project', { requestId: 'create', projectType: 'natural_language', title: 'Inline film', requirements: '静音短片' });
  const args = { action: 'begin', projectId: project.projectId, requestId: 'round-one', mode: 'create' };
  const started = await service.call('openmotion_open_preview', args);
  assert.equal(started.inlineWork.state, 'authoring');
  assert.equal(started.inlineWork.mode, 'create');
  assert.equal(started.inlineWork.versionId, project.version.versionId);
  const replay = await service.call('openmotion_open_preview', args);
  assert.equal(replay.inlineWork.id, started.inlineWork.id);
  const read = await service.call('openmotion_get_project', { projectId: project.projectId, workId: started.inlineWork.id });
  assert.equal(read.inlineWork.id, started.inlineWork.id);
  assert.equal(read.inlineWork.playable, false);
  await assert.rejects(service.call('openmotion_open_preview', { ...args, mode: 'modify' }), /REQUEST_ID_CONFLICT/);
}, false));

test('a lost save or render reply recovers the work binding after restart without replaying effects', () => fixture(async store => {
  let service = api(store);
  const p = await service.call('openmotion_create_project', { requestId: 'create', projectType: 'natural_language', title: 'Recovery film', requirements: '静音短片' });
  const { inlineWork: work } = await service.call('openmotion_open_preview', { action: 'begin', projectId: p.projectId, requestId: 'begin', mode: 'create' });
  const workFile = path.join(store.directory, 'phase1', 'work', work.id + '.json');
  const edit = { projectId: p.projectId, workId: work.id, requestId: 'save', expectedRevision: p.revision, expectedVersionId: p.version.versionId, files: [{ path: 'note.txt', content: 'saved before interruption' }] };
  async function interrupt(requestId: string, before: string) {
    // Persistence-boundary fault: the source/job exists, its reply journal and work observation were not committed.
    const file = path.join(store.directory, 'phase1', 'requests', createHash('sha256').update(requestId).digest('hex') + '.json');
    const record = JSON.parse(await readFile(file, 'utf8')); delete record.result; record.state = 'pending';
    await writeFile(file, JSON.stringify(record)); await writeFile(workFile, before); service = api(store);
  }
  const beforeSave = await readFile(workFile, 'utf8');
  const saved = await service.call('openmotion_edit_project', edit); await interrupt('save', beforeSave);
  assert.equal((await service.call('openmotion_edit_project', edit)).version.versionId, saved.version.versionId);
  assert.equal((await service.call('openmotion_get_project', { projectId: p.projectId, workId: work.id })).inlineWork.versionId, saved.version.versionId);
  const request = { projectId: p.projectId, workId: work.id, requestId: 'export', expectedRevision: saved.revision, versionId: saved.version.versionId, audio: 'silent' };
  const beforeRender = await readFile(workFile, 'utf8');
  const queued = await service.call('openmotion_export_request', request); await interrupt('export', beforeRender);
  assert.equal((await service.call('openmotion_export_request', request)).job.id, queued.job.id);
  assert.equal((await service.call('openmotion_get_project', { projectId: p.projectId, workId: work.id })).inlineWork.jobId, queued.job.id);
  assert.equal((await service.call('openmotion_list_versions', { projectId: p.projectId })).versions.length, 2);
}, false));

test('a queued cancellation becomes terminal in the same round and never enables playback', () => fixture(async store => {
  const service = api(store);
  const p = await service.call('openmotion_create_project', { requestId: 'create', projectType: 'natural_language', title: 'Cancel film', requirements: '静音短片' });
  const { inlineWork: work } = await service.call('openmotion_open_preview', { action: 'begin', projectId: p.projectId, requestId: 'begin', mode: 'create' });
  const queued = await service.call('openmotion_export_request', { projectId: p.projectId, workId: work.id, requestId: 'export', versionId: p.version.versionId, expectedRevision: p.revision, audio: 'silent' });
  await service.call('openmotion_export_cancel', { projectId: p.projectId, requestId: 'cancel', jobId: queued.job.id });
  const view = (await service.call('openmotion_get_project', { projectId: p.projectId, workId: work.id })).inlineWork;
  assert.equal(view.state, 'cancelled'); assert.equal(view.playable, false);
}, false));

test('the final UI declares embedded media without binding editor calls to a component', () => fixture(async store => {
  const list: any = await rpc({ jsonrpc: '2.0', id: 1, method: 'tools/list' }, store);
  const preview = list.result.tools.find((tool: any) => tool.name === 'openmotion_open_preview');
  assert.equal(preview._meta, undefined);
  const resource: any = await rpc({ jsonrpc: '2.0', id: 2, method: 'resources/read', params: { uri: 'ui://openmotion/inline-video/v1/player.html' } }, store);
  assert.deepEqual(resource.result.contents[0]._meta.ui.csp.resourceDomains, ['data:', 'blob:']);
  assert.match(resource.result.contents[0].mimeType, /profile=mcp-app/);
  assert.ok(resource.result.contents[0].text.includes('openmotion_get_project'));
  assert.deepEqual(await readdir(store.directory), []);
}, false));

test('a rejected save reports a failed round without changing the project', () => fixture(async store => {
  const service = api(store);
  const p = await service.call('openmotion_create_project', { requestId: 'create', projectType: 'natural_language', title: 'Inline film', requirements: '静音短片' });
  const { inlineWork: work } = await service.call('openmotion_open_preview', { action: 'begin', projectId: p.projectId, requestId: 'begin', mode: 'create' });
  await assert.rejects(service.call('openmotion_edit_project', { projectId: p.projectId, workId: work.id, requestId: 'bad-save', expectedRevision: p.revision, expectedVersionId: p.version.versionId, files: [{ path: '../outside.html', content: 'invalid' }] }));
  assert.equal((await service.call('openmotion_get_project', { projectId: p.projectId })).revision, p.revision);
  const failed = (await service.call('openmotion_get_project', { projectId: p.projectId, workId: work.id })).inlineWork;
  assert.equal(failed.state, 'failed'); assert.equal(failed.playable, false); assert.ok(failed.error);
}, false));

test('project ownership is checked before writes and silence becomes unconfirmed', t => fixture(async store => {
  const service = api(store);
  const create = (requestId: string) => service.call('openmotion_create_project', { requestId, projectType: 'natural_language', title: requestId, requirements: '静音短片' });
  const first = await create('first'), other = await create('other');
  const { inlineWork: work } = await service.call('openmotion_open_preview', { action: 'begin', projectId: first.projectId, requestId: 'begin', mode: 'create' });
  await assert.rejects(service.call('openmotion_edit_project', { projectId: other.projectId, workId: work.id, requestId: 'wrong-project', expectedRevision: other.revision, expectedVersionId: other.version.versionId, files: [{ path: 'note.txt', content: 'wrong' }] }), /WORK_NOT_FOUND/);
  assert.equal((await service.call('openmotion_get_project', { projectId: other.projectId })).revision, other.revision);
  t.mock.method(Date, 'now', () => work.updatedAt + 120_001);
  const view = await service.call('openmotion_get_project', { projectId: first.projectId, workId: work.id });
  assert.equal(view.inlineWork.state, 'unconfirmed');
  assert.equal(view.inlineWork.playable, false);
}, false));

test('saving updates the round version without completing it, then an export freezes that round', () => fixture(async store => {
  const service = api(store);
  const p = await service.call('openmotion_create_project', { requestId: 'create', projectType: 'natural_language', title: 'Inline film', requirements: '静音短片' });
  const { inlineWork: work } = await service.call('openmotion_open_preview', { action: 'begin', projectId: p.projectId, requestId: 'begin', mode: 'create' });
  const edit = { projectId: p.projectId, workId: work.id, requestId: 'save', expectedRevision: p.revision, expectedVersionId: p.version.versionId, files: [{ path: 'note.txt', content: 'round one' }] };
  const saved = await service.call('openmotion_edit_project', edit);
  let view = await service.call('openmotion_get_project', { projectId: p.projectId, workId: work.id });
  assert.equal(view.inlineWork.state, 'saved');
  assert.equal(view.inlineWork.playable, false);
  assert.equal(view.inlineWork.versionId, saved.version.versionId);
  const request = { projectId: p.projectId, workId: work.id, requestId: 'render', expectedRevision: saved.revision, versionId: saved.version.versionId, audio: 'silent' };
  const queued = await service.call('openmotion_export_request', request);
  view = await service.call('openmotion_get_project', { projectId: p.projectId, workId: work.id });
  assert.equal(view.inlineWork.jobId, queued.job.id);
  assert.equal(view.inlineWork.state, 'queued');
  assert.equal((await service.call('openmotion_export_request', request)).job.id, queued.job.id);
  await service.call('openmotion_edit_project', edit); // Lost save reply may be safely replayed after submission.
  view = await service.call('openmotion_get_project', { projectId: p.projectId, workId: work.id });
  assert.equal(view.inlineWork.jobId, queued.job.id);
  await assert.rejects(service.call('openmotion_edit_project', { ...edit, requestId: 'late-write' }), /WORK_CLOSED/);
}, false));
