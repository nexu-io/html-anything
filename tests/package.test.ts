import test from 'node:test';
import assert from 'node:assert/strict';
import { zip } from '../scripts/package.ts';
import { distributionFiles } from '../scripts/distribution.ts';
import { getWorkflow, workflowRegistry } from '../shared/workflow.ts';

test('every distribution preserves public workflow dependencies and licenses while excluding development material', async () => {
  for (const profile of ['phase1', 'legacy']) {
    const files = new Set(await distributionFiles(profile));
    assert(files.has('docs/release-guide.md'), 'The public test/stable manual must ship');
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

test('Library compatibility folders contain only forwarding entries and no duplicated payload', async () => {
  const { readdir, readFile } = await import('node:fs/promises');
  for (const [old, current] of Object.entries({ brandkit: 'openmotion-brandkit', 'presenter-story': 'openmotion-presenter-story', 'motion-design-remix': 'openmotion-design-remix' })) {
    const folder = new URL('../library/skills/' + old + '/', import.meta.url);
    assert.deepEqual((await readdir(folder)).sort(), ['SKILL.md', 'agents']);
    assert.deepEqual(await readdir(new URL('agents/', folder)), ['openai.yaml']);
    assert.match(await readFile(new URL('SKILL.md', folder), 'utf8'), new RegExp('../' + current + '/SKILL.md'));
    const files = await distributionFiles('phase1');
    assert.deepEqual(files.filter(file => file.startsWith('library/skills/' + old + '/')).sort(), [
      'library/skills/' + old + '/SKILL.md', 'library/skills/' + old + '/agents/openai.yaml',
    ]);
  }
});
