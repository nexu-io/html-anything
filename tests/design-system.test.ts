import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { compile } from 'tailwindcss';
import { designTokens, renderDesignTokens } from '../scripts/design-tokens.ts';
import { publicDesignFiles, resolveDesignSystemFile } from '../packages/design-system/index.js';
import { serveEditorFile } from '../editor-server.ts';
import { loadStylesheet, STYLES_DIR } from '../studio/src/styles/styleSources.ts';

const packageRoot = new URL('../packages/design-system/', import.meta.url);

test('one token change reaches portable controls and compiled Studio/catalog utilities', async () => {
  const tokens = structuredClone(await designTokens(true));
  tokens.themes.light.panel = '#efe5ff';
  tokens.themes.dark.panel = '#312042';
  tokens.shared['font-sans'] = 'DesignSystemProbe, sans-serif';
  tokens.shared['radius-sm'] = '9px';
  const generated = renderDesignTokens(tokens);
  const compiler = await compile(await readFile(path.join(STYLES_DIR, 'studio.css'), 'utf8'), {
    base: STYLES_DIR,
    loadStylesheet: async (id, base) => {
      const loaded = loadStylesheet(id, base);
      for (const [file, content] of Object.entries(generated)) {
        if (loaded.path === fileURLToPath(new URL(file, packageRoot))) return { ...loaded, content };
      }
      return loaded;
    },
  });
  const css = compiler.build(['bg-surface', 'bg-template-controls-bg', 'font-sans', 'rounded-button']);
  assert.match(css, /--motion-panel: #efe5ff/);
  assert.match(css, /--motion-panel: #312042/);
  assert.match(css, /--color-surface: var\(--motion-panel\)/);
  assert.match(css, /--color-template-controls-bg: var\(--motion-panel\)/);
  assert.match(css, /\.bg-surface\s*\{\s*background-color: var\(--color-surface\)/);
  assert.match(css, /--font-sans: var\(--motion-font-sans\)/);
  assert.match(css, /--motion-font-sans: DesignSystemProbe, sans-serif/);
  assert.match(css, /--radius-button: var\(--motion-radius-sm\)/);
  assert.match(css, /--motion-radius-sm: 9px/);
  const controls = await readFile(new URL('controls.css', packageRoot), 'utf8');
  assert.match(controls, /var\(--motion-panel\)/);
  assert.match(controls, /var\(--motion-radius-sm\)/);
  // Generation is scoped; a user-authored composition without this attribute is untouched.
  assert.match(generated['tokens.css'], /:where\(\[data-motion-ui\]\)/);
  assert.doesNotMatch(generated['tokens.css'], /:root|\bbody\s*\{/);
});

test('public package assets and their transitive imports work through both HTTP prefixes', async t => {
  const server = createServer(async (req, res) => {
    if (!await serveEditorFile(new URL(req.url!, 'http://localhost'), res)) {
      res.writeHead(404); res.end();
    }
  });
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())));
  const address = server.address() as { port: number };
  const origin = `http://127.0.0.1:${address.port}`;
  for (const file of publicDesignFiles) {
    const response = await fetch(`${origin}/design-system/${file}`);
    assert.equal(response.status, 200, file);
    const bytes = Buffer.from(await response.arrayBuffer());
    assert.deepEqual(bytes, await readFile(new URL(file, packageRoot)), file);
    if (!/\.(css|html)$/.test(file)) continue;
    for (const match of bytes.toString().matchAll(/(?:url\(\s*['"]?([^)'"\s]+)|(?:src|href)="(\/design-system\/[^"#]+))/g)) {
      const target = new URL(match[1] || match[2], `${origin}/design-system/${file}`);
      if (target.origin !== origin) continue;
      assert.equal((await fetch(target)).status, 200, `${file} -> ${target.pathname}`);
    }
  }
  for (const file of ['tokens.css', 'fonts/AlbertSans-VariableFont_wght.ttf', 'brand/loading-mark.svg']) {
    assert.deepEqual(Buffer.from(await (await fetch(`${origin}/web/design-system/${file}`)).arrayBuffer()), await readFile(new URL(file, packageRoot)));
  }
  assert.equal((await fetch(`${origin}/design-system`)).status, 200);
  for (const file of ['package.json', 'index.js', 'loading.ts', 'brand/BRANDKIT.md', '../package.json', '%2e%2e%2fpackage.json']) {
    assert.equal(resolveDesignSystemFile(`/design-system/${file}`), undefined, file);
  }
});

test('the source package remains independent of workspaces and application modules', async () => {
  const manifest = JSON.parse(await readFile(new URL('package.json', packageRoot), 'utf8'));
  assert.equal(manifest.private, true);
  assert.equal(manifest.dependencies, undefined);
  for (const entry of Object.values(manifest.exports) as string[]) await readFile(new URL(entry, packageRoot));
  const application = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
  assert.equal(application.workspaces, undefined);
  for (const value of Object.values({ ...application.dependencies, ...application.devDependencies }) as string[]) {
    assert.doesNotMatch(value, /^(workspace:|file:.*design-system)/);
  }
});
