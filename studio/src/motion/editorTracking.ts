import type { EventFields } from '../../../tracking/core.ts';
import { slug, uuid } from '../../../tracking/core.ts';
import type { StudioEvent, studioEvents } from '../../../tracking/events.ts';

type Send = <E extends StudioEvent>(event: E, properties: EventFields<typeof studioEvents[E]>) => unknown;
let send: Send | undefined;
let activeProjectId: string | null = null;
/**
 * The Motion host installs the existing tracking wrapper once. Editor modules report through it and
 * never import the transport, so an editor mounted without the host (tests, embeds) reports nothing.
 */
export function installEditorTracking(sender: Send | undefined) { send = sender; }
function trackMotion<E extends StudioEvent>(event: E, properties: EventFields<typeof studioEvents[E]>) {
  // Reporting never changes or fails the edit, export or import that triggered it.
  try { return send?.(event, properties); } catch { return undefined; }
}

type Fields<E extends keyof typeof studioEvents> = EventFields<typeof studioEvents[E]>;
type Click = Fields<'ui_click'>;
type Edit = Fields<'studio_edit_result'>;
type ExportSettings = Pick<Fields<'studio_export_request_result'>, 'origin' | 'format' | 'quality' | 'resolution' | 'fps'>;
export type EditSurface = Edit['surface'];
export type EditKind = Edit['edit_kind'];
export type ExportOrigin = ExportSettings['origin'];
export type ImportEntryPoint = Fields<'studio_asset_import_result'>['entry_point'];
export type ImportErrorCategory = NonNullable<Fields<'studio_asset_import_result'>['error_category']>;
export type InteractionMethod = NonNullable<Click['interaction_method']>;

/** Project names are never sent. Only a UUID id leaves the browser; other ids collapse to a scope. */
export function projectFields(projectId: string | null | undefined) {
  if (!projectId) return {};
  if (uuid.test(projectId)) return { project_scope: 'managed', project_id: projectId } as const;
  return { project_scope: projectId === 'project' ? 'default' : 'other' } as const;
}

export function trackStudioClick(area: Click['area'], element: Click['element'], projectId?: string | null, method?: InteractionMethod, option?: ClickOption, templateId?: string) {
  void trackMotion('ui_click', { page_name: 'studio', area, element, ...templateFields(templateId), ...(option ? { option } : {}), ...(method ? { interaction_method: method } : {}), ...projectFields(projectId ?? activeProjectId) });
}
export type ClickOption = NonNullable<Click['option']>;
const OPTIONS = new Set<string>(['featured', 'ads', 'clone', 'motion', 'script', 'on', 'off', 'light', 'dark', 'en', 'zh-CN', 'ja', 'ko', 'de', 'fr', 'ru', 'es', 'pt-BR', 'it', 'tr',
  'all', 'images', 'video', 'audio', 'fonts', 'captions', 'code-animation', 'vfx', 'transitions', 'effects', 'text-effects', 'social',
  'data', 'scenes', '0.25', '0.5', '1', '1.5', '2']);
/** A control's chosen value as a registered option; anything else is reported as `other`. */
export const clickOption = (value: unknown): ClickOption => OPTIONS.has(String(value)) ? String(value) as ClickOption : 'other';
/** True when a search box goes from empty to holding text: one use per search, not per keystroke. */
export const searchStarted = (previous: string, next: string) => !previous.trim() && Boolean(next.trim());

/** A click event with no pointer coordinates was produced by the keyboard. */
export const clickMethod = (event: { detail: number }): InteractionMethod => event.detail === 0 ? 'keyboard' : 'pointer';

// ── Templates, project scale and video length ──

