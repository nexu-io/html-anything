import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, realpath, rm, symlink, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { mediaKey, mediaOrigin } from '../shared/repository-media.ts';
import { TemplateCatalog } from '../prism-templates.ts';
import { repositoryCatalogRoot, readRepositoryFile } from '../shared/repository-template-catalog.ts';
import { WorkspaceStore } from '../workspace.ts';
import { transport } from './http.ts';
import { templatePrompt } from '../shared/integration.ts';
import { repositoryTemplatePrompts } from '../shared/template-prompts.ts';
import { templates as builtinTemplates } from '../template-library.ts';

process.env.MOTION_TEMPLATE_SOURCE = 'repository';
const appRoot = fileURLToPath(new URL('../', import.meta.url));
const firstId = 'motion-f4b325fd-64ba-42da-9f7e-6a6b77cfafd2';

async function fixture(t: { after: (fn: () => Promise<void>) => void }) {
  const work = await mkdtemp(path.join(tmpdir(), 'openmotion-repository-runtime-'));
  t.after(() => rm(work, { recursive: true, force: true }));
  const root = path.join(work, 'catalog'), id = 'motion-local', folder = path.join(root, id);
  await mkdir(path.join(folder, 'source'), { recursive: true });
  const manifest = { schemaVersion: 1, publication: { resourceId: 'repository-fixture', environment: 'prod', channel: 'default', publicationId: 'imported-publication', defaultLocale: 'en', locales: ['en', 'zh-CN'] }, templateIds: [id] };
  const record = { templateId: id, entry: { templateId: id, sortOrder: 1, original: { templateName: 'Local guide', summary: 'Local motion guidance' }, files: [] }, locales: { en: {}, 'zh-CN': { original: { templateName: '本地指南', summary: '本地动效规范' } } } };
  const save = (name: string, value: unknown) => writeFile(path.join(root, name), JSON.stringify(value));
  await save('catalog.json', manifest); await save(id + '/template.json', record);
  await save(id + '/source/manifest.json', { files: [{ path: 'motion.md' }, { path: 'preview.html' }] });
  await writeFile(path.join(folder, 'TEMPLATE.md'), '# Local instructions');
  await writeFile(path.join(folder, 'source/motion.md'), '# Local motion');
  await writeFile(path.join(folder, 'source/preview.html'), '<html>local example</html>');
  const catalog = new TemplateCatalog(work, { source: 'repository', repositoryRoot: root, locale: 'en', fetch: async () => { throw new Error('Unexpected CMS request'); } });
  return { work, root, folder, id, manifest, record, save, catalog };
}

test('repository index, detail and gallery read local files with no CMS dependency and observe edits', async t => {
  const f = await fixture(t);
  const first = await f.catalog.index();
  assert.equal(first.source, 'repository'); assert.equal(first.total, 4);
  const row = JSON.parse((await readFile(first.indexPath, 'utf8')).split('\n')[0]);
  assert.equal(row.localSource.directory, await realpath(f.folder));
  const detail = await f.catalog.detail(f.id);
  assert.equal(detail.instructions, '# Local instructions');
  assert.equal(detail.motionDocument?.content, '# Local motion');
  assert.equal(detail.hasHtmlProject, false);
  assert.equal(detail.workflowGuide.workflow, 'production');
  assert.equal((await f.catalog.page({ query: '本地', locale: 'zh-CN' })).items[0].title, '本地指南');
  f.record.entry.original.templateName = 'Edited locally';
  await f.save(f.id + '/template.json', f.record);
  await writeFile(path.join(f.folder, 'source/motion.md'), '# Edited motion');
  const updated = await f.catalog.index();
  assert.notEqual(updated.catalogVersion, first.catalogVersion);
  assert.equal((await f.catalog.detail(f.id)).motionDocument?.content, '# Edited motion');
  assert((await readFile(updated.indexPath, 'utf8')).includes('Edited locally'));
  assert(!(await readFile(first.indexPath, 'utf8')).includes('Edited locally'));
  await assert.rejects(f.catalog.get('missing'), /模板不存在/);
});

