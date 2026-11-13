import { validField, validProperties } from './core.ts';
import type { Fields, Registry } from './core.ts';
import { studioUsageEvents, studioErrorNames, resolverOperations } from './studio-events.ts';

/** Adapt existing callers at one boundary; private content never enters either queue. */
export function studioUsageProperties(event: string, raw: Record<string, unknown>): Fields | null {
  if (!Object.hasOwn(studioUsageEvents, event)) return null;
  const spec = (studioUsageEvents as Registry)[event];
  const values: Record<string, unknown> = { ...raw };
  if (event.startsWith('audio_fx_')) {
    for (const key of ['preset', 'effect', 'param', 'job', 'family']) {
      const rule = spec.fields[key];
      if (raw[key] !== undefined && rule && Array.isArray(rule) && !rule.includes(raw[key] as string)) values[key] = 'other';
    }
  }
  if (Object.hasOwn(spec.fields, 'error_name') && values.error_name === undefined
    && (raw.error !== undefined || raw.error_message !== undefined)) values.error_name = 'unknown';
  if (Object.hasOwn(spec.fields, 'error_name') && values.error_name !== undefined
    && !(studioErrorNames as readonly unknown[]).includes(values.error_name)) values.error_name = 'OtherError';
  if (event === 'studio_feedback') values.has_comment = typeof raw.comment === 'string' && raw.comment.trim().length > 0;
  if (event === 'save_skipped_unresolvable') values.has_target = Boolean(raw.target_id || raw.target_selector);
  if (event === 'audio_fx_param_committed') {
    values.value_kind = typeof raw.value === 'number' ? 'number' : 'category';
    if (typeof raw.value === 'string') values.value_category = validField(spec.fields.value_category, raw.value) ? raw.value : 'other';
  }
  if (event === 'sdk_resolver_shadow' && typeof raw.mismatches === 'string' && raw.mismatches.length <= 16_384) {
    try {
      const mismatches: unknown = JSON.parse(raw.mismatches);
      if (Array.isArray(mismatches)) for (const item of mismatches.slice(0, 128)) {
        const kind = item && typeof item === 'object' && 'kind' in item ? item.kind : null;
        const key = typeof kind === 'string' && ['element_not_found', 'animation_not_found', 'value_mismatch', 'dispatch_error', 'session_empty'].includes(kind)
          ? kind + '_count' : 'other_mismatch_count';
        values[key] = Number(values[key] ?? 0) + 1;
      }
    } catch { /* Keep aggregate counts when diagnostic JSON is unavailable. */ }
  }
  if (event === 'sdk_resolver_shadow' && raw.opLabel !== undefined
    && !(resolverOperations as readonly unknown[]).includes(raw.opLabel)) values.opLabel = 'other';
  if (event === 'sdk_resolver_shadow_attempt') {
    try {
      if (typeof raw.counts !== 'string' || raw.counts.length > 16_384) return null;
      const counts: unknown = JSON.parse(raw.counts);
      if (!counts || typeof counts !== 'object' || Array.isArray(counts)) return null;
      const entries = Object.values(counts);
      if (entries.length > 128 || !entries.every(value => validField('integer', value))) return null;
      values.attempt_count = entries.reduce<number>((sum, count) => sum + Number(count), 0);
      values.operation_count = entries.length;
    } catch { return null; }
  }
  const properties: Fields = {};
  for (const [key, rule] of Object.entries(spec.fields)) {
    if (validField(rule, values[key])) properties[key] = values[key];
  }
  return validProperties(studioUsageEvents, event, properties) ? properties : null;
}
