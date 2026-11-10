// @vitest-environment happy-dom
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { validProperties } from '../../../tracking/core.ts';
import { studioEvents } from '../../../tracking/events.ts';
import {
  classifyEdit, exportRejection, exportSettings, importErrorCategory, installEditorTracking, noteHistoryTrigger,
  noteImportEntry, projectFields, reportAssetImport, reportHistoryStep, reportManualEdit, resetEditorTrackingForTests,
  clickOption, compositionBucket, countBucket, durationBucket, openTemplateFields, projectScaleFields, reportEdit, reportTemplateEvent,
  setProjectInventory, setProjectTemplate, templateFields, reportSaveFailure, searchStarted, setTrackedProject, styleEditKind, takeHistoryTrigger, takeImportEntry,
  trackStudioClick, watchEditSurface, withEditKind,
} from './editorTracking';

const PROJECT = '0b8a4c1e-5d2f-4a7b-9c3d-1e2f3a4b5c6d';
const sent = vi.fn((_event: string, _properties: Record<string, unknown>) => 'queued');
const events = (name: string) => sent.mock.calls.filter(([event]) => event === name).map(([, properties]) => properties);

beforeEach(() => { sent.mockClear(); resetEditorTrackingForTests(); installEditorTracking(sent as never); });
afterEach(() => { installEditorTracking(undefined); document.body.innerHTML = ''; vi.useRealTimers(); });

function press(panel: string) {
  const host = document.createElement('div'); host.setAttribute('data-dock-panel', panel);
  const target = document.createElement('button'); host.append(target); document.body.append(host);
  target.dispatchEvent(new Event('pointerdown', { bubbles: true }));
}

it('sends a project UUID, and only a scope for the built-in project or any other id', () => {
  expect(projectFields(PROJECT)).toEqual({ project_scope: 'managed', project_id: PROJECT });
  expect(projectFields('project')).toEqual({ project_scope: 'default' });
  expect(projectFields('Q4 launch film')).toEqual({ project_scope: 'other' });
  expect(projectFields(null)).toEqual({});
});

it('maps history labels to closed categories without carrying the label text', () => {
  expect(classifyEdit('Move timeline clip')).toEqual({ edit_kind: 'timeline_move', surface: 'timeline' });
  expect(classifyEdit('Resize timeline clips')).toEqual({ edit_kind: 'timeline_trim', surface: 'timeline' });
  expect(classifyEdit('Split 2 clips at 1.50s')).toEqual({ edit_kind: 'timeline_split', surface: 'timeline' });
  expect(classifyEdit('Hide track')).toEqual({ edit_kind: 'visibility', surface: 'timeline' });
  expect(classifyEdit('Add block: Secret Client Intro')).toEqual({ edit_kind: 'add_catalog_item', surface: 'catalog' });
  expect(classifyEdit('Move layer (new keyframe)')).toEqual({ edit_kind: 'keyframe', surface: 'properties' });
  expect(classifyEdit('Move layer')).toEqual({ edit_kind: 'move', surface: 'canvas' });
  expect(classifyEdit('Edit text')).toEqual({ edit_kind: 'text', surface: 'canvas' });
  expect(classifyEdit('Edit layer style')).toEqual({ edit_kind: 'style', surface: 'properties' });
  expect(classifyEdit('Edit GSAP opacity')).toEqual({ edit_kind: 'animation', surface: 'properties' });
  expect(classifyEdit('Reorder layers')).toEqual({ edit_kind: 'layer_order', surface: 'layers' });
  expect(classifyEdit('Something a later version adds')).toEqual({ edit_kind: 'other', surface: 'other' });
});

it('prefers the panel the person last pressed in, and forgets it after a minute', () => {
  vi.useFakeTimers();
  watchEditSurface();
  press('layers');
  expect(classifyEdit('Delete element')).toEqual({ edit_kind: 'delete', surface: 'layers' });
  press('design');
  expect(classifyEdit('Move layer').surface).toBe('properties');
  vi.advanceTimersByTime(61_000);
  expect(classifyEdit('Move layer').surface).toBe('canvas');
});

