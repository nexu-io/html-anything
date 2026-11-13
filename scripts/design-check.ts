import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { designTokens } from './design-tokens.ts';

const root = new URL('../', import.meta.url);
const luminance = (hex: string) => {
  const values = hex.slice(1).match(/../g)!.map(value => Number.parseInt(value, 16) / 255)
    .map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
  return values[0] * .2126 + values[1] * .7152 + values[2] * .0722;
};
export async function checkDesign() {
  const tokens = await designTokens(true);
  assert.deepEqual(Object.keys(tokens.themes.light).sort(), Object.keys(tokens.themes.dark).sort(), 'Both themes need the same semantic colors.');
  const coreAliases = { 'color-surface': 'panel', 'color-text-body': 'text', 'font-sans': 'font-sans', 'radius-button': 'radius-sm', 'color-template-controls-bg': 'panel', 'color-template-text': 'strong' };
  for (const [alias, role] of Object.entries(coreAliases)) assert.equal(tokens.studio[alias], `var(--motion-${role})`, `${alias} must inherit the shared theme`);
  const material = await readFile(new URL('packages/design-system/material.css', root), 'utf8');
  const materialNames = [...material.matchAll(/(--motion-[\w-]+)\s*:/g)].map(match => match[1]);
  const names = new Set([...Object.keys(tokens.shared), ...Object.keys(tokens.themes.light)].map(name => '--motion-' + name).concat(materialNames));
  const consumerFiles = (await Promise.all(['studio/src/', 'web/'].map(async directory =>
    (await readdir(new URL(directory, root), { recursive: true }))
      .filter(file => file.endsWith('.css')).map(file => directory + file)
  ))).flat();
  const sharedNames = new Set([...names, ...Object.keys(tokens.studio).map(name => '--' + name)]);
  for (const file of [...consumerFiles, 'packages/design-system/base.css', 'packages/design-system/material.css', 'packages/design-system/controls.css', 'packages/design-system/catalog.css', 'packages/design-system/loading.css', 'packages/design-system/studio/adapter.css', 'packages/design-system/studio/control-states.css', 'packages/design-system/studio/feedback.css']) {
    const css = await readFile(new URL(file, root), 'utf8');
    assert.doesNotMatch(css, /#[\da-f]{3,8}\b|\brgba?\(|\bhsla?\(/i, `${file}: UI colors belong in tokens.json.`);
    for (const match of css.matchAll(/var\((--motion-[\w-]+)/g)) assert.ok(names.has(match[1]), `${file}: undefined ${match[1]}`);
    if (consumerFiles.includes(file)) {
      for (const match of css.matchAll(/(--[\w-]+)\s*:/g)) {
        assert.ok(!sharedNames.has(match[1]), `${file}: shared role ${match[1]} must be defined in packages/design-system, not overridden by a feature.`);
      }
    }
  }
  for (const [name, value] of Object.entries(tokens.studio) as [string, string][]) {
    for (const match of value.matchAll(/var\((--motion-[\w-]+)/g)) assert.ok(names.has(match[1]), `Studio token ${name}: undefined ${match[1]}`);
  }
  for (const [theme, values] of Object.entries(tokens.themes) as [string, Record<string, string>][]) {
    for (const [ink, surface] of [['text', 'panel'], ['text', 'inset'], ['muted', 'panel'], ['dim', 'panel'], ['dim', 'bg'], ['accent', 'accent-soft'], ['on-action', 'action'], ['danger', 'danger-soft'], ['warning', 'warning-soft'], ['strong', 'highlight']]) {
      const a = luminance(values[ink]), b = luminance(values[surface]);
      assert.ok((Math.max(a, b) + .05) / (Math.min(a, b) + .05) >= 4.5, `${theme}: ${ink} on ${surface} needs 4.5:1 contrast.`);
    }
  }
  for (const file of ['theme.js', 'catalog.js', 'catalog-view.js', 'token-model.js', 'generate.js']) execFileSync(process.execPath, ['--check', fileURLToPath(new URL('packages/design-system/' + file, root))]);
  console.log('Design token freshness, theme parity, UI color references, contrast and browser scripts passed.');
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await checkDesign();
