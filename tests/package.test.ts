import test from 'node:test';
import assert from 'node:assert/strict';
import { zip } from '../scripts/package.ts';
import { distributionFiles } from '../scripts/distribution.ts';
import { getWorkflow, workflowRegistry } from '../shared/workflow.ts';

test('every distribution preserves public workflow dependencies and licenses while excluding development material', async () => {
  for (const profile of ['phase1', 'legacy']) {
    const files = new Set(await distributionFiles(profile));
    assert(files.has('docs/release-guide.md'), 'The public test/stable manual must ship');
    assert(files.has('docs/template-repository.md'), 'Repository guidance must ship');
    assert(![...files].some(file => file.startsWith('library/templates/catalog/') || /scripts\/(?:template-library|check-template-library)\.ts$/.test(file)), 'The source catalog and contribution tools must not inflate application packages');
    assert(files.has('shared/asset-limits.ts'), 'The shared asset import limit must ship');
    for (const file of ['studio/build/index.html', 'studio/LICENSE', 'template-library/LICENSE', 'template-library/NOTICE.md', 'web/design-system/fonts/Albert-Sans-OFL.txt', 'scripts/distribution.ts', 'scripts/diagnostics.mjs', 'scripts/zip.mjs', 'scripts/diagnostic-redaction.mjs', 'shared/build-info.json', 'shared/editor-launch.pl', 'shared/workspace-studio.ts', 'shared/owned-studio.mjs', 'shared/workflow-entry.js', 'skills/openmotion-recreate/scripts/measure_frame.mjs']) assert(files.has(file), 'Missing runtime or license: ' + file);
    assert(![...files].some(file => /^(?:tests\/|studio\/(?:src|tests)\/)|\.map$|publish-test-package|acceptance\.md$/.test(file)));
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
