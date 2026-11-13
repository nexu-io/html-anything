import { build } from 'esbuild';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const root = new URL('../', import.meta.url);
const bundled = await build({ entryPoints: [fileURLToPath(new URL('web/inline-video.js', root))], bundle: true, format: 'esm', platform: 'browser', write: false });
const script = bundled.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
const css = await readFile(new URL('web/inline-video.css', root), 'utf8');
const tokens = await readFile(new URL('packages/design-system/tokens.css', root), 'utf8');
await writeFile(new URL('web/inline-video.html', root), `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${tokens}\n${css}</style><script type="module">${script}</script></html>`);
