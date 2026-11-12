import test from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdir, mkdtemp, readFile, realpath, rename, rm, symlink, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { editorRequest, readEditor, sharedEditorEnabled } from '../editor-runtime.ts';
import { pluginRoot } from '../hyperframes.ts';
import { closeFixtureEditor, copyRuntimeFixture } from './fixtures.ts';

const pause = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

test('one stdio connection exports across a compatible plugin update and an idle backend replacement', { skip: !sharedEditorEnabled, timeout: 240_000 }, async () => {
  const temporary = await realpath(await mkdtemp(path.join(tmpdir(), 'motion-mcp-upgrade-')));
  const app = path.join(temporary, 'app'), replacement = path.join(temporary, 'replacement'), data = path.join(temporary, 'data');
  const clients: any[] = [], observations: any[] = [];
  const evidence = process.env.OPENMOTION_UPGRADE_EVIDENCE;
  async function copyRuntime(target: string) {
    await copyRuntimeFixture(target);
    await mkdir(path.join(target, 'studio'));
    await symlink(path.join(pluginRoot, 'studio/build'), path.join(target, 'studio/build'), 'dir');
  }
  async function waitJob(client: any, projectId: string, jobId: string) {
    for (let i = 0; i < 360; i++) {
      const job = (await client.call('openmotion_get_project', { projectId, exportJobId: jobId })).exportJob;
      assert.ok(!['failed', 'cancelled'].includes(job.state), JSON.stringify(job));
      if (job.state === 'completed') {
        assert.equal(job.verification.status, 'passed', JSON.stringify(job.verification));
        return job;
      }
      await pause(250);
    }
    assert.fail('export did not complete');
  }
  try {
    await copyRuntime(app); await copyRuntime(replacement);
    const pkg = JSON.parse(await readFile(path.join(replacement, 'package.json'), 'utf8'));
    pkg.version = '0.6.4';
    await writeFile(path.join(replacement, 'package.json'), JSON.stringify(pkg));
    const runtimeFile = path.join(replacement, 'editor-runtime.ts');
    await writeFile(runtimeFile, await readFile(runtimeFile, 'utf8') + '\n// Compatible upgrade fixture.\n');
    const { Client } = await import(pathToFileURL(path.join(app, 'tests/shared-editor-client.mjs')).href);
    const old = new Client(data); clients.push(old); await old.initialize();
    const pid = old.child.pid;
    const project = await old.call('openmotion_create_project', { requestId: 'create-a', projectType: 'natural_language', title: 'Upgrade A', requirements: 'Keep this project and its exports across a compatible update' });
    const html = `<!doctype html><html><head><meta charset="utf-8"><script src="assets/gsap.min.js"></script><style>body{margin:0}#main{position:relative;width:320px;height:180px;background:#d3e7ae}#box{position:absolute;top:60px;left:20px;width:40px;height:40px;background:#203021}</style></head><body><div id="main" data-composition-id="main" data-start="0" data-duration="1" data-width="320" data-height="180" data-fps="10"><div id="box"></div></div><script>window.__timelines={main:gsap.timeline({paused:true}).fromTo('#box',{x:0},{x:200,duration:1,ease:'none'})};</script></body></html>`;
    await old.call('openmotion_edit_project', { projectId: project.projectId, requestId: 'film', expectedRevision: project.revision, expectedVersionId: project.currentVersionId, files: [{ path: 'index.html', content: html }] });
    const current = await old.call('openmotion_get_project', { projectId: project.projectId });
    const args = { projectId: project.projectId, requestId: 'before-update', expectedRevision: current.revision, versionId: current.currentVersionId, audio: 'silent' };
    const submitted = await old.call('openmotion_export_request', args);
    const before = (await readEditor(data))!;
    await assert.rejects(editorRequest(before, '/editor-api/shutdown', {}), /active work/);
    await rename(app, path.join(temporary, 'previous')); await rename(replacement, app);
    const { Client: UpdatedClient } = await import(pathToFileURL(path.join(app, 'tests/shared-editor-client.mjs')).href + '?updated');
    const fresh = new UpdatedClient(data); clients.push(fresh); await fresh.initialize();
    const throughNew = await fresh.call('openmotion_get_project', { projectId: project.projectId, exportJobId: submitted.job.id });
    assert.equal(throughNew.exportJob.id, submitted.job.id);
    assert.equal((await readEditor(data))!.instanceId, before.instanceId);
    const completed = await waitJob(old, project.projectId, submitted.job.id);
    assert.equal((await old.call('openmotion_export_request', args)).job.id, submitted.job.id, 'a stable request must not create another export');
    const originalHash = createHash('sha256').update(await readFile(completed.path)).digest('hex');
    observations.push({ scenario: 'update-during-export', stdioPid: pid, jobId: completed.id, backendInstanceId: before.instanceId, verification: completed.verification.status, sha256: originalHash });
    await fresh.call('openmotion_create_project', { requestId: 'create-b', projectType: 'natural_language', title: 'Upgrade B', requirements: 'Another conversation must not replace the original binding' });
    // Simulate an updater retiring only this isolated, now-idle authority.
    await editorRequest(before, '/editor-api/shutdown', {});
    for (let i = 0; i < 100 && await readEditor(data); i++) await pause(50);
    assert.equal(await readEditor(data), null);
    assert.equal((await old.call('openmotion_open_preview')).projectId, project.projectId, 'the old connection must keep its project binding');
    const after = (await readEditor(data))!;
    assert.notEqual(after.instanceId, before.instanceId); assert.equal(after.version, '0.6.4'); assert.notEqual(after.build, before.build);
    assert.equal((await old.call('openmotion_get_project', { projectId: project.projectId, exportJobId: completed.id })).exportJob.state, 'completed');
    const latest = await old.call('openmotion_get_project', { projectId: project.projectId });
    assert.ok(latest.project.html.includes('x:200'));
    const next = await old.call('openmotion_export_request', { ...args, requestId: 'after-update', expectedRevision: latest.revision, versionId: latest.currentVersionId });
    const exported = await waitJob(old, project.projectId, next.job.id);
    assert.notEqual(exported.id, completed.id);
    assert.equal(createHash('sha256').update(await readFile(completed.path)).digest('hex'), originalHash);
    assert.equal(old.child.pid, pid); assert.equal(old.trace.filter((item: any) => item.method === 'initialize').length, 1);
    observations.push({ scenario: 'export-after-backend-replacement', stdioPid: pid, initializeCount: 1, projectId: project.projectId, jobId: exported.id, backendVersion: after.version, backendInstanceId: after.instanceId, verification: exported.verification.status, previousExportUnchanged: true });
    if (evidence) { await mkdir(evidence, { recursive: true }); await cp(exported.path, path.join(evidence, 'continued-export.mp4')); }
  } finally {
    await Promise.all(clients.map(client => client.close()));
    await closeFixtureEditor(data);
    if (evidence) { await mkdir(evidence, { recursive: true }); await writeFile(path.join(evidence, 'observations.json'), JSON.stringify({ observations, traces: clients.map(client => client.trace) }, null, 2)); }
    await rm(temporary, { recursive: true, force: true });
  }
});
