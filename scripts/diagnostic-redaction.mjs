// Shared by local log writers and the ZIP collector; never send these logs to telemetry.
export function redactDiagnostic(value, environment = {}, paths = []) {
  let text = String(value);
  for (const [key, secret] of Object.entries(environment)) {
    if (/token|secret|password|authorization|cookie|(?:^|_)key|private.?key|api.?key/i.test(key) && typeof secret === 'string' && secret.length >= 4) text = text.replaceAll(secret, '[redacted]');
  }
  text = text.replace(/-----BEGIN [^-\r\n]*PRIVATE KEY-----[\s\S]*?(?:-----END [^-\r\n]*PRIVATE KEY-----|$)/g, '[redacted private key]')
    .replace(/^(?:[A-Za-z0-9+/]{64,}={0,2})\r?$/gm, value => /^[a-f\d]+$/i.test(value) ? value : '[redacted encoded data]')
    .replace(/((?:set-cookie|cookie|authorization)\s*:\s*)[^\r\n]+/gi, '$1[redacted]')
    .replace(/\b(?:Bearer|Basic)\s+[^\s"',;}]+/gi, '[redacted authorization]')
    .replace(/([\w-]*(?:token|secret|password|passwd|authorization|cookie|api.?key)[\w-]*["']?\s*[:=]\s*)("(?:\\.|[^"\\])*"|'[^']*'|[^\s,;}]+)/gi, '$1[redacted]')
    .replace(/\b(?:sk-[\w-]{8,}|gh[pousr]_[\w]{12,}|github_pat_[\w]{12,}|AKIA[A-Z0-9]{16}|eyJ[\w-]+\.[\w-]+\.[\w-]+)\b/g, '[redacted token]')
    .replace(/https?:\/\/[^\s<>"')]+/gi, value => {
      try { return new URL(value).origin + '/[redacted-url]'; } catch { return '[redacted-url]'; }
    });
  for (const prefix of paths.filter(value => typeof value === 'string' && value.length > 1).sort((a, b) => b.length - a.length)) text = text.replaceAll(prefix, '[local]');
  return text.replace(/(?:[A-Z]:[\\/](?:Users|Documents and Settings)[\\/][^\r\n"'<>]+|\/(?:Users|home|private|var|tmp|opt|etc|Volumes|mnt)\/[^\r\n"'<>]+)/gi, '[local path]')
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[redacted email]');
}
