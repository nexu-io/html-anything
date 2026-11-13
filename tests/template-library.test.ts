import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { spawnSync } from 'node:child_process';
import { zip } from '../scripts/package.ts';
import { checkTemplateLibrary, git, scope } from '../scripts/check-template-library.ts';
import { catalogRoot, cmsUrl, digest, exportCatalog, importCatalog, refreshManifest, safePath, unzip, validateRecord } from '../scripts/template-library.ts';

function fixture(t: { after: (fn: () => void) => void }, imageSize = 5) {
  const root = mkdtempSync(path.join(tmpdir(), 'openmotion-templates-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const catalog = path.join(root, scope); const id = 'motion-demo'; const directory = path.join(catalog, id);
  mkdirSync(path.join(directory, 'source/assets'), { recursive: true });
  const image = imageSize === 5 ? Buffer.from([255, 216, 255, 0, 42]) : Buffer.alloc(imageSize, 42);
  const contents = { 'assets/frame.jpg': image, 'preview.html': Buffer.from('<html><img src="assets/frame.jpg">authored example</html>\n'), 'motion.md': Buffer.from('# Motion\n') };
  const sourceManifest = { provenance: {}, files: Object.entries(contents).map(([name, bytes]) => ({ path: name, bytes: bytes.length, sha256: digest(bytes) })) };
  const archive = zip([...Object.entries(contents).map(([name, data]) => ({ name, data })), { name: 'manifest.json', data: Buffer.from(JSON.stringify(sourceManifest)) }]);
  const url = 'https://r.open-design.ai/files/' + digest(archive);
  const record = { templateId: id, entry: { templateId: id, original: { templateName: 'Demo', templateId: 'V001', sourceUrl: 'https://example.com/reference' }, files: [], motionDocumentUrl: url, previewUrl: 'https://r.open-design.ai/files/' + 'b'.repeat(64) }, locales: { en: {}, 'zh-CN': { original: { templateName: '示例', templateId: 'V001', sourceUrl: 'https://example.com/reference' } } }, sourceArchive: { url, bytes: archive.length, sha256: digest(archive) } };
  const manifest = { schemaVersion: 1, source: { url: 'https://r.open-design.ai/resources/test/channels/default/main.json', sha256: 'a'.repeat(64) }, publication: { resourceId: 'test', environment: 'prod', channel: 'default', defaultLocale: 'en', locales: ['en', 'zh-CN'] }, templateIds: [id] };
  const json = (name: string, data: unknown) => writeFileSync(path.join(directory, name), JSON.stringify(data));
  writeFileSync(path.join(catalog, 'catalog.json'), JSON.stringify(manifest)); json('template.json', record); json('source/manifest.json', sourceManifest);
  for (const [name, data] of Object.entries(contents)) writeFileSync(path.join(directory, 'source', name), data);
  writeFileSync(path.join(directory, 'TEMPLATE.md'), '# Instructions');
  git(['-c', 'init.templateDir=', 'init', '-b', 'main', root], root);
  git(['config', 'user.name', 'Template test'], root); git(['config', 'user.email', 'test@example.invalid'], root); git(['config', 'core.hooksPath', '/dev/null'], root);
  const stage = () => git(['-c', 'filter.lfs.process=', '-c', 'filter.lfs.clean=cat', '-c', 'filter.lfs.required=false', 'add', '.'], root);
  return { root, catalog, id, directory, archive, image, record, sourceManifest, json, stage };
}

test('imported templates preserve IDs, eleven locales, filtering data and reference-only status', async () => {
  const manifest = JSON.parse(await readFile(path.join(catalogRoot, 'catalog.json'), 'utf8'));
  const publication = await exportCatalog();
  assert(manifest.templateIds.length >= 286); assert.equal(Object.keys(publication.content).length, 11);
  for (const locale of manifest.publication.locales) {
    const { templates, ...facets } = publication.content[locale];
    assert.deepEqual(facets, manifest.localeContent[locale]); assert(facets.brands.length > 0);
    assert.deepEqual(templates.map(item => item.templateId), manifest.templateIds);
    assert(templates.filter(item => item.files.length === 0 && item.projectFileUrl === null && item.conversionStatus === 'pending').length >= 286);
  }
  let images = 0, remoteImages = 0;
  for (const id of manifest.templateIds) {
    const files = await readdir(path.join(catalogRoot, id, 'source'), { recursive: true });
    assert(!files.some(file => /\.zip$/i.test(file)), 'Duplicate archives do not belong in template source');
    images += files.filter(file => file.endsWith('.jpg')).length;
    const record = JSON.parse(await readFile(path.join(catalogRoot, id, 'template.json'), 'utf8'));
    remoteImages += (record.remoteAssets ?? []).length;
  }
  assert(images >= 1419 && remoteImages >= 236, 'Small images are local; large originals have CMS rendition links');
});
test('import unpacks verified source and original images without fetching a video or keeping duplicate archives', async t => {
  const f = fixture(t); const publication = await exportCatalog(f.catalog);
  const input = path.join(f.root, 'publication.json'); writeFileSync(input, JSON.stringify(publication));
  mkdirSync(path.join(f.root, 'packages/V001'), { recursive: true }); writeFileSync(path.join(f.root, 'packages/V001/motion.md'), f.archive);
  const output = path.join(f.root, 'imported'); await importCatalog(input, path.join(f.root, 'packages'), output);
  assert.deepEqual(await readFile(path.join(output, f.id, 'source/assets/frame.jpg')), f.image);
  assert.deepEqual(await exportCatalog(output), publication);
  assert(!(await readdir(path.join(output, f.id))).some(name => /\.(?:mp4|zip)$/.test(name)));
  await assert.rejects(importCatalog(input, path.join(f.root, 'packages'), output), /EEXIST/);
});
test('corrupt input packages fail before creating a template directory', async t => {
  const f = fixture(t); const input = path.join(f.root, 'publication.json'); writeFileSync(input, JSON.stringify(await exportCatalog(f.catalog)));
  mkdirSync(path.join(f.root, 'packages/V001'), { recursive: true }); writeFileSync(path.join(f.root, 'packages/V001/motion.md'), 'corrupt');
  await assert.rejects(importCatalog(input, path.join(f.root, 'packages'), path.join(f.root, 'imported')), /differs from published archive/);
  await assert.rejects(readdir(path.join(f.root, 'imported', f.id)), /ENOENT/);
});
test('unsafe ZIP paths, duplicates, malformed archives and changed locale identities are rejected', t => {
  const f = fixture(t);
  for (const name of ['../escape', '/escape', 'C:/escape', 'assets/../escape', 'assets\\escape']) assert.throws(() => unzip(zip([{ name, data: Buffer.from('x') }])), /Unsafe template path/);
  assert.throws(() => unzip(zip([{ name: 'a', data: Buffer.from('x') }, { name: 'a', data: Buffer.from('y') }])), /duplicate path/);
  assert.throws(() => unzip(Buffer.from('bad')), /Invalid ZIP/);
  assert.throws(() => safePath('../bad')); assert.throws(() => cmsUrl('https://r.open-design.ai@evil.test/files/' + 'a'.repeat(64)));
  f.record.locales.en = { templateId: 'changed' } as any;
  assert.throws(() => validateRecord(f.record, f.id, ['en', 'zh-CN']), /changed identity/);
});
test('staged small local images pass without LFS; product media is outside this policy', t => {
  const f = fixture(t); mkdirSync(path.join(f.root, 'product')); writeFileSync(path.join(f.root, 'product/video.mp4'), Buffer.alloc(1024 * 1024 + 1));
  f.stage(); assert.deepEqual(checkTemplateLibrary(f.root), []);
  writeFileSync(path.join(f.directory, 'source/preview.html'), 'unstaged edit'); assert.deepEqual(checkTemplateLibrary(f.root), []);
});
test('edited source must refresh its manifest before staging a valid contribution', async t => {
  const f = fixture(t); writeFileSync(path.join(f.directory, 'source/preview.html'), 'edited source'); f.stage();
  assert.match(checkTemplateLibrary(f.root).join('\n'), /Source manifest mismatch/);
  await refreshManifest(f.id, f.catalog); f.stage(); assert.deepEqual(checkTemplateLibrary(f.root), []);
  writeFileSync(path.join(f.directory, 'source/assets/extra.jpg'), f.image); f.stage();
  assert.match(checkTemplateLibrary(f.root).join('\n'), /coverage mismatch/);
  await refreshManifest(f.id, f.catalog); f.stage(); assert.deepEqual(checkTemplateLibrary(f.root), []);
});
test('raw videos, malformed pointers and disguised binary source are rejected', t => {
  const f = fixture(t);
  writeFileSync(path.join(f.directory, 'source/binary.txt'), Buffer.from([0, 1, 255]));
  writeFileSync(path.join(f.directory, 'source/assets/video.mp4'), Buffer.from([0, 1, 255]));
  f.stage(); const errors = checkTemplateLibrary(f.root).join('\n');
  assert.match(errors, /disguised binary/); assert.match(errors, /video\/audio must use Git LFS/);
});
test('large ordinary images are rejected; valid LFS assets pass without downloading or CMS uploads', async t => {
  const large = fixture(t, 100001); large.stage();
  assert.match(checkTemplateLibrary(large.root).join('\n'), /asset exceeds 100 KB/);
  const f = fixture(t);
  mkdirSync(path.join(f.directory, 'source/assets/lfs'), { recursive: true });
  writeFileSync(path.join(f.root, '.gitattributes'), `${scope}*/source/assets/lfs/** filter=lfs diff=lfs merge=lfs -text\n`);
  const name = 'source/assets/lfs/video.mp4';
  writeFileSync(path.join(f.directory, name), `version https://git-lfs.github.com/spec/v1\noid sha256:${'a'.repeat(64)}\nsize 2000000\n`);
  delete (f.record as any).sourceArchive; delete (f.record.entry as any).motionDocumentUrl; delete (f.record.entry as any).previewUrl;
  Object.assign(f.record, { localMedia: { preview: 'assets/lfs/video.mp4' } });
  f.json('template.json', f.record);
  await refreshManifest(f.id, f.catalog); f.stage();
  const manifest = JSON.parse(await readFile(path.join(f.directory, 'source/manifest.json'), 'utf8'));
  assert.deepEqual(manifest.files.find(file => file.path === 'assets/lfs/video.mp4'), { path: 'assets/lfs/video.mp4', bytes: 2000000, sha256: 'a'.repeat(64) });
  assert.deepEqual(checkTemplateLibrary(f.root), []);
  git(['commit', '-qm', 'Initial source'], f.root); const base = git(['rev-parse', 'HEAD'], f.root).toString().trim();
  writeFileSync(path.join(f.directory, name), `version https://git-lfs.github.com/spec/v1\noid sha256:${'b'.repeat(64)}\nsize 2000001\n`);
  await refreshManifest(f.id, f.catalog); f.stage(); git(['commit', '-qm', 'Update LFS media'], f.root);
  assert.deepEqual(checkTemplateLibrary(f.root, base), []);
  writeFileSync(path.join(f.root, '.gitattributes'), ''); f.stage();
  assert.match(checkTemplateLibrary(f.root).join('\n'), /staged LFS attributes/);
});
test('LFS budgets, pointer hashes and required filtering cannot be bypassed by checkout contents', async t => {
  const f = fixture(t);
  mkdirSync(path.join(f.directory, 'source/assets/lfs'), { recursive: true });
  writeFileSync(path.join(f.root, '.gitattributes'), `${scope}*/source/assets/lfs/** filter=lfs diff=lfs merge=lfs -text\n`);
  const save = (name: string, size: number) => writeFileSync(path.join(f.directory, 'source/assets/lfs', name), `version https://git-lfs.github.com/spec/v1\noid sha256:${'a'.repeat(64)}\nsize ${size}\n`);
  save('video.mp4', 50 * 1024 * 1024 + 1); await refreshManifest(f.id, f.catalog); f.stage();
  assert.match(checkTemplateLibrary(f.root).join('\n'), /LFS asset exceeds 50 MiB/);
  for (let i = 0; i < 4; i++) save(`clip-${i}.mp4`, 40 * 1024 * 1024);
  await refreshManifest(f.id, f.catalog); f.stage();
  assert.match(checkTemplateLibrary(f.root).join('\n'), /template assets exceed 150 MiB/);
  save('video.mp4', 1234); f.stage();
  assert.match(checkTemplateLibrary(f.root).join('\n'), /Source manifest mismatch/);
  writeFileSync(path.join(f.directory, 'source/assets/lfs/video.mp4'), 'raw video with no clean filter'); f.stage();
  assert.match(checkTemplateLibrary(f.root).join('\n'), /valid LFS pointer/);
});
test('real Git LFS pushes media and supports a pointer-only clone followed by a scoped pull', {
  skip: spawnSync('git', ['lfs', 'version']).status !== 0,
}, async t => {
  const f = fixture(t);
  git(['config', 'core.hooksPath', '.git/hooks'], f.root);
  git(['lfs', 'install', '--local', '--skip-smudge'], f.root);
  writeFileSync(path.join(f.root, '.gitattributes'), `${scope}*/source/assets/lfs/** filter=lfs diff=lfs merge=lfs -text\n`);
  mkdirSync(path.join(f.directory, 'source/assets/lfs'), { recursive: true });
  const name = scope + f.id + '/source/assets/lfs/video.mp4';
  const bytes = Buffer.alloc(2 * 1024 * 1024, 42);
  writeFileSync(path.join(f.root, name), bytes);
  await refreshManifest(f.id, f.catalog);
  git(['add', '.'], f.root);
  assert.deepEqual(checkTemplateLibrary(f.root), []);
  assert.match(git(['show', ':' + name], f.root).toString(), /oid sha256:/);
  git(['commit', '-qm', 'Contribute local LFS media'], f.root);
  const remote = f.root + '-remote.git', clone = f.root + '-clone';
  t.after(() => { rmSync(remote, { recursive: true, force: true }); rmSync(clone, { recursive: true, force: true }); });
  git(['init', '--bare', remote], f.root);
  git(['remote', 'add', 'origin', remote], f.root);
  git(['push', '-u', 'origin', 'main'], f.root);
  git(['symbolic-ref', 'HEAD', 'refs/heads/main'], remote);
  git(['-c', 'filter.lfs.smudge=git-lfs smudge --skip -- %f', '-c', 'filter.lfs.process=git-lfs filter-process --skip', 'clone', remote, clone], f.root);
  assert.match((await readFile(path.join(clone, name), 'utf8')), /version https:\/\/git-lfs/);
  git(['lfs', 'install', '--local', '--skip-smudge'], clone);
  git(['lfs', 'pull', '--include=' + scope + f.id + '/source/assets/lfs/**', '--exclude='], clone);
  const downloaded = await readFile(path.join(clone, name));
  assert.equal(downloaded.length, bytes.length); assert.equal(digest(downloaded), digest(bytes));
  assert.deepEqual(checkTemplateLibrary(clone), []);
});
test('verified remote renditions replace large original files, preserve provenance and survive source edits', async t => {
  const f = fixture(t, 100001);
  const rendition = Buffer.from('CMS rendition');
  const remote = { source: f.sourceManifest.files[0], url: 'https://r.open-design.ai/files/' + digest(rendition), bytes: rendition.length, sha256: digest(rendition) };
  const input = path.join(f.root, 'publication.json'); writeFileSync(input, JSON.stringify(await exportCatalog(f.catalog)));
  mkdirSync(path.join(f.root, 'packages/V001'), { recursive: true }); writeFileSync(path.join(f.root, 'packages/V001/motion.md'), f.archive);
  const output = path.join(f.root, 'imported');
  await assert.rejects(importCatalog(input, path.join(f.root, 'packages'), output), /Provide a verified CMS link/);
  await importCatalog(input, path.join(f.root, 'packages'), output, { [f.id]: [remote] });
  await assert.rejects(readFile(path.join(output, f.id, 'source/assets/frame.jpg')), /ENOENT/);
  assert((await readFile(path.join(output, f.id, 'source/preview.html'), 'utf8')).includes(remote.url));
  assert.deepEqual(await exportCatalog(output), await exportCatalog(f.catalog));
  const record = JSON.parse(await readFile(path.join(output, f.id, 'template.json'), 'utf8'));
  assert.deepEqual(record.remoteAssets, [remote]);
  await refreshManifest(f.id, output);
  const sourceManifest = JSON.parse(await readFile(path.join(output, f.id, 'source/manifest.json'), 'utf8'));
  assert.deepEqual(sourceManifest.files.find(file => file.path === remote.source.path), remote.source);
  f.json('template.json', record); rmSync(path.join(f.directory, 'source/assets/frame.jpg'));
  writeFileSync(path.join(f.directory, 'source/preview.html'), await readFile(path.join(output, f.id, 'source/preview.html')));
  await refreshManifest(f.id, f.catalog); f.stage(); assert.deepEqual(checkTemplateLibrary(f.root), []);
  record.remoteAssets[0].sha256 = 'a'.repeat(64); f.json('template.json', record); f.stage();
  assert.match(checkTemplateLibrary(f.root).join('\n'), /identity mismatch/);
});
test('adding then deleting large blobs and videos cannot hide new Git history growth', t => {
  const f = fixture(t); f.stage(); git(['commit', '-qm', 'Initial template'], f.root);
  const base = git(['rev-parse', 'HEAD'], f.root).toString().trim();
  writeFileSync(path.join(f.directory, 'large.json'), 'x'.repeat(1024 * 1024 + 1));
  writeFileSync(path.join(f.directory, 'source/assets/large.jpg'), Buffer.alloc(100001));
  writeFileSync(path.join(f.directory, 'source/assets/video.mp4'), Buffer.from([0, 1, 255]));
  f.stage(); git(['commit', '-qm', 'Add unwanted data'], f.root);
  rmSync(path.join(f.directory, 'large.json')); rmSync(path.join(f.directory, 'source/assets/video.mp4'));
  rmSync(path.join(f.directory, 'source/assets/large.jpg'));
  f.stage(); git(['commit', '-qm', 'Remove unwanted data'], f.root);
  assert.deepEqual(checkTemplateLibrary(f.root), []);
  const errors = checkTemplateLibrary(f.root, base).join('\n'); assert.match(errors, /exceeds 1 MiB, even if deleted/); assert.match(errors, /video\/audio must use LFS/);
  assert.match(errors, /asset exceeds 100 KB or bypasses LFS; remove it from new history/);
});
test('metadata and unregistered directories cannot bypass template validation', t => {
  const f = fixture(t); f.record.templateId = 'wrong'; f.json('template.json', f.record);
  mkdirSync(path.join(f.catalog, 'unlisted')); writeFileSync(path.join(f.catalog, 'unlisted/guide.md'), 'Unlisted');
  f.stage(); const errors = checkTemplateLibrary(f.root).join('\n'); assert.match(errors, /ID must match/); assert.match(errors, /not registered/);
});
