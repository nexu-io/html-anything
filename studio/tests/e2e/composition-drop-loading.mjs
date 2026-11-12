// Run with browser-lock.sh. Delay real insertion requests; never mock their responses.
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
const output = process.env.EVIDENCE_DIR || await mkdtemp(path.join(tmpdir(), 'motion-composition-drop-'));
await mkdir(output, { recursive: true });
process.env.HYPERFRAMES_HISTORY_ROOT = path.join(output, 'history');
const store = new WorkspaceStore(await mkdtemp(path.join(output, 'workspace-')));
await store.initialize(root);
const entry = path.join(store.projectDirectory, 'index.html');
await writeFile(entry, `<!doctype html><html><head><script src="assets/gsap.min.js"></script></head><body style="margin:0"><div id="main" data-composition-id="main" data-start="0" data-duration="30" data-width="640" data-height="360" style="position:relative;width:640px;height:360px;background:#eee"><div id="control" data-start="0" data-duration="30" data-track-index="0">Control</div></div><script>window.__timelines={main:gsap.timeline({paused:true})};</script></body></html>`);
const native = await startWorkspaceStudio(root, store.directory, store.projectDirectory, Number(process.env.D4_LANE_API_PORT));
const studio = { url: native.origin, alive: () => true, projectDirectory: store.projectDirectory };
const requests = [];
const uploads = [];
const server = createServer((req, res) => {
  const forward = () => handler(req, res, store, { studio, runtimeRoot: root, nativeRoot: root, ffmpeg: true, ensureStudio: async () => studio });
  if (req.method === 'POST' && req.url.includes('/file-mutations/insert-composition/')) {
    requests.push({ forward });
  } else if (req.method === 'POST' && req.url.endsWith('/upload')) {
    uploads.push({ forward });
  } else void forward();
});
await new Promise(resolve => server.listen(Number(process.env.PLAYWRIGHT_WEB_PORT), '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
let browser;
try {
  browser = await puppeteer.launch({ executablePath: resolveChromeExecutable(), headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1000 });
  await page.evaluateOnNewDocument(() => localStorage.setItem('motion.studio.locale', 'en'));
  page.on('pageerror', error => console.log('Page error:', error.message));
  await page.goto(`${origin}/?project=${store.projectId}#project/${store.projectId}`);
  await page.waitForSelector('[data-studio-timeline]', { timeout: 60000 });
  await page.waitForSelector('[data-timeline-scroll-viewport] [data-clip="true"]', { timeout: 60000 });
  await page.waitForFunction(() => !document.querySelector('[data-testid="timeline-loading-disabled-overlay"]'));
  await page.evaluate(() => {
    const button = Array.from(document.querySelectorAll('.hf-dock-side-rail button')).find(button => /compositions/i.test(`${button.title} ${button.getAttribute('aria-label')}`));
    if (!button) throw new Error('Composition rail button missing');
    button.click();
  });
  await page.waitForSelector('[data-composition-list] [draggable]');
  const drag = (name, offset) => page.evaluate(({ name, offset }) => {
    const card = [...document.querySelectorAll('[data-composition-list] [draggable]')].find(node => node.textContent.includes(`compositions/${name}.html`));
    if (!card) throw new Error(`No composition card for ${name}`);
    const target = document.querySelector('[data-timeline-scroll-viewport]');
    const transfer = new DataTransfer();
    card.dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer: transfer }));
    const rect = target.getBoundingClientRect();
    const options = { bubbles: true, cancelable: true, dataTransfer: transfer, clientX: rect.left + offset, clientY: rect.top + 64 };
    target.dispatchEvent(new DragEvent('dragover', options));
    target.dispatchEvent(new DragEvent('drop', options));
    card.dispatchEvent(new DragEvent('dragend', options));
  }, { name, offset });
  await page.evaluate(() => {
    window.__dropSamples = [];
    const visible = node => {
      const box = node.getBoundingClientRect();
      const view = node.closest('[data-timeline-scroll-viewport]').getBoundingClientRect();
      return box.right > view.left && box.left < view.right && box.bottom > view.top && box.top < view.bottom;
    };
    const sample = () => {
      window.__dropSamples.push({
        pending: [...document.querySelectorAll('[data-testid="timeline-pending-asset"]')].filter(visible).map(node => node.dataset.dropId),
        clips: [...document.querySelectorAll('[data-clip="true"]')].filter(visible).map(node => node.dataset.elId),
      });
      window.__dropSampleFrame = requestAnimationFrame(sample);
    };
    sample();
  });
  await drag('first', 340);
  await page.waitForSelector('[data-testid="timeline-pending-asset"][aria-busy="true"]');
  const firstId = await page.$eval('[data-testid="timeline-pending-asset"]', node => node.dataset.dropId);
  assert.ok(await page.$eval('[data-testid="timeline-pending-asset"]', node => {
    const box = node.getBoundingClientRect(), view = node.closest('[data-timeline-scroll-viewport]').getBoundingClientRect();
    return box.left >= view.left && box.right <= view.right;
  }), 'The pending clip must remain inside the visible timeline after release');
  await new Promise(resolve => setTimeout(resolve, 1200));
  assert.equal(requests.length, 1);
  assert.equal(await page.$$eval('[data-testid="timeline-pending-asset"]', nodes => nodes.length), 1);
  assert.equal(await page.$$eval('.hf-toast-enter[role="status"]', nodes => nodes.length), 0);
  await drag('first', 540);
  await page.waitForFunction(() => document.querySelectorAll('[data-testid="timeline-pending-asset"]').length === 2);
  const secondId = await page.$$eval('[data-testid="timeline-pending-asset"]', nodes => nodes[1].dataset.dropId);
  assert.equal(requests.length, 1, 'Second insertion must wait in the existing file mutation queue');
  await page.screenshot({ path: path.join(output, 'composition-pending.png') });
  await requests[0].forward();
  for (let attempt = 0; attempt < 100 && requests.length < 2; attempt++) await new Promise(resolve => setTimeout(resolve, 50));
  assert.equal(requests.length, 2);
  assert.ok(await page.$(`[data-drop-id="${secondId}"]`));
  await requests[1].forward();
  await page.waitForFunction(() => !document.querySelector('[data-testid="timeline-pending-asset"]') && !!document.querySelector('[data-el-id="index.html#first_2"]'), { timeout: 30000 });
  assert.equal(await page.$$eval('.hf-toast-enter[role="status"]', nodes => nodes.length), 0);
  const samples = await page.evaluate(() => { cancelAnimationFrame(window.__dropSampleFrame); return window.__dropSamples; });
  for (const [id, key] of [[firstId, 'index.html#first'], [secondId, 'index.html#first_2']]) {
    const accepted = samples.findIndex(sample => sample.pending.includes(id));
    assert.ok(accepted >= 0);
    assert.ok(samples.slice(accepted).every(sample => sample.pending.includes(id) || sample.clips.includes(key)), `No empty frame for ${key}`);
  }
  assert.equal((await readFile(entry, 'utf8')).match(/data-composition-src=/g).length, 2);
  await page.screenshot({ path: path.join(output, 'composition-ready.png') });
  // Insert the root into itself to exercise the real native cycle refusal.
  await page.evaluate(() => {
    const card = [...document.querySelectorAll('[data-composition-list] [draggable]')].find(node => node.textContent.includes('index.html'));
    const target = document.querySelector('[data-timeline-scroll-viewport]');
    const transfer = new DataTransfer();
    card.dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer: transfer }));
    const rect = target.getBoundingClientRect();
    const options = { bubbles: true, cancelable: true, dataTransfer: transfer, clientX: rect.left + 340, clientY: rect.top + 64 };
    target.dispatchEvent(new DragEvent('dragover', options));
    target.dispatchEvent(new DragEvent('drop', options));
    card.dispatchEvent(new DragEvent('dragend', options));
  });
  for (let attempt = 0; attempt < 100 && requests.length < 3; attempt++) await new Promise(resolve => setTimeout(resolve, 50));
  assert.equal(requests.length, 3);
  await requests[2].forward();
  await page.waitForSelector('[data-testid="timeline-pending-asset"][role="alert"][aria-busy="false"]');
  assert.equal((await readFile(entry, 'utf8')).match(/data-composition-src=/g).length, 2);
  await page.screenshot({ path: path.join(output, 'composition-failed.png') });
  await page.click('[data-testid="timeline-pending-asset"][role="alert"] button');
  await page.evaluate(async () => {
    window.__uploadSamples = [];
    const sample = () => {
      const visible = node => {
        const box = node.getBoundingClientRect(), view = node.closest('[data-timeline-scroll-viewport]').getBoundingClientRect();
        return box.right > view.left && box.left < view.right && box.bottom > view.top && box.top < view.bottom;
      };
      window.__uploadSamples.push({
        pending: [...document.querySelectorAll('[data-testid="timeline-pending-asset"]')].filter(visible).map(node => node.getAttribute('aria-label')),
        clips: [...document.querySelectorAll('[data-clip="true"]')].filter(visible).map(node => node.dataset.elId),
      });
      window.__uploadSampleFrame = requestAnimationFrame(sample);
    };
    sample();
    const canvas = document.createElement('canvas'); canvas.width = 16; canvas.height = 16;
    canvas.getContext('2d').fillRect(0, 0, 16, 16);
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    const transfer = new DataTransfer();
    transfer.items.add(new File([blob], 'upload-one.png', { type: 'image/png' }));
    transfer.items.add(new File([blob], 'upload-two.png', { type: 'image/png' }));
    const target = document.querySelector('[data-timeline-scroll-viewport]'), rect = target.getBoundingClientRect();
    const options = { bubbles: true, cancelable: true, dataTransfer: transfer, clientX: rect.left + 640, clientY: rect.top + 64 };
    target.dispatchEvent(new DragEvent('dragover', options));
    target.dispatchEvent(new DragEvent('drop', options));
  });
  await page.waitForSelector('[data-testid="timeline-pending-asset"][aria-busy="true"]');
  await new Promise(resolve => setTimeout(resolve, 1000));
  assert.equal(uploads.length, 1, 'Keep the existing single multipart upload');
  assert.equal(await page.$$eval('[data-testid="timeline-pending-asset"]', nodes => nodes.length), 1);
  await page.screenshot({ path: path.join(output, 'upload-pending.png') });
  await uploads[0].forward();
  await page.waitForFunction(() => !document.querySelector('[data-testid="timeline-pending-asset"]') && !!document.querySelector('[data-el-id="index.html#upload-two"]'), { timeout: 30000 });
  const uploadSamples = await page.evaluate(() => { cancelAnimationFrame(window.__uploadSampleFrame); return window.__uploadSamples; });
  for (const name of ['upload-one', 'upload-two']) {
    const accepted = uploadSamples.findIndex(sample => sample.pending.some(label => label.includes(name)));
    assert.ok(accepted >= 0);
    assert.ok(uploadSamples.slice(accepted).every(sample => sample.pending.some(label => label.includes(name)) || sample.clips.includes(`index.html#${name}`)), `No empty frame from upload to committed clip: ${name}`);
  }
  assert.equal((await readFile(entry, 'utf8')).match(/<img\s/g).length, 2);
  await page.screenshot({ path: path.join(output, 'upload-ready.png') });
  const result = { status: 'PASS', scope: 'Real composition-list drag, batch file upload, native saves/history and preview; requests delayed, responses never mocked', sampledFrames: samples.length, eachDropHasNoEmptyFrame: true, repeatedClips: 2, nativeCycleErrorVisible: true, uploadFrames: uploadSamples.length, uploadFiles: 2, uploadHasNoEmptyFrame: true };
  await writeFile(path.join(output, 'browser-result.json'), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result));
} catch (error) {
  const page = (await browser?.pages())?.at(-1);
  if (page) { await page.screenshot({ path: path.join(output, 'failure.png') }); await writeFile(path.join(output, 'failure-text.txt'), await page.evaluate(() => document.body.innerText)); }
  throw error;
} finally {
  await browser?.close(); server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); await native.close();
}
