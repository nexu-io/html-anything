import test from 'node:test';
import assert from 'node:assert/strict';
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { JSDOM } from 'jsdom';
import { copyTemplate } from '../template-library.ts';
import { pluginRoot } from '../hyperframes.ts';
import { renderNext } from '../server.ts';
import { fixture } from './fixtures.ts';

test('the unchanged decision-tree template exports a verified 1080p MP4', { timeout: 180_000 }, () => fixture(async store => {
  await copyTemplate('decision-tree', store.projectDirectory, pluginRoot);
  const before = await store.get();
  const job = await store.requestExport(before.revision, { phase1: true, audio: 'silent' });
  await renderNext(store, pluginRoot);
  const completed = (await store.job(job.id))!;
  const evidence = process.env.OPENMOTION_DECISION_TREE_EVIDENCE;
  if (evidence) {
    await mkdir(evidence, { recursive: true });
    await writeFile(path.join(evidence, 'export.json'), JSON.stringify(completed, null, 2));
    await copyFile(path.join(store.directory, 'jobs', job.id, 'render.log'), path.join(evidence, 'render.log'));
    if (completed.file) await copyFile(path.join(store.directory, completed.file), path.join(evidence, 'decision-tree.mp4'));
  }
  assert.equal(completed.state, 'completed', JSON.stringify(completed));
  assert.deepEqual(completed.expected, { width: 1920, height: 1080, fps: 30, duration: 10, audio: 'silent' });
  assert.equal((completed.verification as any).status, 'passed', JSON.stringify(completed.verification));
  assert.equal((await store.get()).revision, before.revision, 'export must preserve the template source');
}, false));

test('the decision-tree selection follows playback, seeking, replay and loops', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'motion-decision-tree-'));
  const dom = new JSDOM('<!doctype html><body><div class="selection-border" style="opacity:0.4"></div></body>', {
    runScripts: 'outside-only',
    pretendToBeVisual: true,
  });
  try {
    await copyTemplate('decision-tree', directory, pluginRoot);
    const source = await readFile(path.join(directory, 'compositions/decision_tree.html'), 'utf8');
    dom.window.document.body.insertAdjacentHTML('beforeend', source);
    const template = dom.window.document.querySelector('template')!;
    dom.window.document.body.appendChild(template.content.cloneNode(true));
    const script = dom.window.document.querySelector('script:not([src])')!.textContent!;
    const warnings: string[] = [];
    dom.window.console.warn = (...args) => warnings.push(args.join(' '));
    dom.window.eval(await readFile(path.join(directory, 'vendor/gsap-3.14.2/dist/gsap.min.js'), 'utf8'));
    dom.window.eval(script);
    const timeline = dom.window.__timelines['decision-tree'];
    const selectedAt = timeline.labels.hold3 + 1;
    const deselectAt = timeline.labels.hold6 + 0.3;
    const duration = timeline.duration();
    assert.equal(selectedAt, 5.45);
    assert.equal(deselectAt, 7.35);
    assert.equal(duration, 10.1);
    const borderOpacity = () => {
      const borders = dom.window.document.querySelectorAll('#node-python > .selection-border');
      assert.equal(borders.length, 1, 'playback must retain one selection border');
      return Number(dom.window.getComputedStyle(borders[0]).opacity);
    };
    const assertAt = (time: number, expected: number, suppressEvents: boolean) => {
      timeline.seek(time, suppressEvents);
      assert.equal(borderOpacity(), expected, `selection opacity at ${time}s`);
    };
    assert.equal(borderOpacity(), 0);

    // Ordinary playback must hide the border after the click-away fade.
    timeline.seek(0, false);
    for (let frame = 1; frame <= Math.ceil((deselectAt + 0.2) * 60); frame++) {
      timeline.time(frame / 60, false);
    }
    assert.equal(borderOpacity(), 0);

    // Studio scrubbing suppresses callbacks and can visit frames in either order.
    for (const suppressEvents of [true, false]) {
      assertAt(selectedAt - 0.01, 0, suppressEvents);
      assertAt(selectedAt, 1, suppressEvents);
      assertAt(deselectAt, 1, suppressEvents);
      timeline.seek(deselectAt + 0.05, suppressEvents);
      assert.ok(borderOpacity() > 0 && borderOpacity() < 1, 'deselection retains its 0.1s fade');
      assertAt(deselectAt + 0.1, 0, suppressEvents);
      assertAt(selectedAt + 0.1, 1, suppressEvents);
      assertAt(0, 0, suppressEvents);
      assertAt(duration, 0, suppressEvents);
    }

    // Reopening the composition starts with the same hidden selection.
    timeline.kill();
    dom.window.eval(script);
    const replay = dom.window.__timelines['decision-tree'];
    replay.seek(deselectAt + 0.2);
    assert.equal(borderOpacity(), 0);
    replay.restart().pause();
    assert.equal(borderOpacity(), 0);
    replay.seek(selectedAt + 0.1);
    assert.equal(borderOpacity(), 1);
    replay.repeat(1);
    replay.totalTime(duration + 0.1, false);
    assert.equal(borderOpacity(), 0);
    replay.totalTime(duration + selectedAt + 0.1, false);
    assert.equal(borderOpacity(), 1);
    replay.totalTime(duration + deselectAt + 0.2, false);
    assert.equal(borderOpacity(), 0);
    assert.equal(dom.window.document.querySelector('body > .selection-border')!.style.opacity, '0.4');
    assert.deepEqual(warnings, []);
  } finally {
    dom.window.gsap?.ticker.sleep();
    dom.window.close();
    await rm(directory, { recursive: true, force: true });
  }
});
