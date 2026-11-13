import { expect, it } from 'vitest';
import { translate } from './I18n';
import { importValidationMessage } from './importMessages';
import { splitFailureMessage } from './editorErrors';
import { systemMessage } from './systemMessages';
import { languages } from './messages';

it('localizes unavailable timeline media in every interface language', () => {
  expect(translate('zh-CN', 'Media unavailable')).toBe('素材已失效');
  for (const { locale } of languages) {
    if (locale !== 'en') expect(translate(locale, 'Media unavailable')).not.toBe('Media unavailable');
  }
});

it('localizes rejected history restores while preserving project-relative paths', () => {
  const files = 'assets/原始配乐.wav, assets/photo.png';
  const messages = [
    'VERSION_NOT_RESTORABLE: Historical files are missing, unreadable or corrupt: ' + files,
    'VERSION_NOT_RESTORABLE: Cannot stage historical file: ' + files,
  ];
  for (const { locale } of languages) for (const message of messages) {
    const localized = systemMessage(message, (key, values) => translate(locale, key, values));
    expect(localized).toContain(files);
    expect(localized).not.toContain('VERSION_NOT_RESTORABLE');
    expect(localized).not.toMatch(/\{files\}/);
    if (locale === 'zh-CN') expect(localized).toContain('当前项目保持不变');
    if (locale === 'en') expect(localized).toContain('Your current project is unchanged');
  }
});

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