it('reports one manual edit per history entry and none for an Agent write', () => {
  reportManualEdit({ projectId: PROJECT, label: 'Move layer', entryId: 'e1', coalesceKey: 'drag' });
  reportManualEdit({ projectId: PROJECT, label: 'Move layer', entryId: 'e1', coalesceKey: 'drag' });
  reportManualEdit({ projectId: PROJECT, label: 'Edit text', entryId: 'e2' });
  reportManualEdit({ projectId: PROJECT, label: 'Edit text', entryId: 'e3', agent: true });
  expect(events('studio_edit_result')).toEqual([
    { outcome: 'success', edit_kind: 'move', surface: 'canvas', project_scope: 'managed', project_id: PROJECT },
    { outcome: 'success', edit_kind: 'text', surface: 'canvas', project_scope: 'managed', project_id: PROJECT },
  ]);
});

it('gives each property-panel feature its own kind while its commit is saving', async () => {
  expect(['clip-path', 'font-family', 'font-size', 'color', 'text-align', 'opacity', 'background-color', 'border-radius'].map(p => styleEditKind([p])))
    .toEqual(['crop', 'font_family', 'font_size', 'text_color', 'text_align', 'opacity', 'fill', 'style']);
  await withEditKind('Edit layer style', 'font_size', async () => {
    reportManualEdit({ projectId: PROJECT, label: 'Edit layer style', entryId: 'f1' });
    reportManualEdit({ projectId: PROJECT, label: 'Move layer', entryId: 'f2' });
  });
  await withEditKind('Edit layer style', 'crop', async () => { throw new Error('save failed'); }).catch(() => undefined);
  reportManualEdit({ projectId: PROJECT, label: 'Edit layer style', entryId: 'f3' });
  expect(events('studio_edit_result').map(event => [event.edit_kind, event.surface])).toEqual([
    ['font_size', 'properties'], ['move', 'canvas'], ['style', 'properties'],
  ]);
});

it('reports committed changes without a history entry and save failures by status class only', () => {
  reportEdit('project_rename', 'header', true, PROJECT);
  reportEdit('asset_delete', 'assets', false, PROJECT);
  setTrackedProject('project');
  reportSaveFailure('Move layer', 409);
  reportSaveFailure(undefined, undefined);
  expect(events('studio_edit_result').map(({ project_id: _id, ...rest }) => rest)).toEqual([
    { outcome: 'success', edit_kind: 'project_rename', surface: 'header', project_scope: 'managed' },
    { outcome: 'failure', edit_kind: 'asset_delete', surface: 'assets', project_scope: 'managed' },
    { outcome: 'failure', edit_kind: 'move', surface: 'canvas', error_code: 'CONFLICT', project_scope: 'default' },
    { outcome: 'failure', edit_kind: 'other', surface: 'other', error_code: 'UNKNOWN', project_scope: 'default' },
  ]);
  for (const [event, properties] of sent.mock.calls) expect(validProperties(studioEvents, event, properties), event).toBe(true);
});

it('reports a chosen option only from the registered set, and one search per query', () => {
  expect([clickOption('zh-CN'), clickOption(1.5), clickOption('images'), clickOption('My private folder')]).toEqual(['zh-CN', '1.5', 'images', 'other']);
  expect([searchStarted('', 'a'), searchStarted('a', 'ab'), searchStarted('ab', ''), searchStarted(' ', ' ')]).toEqual([true, false, false, false]);
  setTrackedProject(PROJECT);
  trackStudioClick('project_drawer', 'language_change', undefined, undefined, clickOption('ja'));
  expect(events('ui_click')).toEqual([{ page_name: 'studio', area: 'project_drawer', element: 'language_change', option: 'ja', project_scope: 'managed', project_id: PROJECT }]);
});

it('coalesces unclaimed edits by key, and counts a different key as another edit', () => {
  reportManualEdit({ projectId: 'project', label: 'Edit layer style', entryId: null, coalesceKey: 'opacity' });
  reportManualEdit({ projectId: 'project', label: 'Edit layer style', entryId: null, coalesceKey: 'opacity' });
  reportManualEdit({ projectId: 'project', label: 'Edit layer style', entryId: null, coalesceKey: 'color' });
  reportManualEdit({ projectId: 'project', label: 'Edit layer style', entryId: null });
  expect(events('studio_edit_result')).toHaveLength(3);
});

