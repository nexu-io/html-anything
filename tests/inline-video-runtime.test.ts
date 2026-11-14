import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, rm, truncate } from 'node:fs/promises';
import path from 'node:path';
import { fixture } from './fixtures.ts';
import { startServer } from '../server.ts';
import { rpc, mcpRegistry } from '../mcp.ts';
import { delay } from '../hyperframes.ts';
const film = (color: string) => `<!doctype html><html><head><script src="assets/gsap.min.js"></script><style>body{margin:0}#main{width:320px;height:180px;position:relative;background:#10251f;overflow:hidden}#box{position:absolute;width:60px;height:60px;top:60px;left:20px;background:${color}}</style></head><body><div id="main" data-composition-id="main" data-start="0" data-duration="1" data-width="320" data-height="180" data-fps="10"><div id="box"></div></div><script>let tl=gsap.timeline({paused:true});tl.to('#box',{x:210,duration:1,ease:'none'},0);window.__timelines={main:tl};</script></body></html>`;

test('real per-round MCP playback keeps first and edited exports separate, reopens, cancels and reports missing media', { timeout: 180_000 }, () => fixture(async store => {
  const running = await startServer(store, 0, { editor: false });
  const address = running.server.address(); assert.ok(address && typeof address !== 'string');
  await writeFile(path.join(store.directory, 'preview.json'), JSON.stringify({ port: address.port }));
  const call = async (name: string, args: any = {}) => {
    const response: any = await rpc({ jsonrpc: '2.0', id: crypto.randomUUID(), method: 'tools/call', params: { name, arguments: args } }, store);
    assert.ok(!response.result.isError, JSON.stringify(response)); return response.result;
  };
  const appState: any = {};
  await rpc({ jsonrpc: '2.0', id: 'app-init', method: 'initialize', params: { capabilities: { extensions: { 'io.modelcontextprotocol/ui': { mimeTypes: ['text/html;profile=mcp-app'] } } } } }, store, mcpRegistry(), undefined, appState);
  const show = async (projectId: string, workId: string) => (await rpc({ jsonrpc: '2.0', id: crypto.randomUUID(), method: 'tools/call', params: { name: 'openmotion_show_video', arguments: { projectId, workId } } }, store, mcpRegistry(), undefined, appState) as any).result;
  const exportFile = async (jobId: string) => store.exportPath((await store.job(jobId))!);
  const view = async (projectId: string, workId: string, includeVideo = false) => call('openmotion_get_project', { projectId, workId, includeVideo });
  const wait = async (projectId: string, workId: string) => {
    const end = Date.now() + 90_000;
    for (;;) {
      const r = await view(projectId, workId), work = r.structuredContent.inlineWork;
      assert.ok(!['failed', 'unavailable'].includes(work.state), JSON.stringify(work));
      if (work.playable) return work;
      assert.ok(Date.now() < end, JSON.stringify(work)); await delay(250);
    }
  };
  try {
    const p = (await call('openmotion_create_project', { requestId: 'create', projectType: 'natural_language', title: 'Inline runtime', requirements: '静音移动图形' })).structuredContent;
    async function round(requestId: string, mode: string, before: any, color: string) {
      const work = (await call('openmotion_open_preview', { projectId: p.projectId, action: 'begin', requestId, mode })).structuredContent.inlineWork;
      const saved = (await call('openmotion_edit_project', { projectId: p.projectId, workId: work.id, requestId: requestId + '-save', expectedRevision: before.revision, expectedVersionId: before.version.versionId, files: [{ path: 'index.html', content: film(color) }] })).structuredContent;
      assert.equal((await view(p.projectId, work.id)).structuredContent.inlineWork.playable, false);
      assert.equal(saved.previewHandoff.state, 'deferred');
      const premature = await show(p.projectId, work.id);
      assert.equal(premature.isError, true);
      assert.match(premature.structuredContent.error.message, /FINAL_VIDEO_NOT_READY/);
      await call('openmotion_export_request', { projectId: p.projectId, workId: work.id, requestId: requestId + '-export', expectedRevision: saved.revision, versionId: saved.version.versionId, audio: 'silent' });
      return { work: await wait(p.projectId, work.id), saved };
    }
    const first = await round('first', 'create', p, '#d7f6af');
    const original = await show(p.projectId, first.work.id);
    assert.equal(original.isError, undefined);
    assert.ok(original._meta.inlineVideo.video.startsWith('data:video/mp4;base64,'));
    assert.ok(!JSON.stringify(original.structuredContent).includes('base64'));
    assert.ok(!original.content[0].text.includes('base64'));
    const one = Buffer.from(original._meta.inlineVideo.video.split(',')[1], 'base64');
    assert.deepEqual(one, await readFile(await exportFile(first.work.jobId)));
    const second = await round('second', 'modify', first.saved, '#ff9578');
    assert.notEqual(second.work.versionId, first.work.versionId);
    const two = await show(p.projectId, second.work.id);
    assert.notEqual(two._meta.inlineVideo.video, original._meta.inlineVideo.video);
    assert.equal((await show(p.projectId, first.work.id))._meta.inlineVideo.video, original._meta.inlineVideo.video);
    const reopened = await rpc({ jsonrpc: '2.0', id: 'reopen', method: 'tools/call', params: { name: 'openmotion_get_project', arguments: { projectId: p.projectId, workId: first.work.id, includeVideo: true } } }, new (await import('../workspace.ts')).WorkspaceStore(store.directory));
    assert.equal((reopened as any).result._meta.inlineVideo.video, original._meta.inlineVideo.video);
    assert.equal((await view(p.projectId, first.work.id)).structuredContent.inlineWork.versionId, first.work.versionId);
    await call('openmotion_export_cancel', { projectId: p.projectId, requestId: 'cancel-completed', jobId: first.work.jobId });
    assert.equal((await view(p.projectId, first.work.id)).structuredContent.inlineWork.playable, true);
    await truncate(await exportFile(first.work.jobId), 33 * 1024 * 1024);
    const oversized = await view(p.projectId, first.work.id, true);
    assert.equal(oversized.structuredContent.inlineWork.state, 'unavailable');
    assert.match(oversized.structuredContent.inlineWork.error, /32 MiB/);
    assert.equal(oversized._meta.inlineVideo.video, undefined);
    await writeFile(await exportFile(first.work.jobId), one);
    await writeFile(await exportFile(first.work.jobId), Buffer.concat([one, Buffer.from('changed')]));
    const changed = (await view(p.projectId, first.work.id)).structuredContent.inlineWork;
    assert.equal(changed.state, 'unavailable'); assert.equal(changed.playable, false);
    await rm(await exportFile(first.work.jobId));
    const missing = (await view(p.projectId, first.work.id)).structuredContent.inlineWork;
    assert.equal(missing.state, 'failed'); assert.equal(missing.playable, false);
    assert.equal((await view(p.projectId, second.work.id)).structuredContent.inlineWork.playable, true);
  } finally { await running.close(); }
}, false));
