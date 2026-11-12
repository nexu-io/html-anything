import { readFile } from 'node:fs/promises';

// Keep upstream HTML byte-for-byte for provenance. Localize its working copy.
const manifest = JSON.parse(await readFile(new URL('../vendor/manifest.json', import.meta.url), 'utf8'));
const families = { Inter: 'inter', Gelasio: 'gelasio', 'DM Sans': 'dm-sans', 'Libre Baskerville': 'libre-baskerville', 'Libre Franklin': 'libre-franklin' };

export function localize(html, prefix = './vendor/') {
  for (const [url, file] of Object.entries(manifest.replacements).sort((a, b) => b[0].length - a[0].length)) {
    html = html.replaceAll(url, prefix + file.slice('vendor/'.length));
  }
  html = html.replace(/<link\s+rel="preconnect"[^>]*>/g, '');
  html = html.replace(/https:\/\/fonts\.googleapis\.com\/css2\?family=([^"'\s<)]+)/g, (_url, query) => {
    if (query.startsWith('Libre+Baskerville:') && query.includes('&family=Libre+Franklin:')) return prefix + 'fonts/libre.css';
    const family = decodeURIComponent(query.split(':')[0].replaceAll('+', ' '));
    if (!families[family] || query.includes('&family=')) throw new Error('Unexpected font query: ' + query);
    return prefix + 'fonts/' + families[family] + '.css';
  });
  // Custom family names use an explicitly supplied local @font-face or system font.
  // Never silently make a new Google Fonts request from a portable project.
  html = html.replace(/      if \(!\/\^\(Helvetica\|Arial\|Gelasio[\s\S]*?document\.head\.appendChild\(fl\);\n      }/, '      // Custom fonts must be supplied locally; no dynamic font download.');
  return html;
}
