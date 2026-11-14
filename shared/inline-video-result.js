const maxTextBytes = 48 * 1024 * 1024;
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const invalid = message => { throw new Error('INLINE_RESULT_INVALID: ' + message); };

/** Normalize the supported MCP envelopes without copying private media into visible text. */
export function normalizeInlineResult(input) {
  let metadata = {}, failed = false, identity;
  const mergeMeta = value => {
    if (value === undefined) return;
    if (!record(value)) invalid('metadata must be an object');
    if (value.inlineVideo !== undefined) {
      if (!record(value.inlineVideo)) invalid('invalid private media');
      const media = value.inlineVideo;
      for (const key of Object.keys(media)) {
        if (!['video', 'poster'].includes(key) || typeof media[key] !== 'string'
          || media[key].length > maxTextBytes
          || !(key === 'video' ? /^data:video\/mp4;base64,[A-Za-z0-9+/=]+$/ : /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/).test(media[key])) invalid('invalid private media field');
        if (metadata.inlineVideo?.[key] !== undefined && metadata.inlineVideo[key] !== media[key]) invalid('conflicting private media');
      }
      metadata = { ...metadata, ...value, inlineVideo: { ...metadata.inlineVideo, ...media } };
    } else metadata = { ...metadata, ...value };
  };
  const checkIdentity = value => {
    if (!value.inlineWork) return;
    const work = value.inlineWork;
    if (!record(work) || typeof work.id !== 'string' || typeof work.projectId !== 'string'
      || value.projectId !== work.projectId) invalid('invalid work identity');
    const next = JSON.stringify([value.projectId, work.id, work.versionId, work.jobId, work.sha256]);
    if (identity !== undefined && identity !== next) invalid('conflicting work identity');
    identity = next;
  };
  const sanitize = value => {
    if (Array.isArray(value)) return value.map(sanitize);
    if (!record(value)) return value;
    const clean = {};
    for (const [key, child] of Object.entries(value)) {
      if (key === '_inlineMedia') { mergeMeta({ inlineVideo: child }); continue; }
      if (key === '_meta') { mergeMeta(child); continue; }
      clean[key] = sanitize(child);
    }
    return clean;
  };
  const unwrap = (value, jsonDepth = 0, envelopeDepth = 0) => {
    if (!record(value) || envelopeDepth > 4) invalid('unsupported result shape');
    failed ||= value.isError === true;
    mergeMeta(value._meta);
    if (value.projectId && value.inlineWork && value.structuredContent === undefined && !Array.isArray(value.content)) { checkIdentity(value); return sanitize(value); }
    if (value.structuredContent !== undefined) {
      if (!record(value.structuredContent)) invalid('structuredContent must be an object');
      const structured = value.structuredContent;
      if (structured.structuredContent !== undefined || Array.isArray(structured.content) && !structured.projectId)
        return unwrap(structured, jsonDepth, envelopeDepth + 1);
      checkIdentity(structured);
      // A canonical result may contain its domain JSON twice. Check conflicting work replies,
      // then rebuild content from the sanitized domain rather than retaining either text copy.
      if (Array.isArray(value.content)) for (const item of value.content) {
        if (item?.type !== 'text' || typeof item.text !== 'string' || item.text.length > maxTextBytes) continue;
        try { const duplicate = JSON.parse(item.text); if (record(duplicate) && (duplicate.inlineWork || duplicate.structuredContent || Array.isArray(duplicate.content))) {
          if (duplicate.inlineWork && duplicate.structuredContent === undefined && !Array.isArray(duplicate.content)) checkIdentity(duplicate);
          else {
            if (jsonDepth >= 2) invalid('too many JSON envelopes');
            unwrap(duplicate, jsonDepth + 1, envelopeDepth + 1);
          }
        } }
        catch (error) { if (String(error?.message).startsWith('INLINE_RESULT_INVALID:')) throw error; }
      }
      return sanitize(structured);
    }
    if (!Array.isArray(value.content) || value.content.length !== 1 || value.content[0]?.type !== 'text'
      || typeof value.content[0].text !== 'string' || value.content[0].text.length > maxTextBytes || jsonDepth >= 2) invalid('unsupported JSON envelope');
    let decoded;
    try { decoded = JSON.parse(value.content[0].text); } catch {
      if (value.isError === true) return { error: { code: 'TOOL_FAILED', message: 'The tool request failed.' } };
      invalid('malformed JSON envelope');
    }
    if (record(decoded) && decoded.projectId && decoded.inlineWork) {
      checkIdentity(decoded); return sanitize(decoded);
    }
    return unwrap(decoded, jsonDepth + 1, envelopeDepth + 1);
  };
  const structuredContent = unwrap(input);
  return { structuredContent, content: [{ type: 'text', text: JSON.stringify(structuredContent) }],
    ...(Object.keys(metadata).length ? { _meta: metadata } : {}), ...(failed ? { isError: true } : {}) };
}