test('malformed or missing local source fails explicitly and cannot silently use a CMS catalog', async t => {
  const f = await fixture(t);
  f.record.templateId = 'wrong'; await f.save(f.id + '/template.json', f.record);
  await assert.rejects(f.catalog.index(), /identity mismatch/);
  await assert.rejects(new TemplateCatalog(f.work, { source: 'repository', repositoryRoot: path.join(f.work, 'missing'), fetch: async () => { throw new Error('Unexpected CMS request'); } }).index(), /ENOENT/);
});

test('local source reads reject traversal, unlisted files and symlink escape', async t => {
  const f = await fixture(t);
  assert.equal((await f.catalog.sourceFile(f.id, 'motion.md')).toString(), '# Local motion');
  await assert.rejects(f.catalog.sourceFile(f.id, 'template.json'), /not found/);
  await assert.rejects(readRepositoryFile(f.root, '../outside.md'), /Invalid repository template path/);
  await writeFile(path.join(f.work, 'outside.md'), 'private fixture');
  await rm(path.join(f.folder, 'source/motion.md'));
  await symlink(path.join(f.work, 'outside.md'), path.join(f.folder, 'source/motion.md'));
  await assert.rejects(f.catalog.sourceFile(f.id, 'motion.md'), /symlinks/);
});

test('repository media works without CMS, refuses missing LFS bytes and verifies downloaded contents', async t => {
  const f = await fixture(t), bytes = Buffer.alloc(1024 * 1024 + 1, 42);
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  await mkdir(path.join(f.folder, 'source/assets/lfs'), { recursive: true });
  const relative = 'assets/lfs/reference.mp4', filename = path.join(f.folder, 'source', relative);
  await f.save(f.id + '/source/manifest.json', { files: [{ path: 'motion.md' }, { path: 'preview.html' }, { path: relative, bytes: bytes.length, sha256 }] });
  Object.assign(f.record, { localMedia: { preview: relative } }); await f.save(f.id + '/template.json', f.record);
  await writeFile(filename, `version https://git-lfs.github.com/spec/v1\noid sha256:${sha256}\nsize ${bytes.length}\n`);
  assert.equal((await f.catalog.page()).items[0].previewUrl, `/api/template-source/${f.id}/${relative}`);
  await assert.rejects(f.catalog.sourceFile(f.id, relative), { code: 'TEMPLATE_LFS_NOT_FETCHED' });
  await writeFile(filename, bytes);
  assert.deepEqual(await f.catalog.sourceFile(f.id, relative), bytes);
  await writeFile(filename, Buffer.alloc(bytes.length, 0));
  await assert.rejects(f.catalog.sourceFile(f.id, relative), /does not match/);
});

test('transferred PR media appears in Studio and detail without downloading and verifies bytes on source access', async t => {
  const f = await fixture(t), bytes = Buffer.alloc(128, 42), sha256 = createHash('sha256').update(bytes).digest('hex');
  const relative = 'assets/reference.mp4', url = mediaOrigin + '/' + mediaKey(sha256, relative);
  Object.assign(f.record, { localMedia: { preview: relative }, remoteAssets: [{ url, bytes: bytes.length, sha256, source: { path: relative, bytes: bytes.length, sha256 } }] });
  await f.save(f.id + '/template.json', f.record);
  await f.save(f.id + '/source/manifest.json', { files: [{ path: 'motion.md' }, { path: 'preview.html' }, { path: relative, bytes: bytes.length, sha256 }] });
  let calls = 0, corrupt = false;
  const catalog = new TemplateCatalog(f.work, { source: 'repository', repositoryRoot: f.root, fetch: async requested => {
    calls++; assert.equal(requested, url); return new Response(new Uint8Array(corrupt ? Buffer.alloc(bytes.length) : bytes));
  } });
  assert.equal((await catalog.page()).items[0].previewUrl, url);
  assert.equal((await catalog.detail(f.id)).previewUrl, url);
  assert.equal(calls, 0, 'Search and MCP detail must not fetch remote media');
  assert.deepEqual(await catalog.sourceFile(f.id, relative), bytes);
  corrupt = true;
  await assert.rejects(catalog.sourceFile(f.id, relative), /SHA-256 mismatch/);
});

