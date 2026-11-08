import assert from 'node:assert/strict';
import { cp, mkdir, readFile, readdir, writeFile, lstat, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import path from 'node:path';

// A source-copy helper for this example pack, not a MOTION_DESIGN.md interpreter.
const root = fileURLToPath(new URL('../', import.meta.url));
const [id, variant, destination, customPreset] = process.argv.slice(2);
const catalog = JSON.parse(await readFile(path.join(root, 'sources.json'), 'utf8'));
assert(catalog.items.some(item => item.id === id), 'Choose an ID from sources.json');
assert(['reference', 'remix'].includes(variant), 'Choose reference or remix');
assert(destination, 'Usage: node scripts/materialize.mjs <id> <reference|remix> <new-output-dir> [preset.json]');
const output = path.resolve(destination);
assert(!output.startsWith(root), 'Keep generated projects outside the Skill package');
const presetPath = customPreset ? path.resolve(customPreset) : path.join(root, 'presets', id + '.json');
const preset = JSON.parse(await readFile(presetPath, 'utf8'));
assert.equal(preset.id, id, 'Preset must belong to this source');
let html = await readFile(path.join(root, 'assets', id, 'index.html'), 'utf8');
const sourceSha256 = createHash('sha256').update(html).digest('hex');
assert.equal(sourceSha256, preset.sourceSha256, 'Source changed; review the preset against the new revision');
if (variant === 'remix') {
  for (const edit of preset.replacements) {
    assert(typeof edit.from === 'string' && edit.from.length > 0 && typeof edit.to === 'string');
    assert(Number.isSafeInteger(edit.count) && edit.count > 0);
    assert.equal(html.split(edit.from).length - 1, edit.count, 'Replacement count changed: ' + edit.from);
    html = html.split(edit.from).join(edit.to);
  }
}
// Refuse existing files, directories and symlinks. Never overwrite a previous project.
await assert.rejects(lstat(output), { code: 'ENOENT' }, 'Output already exists; choose a new directory');
await mkdir(path.dirname(output), { recursive: true });
await mkdir(output);
try {
  for (const entry of await readdir(path.join(root, 'assets', id))) {
    await cp(path.join(root, 'assets', id, entry), path.join(output, entry), { recursive: true, force: false, errorOnExist: true });
  }
  await writeFile(path.join(output, 'index.html'), html);
  await cp(path.join(root, 'LICENSE'), path.join(output, 'LICENSE'));
  const item = catalog.items.find(item => item.id === id);
  await writeFile(path.join(output, 'NOTICE.md'), `# Source and runtime notes\n\nSource: ${item.upstream}\n\nHeyGen Hyperframes source: Apache-2.0 (LICENSE). OpenMotion adds the remix instructions and content preset. Preserve any font licenses in assets/. Original upstream marks remain reference artwork. CDN scripts and Google Fonts need network access; WebGL is required. Displayed code and statistics are illustrative, not product APIs or metrics.\n`);
  const design = (await readFile(path.join(root, 'references', id, 'MOTION_DESIGN.md'), 'utf8'))
    .replaceAll(`../../assets/${id}/index.html`, 'index.html')
    .replaceAll(`../../presets/${id}.json`, 'remix-record.json')
    .replace('[Pack instructions](../../SKILL.md) · ', '')
    .replaceAll('../../NOTICE.md', 'NOTICE.md')
    .replace("See the pack's evidence manifest for checks actually completed.", 'Record the checks for this new project separately; previous preview evidence does not cover subsequent edits.');
  await writeFile(path.join(output, 'MOTION_DESIGN.md'), design);
  await writeFile(path.join(output, 'remix-record.json'), JSON.stringify({ id, variant, upstreamCommit: catalog.upstreamCommit, sourceSha256, outputSha256: createHash('sha256').update(html).digest('hex'), preset }, null, 2) + '\n');
  console.log(JSON.stringify({ output, id, variant, entry: 'index.html' }));
} catch (error) {
  await rm(output, { recursive: true, force: true });
  throw error;
}