/** A catalogue id is sent only when it is a bounded slug; anything else is left out, never rewritten. */
export function templateFields(templateId: string | null | undefined) {
  return typeof templateId === 'string' && slug.test(templateId) ? { template_id: templateId } : {};
}
type Scale = Pick<Fields<'studio_export_request_result'>, 'clip_count_bucket' | 'asset_count_bucket' | 'composition_count_bucket'>;
const known = (value: number | null | undefined): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0;
export function countBucket(count: number | null | undefined): NonNullable<Scale['clip_count_bucket']> {
  if (!known(count)) return 'unknown';
  return count === 0 ? '0' : count <= 5 ? '1_5' : count <= 20 ? '6_20' : count <= 50 ? '21_50' : 'gt_50';
}
export function compositionBucket(count: number | null | undefined): NonNullable<Scale['composition_count_bucket']> {
  if (!known(count) || count < 1) return 'unknown';
  return count === 1 ? '1' : count <= 5 ? '2_5' : count <= 20 ? '6_20' : 'gt_20';
}
export function durationBucket(seconds: number | null | undefined): NonNullable<Fields<'studio_export_result'>['video_duration_bucket']> {
  if (!known(seconds) || seconds === 0) return 'unknown';
  return seconds < 15 ? 'lt_15s' : seconds < 60 ? '15_60s' : seconds < 180 ? '1_3min' : seconds < 600 ? '3_10min' : 'gt_10min';
}
// What Studio already holds about the open project. Null until its file tree has loaded.
let inventory: { assets: number; compositions: number } | null = null;
let openTemplateId: string | undefined;
export function setProjectInventory(next: { assets: number; compositions: number } | null) { inventory = next; }
/** The template the open project was created from, when the workspace catalogue says so. */
export function setProjectTemplate(templateId: string | undefined) { openTemplateId = templateId; }
/** Buckets from memory only; a value that has not loaded yet is `unknown`, never waited for. */
export function projectScaleFields(clipCount: number | null | undefined): Required<Scale> {
  return { clip_count_bucket: countBucket(clipCount), asset_count_bucket: countBucket(inventory?.assets),
    composition_count_bucket: compositionBucket(inventory?.compositions) };
}
export const openTemplateFields = () => templateFields(openTemplateId);

type TemplateEvent =
  | { kind: 'copy_click' | 'preview' | 'use'; templateId: string }
  | { kind: 'copy_result'; templateId: string; host: string; status: 'clipboard_written' | 'manual_fallback_shown' | 'failed' }
  | { kind: 'category'; category: string }
  | { kind: 'search' };
const HOSTS = ['codex', 'claude', 'deepseek', 'chatgpt', 'mcp'] as const;
/** The template library dialog reports here; it owns no tracking code of its own. */
export function reportTemplateEvent(event: TemplateEvent, projectId?: string | null) {
  if (event.kind === 'copy_result') {
    const host = HOSTS.find(item => item === event.host);
    if (host) void trackMotion('template_instruction_copy_result', { host_product: host, copy_status: event.status, page_name: 'studio',
      ...templateFields(event.templateId), ...projectFields(projectId ?? activeProjectId) });
    return;
  }
  if (event.kind === 'category') return trackStudioClick('templates', 'template_category', projectId, undefined, clickOption(event.category));
  if (event.kind === 'search') return trackStudioClick('templates', 'template_search', projectId);
  trackStudioClick('templates', event.kind === 'copy_click' ? 'copy_template' : event.kind === 'preview' ? 'preview_template' : 'use_template',
    projectId, undefined, undefined, event.templateId);
}

// ── Manual edits ──

const PANEL_SURFACE: Record<string, EditSurface> = {
  preview: 'canvas', timeline: 'timeline', design: 'properties', layers: 'layers', assets: 'assets', catalog: 'catalog',
};
const GESTURE_TTL_MS = 60_000;
let gesture: { surface: EditSurface; at: number } | null = null;
let listening = false;

function noteGesture(event: Event) {
  const target = event.target instanceof Element ? event.target.closest('[data-dock-panel]') : null;
  const surface = target ? PANEL_SURFACE[target.getAttribute('data-dock-panel') ?? ''] : undefined;
  // Menus and popovers render outside their panel; they keep the surface of the gesture that opened them.
  if (surface) gesture = { surface, at: Date.now() };
}
/** Remember which editor panel the person last pressed or typed in. Idempotent. */
export function watchEditSurface() {
  if (listening || typeof window === 'undefined') return;
  listening = true;
  window.addEventListener('pointerdown', noteGesture, true);
  window.addEventListener('keydown', noteGesture, true);
}

