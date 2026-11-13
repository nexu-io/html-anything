import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import puppeteer from 'puppeteer-core';
import { WorkspaceStore } from '../workspace.ts';
import { gatewayFor } from '../gateway/service.ts';
import { startServer } from '../server.ts';
import { pluginRoot } from '../hyperframes.ts';

const output = process.argv[2];
assert(output && path.isAbsolute(output), 'Pass an absolute evidence directory');
assert(process.env.D4_LANE && process.env.PLAYWRIGHT_WEB_PORT, 'Run with browser-lock.sh');
await mkdir(output, { recursive: true });
const data = await mkdtemp(path.join(tmpdir(), 'motion-byok-browser-'));
const store = new WorkspaceStore(data);
let browser, running;
try {
  await store.initialize(pluginRoot);
  await gatewayFor(store).configureProvider('opendesign', { apiKey: 'browser-fixture-cloud-key', baseUrl: 'https://cloud.example' });
  gatewayFor(store).options.detect = async () => [];
  running = await startServer(store, Number(process.env.PLAYWRIGHT_WEB_PORT), { editor: true });
  const origin = (await running.info()).previewUrl;
  browser = await puppeteer.launch({ executablePath: process.env.HYPERFRAMES_BROWSER_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true,
    userDataDir: path.join(data, 'browser'), args: ['--no-first-run'] });
  const page = await browser.newPage(); page.on('pageerror', error => console.error('Browser error: ' + error.message)); await page.setViewport({ width: 1280, height: 850 });
  await page.evaluateOnNewDocument(() => { localStorage.setItem('motion.studio.locale', 'en'); });
  await page.goto(origin, { waitUntil: 'domcontentloaded' });
  await (await page.waitForSelector('[aria-label="Open project list"]')).click();
  await (await page.waitForSelector('.motion-byok-entry')).click();
  await page.waitForSelector('dialog[open] [aria-label="fal.ai API key"]');
  await page.screenshot({ path: path.join(output, 'providers-empty.png') });
  assert.equal(await page.$$eval('dialog[open] input[type=checkbox]', nodes => nodes.length), 0);
  await page.type('[aria-label="fal.ai API key"]', 'browser-fixture-fal-key');
  const saved = page.waitForResponse(response => response.url().endsWith('/models/providers/fal') && response.request().method() === 'PUT');
  await page.click('dialog[open] article:has([aria-label="fal.ai API key"]) button[type=submit], dialog[open] article:has([aria-label="fal.ai API key"]) form button:not([type])');
  assert.equal((await saved).status(), 200);
  await page.waitForFunction(() => document.querySelector('[aria-label="fal.ai API key"]').value === '' && document.querySelector('dialog[open] article:has([aria-label="fal.ai API key"])').textContent.includes('Configured'));
  assert.equal(await page.$$eval('dialog[open] .motion-provider-card', nodes => nodes.length), 3);
  assert.equal((await page.$eval('dialog[open]', node => node.textContent)).includes('OpenDesign Cloud'), false);
  for (const [id, label] of [['atlascloud', 'Atlas Cloud'], ['wavespeed', 'WaveSpeedAI']]) {
    const input = `[aria-label="${label} API key"]`;
    await page.type(input, `browser-fixture-${id}-key`);
    const saved = page.waitForResponse(response => response.url().endsWith(`/models/providers/${id}`) && response.request().method() === 'PUT');
    await page.click(`dialog[open] article:has(${input}) form button:not([type])`);
    assert.equal((await saved).status(), 200);
    await page.waitForFunction(selector => document.querySelector(selector).value === '', {}, input);
    const guide = await page.evaluate(async provider => (await fetch(`/motion-api/models/providers/${provider}/reference`)).text(), id);
    assert(guide.includes(id === 'atlascloud' ? 'atlascloud.ai/docs/' : 'wavespeed.ai/docs/'));
  }
  const status = await page.evaluate(async () => (await fetch('/motion-api/models/capabilities')).json());
  assert(status.providers.find(p => p.id === 'fal').enabled); assert(status.providers.find(p => p.id === 'opendesign').enabled);
  assert(status.providers.find(p => p.id === 'atlascloud').enabled); assert(status.providers.find(p => p.id === 'wavespeed').enabled);
  assert(!JSON.stringify(status).includes('browser-fixture-'));
  const guide = await page.evaluate(async () => (await fetch('/motion-api/models/providers/fal/reference')).text());
  assert(guide.includes('https://fal.ai/docs/'));
  assert.equal((await page.evaluate(() => document.body.innerText)).includes('browser-fixture-'), false);
  assert.equal(await page.$$eval('dialog[open] details', nodes => nodes.length), 0);
  await page.screenshot({ path: path.join(output, 'providers-configured.png') });
  await page.setViewport({ width: 360, height: 800 });
  assert(await page.evaluate(() => { const el = document.querySelector('dialog[open]'); const box = el.getBoundingClientRect(); return box.left >= 0 && box.right <= innerWidth && el.scrollWidth <= el.clientWidth; }));
  await page.screenshot({ path: path.join(output, 'providers-mobile.png') });
  await page.keyboard.press('Escape'); await page.waitForSelector('dialog[open]', { hidden: true });
  await page.setViewport({ width: 1280, height: 850 });
  await (await page.waitForSelector('[aria-label="Open project list"]')).click();
  await (await page.waitForSelector('[aria-label="Switch to dark theme"]')).click();
  await page.waitForFunction(() => document.documentElement.dataset.theme !== 'paper' && !document.documentElement.dataset.themeReveal);
  await page.evaluate(async () => { await Promise.allSettled(document.getAnimations().filter(animation => animation.effect?.pseudoElement?.startsWith('::view-transition')).map(animation => animation.finished)); await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))); });
  await page.waitForFunction(() => { const button = document.querySelector('.motion-byok-entry'); if (!button) return false; const box = button.getBoundingClientRect(); return button.contains(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2)); });
  await (await page.waitForSelector('.motion-byok-entry')).click();
  try { await page.waitForSelector('dialog[open] [aria-label="fal.ai API key"]', { timeout: 5000 }); }
  catch (error) {
    await page.screenshot({ path: path.join(output, 'reopen-failure.png') });
    console.log(await page.evaluate(() => ({ dialogs: [...document.querySelectorAll('dialog')].map(d => ({ open: d.open, text: d.innerText })), buttons: [...document.querySelectorAll('.motion-byok-entry')].map(b => ({ text: b.textContent, rect: b.getBoundingClientRect().toJSON() })), focus: document.activeElement?.outerHTML })));
    throw error;
  }
  await page.evaluate(async () => { const dialog = document.querySelector('dialog[open]'); await Promise.allSettled(document.getAnimations().filter(animation => animation.effect?.target === dialog).map(animation => animation.finished)); });
  await page.screenshot({ path: path.join(output, 'providers-dark.png') });
  await page.keyboard.press('Escape'); await page.waitForSelector('dialog[open]', { hidden: true });
  const credentials = JSON.parse(await readFile(path.join(data, 'model-gateway/secrets.json'), 'utf8'));
  assert.equal(credentials.fal, 'browser-fixture-fal-key');
  await writeFile(path.join(output, 'result.json'), JSON.stringify({ status: 'passed', lane: process.env.D4_LANE, checks: ['drawer settings entry', 'fal key save', 'Cloud settings hidden with saved credentials preserved', 'Atlas key save', 'WaveSpeed key save', 'no model catalogue', 'auto-enable', 'masked and cleared inputs', 'no key in status', 'provider guide', 'narrow layout', 'dark theme', 'reopen persisted settings', 'Escape closes dialog'], paidCalls: false }, null, 2));
  console.log('BYOK browser configuration checks passed; no provider requests were made.');
} finally { await browser?.close(); await running?.close(); await gatewayFor(store).close(); await rm(data, { recursive: true, force: true }); }
