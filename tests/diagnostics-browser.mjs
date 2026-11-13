import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import puppeteer from 'puppeteer-core';
import { WorkspaceStore } from '../workspace.ts';
import { handler } from '../server.ts';
import { pluginRoot } from '../hyperframes.ts';
import { runFile } from '../scripts/runtime-assets.mjs';

const output = process.argv[2];
assert(output && path.isAbsolute(output), 'Pass an absolute evidence directory');
assert(process.env.D4_LANE && process.env.PLAYWRIGHT_WEB_PORT, 'Run with the shared browser-lock.sh wrapper');
await mkdir(output, { recursive: true });
const downloads = path.join(output, 'downloads'); await mkdir(downloads);
const data = await mkdtemp(path.join(tmpdir(), 'motion-diagnostic-browser-'));
const store = new WorkspaceStore(data), context = { nativeRoot: pluginRoot };
const server = createServer((req, res) => { void handler(req, res, store, context); });
let browser;
try {
  await store.initialize(pluginRoot);
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(Number(process.env.PLAYWRIGHT_WEB_PORT), '127.0.0.1', resolve); });
  const origin = `http://127.0.0.1:${server.address().port}`;
  browser = await puppeteer.launch({ executablePath: process.env.HYPERFRAMES_BROWSER_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true,
    userDataDir: path.join(data, 'browser'), args: ['--no-first-run'] });
  const page = await browser.newPage(); await page.setViewport({ width: 1280, height: 850 });
  await page.evaluateOnNewDocument(() => { localStorage.setItem('motion.studio.locale', 'en'); });
  const client = await page.createCDPSession();
  await client.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: downloads });
  await page.goto(origin, { waitUntil: 'networkidle0' });
  const menu = await page.waitForSelector('[aria-label="Open project list"]'); await menu.click();
  await (await page.waitForSelector('[aria-label="Privacy settings"]')).click();
  await page.waitForSelector('dialog[open] .motion-diagnostic-export button');
  await page.evaluate(() => window.dispatchEvent(new ErrorEvent('error', { message: 'api_key=fixture-browser-secret', error: new Error('api_key=fixture-browser-secret') })));
  await page.waitForFunction(() => localStorage.getItem('motion.local-diagnostics.v1')?.includes('redacted'));
  await page.screenshot({ path: path.join(output, 'privacy-diagnostic-export.png') });
  const persistedDownload = page.waitForResponse(response => response.url() === origin + '/motion-api/diagnostics/events'
    && response.request().postData()?.includes('download_triggered'), { timeout: 15000 });
  const response = page.waitForResponse(response => response.url() === origin + '/motion-api/diagnostics' && response.request().method() === 'POST');
  await page.click('dialog[open] .motion-diagnostic-export button');
  assert.equal((await response).status(), 200);
  await page.waitForFunction(() => document.querySelector('.motion-diagnostic-export [role=status]')?.textContent.includes('Download started. Check your browser downloads.'));
  let archive;
  for (let attempt = 0; attempt < 40; attempt++) {
    archive = (await readdir(downloads)).find(file => file.endsWith('.zip'));
    if (archive) break;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert(archive, 'Chrome must actually save the ZIP');
  const zipFile = path.join(downloads, archive);
  assert.match(await runFile('unzip', ['-t', zipFile]), /No errors detected/);
  assert(!(await readFile(zipFile)).includes(Buffer.from('fixture-browser-secret')));
  const metadata = JSON.parse(await runFile('unzip', ['-p', zipFile, 'metadata.json']));
  assert.equal(metadata.platform, process.platform);
  const activity = JSON.parse(await runFile('unzip', ['-p', zipFile, 'browser-activity.json']));
  assert(activity.some(event => event.kind === 'activity_session' && event.message.includes('browser=Chrome/')));
  assert(activity.some(event => event.kind === 'activity_diagnostic_export' && event.message.includes('outcome=started')));
  assert(activity.some(event => event.kind === 'activity_summary'));
  await page.setViewport({ width: 360, height: 800 });
  assert(await page.evaluate(() => { const dialog = document.querySelector('dialog[open]'); const bounds = dialog.getBoundingClientRect(); return bounds.left >= 0 && bounds.right <= innerWidth && dialog.scrollWidth <= dialog.clientWidth; }), 'Download feedback and filename must fit a narrow dialog');
  await page.screenshot({ path: path.join(output, 'diagnostic-success-narrow.png') });
  await page.click('dialog[open] .motion-diagnostic-export button');
  await page.waitForFunction(() => document.querySelector('.motion-diagnostic-export [role=alert]')?.textContent.includes('30 seconds'));
  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }]);
  await page.setViewport({ width: 540, height: 800 });
  assert(await page.evaluate(() => { const bounds = document.querySelector('dialog[open]').getBoundingClientRect(); return bounds.left >= 0 && bounds.right <= innerWidth; }));
  await page.screenshot({ path: path.join(output, 'diagnostic-rate-limit-narrow.png') });
  assert.equal((await persistedDownload).status(), 200);
  await browser.close(); browser = undefined;
  server.closeAllConnections(); await new Promise(resolve => server.close(resolve));
  const offline = path.join(output, 'offline-cli.zip');
  await runFile(process.execPath, ['scripts/diagnostics.mjs', '--data-dir', data, '--output', offline]);
  const log = await runFile('unzip', ['-p', offline, 'logs/diagnostics/events.log']);
  assert(log.includes('unhandled_error') && !log.includes('fixture-browser-secret'));
  assert(log.includes('archive_received') && log.includes('download_triggered') && log.includes('diagnostic_export_failed'));
  await writeFile(path.join(output, 'result.json'), JSON.stringify({ status: 'passed', scope: 'real Chrome + workspace HTTP handler + offline CLI; no native renderer or real host installation',
    checks: ['privacy download', 'actual ZIP integrity', 'default redaction', 'repeat-click limit', 'narrow dialog', 'offline CLI retains browser error'], archive, metadata }, null, 2));
  console.log('PASS real Chrome download, redaction, throttling, narrow layout and offline CLI');
} finally {
  await browser?.close(); server.closeAllConnections(); server.close(); await rm(data, { recursive: true, force: true });
}
