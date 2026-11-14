import test from 'node:test';
import assert from 'node:assert/strict';
import { Window } from 'happy-dom';
import { mountFinalVideo } from '../web/final-video-component.js';

const work = { id: 'round', projectId: 'project', versionId: 'v4', jobId: 'job', sha256: 'a'.repeat(64),
  title: 'Final film', state: 'completed', playable: true };
const reply = (changes = {}) => ({ structuredContent: { projectId: work.projectId, inlineWork: { ...work, ...changes } },
  _meta: { inlineVideo: { video: 'data:video/mp4;base64,YQ==' } } });

test('only a completed decoded MP4 expands the final player and shows actual duration', async () => {
  const window = new Window(), root = window.document.createElement('main');
  window.document.body.append(root);
  const ui = mountFinalVideo(root, { callServerTool: async () => reply() });
  try {
    ui.update(reply({ state: 'authoring', playable: false }));
    assert.equal(root.querySelector<HTMLElement>('.screen')!.hidden, true);
    assert.equal(root.querySelector('video')!.src, '');
    ui.update({ content: [{ type: 'text', text: JSON.stringify(reply()) }] });
    const video = root.querySelector('video')!;
    assert.match(video.src, /^blob:/);
    assert.equal(root.querySelector<HTMLElement>('.screen')!.hidden, true, 'Wait for actual decoding');
    for (const [name, value] of Object.entries({ duration: 15, videoWidth: 1920, videoHeight: 1080 }))
      Object.defineProperty(video, name, { configurable: true, value });
    video.dispatchEvent(new window.Event('loadeddata'));
    assert.equal(root.querySelector<HTMLElement>('.screen')!.hidden, false);
    assert.equal(root.querySelector('.duration')!.textContent, '片长 0:15');
    assert.match(root.querySelector('.status')!.textContent!, /可播放/);
    ui.update(reply({ jobId: 'unrelated-job', title: 'Other film' }));
    assert.equal(root.querySelector('.title')!.textContent, 'Final film');
    assert.match(root.querySelector('.status')!.textContent!, /不匹配/);
    video.dispatchEvent(new window.Event('loadeddata'));
    assert.equal(root.querySelector<HTMLElement>('.screen')!.hidden, true, 'A late media event must not override a rejected result');
  } finally { ui.destroy(); await window.happyDOM.abort(); }
});

test('bad or missing final media remains compact with recovery, never a fake ready player', async () => {
  const window = new Window(), root = window.document.createElement('main');
  const ui = mountFinalVideo(root, { callServerTool: async () => reply() });
  try {
    ui.update({ structuredContent: reply().structuredContent });
    assert.equal(root.querySelector<HTMLElement>('.screen')!.hidden, true);
    assert.equal(root.querySelector<HTMLButtonElement>('.retry')!.hidden, false);
    ui.update(reply());
    root.querySelector('video')!.dispatchEvent(new window.Event('error'));
    assert.match(root.querySelector('.status')!.textContent!, /播放失败/);
    assert.equal(root.querySelector<HTMLElement>('.screen')!.hidden, true);
  } finally { ui.destroy(); await window.happyDOM.abort(); }
});
