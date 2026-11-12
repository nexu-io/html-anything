import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import { startServer } from '../server.ts';
import { pluginRoot } from '../hyperframes.ts';
import { sharedEditorEnabled } from '../editor-runtime.ts';
import { fixture } from './fixtures.ts';
import { Client } from './shared-editor-client.mjs';

test('HTTP project, template and session handoffs return the OpenMotion editor origin', { timeout: 30_000 }, () => fixture(async store => {
  const running = await startServer(store, 0, { editor: false });
  const origin = `http://127.0.0.1:${(running.server.address() as { port: number }).port}`;
  const editor = async (value: { studioUrl?: string; projectId?: string }) => {
    assert.ok(value.studioUrl);
    const url = new URL(value.studioUrl);
    assert.equal(url.origin, origin);
    if (value.projectId) assert.equal(url.hash, `#project/${value.projectId}`);
    assert.match(await (await fetch(url)).text(), /data-motion-studio/);
  };
  const post = async (route: string, data: Record<string, unknown> = {}) => {
    const current = await store.status();
    const response = await fetch(origin + route, { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' },
      body: JSON.stringify({ expectedRevision: current.revision, expectedProjectId: current.projectId, ...data }) });
    assert.ok(response.ok, await response.clone().text());
    return response.json();
  };
  try {
    assert.equal((await running.info()).studioUrl, undefined);
    await editor(await post('/motion-api/preview/open'));
    await editor(await running.info());
    const health = await (await fetch(origin + '/api/health')).json();
    await editor(health);
    assert.equal(health.nativeStudioUrl, running.studio.url);
    assert.notEqual(new URL(health.nativeStudioUrl).origin, origin);
    await editor({ studioUrl: (await (await fetch(origin + '/api/studio')).json()).url });
    await editor(await post('/motion-api/projects/project/open'));
    await editor(await post('/motion-api/projects', { title: 'Another project' }));
    await editor(await post('/motion-api/projects/project/open'));
    const session = await post('/motion-api/sessions', { title: 'Another session' });
    await editor(await post(`/motion-api/sessions/${session.sessionId}/artifacts`));
    await editor(await post(`/motion-api/sessions/${session.sessionId}/open`));
    await editor(await post('/api/templates/product-promo/open'));
  } finally { await running.close(); }
}));

test('macOS source launchers and both MCP profiles hand off OpenMotion URLs', { skip: !sharedEditorEnabled, timeout: 60_000 }, () => fixture(async store => {
  const clients = [new Client(store.directory), new Client(store.directory, { legacy: true })];
  try {
    await Promise.all(clients.map(client => client.initialize()));
    const created = await clients[0].call('openmotion_create_project', { requestId: 'editor-urls', projectType: 'natural_language',
      title: 'Editor URLs', requirements: 'Verify editor URL handoffs without generating media or exporting.' });
    const opened = await clients[0].call('openmotion_open_preview', { projectId: created.projectId });
    const origin = new URL(opened.previewUrl).origin;
    const assertUrls = (value: Record<string, any>) => {
      for (const field of ['previewUrl', 'studioUrl', 'sessionUrl', 'embeddedPreviewUrl', 'serverUrl']) {
        if (value[field]) assert.equal(new URL(value[field]).origin, origin, field);
      }
      if (value.previewHandoff) assert.equal(new URL(value.previewHandoff.previewUrl).origin, origin);
    };
    assertUrls(opened);
    assertUrls(await clients[1].call('openmotion_open_preview', { projectId: created.projectId }));
    for (const entry of ['server.ts', 'preview.ts']) {
      const { stdout } = await promisify(execFile)(process.execPath, ['--experimental-strip-types', path.join(pluginRoot, entry)], {
        cwd: pluginRoot, env: { ...process.env, MOTION_DATA_DIR: store.directory }, timeout: 20_000 });
      const value = JSON.parse(stdout);
      assert.ok(value.studioUrl, entry);
      assertUrls(value);
      assert.equal(new URL(value.studioUrl).hash, `#project/${created.projectId}`);
    }
  } finally { await Promise.all(clients.map(client => client.close())); }
}, false));