it('buckets export settings and rejections into closed values', () => {
  expect(exportSettings('export_panel', { format: 'mov', quality: 'high', resolution: 'portrait-4k', fps: 60 }))
    .toEqual({ origin: 'export_panel', format: 'mov', quality: 'high', resolution: '4k', fps: '60' });
  expect(exportSettings(undefined, { format: '../x', quality: 'ultra', resolution: 'square', fps: 25 }))
    .toEqual({ origin: 'header', format: 'mp4', quality: 'standard', resolution: '1080p', fps: 'other' });
  expect(exportSettings('header', {}).resolution).toBe('auto');
  expect([exportRejection(503), exportRejection(400), exportRejection(500)]).toEqual(['SERVICE_UNAVAILABLE', 'REQUEST_REJECTED', 'SERVER_ERROR']);
});

it('reports asset import counts with a safe category only when something failed', () => {
  expect(importErrorCategory('no supported video stream found')).toBe('unsupported_format');
  expect(importErrorCategory('ffprobe failed to read the media file')).toBe('unreadable');
  expect(importErrorCategory('/Users/someone/private.mov exploded')).toBe('other');
  reportAssetImport({ projectId: PROJECT, entryPoint: 'assets_button', requested: 2, added: 2, category: 'other' });
  reportAssetImport({ projectId: PROJECT, entryPoint: 'assets_drop', requested: 3, added: 1, category: 'too_large' });
  reportAssetImport({ projectId: PROJECT, requested: 1, added: 0, category: 'unreadable' });
  expect(events('studio_asset_import_result').map(({ project_id: _id, project_scope: _scope, ...rest }) => rest)).toEqual([
    { outcome: 'success', entry_point: 'assets_button', requested_count: 2, added_count: 2, failed_count: 0 },
    { outcome: 'partial', entry_point: 'assets_drop', requested_count: 3, added_count: 1, failed_count: 2, error_category: 'too_large' },
    { outcome: 'failure', entry_point: 'other', requested_count: 1, added_count: 0, failed_count: 1, error_category: 'unreadable' },
  ]);
});

it('hands a noted trigger or entry point to exactly one consumer, and drops a stale one', () => {
  vi.useFakeTimers();
  noteHistoryTrigger('keyboard'); noteImportEntry('timeline_button');
  expect([takeHistoryTrigger(), takeHistoryTrigger()]).toEqual(['keyboard', undefined]);
  expect([takeImportEntry(), takeImportEntry()]).toEqual(['timeline_button', undefined]);
  noteHistoryTrigger('pointer'); noteImportEntry('timeline_button');
  vi.advanceTimersByTime(5000);
  expect([takeHistoryTrigger(), takeImportEntry()]).toEqual([undefined, undefined]);
});

it('emits only properties the Studio registry admits', () => {
  trackStudioClick('header', 'export', PROJECT, 'pointer');
  trackStudioClick('left_panel', 'tab_assets');
  reportHistoryStep('undo', 'unavailable', 'project', 'keyboard');
  reportManualEdit({ projectId: 'customer name', label: 'Edit color', entryId: 'e9' });
  reportAssetImport({ projectId: PROJECT, entryPoint: 'timeline_drop', requested: 1, added: 1 });
  expect(sent).toHaveBeenCalledTimes(5);
  for (const [event, properties] of sent.mock.calls) expect(validProperties(studioEvents, event, properties), event).toBe(true);
  expect(JSON.stringify(sent.mock.calls)).not.toContain('customer name');
});

it('keeps the feature working when no tracker is installed or the tracker throws', () => {
  installEditorTracking(undefined);
  expect(() => reportManualEdit({ projectId: PROJECT, label: 'Move layer', entryId: 'e1' })).not.toThrow();
  installEditorTracking((() => { throw new Error('collector down'); }) as never);
  expect(() => trackStudioClick('header', 'export')).not.toThrow();
  expect(() => reportHistoryStep('redo', 'success', PROJECT)).not.toThrow();
});

