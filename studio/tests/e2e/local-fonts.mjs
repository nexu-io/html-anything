// Run inside browser-lock.sh; uses its web/API ports and an isolated project.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdir, mkdtemp, readFile, writeFile, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, execFileSync } from 'node:child_process';
import puppeteer from 'puppeteer-core';
import { create } from 'fontkit';
import { WorkspaceStore } from '../../../workspace.ts';
import { handler } from '../../../server.ts';
import { startWorkspaceStudio } from '../../../shared/workspace-studio.ts';
import { resolveChromeExecutable } from './chrome-executable.mjs';

assert.ok(process.env.D4_LANE, 'Acquire the shared browser lane first');
const root = fileURLToPath(new URL('../../../', import.meta.url));
const output = process.env.EVIDENCE_DIR || await mkdtemp(path.join(tmpdir(), 'motion-font-e2e-'));
await mkdir(output, { recursive: true });
const store = new WorkspaceStore(await mkdtemp(path.join(output, 'workspace-')));
await store.initialize(root);
const assets = path.join(store.projectDirectory, 'assets/fonts');
await mkdir(assets, { recursive: true });
const ownedFonts = path.join(root, 'library/skills/motion-design-remix/assets/wireframe-portal-title/assets/fonts');
await writeFile(path.join(assets, 'material.ttf'), await readFile(path.join(ownedFonts, 'Geist-Regular.ttf')));
const entry = path.join(store.projectDirectory, 'index.html');
await writeFile(entry, `<!doctype html><html><head><script src="assets/gsap.min.js"></script><style>
@font-face{font-family:'Project Brand';src:url('assets/fonts/material.ttf')}
body{margin:0}#main{position:relative;width:640px;height:360px;background:#eee}
#title{position:absolute;left:40px;top:100px;font:32px system-ui;color:#222}
#material{position:absolute;left:40px;top:250px;font:24px 'Project Brand';color:#222}
</style></head><body><div id="main" data-composition-id="main" data-start="0" data-duration="1" data-width="640" data-height="360" data-fps="12">
<h1 id="title" class="clip" data-start="0" data-duration="1" data-track-index="0">Font test ABC 新标题</h1><p id="material">Material font sample</p>
</div><script>window.__timelines={main:gsap.timeline({paused:true})};</script></body></html>`);
const native = await startWorkspaceStudio(root, store.directory, store.projectDirectory, Number(process.env.D4_LANE_API_PORT));
const studio = { url: native.origin, alive: () => true, projectDirectory: store.projectDirectory };
const server = createServer((req, res) => void handler(req, res, store, { studio, runtimeRoot: root, nativeRoot: root, ffmpeg: true, ensureStudio: async () => studio }));
await new Promise(resolve => server.listen(Number(process.env.PLAYWRIGHT_WEB_PORT), '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const results = { head: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(), output, projectDirectory: store.projectDirectory, fonts: [], screenshots: [] };
let browser;
try {
  const families = (await (await fetch(`${origin}/api/fonts`)).json()).fonts;
  for (const family of ['Arial', 'Avenir Next', 'Songti SC', 'Hiragino Sans GB'].filter(family => families.includes(family))) {
    const response = await fetch(`${origin}/api/fonts/file?family=${encodeURIComponent(family)}`);
    assert.equal(response.status, 200);
    const metadata = JSON.parse(decodeURIComponent(response.headers.get('X-Font-Metadata')));
    const decoded = create(Buffer.from(await response.arrayBuffer()));
    assert.equal(metadata.postscriptName, decoded.postscriptName);
    assert.equal(metadata.family, family);
    assert.equal(metadata.style, 'normal');
    if (family === 'Arial') assert.equal(metadata.postscriptName, 'ArialMT');
    if (family === 'Avenir Next') assert.equal(metadata.postscriptName, 'AvenirNext-Regular');
    if (family === 'Songti SC') assert.equal(metadata.postscriptName, 'STSongti-SC-Regular');
    results.fonts.push(metadata);
  }
  if (!results.fonts.length) {
    const response = await fetch(`${origin}/api/fonts/file?family=${encodeURIComponent(families[0])}`);
    results.fonts.push(JSON.parse(decodeURIComponent(response.headers.get('X-Font-Metadata'))));
  }
  browser = await puppeteer.launch({ executablePath: resolveChromeExecutable(), headless: true });
  const page = await browser.newPage();
  page.on('console', message => { if (message.type() === 'error') console.log('Browser:', message.text()); });
  page.on('response', async response => { if (response.status() >= 400 && /\/api\//.test(response.url())) console.log('HTTP failure:', response.status(), response.url(), (await response.text().catch(() => '')).slice(0, 500)); });
  await page.setViewport({ width: 1440, height: 1000 });
  const client = await page.createCDPSession();
  await client.send('DOM.enable'); await client.send('CSS.enable');
  const capture = async name => {
    await page.evaluate(() => Promise.all(document.getAnimations().filter(animation => animation.effect?.getComputedTiming().iterations !== Infinity).map(animation => animation.finished.catch(() => {}))));
    await page.screenshot({ path: path.join(output, name) }); results.screenshots.push(name);
  };
  const remoteFontRequests = [];
  page.on('request', request => { if (/fonts\.(googleapis|gstatic)\.com/.test(request.url())) remoteFontRequests.push(request.url()); });
  const url = `${origin}/?project=${store.projectId}#project/${store.projectId}`;
  const preview = () => page.evaluateHandle(() => document.querySelector('hyperframes-player').shadowRoot.querySelector('iframe').contentDocument);
  const selectTitle = async () => {
    await page.waitForFunction(() => !!document.querySelector('hyperframes-player')?.shadowRoot?.querySelector('iframe')?.contentDocument?.querySelector('#title'));
    await page.evaluate(() => Array.from(document.querySelectorAll('.hf-dock-side-rail')).find(rail => rail.getBoundingClientRect().left > innerWidth / 2)?.querySelector('.hf-dock-side-rail-items button')?.click());
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    // A saved project can replace its initial preview while fonts finish loading.
    for (let attempt = 0; attempt < 3; attempt++) {
      const at = await page.evaluate(async () => {
        const frame = document.querySelector('hyperframes-player').shadowRoot.querySelector('iframe');
        await frame.contentDocument.fonts.ready;
        const box = frame.getBoundingClientRect(), scale = box.width / frame.contentWindow.innerWidth;
        const rect = frame.contentDocument.querySelector('#title').getBoundingClientRect();
        return { x: box.left + (rect.left + rect.width / 2) * scale, y: box.top + (rect.top + rect.height / 2) * scale };
      });
      await page.mouse.click(at.x, at.y);
      if (await page.waitForSelector('[data-flat-font-trigger]', { timeout: 1500 }).catch(() => null)) return;
    }
    throw new Error('The loaded title could not be selected');
  };
  const choose = async family => {
    console.log('Choosing font:', family);
    await page.waitForSelector('[data-flat-font-trigger]:not(:disabled)');
    await page.click('[data-flat-font-trigger]');
    await page.locator('input[role="combobox"]').fill(family);
    await page.waitForFunction(family => Array.from(document.querySelectorAll('[data-font-option-index]')).some(el => el.querySelector('span[title]')?.title === family), {}, family);
    const item = await page.evaluateHandle(family => Array.from(document.querySelectorAll('[data-font-option-index]')).find(el => el.querySelector('span[title]')?.title === family), family);
    await item.asElement().click();
  };
  const applied = async family => {
    console.log('Waiting for applied font:', family);
    await page.waitForFunction(family => document.querySelector('[data-flat-font-trigger]')?.textContent.includes(family), {}, family);
    await page.waitForSelector('[data-flat-font-trigger]:not(:disabled)');
    await page.waitForFunction(() => !document.querySelector('input[role="combobox"]'));
    await (await preview()).evaluate(async doc => {
      const title = doc.querySelector('#title'), style = doc.defaultView.getComputedStyle(title);
      await doc.fonts.load(`${style.fontWeight} ${style.fontSize} ${style.fontFamily}`, title.textContent);
    });
    await page.waitForFunction(() => !/Saving|正在保存/.test(document.body.innerText));
    await page.waitForFunction(async ({ family, id }) => {
      const data = await (await fetch(`/api/projects/${id}/files/index.html`)).json();
      return new DOMParser().parseFromString(data.content, 'text/html').querySelector('#title')?.style.fontFamily.includes(family);
    }, {}, { family, id: store.projectId });
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  };
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await selectTitle();
  for (const font of results.fonts) {
    await choose(font.family); await applied(font.family);
    await page.waitForFunction(family => document.querySelector('hyperframes-player').shadowRoot.querySelector('iframe').contentDocument.querySelector('#title').style.fontFamily.includes(family), {}, font.family);
    const source = await readFile(entry, 'utf8');
    assert.ok(source.includes('data-hf-studio-fonts="true"'));
    assert.ok(source.includes(font.family));
    const { root: dom } = await client.send('DOM.getDocument', { depth: -1, pierce: true });
    const findTitle = node => node.attributes?.some((value, index) => value === 'id' && node.attributes[index + 1] === 'title') ? node : [...node.children ?? [], ...node.shadowRoots ?? [], ...node.contentDocument ? [node.contentDocument] : []].map(findTitle).find(Boolean);
    const title = findTitle(dom);
    assert.ok(title, 'CDP sees the rendered title');
    const rendered = (await client.send('CSS.getPlatformFontsForNode', { nodeId: title.nodeId })).fonts;
    assert.ok(rendered.some(face => face.postScriptName === font.postscriptName && face.isCustomFont && face.glyphCount > 0), JSON.stringify(rendered));
    font.rendered = rendered;
  }
  await capture('local-font.png');
  const before = await readFile(entry, 'utf8');
  console.log('Reopening local font');
  await page.reload({ waitUntil: 'domcontentloaded' }); await selectTitle();
  await applied(results.fonts.at(-1).family);
  assert.equal(await readFile(entry, 'utf8'), before);
  results.reopen = true;

  const current = results.fonts.at(-1).family;
  console.log('Rejecting invalid import');
  await page.click('[data-flat-font-trigger]');
  let input = await page.$('input[type="file"][accept*=".ttf"]');
  const bad = path.join(output, 'Broken.ttf'); await writeFile(bad, 'not a font');
  await input.uploadFile(bad);
  await page.waitForFunction(() => document.body.innerText.includes('current font was kept'));
  assert.ok(await page.$eval('[data-flat-font-trigger]', (el, current) => el.textContent.includes(current), current));
  assert.equal((await readdir(assets)).some(file => file.includes('Broken')), false);
  await capture('invalid-font.png');
  results.invalidRejectedBeforeUpload = true;
  await page.keyboard.press('Escape');

  const projectFonts = (await (await fetch(`${origin}/api/projects/${store.projectId}`)).json()).fonts;
  const largeFont = projectFonts.find(font => font.family === 'Songti SC');
  if (largeFont) {
    console.log('Importing a large CJK font file');
    await page.click('[data-flat-font-trigger]');
    input = await page.$('input[type="file"][accept*=".ttf"]');
    await input.uploadFile(path.join(store.projectDirectory, largeFont.path));
    await applied(largeFont.family);
    results.largeCjkFileImport = true;
  }

  await page.click('[data-flat-font-trigger]'); input = await page.$('input[type="file"][accept*=".ttf"]');
  console.log('Importing a valid font');
  await input.uploadFile(path.join(ownedFonts, 'Geist-Bold.ttf')); await applied('Geist');
  const importedSource = await readFile(entry, 'utf8');
  assert.match(importedSource, /font-weight: 700/);
  await page.reload({ waitUntil: 'domcontentloaded' }); await selectTitle(); await applied('Geist');
  const listing = await (await fetch(`${origin}/api/projects/${store.projectId}`)).json();
  assert.ok(listing.fonts.some(font => font.family === 'Geist' && font.weight === '700'));
  results.importedMetadataSurvivesReopen = true;

  await choose('Project Brand'); await applied('Project Brand');
  assert.ok((await readFile(entry, 'utf8')).includes('Project Brand'));
  await capture('material-font.png');
  await page.click('[data-flat-font-trigger]');
  const remote = ['Pacifico', 'Roboto Slab', 'ABeeZee'].find(family => !families.includes(family));
  if (remote) {
    await page.locator('input[role="combobox"]').fill(remote);
    assert.equal(await page.$$eval('[data-font-option-index]', elements => elements.length), 0);
  }
  await page.keyboard.press('Escape');
  assert.deepEqual(remoteFontRequests, []);
  results.noRemoteSuggestionsOrRequests = true;
  await choose(results.fonts.at(-1).family); await applied(results.fonts.at(-1).family);
  await writeFile(path.join(output, 'saved-index.html'), await readFile(entry));
  await writeFile(path.join(output, 'browser-result.json'), JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results));

  if (process.env.FONT_E2E_RENDER === '1') {
    const render = await new Promise(resolve => {
      const child = spawn(process.execPath, [path.join(root, 'node_modules/hyperframes/bin/hyperframes.mjs'), 'render', store.projectDirectory, '--output', path.join(output, 'font-test.mp4'), '--workers', '1', '--quality', 'draft', '--experimental-fast-capture=false', '--json'], { cwd: root, env: process.env });
      let stdout = '', stderr = '';
      child.stdout.on('data', data => { stdout += data; }); child.stderr.on('data', data => { stderr += data; });
      child.on('close', code => resolve({ code, stdout, stderr }));
    });
    await writeFile(path.join(output, 'render.log'), render.stdout + render.stderr);
    assert.equal(render.code, 0, render.stderr);
    results.rendered = true;
    await writeFile(path.join(output, 'browser-result.json'), JSON.stringify(results, null, 2));
  }
} catch (error) {
  const page = (await browser?.pages())?.at(-1);
  if (page) { await page.screenshot({ path: path.join(output, 'failure.png') }); await writeFile(path.join(output, 'failure-text.txt'), await page.evaluate(() => document.body.innerText)); }
  throw error;
} finally {
  await browser?.close(); server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); await native.close();
}
