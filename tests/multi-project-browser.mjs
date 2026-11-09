import assert from 'node:assert/strict';
import { cp, mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import puppeteer from 'puppeteer-core';
import { Client } from './shared-editor-client.mjs';
import { closeFixtureEditor, fixture } from './fixtures.ts';
import { ensureEditor } from '../editor-runtime.ts';

assert.ok(process.env.D4_LANE && process.env.D4_LOCK_PID, 'Run with the shared browser-lock lane and real lock');
const out = process.argv[2]; assert.ok(out && path.isAbsolute(out), 'Pass an absolute evidence directory');
await mkdir(out, { recursive: true });
const data = await mkdtemp(path.join(tmpdir(), 'motion-multi-browser-'));
const clients = [new Client(data), new Client(data)];
let browser, pages = [];
const browserEvents = [];
const film = (label, duration) => `<!doctype html><html><head><title>${label}</title><script src="assets/gsap.min.js"></script><style>body{margin:0}#main{position:relative;width:640px;height:360px;background:#18382f;color:#fff;font:700 40px sans-serif}h1{position:absolute;left:48px;top:80px}</style></head><body><div id="main" data-composition-id="main" data-start="0" data-duration="${duration}" data-width="640" data-height="360" data-fps="10"><h1 id="label">${label}</h1></div><script>window.__timelines={main:gsap.timeline({paused:true}).fromTo('#label',{x:0},{x:80,duration:${duration},ease:'none'})};</script></body></html>`;
const result = { status: 'failed', scope: 'two real MCP clients and two Chrome pages; generated local fixtures', checks: [] };
const check = (name, evidence = {}) => { result.checks.push({ name, ...evidence }); console.log('PASS ' + name); };
try {
  await Promise.all(clients.map(client => client.initialize()));
  const projects = [];
  for (const [i, label] of ['PROJECT A', 'PROJECT B'].entries()) {
    const created = await clients[i].call('motion_create_project', { requestId: 'create-' + i, projectType: 'natural_language', title: label, requirements: label });
    await clients[i].call('motion_edit_project', { projectId: created.projectId, requestId: 'write-' + i, expectedRevision: created.revision, expectedVersionId: created.currentVersionId, files: [{ path: 'index.html', content: film(label, i + 1) }] });
    projects.push(await clients[i].call('motion_open_preview', { projectId: created.projectId }));
  }
  const identities = await Promise.all(projects.map(async project => (await fetch(new URL('/__hyperframes_config?projectId=' + project.projectId, project.previewUrl))).json()));
  assert.equal(identities[0].pid, identities[1].pid);
  assert.equal(new URL(projects[0].previewUrl).origin, new URL(projects[1].previewUrl).origin);
  check('both projects use one native process and one public origin', { nativePid: identities[0].pid });
  browser = await puppeteer.launch({ executablePath: process.env.HYPERFRAMES_BROWSER_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, userDataDir: path.join(data, 'browser-profile') });
  pages = await Promise.all(projects.map(() => browser.newPage()));
  const foreignRequests = [];
  for (const [i, page] of pages.entries()) {
    await page.setViewport({ width: 1440, height: 1000 });
    page.on('console', message => { if (['error', 'warn'].includes(message.type())) browserEvents.push({ page: i, type: message.type(), text: message.text() }); });
    page.on('response', response => { if (response.status() >= 400) browserEvents.push({ page: i, status: response.status(), url: response.url() }); });
    page.on('request', request => { const match = new URL(request.url()).pathname.match(/^\/api\/projects\/([^/]+)/); if (match && decodeURIComponent(match[1]) !== projects[i].projectId) foreignRequests.push({ page: i, url: request.url() }); });
    await page.goto(projects[i].previewUrl, { waitUntil: 'domcontentloaded' });
  }
  const waitForFilm = async (page, projectId, label) => {
    // Match returning to a conversation: background tabs may defer native paint/readiness work.
    await page.bringToFront();
    const deadline = Date.now() + 60_000;
    while (Date.now() < deadline) {
      for (const frame of page.frames()) {
        if (!frame.url().includes('/api/projects/' + projectId + '/preview')) continue;
        if (await frame.evaluate(value => document.body?.innerText.includes(value), label).catch(() => false)) {
          await page.waitForFunction(value => {
            const timeline = document.querySelector('[data-timeline-element-count]');
            return Number(timeline?.getAttribute('data-timeline-element-count')) > 0 && timeline?.textContent?.includes(value);
          }, { timeout: 30_000 }, label);
          return;
        }
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    throw new Error(`Preview did not converge: ${projectId} ${label}; ${page.frames().map(frame => frame.url()).join(', ')}`);
  };
  for (const [i, page] of pages.entries()) await waitForFilm(page, projects[i].projectId, ['PROJECT A', 'PROJECT B'][i]);
  await new Promise(resolve => setTimeout(resolve, 2400));
  for (const [i, page] of pages.entries()) assert.equal(new URL(page.url()).searchParams.get('project'), projects[i].projectId);
  check('two live previews and timelines retain their own project after global selection and status polling');
  const currentA = await clients[0].call('motion_get_project', { projectId: projects[0].projectId });
  await clients[0].call('motion_edit_project', { projectId: projects[0].projectId, requestId: 'update-a', expectedRevision: currentA.revision, expectedVersionId: currentA.currentVersionId, files: [{ path: 'index.html', content: film('PROJECT A UPDATED', 1) }] });
  await waitForFilm(pages[0], projects[0].projectId, 'PROJECT A UPDATED');
  await waitForFilm(pages[1], projects[1].projectId, 'PROJECT B');
  await clients[0].call('motion_open_preview', { projectId: projects[0].projectId });
  await new Promise(resolve => setTimeout(resolve, 2200));
  assert.equal(new URL(pages[1].url()).searchParams.get('project'), projects[1].projectId);
  assert.deepEqual(foreignRequests, []);
  check('MCP edits refresh A preview and timeline without changing B URL, content or request targets');
  const origin = new URL(projects[1].previewUrl).origin;
  const render = await fetch(`${origin}/api/projects/${projects[1].projectId}/render`, { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify({ format: 'mp4', fps: 10, quality: 'draft' }) });
  assert.equal(render.status, 200, await render.clone().text());
  const nativeJob = await render.json();
  assert.ok(nativeJob.jobId);
  const cancel = projectId => fetch(`${origin}/api/render/${nativeJob.jobId}/cancel?projectId=${projectId}`, { method: 'POST', headers: { Origin: origin } });
  assert.equal((await cancel(projects[0].projectId)).status, 404, 'A cannot cancel B native render');
  const cancelled = await cancel(projects[1].projectId);
  assert.equal(cancelled.status, 200, await cancelled.clone().text());
  check('native render task cancellation resolves only in its owning project');
  await pages[0].reload({ waitUntil: 'domcontentloaded' });
  await waitForFilm(pages[0], projects[0].projectId, 'PROJECT A UPDATED');
  await waitForFilm(pages[1], projects[1].projectId, 'PROJECT B');
  check('reloading A bookmark leaves B usable');
  for (const [i, page] of pages.entries()) await page.screenshot({ path: path.join(out, `project-${i === 0 ? 'a' : 'b'}.png`) });
  await fixture(async store => {
    const a = store.projectId, b = crypto.randomUUID();
    await writeFile(path.join(store.projectDirectory, 'index.html'), film('COLD BOOKMARK A', 1));
    await cp(store.projectDirectory, store.projectDirectoryFor(b), { recursive: true });
    await store.selectProject(b, { id: b, title: 'Unopened B' });
    const before = await store.forProject(b).get();
    const sourceB = await readFile(path.join(store.projectDirectoryFor(b), 'index.html'), 'utf8');
    const editor = await ensureEditor(store.directory);
    const coldPage = await browser.newPage();
    try {
      await coldPage.setViewport({ width: 1440, height: 1000 });
      await coldPage.goto(new URL('/#project/' + a, editor.endpoint).href, { waitUntil: 'domcontentloaded' });
      await waitForFilm(coldPage, a, 'COLD BOOKMARK A');
      assert.equal(new URL(coldPage.url()).searchParams.get('project'), a);
      assert.equal(await readFile(path.join(store.projectDirectoryFor(b), 'index.html'), 'utf8'), sourceB);
      assert.equal((await store.forProject(b).get()).revision, before.revision);
      assert.equal(store.projectCatalog().activeId, b);
      await coldPage.screenshot({ path: path.join(out, 'cold-hash-bookmark.png') });
      check('cold hash-only bookmark opens A preview and timeline without touching B source, revision or remembered selection');
    } finally { await coldPage.close(); }
  });
  result.status = 'passed';
} catch (error) {
  result.error = error.stack; result.browserEvents = browserEvents; result.pages = [];
  for (const [i, page] of pages.entries()) {
    await page.screenshot({ path: path.join(out, `failure-${i}.png`) }).catch(() => {});
    result.pages.push(await page.evaluate(() => ({ url: location.href, visibility: document.visibilityState, text: document.body.innerText, timeline: document.querySelector('[data-timeline-element-count]')?.outerHTML, frames: [...document.querySelectorAll('iframe')].map(frame => frame.src) })).catch(() => null));
  }
  process.exitCode = 1; console.error(error);
}
finally {
  await browser?.close();
  await Promise.all(clients.map(client => client.close()));
  await closeFixtureEditor(data);
  await rm(data, { recursive: true, force: true });
  await writeFile(path.join(out, 'result.json'), JSON.stringify(result, null, 2));
}
