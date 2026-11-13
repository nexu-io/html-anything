export function renderFilenameStem(title: string | undefined): string {
  const cleaned = (title ?? '').toWellFormed().normalize('NFC')
    .replace(/[<>:"/\\|?*\u0000-\u001f\u007f]/gu, '_').trim();
  let stem = '';
  for (const char of cleaned) {
    if (Buffer.byteLength(stem + char, 'utf8') > 200) break;
    stem += char;
  }
  stem = stem.replace(/[. ]+$/u, '') || 'OpenMotion';
  if (/^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(stem)) stem = '_' + stem;
  return stem;
}
