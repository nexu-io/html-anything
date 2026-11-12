// Public names change; persisted request identities and telemetry keep their original keys.
const sessionTools = new Set(['get_session', 'append_message', 'create_session', 'create_artifact', 'open_artifact']);

export function publicToolName(name) {
  if (typeof name !== 'string') return name;
  if (name.startsWith('motion_')) return 'openmotion_' + name.slice(7);
  if (name.startsWith('design_') && sessionTools.has(name.slice(7))) return 'openmotion_' + name.slice(7);
  return name;
}

export function legacyToolName(name) {
  if (typeof name !== 'string' || !name.startsWith('openmotion_')) return name;
  const suffix = name.slice(11);
  return (sessionTools.has(suffix) ? 'design_' : 'motion_') + suffix;
}

// Normalize only service-owned handoff hints, including replies from an older running backend.
// Project content, request identities and saved results are never rewritten.
export function publicToolResult(result) {
  if (!result?.previewHandoff) return result;
  const handoff = value => Array.isArray(value) ? value.map(handoff) : value && typeof value === 'object'
    ? Object.fromEntries(Object.entries(value).map(([key, child]) => [key,
      key === 'tool' ? publicToolName(child) : key === 'instructions' && typeof child === 'string'
        ? child.replace(/\bmotion:\/\//g, 'openmotion://') : handoff(child)])) : value;
  return { ...result, previewHandoff: handoff(result.previewHandoff) };
}

export const skillAliases = {
  'motion-director': 'openmotion-director',
  'motion-production': 'openmotion-production',
  'motion-recreate': 'openmotion-recreate',
  'motion-template-to-video': 'openmotion-template-to-video',
  'motion-video-to-template': 'openmotion-video-to-template',
  'reference-video': 'openmotion-reference-video',
};
