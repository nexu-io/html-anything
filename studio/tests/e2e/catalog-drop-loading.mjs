// Run with browser-lock.sh. Only catalog download is controlled; editor, saves,
// native history and preview reload use an isolated real workspace backend.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
import { WorkspaceStore } from '../../../workspace.ts';
import { handler } from '../../../server.ts';
import { startWorkspaceStudio } from '../../../shared/workspace-studio.ts';
import { resolveChromeExecutable } from './chrome-executable.mjs';

assert.ok(process.env.D4_LANE, 'Acquire a shared browser lane first');
const root = fileURLToPath(new URL('../../../', import.meta.url));
const output = process.env.EVIDENCE_DIR || await mkdtemp(path.join(tmpdir(), 'motion-catalog-drop-'));
await mkdir(output, { recursive: true });
process.env.HYPERFRAMES_HISTORY_ROOT = path.join(output, 'history');
const store = new WorkspaceStore(await mkdtemp(path.join(output, 'workspace-')));
await store.initialize(root);
await mkdir(path.join(store.projectDirectory, 'assets'), { recursive: true });
await writeFile(path.join(store.projectDirectory, 'assets/gsap.min.js'), await readFile(path.join(root, 'node_modules/gsap/dist/gsap.min.js')));
const entry = path.join(store.projectDirectory, 'index.html');
await writeFile(entry, `<!doctype html><html><head><script src="assets/gsap.min.js"></script></head><body style="margin:0"><div id="main" data-composition-id="main" data-start="0" data-duration="20" data-width="640" data-height="360" style="position:relative;width:640px;height:360px;background:#eee"></div><script>window.__timelines={main:gsap.timeline({paused:true})};</script></body></html>`);
const native = await startWorkspaceStudio(root, store.directory, store.projectDirectory, Number(process.env.D4_LANE_API_PORT));
const studio = { url: native.origin, alive: () => true, projectDirectory: store.projectDirectory };
const server = createServer((req, res) => void handler(req, res, store, { studio, runtimeRoot: root, nativeRoot: root, ffmpeg: true, ensureStudio: async () => studio }));
await new Promise(resolve => server.listen(Number(process.env.PLAYWRIGHT_WEB_PORT), '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const block = { name: 'loading-test', title: 'Loading Test', type: 'hyperframes:block', duration: 8,
  description: 'Catalog loading regression', tags: ['social'], files: [], dimensions: { width: 640, height: 360 } };
const requests = [];
let browser;
try {
  browser = await puppeteer.launch({ executablePath: resolveChromeExecutable(), headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1000 });
  await page.evaluateOnNewDocument(() => localStorage.setItem('motion.studio.locale', 'en'));
  await page.setRequestInterception(true);
  page.on('request', request => {
    const url = request.url();
    if (url.includes('/api/registry/blocks')) return void request.respond({ status: 200, contentType: 'application/json', body: JSON.stringify([block]) });
    if (url.endsWith('/registry/install')) { requests.push(request); return; }
    void request.continue();
  });
  page.on('pageerror', error => console.log('Page error:', error.message));
  await page.goto(`${origin}/?project=${store.projectId}#project/${store.projectId}`);
  await page.waitForSelector('[data-studio-timeline]', { timeout: 60000 });
  await page.waitForFunction(() => !document.querySelector('[data-testid="timeline-loading-disabled-overlay"]'));
  const openCatalog = await page.evaluate(() => {
    const button = Array.from(document.querySelectorAll('.hf-dock-side-rail button')).find(button => /catalog/i.test(`${button.getAttribute('title')} ${button.getAttribute('aria-label')} ${button.textContent}`));
    if (!button) return Array.from(document.querySelectorAll('.hf-dock-side-rail button')).map(button => ({ title: button.title, label: button.getAttribute('aria-label') }));
    button.click(); return true;
  });
  assert.equal(openCatalog, true, JSON.stringify(openCatalog));
  await page.waitForSelector('[data-motion-catalog] [draggable]');
  const drag = () => page.evaluate(() => {
    const card = document.querySelector('[data-motion-catalog] [draggable]');
    const target = document.querySelector('[data-timeline-scroll-viewport]') || document.querySelector('[data-studio-timeline] .h-full.border-t');
    if (!target) throw new Error('No visible timeline drop target');
    const transfer = new DataTransfer();
    card.dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer: transfer }));
    const rect = target.getBoundingClientRect();
    const options = { bubbles: true, cancelable: true, dataTransfer: transfer, clientX: rect.left + 300, clientY: rect.top + 64 };
    target.dispatchEvent(new DragEvent('dragover', options));
    target.dispatchEvent(new DragEvent('drop', options));
    card.dispatchEvent(new DragEvent('dragend', options));
  });
  await page.evaluate(() => {
    window.__dropSamples = [];
    const sample = () => {
      window.__dropSamples.push({ at: performance.now(), pending: document.querySelectorAll('[data-testid="timeline-pending-asset"]').length, clips: document.querySelectorAll('[data-clip="true"]').length });
      window.__dropSampleFrame = requestAnimationFrame(sample);
    };
    window.__dropSampleFrame = requestAnimationFrame(sample);
  });
  await drag();
  await page.waitForSelector('[data-testid="timeline-pending-asset"][aria-busy="true"]');
  await page.waitForFunction(() => !Array.from(document.querySelectorAll('[role="status"]')).some(node => node.textContent.includes('Adding loading-test')));
  await page.screenshot({ path: path.join(output, 'after-release.png') });
  await new Promise(resolve => setTimeout(resolve, 1200));
  assert.equal(requests.length, 1);
  assert.equal(await page.$$eval('[data-testid="timeline-pending-asset"]', nodes => nodes.length), 1);
  await drag();
  await page.waitForFunction(() => document.querySelectorAll('[data-testid="timeline-pending-asset"]').length === 2);
  assert.equal(requests.length, 1, 'Second registry install waits in the queue');
  const fulfill = async (request, index) => {
    const file = `compositions/loading-test-${index}.html`;
    await mkdir(path.join(store.projectDirectory, 'compositions'), { recursive: true });
    await writeFile(path.join(store.projectDirectory, file), `<!doctype html><html><head><script src="../assets/gsap.min.js"></script></head><body style="margin:0"><div data-composition-id="loading-test" data-start="0" data-duration="8" data-width="640" data-height="360" style="width:640px;height:360px;background:#7c5ca5;color:white">Catalog test</div><script>window.__timelines={'loading-test':gsap.timeline({paused:true})};</script></body></html>`);
    await request.respond({ status: 200, contentType: 'application/json', body: JSON.stringify({ written: [file], block }) });
  };
  await fulfill(requests[0], 1);
  for (let attempt = 0; attempt < 100 && requests.length < 2; attempt++) await new Promise(resolve => setTimeout(resolve, 50));
  assert.equal(requests.length, 2);
  await fulfill(requests[1], 2);
  await page.waitForFunction(() => document.querySelectorAll('[data-testid="timeline-pending-asset"]').length === 0 && document.querySelectorAll('[data-clip="true"]').length >= 2, { timeout: 30000 });
  const samples = await page.evaluate(() => { cancelAnimationFrame(window.__dropSampleFrame); return window.__dropSamples; });
  const firstAccepted = samples.findIndex(sample => sample.pending > 0);
  assert.ok(firstAccepted >= 0);
  assert.ok(samples.slice(firstAccepted).every(sample => sample.pending + sample.clips > 0), 'No frame may lose both the pending and committed clips');
  const source = await readFile(entry, 'utf8');
  assert.equal((source.match(/data-composition-src=/g) || []).length, 2);
  assert.ok(source.includes('id="loading-test_2"'));
  await page.screenshot({ path: path.join(output, 'ready.png') });
  await drag();
  await page.waitForSelector('[data-testid="timeline-pending-asset"][aria-busy="true"]');
  for (let attempt = 0; attempt < 100 && requests.length < 3; attempt++) await new Promise(resolve => setTimeout(resolve, 50));
  await requests[2].respond({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'Catalog temporarily unavailable' }) });
  await page.waitForSelector('[data-testid="timeline-pending-asset"][role="alert"][aria-busy="false"]');
  await page.screenshot({ path: path.join(output, 'failed.png') });
  assert.equal((await readFile(entry, 'utf8')).match(/data-composition-src=/g).length, 2);
  await page.click('[data-testid="timeline-pending-asset"][role="alert"] button');
  const previewDrop = () => page.evaluate(() => {
    const card = document.querySelector('[data-motion-catalog] [draggable]');
    const target = document.querySelector('[data-preview-pan-surface]');
    const transfer = new DataTransfer();
    card.dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer: transfer }));
    const rect = target.getBoundingClientRect();
    const options = { bubbles: true, cancelable: true, dataTransfer: transfer, clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2 };
    target.dispatchEvent(new DragEvent('dragenter', options));
    target.dispatchEvent(new DragEvent('dragover', options));
    target.dispatchEvent(new DragEvent('drop', options));
    card.dispatchEvent(new DragEvent('dragend', options));
  });
  await previewDrop();
  await page.waitForSelector('[data-testid="timeline-pending-asset"][aria-busy="true"]');
  await previewDrop();
  await page.waitForFunction(() => document.querySelectorAll('[data-testid="timeline-pending-asset"]').length === 2);
  assert.equal(await page.$$eval('.hf-toast-enter[role="status"]', nodes => nodes.length), 0);
  await page.screenshot({ path: path.join(output, 'preview-drop-pending.png') });
  for (let attempt = 0; attempt < 100 && requests.length < 4; attempt++) await new Promise(resolve => setTimeout(resolve, 50));
  assert.equal(requests.length, 4);
  await fulfill(requests[3], 4);
  for (let attempt = 0; attempt < 100 && requests.length < 5; attempt++) await new Promise(resolve => setTimeout(resolve, 50));
  assert.equal(requests.length, 5);
  await fulfill(requests[4], 5);
  await page.waitForFunction(() => !document.querySelector('[data-testid="timeline-pending-asset"]') && !!document.querySelector('[data-el-id="index.html#loading-test_4"]'), { timeout: 30000 });
  assert.equal((await readFile(entry, 'utf8')).match(/data-composition-src=/g).length, 4);
  await page.screenshot({ path: path.join(output, 'preview-drop-ready.png') });
  const result = { status: 'PASS', scope: 'Production editor timeline and preview drops, native saves/history and preview; controlled catalog list and download response only', sampledFrames: samples.length, noEmptyFrames: true, repeatedClips: 2, failureVisible: true, previewDrops: 2 };
  await writeFile(path.join(output, 'browser-result.json'), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result));
} catch (error) {
  const page = (await browser?.pages())?.at(-1);
  if (page) { await page.screenshot({ path: path.join(output, 'failure.png') }); await writeFile(path.join(output, 'failure-text.txt'), await page.evaluate(() => document.body.innerText)); }
  throw error;
} finally {
  await browser?.close(); server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); await native.close();
}