// History labels are fixed English strings written by Studio; only their category is reported.
const LABEL_RULES: ReadonlyArray<readonly [RegExp, EditKind, EditSurface]> = [
  [/^(move timeline clip|move into sync|slip into sync)/, 'timeline_move', 'timeline'],
  [/^resize timeline clip/, 'timeline_trim', 'timeline'],
  [/^split /, 'timeline_split', 'timeline'],
  [/^delete timeline clip/, 'delete', 'timeline'],
  [/^duplicate/, 'duplicate', 'timeline'],
  [/^paste/, 'paste', 'timeline'],
  [/^(hide|show|mute|unmute) /, 'visibility', 'timeline'],
  [/^add timeline asset/, 'add_asset', 'timeline'],
  [/^add (block|component): /, 'add_catalog_item', 'catalog'],
  [/^add composition to timeline/, 'add_composition', 'timeline'],
  [/keyframe/, 'keyframe', 'properties'],
  [/gsap|animation|arc |ease |gesture recording|unroll/, 'animation', 'properties'],
  [/^delete element/, 'delete', 'canvas'],
  [/^(group|ungroup) elements/, 'group', 'canvas'],
  [/^edit text/, 'text', 'canvas'],
  [/^move /, 'move', 'canvas'],
  [/^resize/, 'resize', 'canvas'],
  [/^rotate/, 'rotate', 'canvas'],
  [/^reorder layers/, 'layer_order', 'layers'],
  [/^edit timing/, 'timing', 'properties'],
  [/^edit source/, 'other', 'other'],
  [/^(edit|replace) /, 'style', 'properties'],
];

export function classifyEdit(label: string, now = Date.now(), hinted?: EditKind): { edit_kind: EditKind; surface: EditSurface } {
  const text = label.toLowerCase();
  const rule = LABEL_RULES.find(([pattern]) => pattern.test(text));
  const pressed = gesture && now - gesture.at <= GESTURE_TTL_MS ? gesture.surface : undefined;
  return { edit_kind: hinted ?? rule?.[1] ?? 'other', surface: pressed ?? (hinted === 'crop' ? 'canvas' : rule?.[2]) ?? 'other' };
}

/** Which property-panel feature a style commit belongs to, from the CSS properties it writes. */
export function styleEditKind(properties: readonly string[]): EditKind {
  const has = (test: (property: string) => boolean) => properties.some(test);
  if (has(property => property === 'clip-path')) return 'crop';
  if (has(property => property === 'font-family')) return 'font_family';
  if (has(property => property === 'font-size')) return 'font_size';
  if (has(property => property === 'color')) return 'text_color';
  if (has(property => property === 'text-align')) return 'text_align';
  if (has(property => property === 'opacity')) return 'opacity';
  if (has(property => property.startsWith('background'))) return 'fill';
  return 'style';
}
// A commit knows its feature; the history entry it records only carries a shared label. The commit
// holds its kind here while it saves, and the entry recorded under that label takes the oldest one.
const pendingKinds: Array<{ label: string; kind: EditKind }> = [];
export function withEditKind<T>(label: string, kind: EditKind, task: () => Promise<T>): Promise<T> {
  const pending = { label, kind };
  pendingKinds.push(pending);
  if (pendingKinds.length > 32) pendingKinds.shift();
  const release = () => { const index = pendingKinds.indexOf(pending); if (index >= 0) pendingKinds.splice(index, 1); };
  try { return task().finally(release); } catch (error) { release(); throw error; }
}

let lastEdit: { id: string | null; key?: string; at: number } | null = null;
/**
 * One event per committed history entry. A coalescing edit (a held slider, repeated nudges) claims the
 * same entry many times; only its first claim is reported. `agent` marks a write an Agent tool dispatched.
 */
export function reportManualEdit(input: { projectId: string | null; label: string; entryId: string | null; coalesceKey?: string; coalesceMs?: number; agent?: boolean }) {
  if (input.agent) return;
  const now = Date.now();
  const sameEntry = lastEdit && (input.entryId
    ? lastEdit.id === input.entryId
    : lastEdit.id === null && input.coalesceKey !== undefined && lastEdit.key === input.coalesceKey && now - lastEdit.at <= Math.max(2000, input.coalesceMs ?? 0));
  lastEdit = { id: input.entryId, key: input.coalesceKey, at: now };
  if (sameEntry) return;
  const hinted = pendingKinds.find(pending => pending.label === input.label)?.kind;
  void trackMotion('studio_edit_result', { outcome: 'success', ...classifyEdit(input.label, now, hinted), ...projectFields(input.projectId) });
}
/** A committed change that has no history entry of its own (project title, asset files). */
export function reportEdit(edit_kind: EditKind, surface: EditSurface, ok: boolean, projectId?: string | null) {
  void trackMotion('studio_edit_result', { outcome: ok ? 'success' : 'failure', edit_kind, surface, ...projectFields(projectId) });
}
/** The open project, for reporters that are not handed one. */
export function setTrackedProject(projectId: string | null) { activeProjectId = projectId; }
export function reportSaveFailure(label: string | undefined, status: number | null | undefined) {
  const error_code = status === 409 ? 'CONFLICT' : !status ? 'UNKNOWN' : status >= 500 ? 'SERVER_ERROR' : 'REQUEST_REJECTED';
  void trackMotion('studio_edit_result', { outcome: 'failure', ...classifyEdit(label ?? ''), error_code, ...projectFields(activeProjectId) });
}

