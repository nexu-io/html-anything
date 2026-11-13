import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const directory = new URL('../packages/design-system/', import.meta.url);
export interface DesignTokens {
  shared: Record<string, string>;
  themes: { light: Record<string, string>; dark: Record<string, string> };
  studio: Record<string, string>;
}

export { renderDesignTokens } from '../packages/design-system/generate.js';
import { renderDesignTokens } from '../packages/design-system/generate.js';

export async function designTokens(checkOnly = false) {
  const tokens = JSON.parse(await readFile(new URL('tokens.json', directory), 'utf8'));
  for (const [file, css] of Object.entries(renderDesignTokens(tokens))) {
    if (checkOnly) {
      if (await readFile(new URL(file, directory), 'utf8') !== css) throw new Error(`${file} is stale. Run npm run design:tokens.`);
    } else await writeFile(new URL(file, directory), css);
  }
  // Stable documentation/plugin paths are generated mirrors, never editable sources.
  const mirrors = {
    'brand/openmotion-logo.svg': '../../docs/readme/openmotion-logo.svg',
    'brand/favicon.svg': '../../studio/public/favicon.svg',
    'fonts/NOTICES.txt': '../../web/design-system/fonts/NOTICES.txt',
    'fonts/Albert-Sans-OFL.txt': '../../web/design-system/fonts/Albert-Sans-OFL.txt',
    'fonts/IBM-Plex-Mono-OFL.txt': '../../web/design-system/fonts/IBM-Plex-Mono-OFL.txt',
  };
  for (const [source, target] of Object.entries(mirrors)) {
    const data = await readFile(new URL(source, directory));
    if (checkOnly) {
      if (!data.equals(await readFile(new URL(target, directory)))) throw new Error(`${target} is stale. Run npm run design:tokens.`);
    } else await writeFile(new URL(target, directory), data);
  }
  return tokens;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await designTokens(process.argv.includes('--check'));
  console.log(process.argv.includes('--check') ? 'Design tokens are in sync.' : 'Generated shared and Studio design tokens and compatibility assets.');
}