test('HTTP gallery and guide routes use the same repository source; copied prompts use the connected plugin', async t => {
  const work = await mkdtemp(path.join(tmpdir(), 'openmotion-local-http-')); t.after(() => rm(work, { recursive: true, force: true }));
  t.mock.method(globalThis, 'fetch', async () => { throw new Error('Unexpected network'); });
  const request = transport(new WorkspaceStore(work));
  const page = await (await request('/motion-api/template-catalog?locale=en&query=Figma')).json();
  assert.equal(page.source, 'repository');
  const template = page.items.find(item => item.id === firstId); assert(template);
  assert.equal(template.localSource.directory, path.join(repositoryCatalogRoot, firstId));
  const response = await request(template.motionGuideUrl); assert.equal(response.status, 200);
  assert.equal(await response.text(), await readFile(template.localSource.previewPath, 'utf8'));
  const css = await request(`/api/template-source/${firstId}/viewer/board.css`); assert.equal(css.status, 200); assert.match(css.headers.get('content-type')!, /text\/css/);
  assert.equal((await request(`/api/template-source/${firstId}/%2e%2e%2f%2e%2e%2fpackage.json`)).status, 404);
  assert.equal((await request(`/api/template-source/${firstId}/missing.md`)).status, 404);
  const info = await (await request('/api/integration')).json();
  assert.equal(info.templateSource, 'repository'); assert.equal(info.transport.env.MOTION_TEMPLATE_SOURCE, 'repository');
  const prompt = templatePrompt(info, 'codex', { id: template.id, title: template.title });
  assert(prompt.includes(firstId) && prompt.includes('openmotion_get_template'));
  assert(!prompt.includes('releases.open-design.ai'));
  const localized = Object.keys(repositoryTemplatePrompts).map(locale => templatePrompt(info, 'codex', { id: firstId, title: '$& literal {name}' }, locale));
  assert.equal(new Set(localized).size, 11);
  for (const message of localized) assert(message.includes('$& literal {name}') && message.includes(firstId) && message.includes('localSource'));
});

test('the real stdio MCP resolves the loaded checkout from a different cwd without starting a backend', async t => {
  const work = await mkdtemp(path.join(tmpdir(), 'openmotion-local-stdio-')); t.after(() => rm(work, { recursive: true, force: true }));
  const hook = path.join(work, 'offline.mjs');
  await writeFile(hook, 'globalThis.fetch = async () => { throw new Error("Unexpected network"); };');
  const messages = [{ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'openmotion_list_templates', arguments: {} } },
    { jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'openmotion_get_template', arguments: { templateId: firstId } } }];
  const env = { ...process.env, MOTION_DATA_DIR: path.join(work, 'data'), OPENMOTION_TELEMETRY: '0' }; delete env.MOTION_TEMPLATE_SOURCE;
  const output = execFileSync(process.execPath, ['--import', hook, path.join(appRoot, 'mcp.ts')], { cwd: work, env, input: messages.map(x => JSON.stringify(x)).join('\n') + '\n', encoding: 'utf8', timeout: 20_000 });
  const responses = output.trim().split('\n').map(line => JSON.parse(line));
  assert.equal(responses[0].result.isError, undefined); assert.equal(responses[0].result.structuredContent.source, 'repository');
  const manifest = JSON.parse(await readFile(path.join(repositoryCatalogRoot, 'catalog.json'), 'utf8'));
  const index = responses[0].result.structuredContent;
  const rows = (await readFile(index.indexPath, 'utf8')).trim().split('\n').map(line => JSON.parse(line));
  const expectedIds = [...manifest.templateIds, ...builtinTemplates.map(template => template.id)];
  assert.equal(index.total, expectedIds.length);
  assert.deepEqual(rows.map(row => row.templateId).sort(), expectedIds.sort());
  assert.equal(responses[1].result.isError, undefined);
  const detail = responses[1].result.structuredContent;
  assert.equal(detail.localSource.directory, path.join(repositoryCatalogRoot, firstId));
  assert.equal(detail.motionDocument.content, await readFile(detail.localSource.motionPath, 'utf8'));
});
