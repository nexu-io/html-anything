import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeInlineResult } from '../shared/inline-video-result.js';

const work = { projectId: 'project-a', inlineWork: { id: 'work-a', projectId: 'project-a', versionId: 'version-a', jobId: 'job-a', sha256: 'a'.repeat(64), playable: true } };
const media = { video: 'data:video/mp4;base64,QUFBQQ==', poster: 'data:image/jpeg;base64,QkJCQg==' };
const canonical = () => ({ structuredContent: work, _meta: { inlineVideo: media }, content: [{ type: 'text', text: JSON.stringify(work) }] });
const wrap = (value: any) => ({ content: [{ type: 'text', text: JSON.stringify(value) }] });

test('canonical and observed one/two-layer envelopes retain media privately and produce identical visible work', () => {
  for (const value of [canonical(), wrap(canonical()), wrap(wrap(canonical())), { structuredContent: { ...work, _inlineMedia: media } }]) {
    const normalized = normalizeInlineResult(value);
    assert.deepEqual(normalized.structuredContent, work);
    assert.deepEqual(normalized._meta.inlineVideo, media);
    assert.ok(!JSON.stringify(normalized.structuredContent).includes('base64'));
    assert.ok(!normalized.content[0].text.includes('base64'));
    assert.ok(!normalized.content[0].text.includes('_meta'));
  }
});

test('outer/inner errors remain errors, never a false successful status', () => {
  assert.equal(normalizeInlineResult({ ...wrap(canonical()), isError: true }).isError, true);
  assert.equal(normalizeInlineResult(wrap({ ...canonical(), isError: true })).isError, true);
  const error = normalizeInlineResult({ isError: true, content: [{ type: 'text', text: 'a provider error with data:video/mp4;base64,AAAA' }] });
  assert.equal(error.isError, true);
  assert.equal(error.structuredContent.error.code, 'TOOL_FAILED');
  assert.ok(!error.content[0].text.includes('base64'));
});

test('malformed, unknown, too-deep, ambiguous, conflicting or cross-work envelopes fail explicitly', () => {
  const other = { ...work, inlineWork: { ...work.inlineWork, id: 'work-b' } };
  for (const value of [{}, { content: [{ type: 'text', text: '{bad' }] }, wrap(wrap(wrap(canonical()))),
    { content: [...wrap(canonical()).content, ...wrap(canonical()).content] },
    { structuredContent: work, content: [{ type: 'text', text: JSON.stringify(other) }] },
    { structuredContent: { ...work, projectId: 'project-b' } },
    { ...canonical(), _meta: { inlineVideo: { video: 'https://untrusted.example/video.mp4' } } }]) {
    assert.throws(() => normalizeInlineResult(value), /INLINE_RESULT_INVALID/);
  }
});

test('nested supported private fields are removed before any visible serialization', () => {
  const normalized = normalizeInlineResult({ structuredContent: { projectId: 'project-a', detail: { _meta: { inlineVideo: media }, status: 'ready' } } });
  assert.deepEqual(normalized.structuredContent, { projectId: 'project-a', detail: { status: 'ready' } });
  assert.deepEqual(normalized._meta.inlineVideo, media);
  assert.ok(!normalized.content[0].text.includes('base64'));
});
