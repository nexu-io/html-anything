import { expect, it } from 'vitest';
import { translate } from './I18n';
import { importValidationMessage } from './importMessages';
import { splitFailureMessage } from './editorErrors';

it('distinguishes invalid media, missing tracks and unavailable validation in both languages', () => {
  const reasons = [
    'ffprobe failed to read the media file', 'no supported video stream found',
    'no supported audio stream found', 'ffprobe returned unreadable media metadata',
    'HYPERFRAMES_FFPROBE_PATH names "/missing", which cannot run: fix it or unset it',
    'not checked: ffprobe was not found. Install FFmpeg or set HYPERFRAMES_FFPROBE_PATH.',
    'unexpected backend details',
  ];
  const zh = reasons.map(reason => importValidationMessage(reason, (m, v) => translate('zh-CN', m, v)));
  const en = reasons.map(reason => importValidationMessage(reason, (m, v) => translate('en', m, v)));
  expect(new Set(zh).size).toBe(reasons.length);
  for (const message of zh) expect(message).not.toMatch(/[A-Za-z]/);
  for (const message of en) expect(message).not.toMatch(/[\u4e00-\u9fff]/);
  expect(zh[5]).toContain('文件已添加');
  expect(zh[0]).toContain('文件完整');
});

it('preserves split failure distinctions without exposing raw server errors', () => {
  const reasons = [
    'Cut conflict: version changed', 'Failed to read index.html before cut (503)',
    'Missing content version for index.html', 'Clip is missing a patchable target.',
    'Cut aborted with rollback conflicts', 'Cut failed: internal server error',
  ];
  const messages = reasons.map(reason => splitFailureMessage(new Error(reason)));
  expect(messages[4]).toContain('could not be rolled back safely');
  expect(messages[0]).toContain('project changed');
  for (const message of messages) {
    expect(translate('zh-CN', message)).not.toBe(message);
    expect(translate('en', message)).toBe(message);
  }
});
