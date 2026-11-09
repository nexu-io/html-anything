// @vitest-environment happy-dom
import { afterEach, expect, it } from 'vitest';
import { filterDockLayout, parseDockLayout } from './dockLayoutSchema';
import { buildEditLayout } from './dockLayout';
import { mountBareDockview } from './dockTestHarness';
import { visibleEditorPanels, editorEntryVisibility } from '../../motion/editorEntryVisibility';
import type { DockviewApi } from 'dockview-react';
const apis: DockviewApi[] = [];
afterEach(() => { apis.splice(0).forEach(api => api.dispose()); document.body.innerHTML = ''; });
function dock() { const { api } = mountBareDockview(); apis.push(api); api.layout(1200, 700); return api; }
it('filters a real layout without mutating it, preserving remaining groups and sizes', () => {
  const api = dock(); buildEditLayout(api, 1200);
  api.getPanel('code')!.api.setActive();
  const before = api.toJSON(), original = JSON.stringify(before);
  const allowed = visibleEditorPanels(editorEntryVisibility);
  const next = filterDockLayout(before, allowed)!;
  expect(parseDockLayout(next, allowed)).not.toBeNull();
  expect(Object.keys(next.panels)).not.toContain('code');
  expect(Object.keys(next.panels)).toContain('design');
  expect(next.grid.width).toBe(before.grid.width);
  expect(next.grid.height).toBe(before.grid.height);
  expect(JSON.stringify(before)).toBe(original);
  api.fromJSON(next);
  expect(api.getPanel('code')).toBeUndefined();
  expect(api.getPanel('assets')).toBeDefined();
  expect(api.getPanel('compositions')?.group.width).toBeGreaterThan(0);
});
it('removes an empty group and chooses a valid active tab', () => {
  const api = dock(); buildEditLayout(api, 1200);
  api.getPanel('variables')!.api.moveTo({ group: api.getPanel('preview')!.group, position: 'right' });
  api.getPanel('variables')!.api.setActive();
  const removedGroup = api.getPanel('variables')!.group.id;
  const next = filterDockLayout(api.toJSON(), visibleEditorPanels(editorEntryVisibility));
  expect(next?.activeGroup).not.toBe(removedGroup);
  expect(next).not.toBeNull();
  expect(() => api.fromJSON(next!)).not.toThrow();
  expect(api.panels.every(panel => !['code', 'variables', 'motionBlur', 'history'].includes(panel.id))).toBe(true);
  expect(api.getPanel('preview')).toBeDefined(); expect(api.getPanel('timeline')).toBeDefined();
});
it('rejects malformed and foreign layouts rather than repairing untrusted data', () => {
  expect(filterDockLayout({ grid: { root: { type: 'leaf', data: { views: ['unknown'] } } }, panels: {} }, ['preview'])).toBeNull();
  expect(filterDockLayout(null, ['preview'])).toBeNull();
});