// ── Undo / redo ──

let historyMethod: { method: InteractionMethod; at: number } | null = null;
/** Called by the button or shortcut that is about to step the history. */
export function noteHistoryTrigger(method: InteractionMethod) { historyMethod = { method, at: Date.now() }; }
export function takeHistoryTrigger(): InteractionMethod | undefined {
  const noted = historyMethod; historyMethod = null;
  return noted && Date.now() - noted.at < 1000 ? noted.method : undefined;
}
export function reportHistoryStep(action: 'undo' | 'redo', outcome: Fields<'studio_history_step_result'>['outcome'], projectId: string | null | undefined, method?: InteractionMethod) {
  void trackMotion('studio_history_step_result', { action, outcome, ...(method ? { interaction_method: method } : {}), ...projectFields(projectId) });
}

// ── Export ──

export function exportSettings(origin: ExportOrigin | undefined, options: { format?: string; quality?: string; resolution?: string; fps?: number }): ExportSettings {
  const { format, quality, resolution, fps } = options;
  return {
    origin: origin ?? 'header',
    format: format === 'webm' || format === 'mov' || format === 'gif' ? format : 'mp4',
    quality: quality === 'draft' || quality === 'high' ? quality : 'standard',
    resolution: !resolution || resolution === 'auto' ? 'auto' : resolution.endsWith('-4k') ? '4k' : '1080p',
    fps: fps === 24 ? '24' : fps === 30 ? '30' : fps === 60 ? '60' : 'other',
  };
}
export function exportRejection(status: number): NonNullable<Fields<'studio_export_request_result'>['error_code']> {
  return status === 503 ? 'SERVICE_UNAVAILABLE' : status >= 400 && status < 500 ? 'REQUEST_REJECTED' : 'SERVER_ERROR';
}
export function reportExportRequest(fields: Fields<'studio_export_request_result'>) { void trackMotion('studio_export_request_result', fields); }
export function reportExportResult(fields: Fields<'studio_export_result'>) { void trackMotion('studio_export_result', fields); }
export function reportNoticeShown(notice: Fields<'studio_notice_shown'>['notice'], projectId?: string | null) {
  void trackMotion('studio_notice_shown', { notice, ...projectFields(projectId ?? activeProjectId) });
}

// ── Asset import ──

const clampCount = (value: number) => Math.min(86_400_000, Math.max(0, Math.trunc(value) || 0));
export function importErrorCategory(reason: string): ImportErrorCategory {
  if (/no supported (video|audio) stream/.test(reason)) return 'unsupported_format';
  if (/ffprobe (failed to read|returned unreadable)/.test(reason)) return 'unreadable';
  return 'other';
}
export function reportAssetImport(input: { projectId: string | null; entryPoint?: ImportEntryPoint; requested: number; added: number; category?: ImportErrorCategory }) {
  const requested = clampCount(input.requested), added = Math.min(requested, clampCount(input.added));
  void trackMotion('studio_asset_import_result', {
    outcome: added === requested ? 'success' : added ? 'partial' : 'failure', entry_point: input.entryPoint ?? 'other',
    requested_count: requested, added_count: added, failed_count: requested - added,
    ...(input.category && added < requested ? { error_category: input.category } : {}), ...projectFields(input.projectId),
  });
}

let importEntry: { entry: ImportEntryPoint; at: number } | null = null;
/** Called by a control whose files reach the shared upload through layers that only pass the files. */
export function noteImportEntry(entry: ImportEntryPoint) { importEntry = { entry, at: Date.now() }; }
export function takeImportEntry(): ImportEntryPoint | undefined {
  const noted = importEntry; importEntry = null;
  return noted && Date.now() - noted.at < 2000 ? noted.entry : undefined;
}

/** Test-only: forget module state between cases. */
export function resetEditorTrackingForTests() { gesture = null; lastEdit = null; historyMethod = null; importEntry = null; pendingKinds.length = 0; activeProjectId = null; inventory = null; openTemplateId = undefined; }
