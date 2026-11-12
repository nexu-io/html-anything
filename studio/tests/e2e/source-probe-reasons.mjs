// Run under the shared browser-lock lane and real lock. Owns an isolated project and native Studio.
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { WorkspaceStore } from '../../../workspace.ts';
import { pluginRoot } from '../../../hyperframes.ts';
import { startServer } from '../../../server.ts';
import { launchStudioChrome } from './chrome-executable.mjs';
import { installWebMcpHost } from './webmcp-host.mjs';

const evidence = process.env.EVIDENCE_DIR || await mkdtemp(path.join(tmpdir(), 'motion-source-probe-evidence-'));
await mkdir(evidence, { recursive: true });
const directory = await mkdtemp(path.join(tmpdir(), 'motion-source-probe-'));
const store = new WorkspaceStore(directory);
let server, browser;
const results = {};
try {
  await store.initialize(pluginRoot);
  const index = path.join(store.projectDirectory, 'index.html');
  await writeFile(index, `<!doctype html><html><head><meta charset="utf-8"><script src="assets/gsap.min.js"></script>
<style>html,body{margin:0;width:1920px;height:1080px;background:#101418;color:white;font-family:Arial}#main{position:relative;width:1920px;height:1080px}#target,#dynamic{position:absolute;left:180px;top:180px;width:550px;height:240px;background:#2463eb;display:grid;place-items:center;font-size:52px}#static-svg{position:absolute;left:1050px;top:180px;width:550px;height:240px}#dynamic{top:600px;background:#6d28d9}</style></head>
<body><div id="main" data-composition-id="main" data-width="1920" data-height="1080" data-duration="7">
<div id="target">可编辑元素</div><svg id="static-svg" viewBox="0 0 550 240"><rect width="550" height="240" fill="#0891b2"/><text x="90" y="140" fill="white" font-size="44">静态 SVG</text></svg></div>
<script>const dynamic=document.createElement('div');dynamic.id='dynamic';dynamic.textContent='动态生成元素';document.getElementById('main').appendChild(dynamic);window.__timelines={main:gsap.timeline({paused:true}).to({}, {duration:7})};</script></body></html>`);
  server = await startServer(store, Number(process.env.D4_LANE_PREVIEW_PORT || 0));
  const url = (await server.info()).studioUrl;
  ({ browser } = await launchStudioChrome());
  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1000 });
  await page.evaluateOnNewDocument(installWebMcpHost, '__sourceProbe');
  await page.evaluateOnNewDocument(() => localStorage.setItem('motion.studio.locale', 'zh-CN'));
  const call = (name, input) => page.evaluate((name, input) => window.__sourceProbe.call(name, input), name, input);
  const wait = async predicate => {
    const deadline = Date.now() + 20_000;
    while (Date.now() < deadline) {
      if (await predicate()) return;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    throw new Error('Expected state did not settle');
  };
  const open = async () => {
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.__sourceProbe?.has('studio_look'), { timeout: 90_000 });
    await wait(async () => (await call('studio_seek', { time: 1 })).ok);
  };
  const handle = async label => {
    let found;
    await wait(async () => {
      found = (await call('studio_look', { limit: 100 })).elements?.find(element => element.label === label)?.handle;
      return found;
    });
    return found;
  };
  const color = () => page.evaluate(() => {
    const iframe = document.querySelector('hyperframes-player')?.shadowRoot?.querySelector('iframe');
    const element = iframe?.contentDocument?.getElementById('target');
    return element ? iframe.contentWindow.getComputedStyle(element).backgroundColor : null;
  });
  await open();
  const target = await handle('Target');
  assert.equal((await call('studio_inspect', { handle: target })).can.editStyles, true);
  const before = await readFile(index, 'utf8');
  results.save = await call('studio_set_style', { handle: target, styles: { backgroundColor: '#e11d48' } });
  assert.equal(results.save.ok, true, JSON.stringify(results.save));
  await wait(async () => (await readFile(index, 'utf8')) !== before);
  const saved = await readFile(index, 'utf8');
  await open();
  await wait(async () => await color() === 'rgb(225, 29, 72)');
  results.refreshAfterSave = true;
  await page.keyboard.down('Control'); await page.keyboard.press('z'); await page.keyboard.up('Control');
  await wait(async () => (await readFile(index, 'utf8')) === before);
  await wait(async () => await color() === 'rgb(36, 99, 235)');
  results.undo = true;
  await open();
  await wait(async () => await color() === 'rgb(36, 99, 235)');
  results.refreshAfterUndo = true;
  await page.screenshot({ path: path.join(evidence, 'save-refresh-undo.png') });

  for (const [label, id, reason, text] of [
    ['Static Svg', 'static-svg', 'cannot be edited visually yet', '暂不支持直接编辑此类元素'],
    ['Dynamic', 'dynamic', 'not found in the current source', '在当前源码中找不到此元素'],
  ]) {
    const current = await handle(label);
    const inspected = await call('studio_inspect', { handle: current });
    assert.equal(inspected.can.editStyles, false);
    assert.ok(inspected.can.reasonIfDisabled.includes(reason), JSON.stringify(inspected));
    assert.equal((await call('studio_select', { handle: current })).ok, true);
    await page.waitForSelector('[data-dom-edit-selection-box="true"]');
    await page.click('[data-dom-edit-selection-box="true"]');
    await page.waitForFunction(text => document.body.innerText.includes(text), {}, text);
    await new Promise(resolve => setTimeout(resolve, 450));
    await page.screenshot({ path: path.join(evidence, `${id}-reason.png`) });
    assert.equal(await readFile(index, 'utf8'), before, 'Blocked selection must not write source');
    results[id] = inspected.can.reasonIfDisabled;
    await page.waitForFunction(text => !document.body.innerText.includes(text), {}, text);
  }
  results.savedSourceChanged = saved !== before;
  await writeFile(path.join(evidence, 'browser-result.json'), JSON.stringify({ status: 'PASS', results }, null, 2));
  console.log(JSON.stringify({ status: 'PASS', evidence, results }, null, 2));
} catch (error) {
  await writeFile(path.join(evidence, 'browser-result.json'), JSON.stringify({ status: 'FAIL', error: error.stack, results }, null, 2));
  if (browser) await (await browser.pages()).at(-1)?.screenshot({ path: path.join(evidence, 'failure.png') });
  throw error;
} finally {
  await browser?.close();
  await server?.close();
  await rm(directory, { recursive: true, force: true });
}