it('buckets video length and project size, and reports unknown instead of guessing', () => {
  expect([0.5, 14.99, 15, 59.9, 60, 179, 180, 599, 600, 7200].map(durationBucket))
    .toEqual(['lt_15s', 'lt_15s', '15_60s', '15_60s', '1_3min', '1_3min', '3_10min', '3_10min', 'gt_10min', 'gt_10min']);
  expect([undefined, null, 0, NaN, Infinity, -3].map(durationBucket)).toEqual(Array(6).fill('unknown'));
  expect([0, 1, 5, 6, 20, 21, 50, 51, 4000].map(countBucket)).toEqual(['0', '1_5', '1_5', '6_20', '6_20', '21_50', '21_50', 'gt_50', 'gt_50']);
  expect([undefined, NaN, -1].map(countBucket)).toEqual(['unknown', 'unknown', 'unknown']);
  expect([1, 2, 5, 6, 20, 21].map(compositionBucket)).toEqual(['1', '2_5', '2_5', '6_20', '6_20', 'gt_20']);
  expect([0, undefined].map(compositionBucket)).toEqual(['unknown', 'unknown']);

  expect(projectScaleFields(undefined)).toEqual({ clip_count_bucket: 'unknown', asset_count_bucket: 'unknown', composition_count_bucket: 'unknown' });
  setProjectInventory({ assets: 12, compositions: 3 });
  expect(projectScaleFields(7)).toEqual({ clip_count_bucket: '6_20', asset_count_bucket: '6_20', composition_count_bucket: '2_5' });
  setProjectInventory(null);
  expect(projectScaleFields(0).asset_count_bucket).toBe('unknown');
});

it('sends a template id only when it is a bounded catalogue slug', () => {
  expect(templateFields('hf-moment-M1147')).toEqual({ template_id: 'hf-moment-M1147' });
  expect(templateFields('product-promo')).toEqual({ template_id: 'product-promo' });
  for (const id of [undefined, null, '', 'Launch Film', 'a/b', 'a.b', 'https://x.test/t', 'x'.repeat(65), '../secret'])
    expect(templateFields(id), String(id)).toEqual({});
  expect(openTemplateFields()).toEqual({});
  setProjectTemplate('nyt-graph');
  expect(openTemplateFields()).toEqual({ template_id: 'nyt-graph' });
  setProjectTemplate('My client template');
  expect(openTemplateFields()).toEqual({});
});

it('reports template library use with ids only, and still reports when the id is not sendable', () => {
  reportTemplateEvent({ kind: 'copy_click', templateId: 'hf-block-aurora' }, PROJECT);
  reportTemplateEvent({ kind: 'copy_result', templateId: 'hf-block-aurora', host: 'claude', status: 'manual_fallback_shown' }, PROJECT);
  reportTemplateEvent({ kind: 'preview', templateId: 'Customer Draft Template' }, PROJECT);
  reportTemplateEvent({ kind: 'use', templateId: 'product-promo' }, 'project');
  reportTemplateEvent({ kind: 'category', category: 'ads' }, 'project');
  reportTemplateEvent({ kind: 'category', category: 'a category added later' }, 'project');
  reportTemplateEvent({ kind: 'search' }, 'project');
  reportTemplateEvent({ kind: 'copy_result', templateId: 'hf-block-aurora', host: 'a host added later', status: 'failed' }, PROJECT);
  const managed = { project_scope: 'managed', project_id: PROJECT }, local = { project_scope: 'default' };
  const click = { page_name: 'studio', area: 'templates' };
  expect(sent.mock.calls).toEqual([
    ['ui_click', { ...click, element: 'copy_template', template_id: 'hf-block-aurora', ...managed }],
    ['template_instruction_copy_result', { host_product: 'claude', copy_status: 'manual_fallback_shown', page_name: 'studio', template_id: 'hf-block-aurora', ...managed }],
    ['ui_click', { ...click, element: 'preview_template', ...managed }],
    ['ui_click', { ...click, element: 'use_template', template_id: 'product-promo', ...local }],
    ['ui_click', { ...click, element: 'template_category', option: 'ads', ...local }],
    ['ui_click', { ...click, element: 'template_category', option: 'other', ...local }],
    ['ui_click', { ...click, element: 'template_search', ...local }],
  ]);
  for (const [event, properties] of sent.mock.calls) expect(validProperties(studioEvents, event, properties), event).toBe(true);
  expect(JSON.stringify(sent.mock.calls)).not.toMatch(/Customer|added later/);
});
