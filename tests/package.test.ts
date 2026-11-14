import test from 'node:test';
import assert from 'node:assert/strict';
import { zip } from '../scripts/package.ts';
import { distributionFiles } from '../scripts/distribution.ts';
import { getWorkflow, workflowRegistry } from '../shared/workflow.ts';
import { designSystemDocuments, designSystemRuntimeFiles } from '../packages/design-system/index.js';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

test('plugin onboarding entry and its shared contract resolve inside every distribution', async () => {
  const manifest = JSON.parse(await readFile(new URL('../.codex-plugin/plugin.json', import.meta.url), 'utf8'));
  const entry = manifest.extensions['com.openai'].onboardingSkill.replace(/^\.\//, '');
  assert(!path.posix.isAbsolute(entry) && !entry.split('/').includes('..'));
  assert(!entry.startsWith('skills/'), 'Onboarding must not alter production Skill discovery');
  const skill = await readFile(new URL('../' + entry, import.meta.url), 'utf8');
  const reference = skill.match(/\]\(([^)]+#installation-success-reply)\)/)?.[1];
  assert(reference, 'Onboarding must reach the canonical installation-success contract');
  const contract = path.posix.normalize(path.posix.join(path.posix.dirname(entry), reference.split('#')[0]));
  assert.equal(contract, 'docs/install.md');
  for (const profile of ['phase1', 'legacy']) {
    const files = new Set(await distributionFiles(profile));
    assert(files.has(entry), 'The declared onboarding entry must ship');
    assert(files.has(contract), 'Its relative contract must ship');
  }
});

test('every distribution preserves public workflow dependencies and licenses while excluding development material', async () => {
  for (const profile of ['phase1', 'legacy']) {
    const files = new Set(await distributionFiles(profile));
    for (const file of ['AGENTS.md', 'CLAUDE.md', 'cloud.md', ...designSystemDocuments, ...designSystemRuntimeFiles.map(file => 'packages/design-system/' + file)]) {
      assert(files.has(file), 'Missing shared design system dependency: ' + file);
    }
    assert(![...files].some(file => file.startsWith('packages/design-system/workbench/')), 'Source-write server and workbench tests stay out of runtime distribution');
    assert(!files.has('packages/design-system/loading.ts'), 'Loading source is compiled into Studio');
    assert(![...files].some(file => file.startsWith('packages/design-system/react/')), 'React source is compiled into Studio');
    assert(files.has('docs/release-guide.md'), 'The public test/stable manual must ship');
    assert(files.has('docs/template-repository.md'), 'Repository guidance must ship');
    assert(![...files].some(file => file.startsWith('library/templates/catalog/') || /scripts\/(?:template-library|check-template-library)\.ts$/.test(file)), 'The source catalog and contribution tools must not inflate application packages');
    assert(files.has('shared/asset-limits.ts'), 'The shared asset import limit must ship');
    assert(files.has('tracking/device.ts'), 'The device identity runtime dependency must ship');
    for (const file of ['studio/build/index.html', 'studio/LICENSE', 'template-library/LICENSE', 'template-library/NOTICE.md', 'packages/design-system/fonts/Albert-Sans-OFL.txt', 'scripts/distribution.ts', 'scripts/diagnostics.mjs', 'scripts/zip.mjs', 'scripts/diagnostic-redaction.mjs', 'shared/build-info.json', 'shared/editor-launch.pl', 'shared/workspace-studio.ts', 'shared/owned-studio.mjs', 'shared/workflow-entry.js', 'skills/openmotion-recreate/scripts/measure_frame.mjs']) assert(files.has(file), 'Missing runtime or license: ' + file);
    assert(![...files].some(file => /^(?:\.agents\/skills\/|tests\/|studio\/(?:src|tests)\/)|\.map$|publish-test-package|acceptance\.md$/.test(file)));
    for (const [workflow, definition] of Object.entries(workflowRegistry)) {
      for (const section of Object.keys(definition.sections)) {
        const document = await getWorkflow(section, workflow);
        assert(files.has(document.documentId), 'Missing workflow document: ' + document.documentId);
        for (const reference of document.references) assert(files.has(reference.documentId), 'Missing workflow reference: ' + reference.documentId);
      }
    }
    assert(files.has('skills/openmotion-video-to-template/SKILL.md'));
  }
  await assert.rejects(distributionFiles('unknown'), /Unknown distribution/);
});
test('ZIP stores UTF-8 names and file sizes in local and central headers', () => {
  const archive = zip([{ name: 'motion/测试.txt', data: Buffer.from('editable project') }]);
  assert.equal(archive.readUInt32LE(0), 0x04034b50);
  assert.equal(archive.readUInt32LE(18), 16);
  const end = archive.length - 22;
  assert.equal(archive.readUInt32LE(end), 0x06054b50);
  assert.equal(archive.readUInt16LE(end + 10), 1);
  assert.equal(archive.readUInt32LE(archive.readUInt32LE(end + 16)), 0x02014b50);
});

test('source and distribution expose only canonical Skill folders', async () => {
  const { readdir } = await import('node:fs/promises');
  const core = ['openmotion-director', 'openmotion-production', 'openmotion-recreate', 'openmotion-reference-video', 'openmotion-template-to-video', 'openmotion-video-to-template'];
  const library = ['openmotion-brandkit', 'openmotion-design-remix', 'openmotion-presenter-story'];
  assert.deepEqual((await readdir(new URL('../skills/', import.meta.url))).filter(name => !name.startsWith('.')).sort(), core);
  assert.deepEqual((await readdir(new URL('../library/skills/', import.meta.url))).sort(), library);
  for (const profile of ['phase1', 'legacy']) {
    const files = await distributionFiles(profile);
    const roots = [...new Set(files.filter(file => /^(?:library\/)?skills\//.test(file)).map(file => file.split('/').at(file.startsWith('library/') ? 2 : 1)))];
    assert(roots.length >= 8);
    assert(roots.every(name => name?.startsWith('openmotion-')), roots.join(', '));
  }
});
