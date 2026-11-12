// Reports for the editor's template library dialog. Event, area, element and field names follow the shared
// OpenMotion tracking sheet (website rows W06–W35) so one funnel reads the same on the website and in the editor.
// The dialog calls these and owns no tracking code of its own; nothing here may throw into it.
import { slug } from '../../../tracking/core.ts';
import type { EventFields } from '../../../tracking/core.ts';
import { studioEvents } from '../../../tracking/events.ts';
import type { StudioEvent } from '../../../tracking/events.ts';
import { isEditableTemplate, type GalleryTemplate } from '../../../shared/catalog';
import { currentProjectFields, templateFields } from './editorTracking';
import { trackMotion } from './tracking';

type Fields<E extends StudioEvent> = EventFields<typeof studioEvents[E]>;
type Click = Fields<'ui_click'>;
export type Placement = NonNullable<Click['placement']>;
export type Sort = NonNullable<Click['sort']>;
export type FilterGroup = NonNullable<Click['filter_group']>;
type FilterAction = Fields<'template_filter_result'>['action'];
type Template = GalleryTemplate;
/** What the list looked like when something happened: the active search, the sort and how many filters were on. */
export type ListContext = { searchId?: string; sort: Sort; filterCount: number };

const send = <E extends StudioEvent>(event: E, properties: Fields<E>) => {
  try { void trackMotion(event, properties).catch(() => {}); } catch { /* reporting never interrupts browsing, copying or downloading */ }
};
export const newTrackingId = () => crypto.randomUUID();
const studio = (projectId?: string | null) => ({ page_name: 'studio' as const, ...currentProjectFields(projectId) });
const list = (context: ListContext) => ({ sort: context.sort, applied_filter_count: context.filterCount, ...(context.searchId ? { search_id: context.searchId } : {}) });
const detail = (detailViewId: string | undefined) => detailViewId ? { detail_view_id: detailViewId, detail_mode: 'modal' as const } : {};
const resource = (template: Template) => ({ resource_kind: isEditableTemplate(template) ? 'editable_project' as const : 'reference' as const });
const instruction = (template: Template) => ({ instruction_kind: isEditableTemplate(template) ? 'template_use' as const : 'reference_recreate' as const });
/** A catalogue option as a stable id. Display text never leaves the browser; an option that cannot be reduced to a slug is left out. */
export function optionId(value: string) {
  const id = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 64).replace(/-$/, '');
  return slug.test(id) ? { filter_value: id } : {};
}
/** The settled search-box value as it is reported: trimmed, control characters removed, at most 100 characters. */
export const searchKeyword = (query: string) => query.replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, 100).trim();

export function reportLibraryShown(resultCount: number, projectId?: string | null) {
  send('surface_view', { ...studio(projectId), area: 'template_library', element: 'library', result_count: resultCount });
}
export function reportCardOpened(template: Template, placement: Placement, position: number, context: ListContext, projectId?: string | null) {
  send('ui_click', { ...studio(projectId), area: 'template_card', element: 'open_detail', ...templateFields(template.id), ...resource(template), placement, position, ...list(context) });
}
export function reportDetailShown(template: Template, detailViewId: string, projectId?: string | null) {
  send('surface_view', { ...studio(projectId), area: 'template_detail', element: 'detail', ...templateFields(template.id), ...resource(template), ...detail(detailViewId) });
}
/** The use or recreate button. A click is intent only; the copy result and the project result say what happened. */
export function reportUseClicked(template: Template, action: NonNullable<Click['template_action']>, detailViewId: string | undefined, projectId?: string | null) {
  send('ui_click', { ...studio(projectId), area: 'template_detail', element: 'start_use', ...templateFields(template.id), ...resource(template), template_action: action, ...detail(detailViewId) });
}
export function reportInstructionShown(template: Template, detailViewId: string | undefined, projectId?: string | null) {
  send('surface_view', { ...studio(projectId), area: 'template_instruction', element: 'instruction', ...templateFields(template.id), ...resource(template), ...instruction(template), ...detail(detailViewId) });
}
export function reportCopyClicked(template: Template, copyAttemptId: string, detailViewId: string | undefined, projectId?: string | null) {
  send('ui_click', { ...studio(projectId), area: 'template_instruction', element: 'copy_instruction', ...templateFields(template.id), ...instruction(template), target_agent: 'codex', copy_attempt_id: copyAttemptId, ...detail(detailViewId) });
}
/** Only `clipboard_written` is a successful copy; showing the text for a manual copy is not. */
export function reportCopyResult(template: Template, status: Fields<'template_instruction_copy_result'>['copy_status'], copyAttemptId: string, detailViewId: string | undefined, projectId?: string | null) {
  send('template_instruction_copy_result', { ...studio(projectId), host_product: 'codex', copy_status: status, copy_attempt_id: copyAttemptId, ...templateFields(template.id), ...resource(template), ...instruction(template), ...detail(detailViewId) });
}
export function reportSearchResult(searchId: string, query: string, resultCount: number, context: Omit<ListContext, 'searchId'>, projectId?: string | null) {
  const keyword = searchKeyword(query);
  if (!keyword) return;
  send('template_search_result', { ...studio(projectId), area: 'template_discovery', search_id: searchId, search_keyword: keyword, query_length: query.trim().length,
    result_count: resultCount, outcome: 'success', sort: context.sort, applied_filter_count: context.filterCount });
}
export function reportDiscoveryClick(element: Extract<Click['element'], 'category_select' | 'category_more' | 'filter_open' | 'filter_apply' | 'filter_clear' | 'filter_option' | 'sort_option'>,
  context: ListContext, extra: Pick<Click, 'filter_group' | 'selected' | 'expanded' | 'previous_sort' | 'changed'> & { option?: string } = {}, projectId?: string | null) {
  const { option, ...fields } = extra;
  send('ui_click', { ...studio(projectId), area: 'template_discovery', element, ...fields, ...(option === undefined ? {} : optionId(option)), ...list(context) });
}
/** Reported once the changed list is on screen, so `result_count` is what the user actually got. */
export function reportFilterResult(action: FilterAction, resultCount: number, context: ListContext, projectId?: string | null) {
  send('template_filter_result', { ...studio(projectId), area: 'template_discovery', action, result_count: resultCount, outcome: 'success', ...list(context) });
}
export function reportDownloadClicked(template: Template, kind: 'download_guide' | 'download_project', downloadAttemptId: string | undefined, detailViewId: string | undefined, projectId?: string | null) {
  send('ui_click', { ...studio(projectId), area: 'template_detail', element: kind, ...templateFields(template.id), resource_kind: kind === 'download_guide' ? 'motion_guide' : 'editable_project',
    ...(downloadAttemptId ? { download_attempt_id: downloadAttemptId } : {}), ...detail(detailViewId) });
}
export function reportDownloadResult(template: Template, downloadAttemptId: string, status: 'browser_save_requested' | 'fetch_failed', errorCode: string | undefined, detailViewId: string | undefined, projectId?: string | null) {
  send('resource_download_result', { ...studio(projectId), resource_kind: 'motion_guide', download_attempt_id: downloadAttemptId, delivery_status: status,
    ...(errorCode ? { error_code: errorCode } : {}), ...templateFields(template.id), ...detail(detailViewId) });
}
export function reportFullPageClicked(template: Template, detailViewId: string | undefined, projectId?: string | null) {
  send('ui_click', { ...studio(projectId), area: 'template_detail', element: 'view_full_page', ...templateFields(template.id), ...detail(detailViewId) });
}
