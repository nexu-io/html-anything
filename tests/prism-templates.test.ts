// These fixtures exercise the published CMS contract independently of repository source.
process.env.MOTION_TEMPLATE_SOURCE = 'cms';
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { TemplateCatalog } from '../prism-templates.ts';
import { WorkspaceStore } from '../workspace.ts';
import { Phase1Service } from '../phase1.ts';
import { pluginRoot } from '../hyperframes.ts';
import { phase1Tools, validateInput } from '../shared/phase1-tools.ts';
import { transport } from './http.ts';
import { contents, mockPrism, publication } from './prism-fixture.ts';
import { packageTemplateConfig } from '../shared/template-config.ts';

test('catalog returns a local searchable index; disk cache revalidates with ETag and survives outages', async t => {
  const directory = await mkdtemp(path.join(tmpdir(), 'motion-prism-cache-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const remote = mockPrism();
  const catalog = new TemplateCatalog(directory, { fetch: remote.request });
  const [index, page] = await Promise.all([catalog.index(), catalog.page({ query: '品牌' })]);
  assert.equal(remote.requests.length, 1);
  assert.equal(index.total, 4); // One published template and three built-ins.
  assert.equal('items' in index, false);
  const lines = (await readFile(index.indexPath, 'utf8')).trim().split('\n').map(line => JSON.parse(line));
  assert.equal(lines[0].templateId, page.items[0].id);
  assert.equal(lines[0].summary, page.items[0].description);
  assert.equal('files' in lines[0], false); assert.equal('files' in page.items[0], false);
  assert.equal(page.catalogVersion, index.catalogVersion);
  const reopened = new TemplateCatalog(directory, { fetch: remote.request });
  assert.equal((await reopened.index()).catalogVersion, index.catalogVersion);
  assert.equal(remote.requests.at(-1)!.etag, '"test-publication-1"');
  remote.offline();
  const offline = await new TemplateCatalog(directory, { fetch: remote.request }).index();
  assert.match(offline.warning!, /offline/);
  assert.equal(offline.catalogVersion, index.catalogVersion);
  await assert.rejects(new TemplateCatalog(path.join(directory, 'empty'), { fetch: remote.request }).index(), /offline/);
});

test('published changes replace the catalog; invalid publications preserve the last good cache', async t => {
  const directory = await mkdtemp(path.join(tmpdir(), 'motion-prism-update-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const remote = mockPrism();
  const catalog = new TemplateCatalog(directory, { fetch: remote.request });
  const first = await catalog.index();
  let now = Date.now(); t.mock.method(Date, 'now', () => now);
  remote.update(); now += 61_000;
  const second = await catalog.index();
  assert.notEqual(second.catalogVersion, first.catalogVersion);
  assert.notEqual(second.indexPath, first.indexPath);
  assert.match(await readFile(second.indexPath, 'utf8'), /测试模板 2/);
  assert.match(await readFile(first.indexPath, 'utf8'), /测试模板 1/);
  remote.update({ ...publication(3), environment: 'dev' }); now += 61_000;
  const invalid = await catalog.index();
  assert.equal(invalid.catalogVersion, second.catalogVersion);
  assert.match(invalid.warning!, /身份不匹配/);
  const dev = new TemplateCatalog(directory, { environment: 'dev', fetch: remote.request });
  assert.notEqual(dev.directory, catalog.directory);
  assert.equal((await dev.index()).catalogVersion, 'test-publication-3');
});

test('build defaults are production; runtime DEV uses a separate source, workspace and service identity', () => {
  assert.equal(packageTemplateConfig().environment, 'prod');
  assert.equal(packageTemplateConfig('dev').environment, 'dev');
  assert.throws(() => packageTemplateConfig('staging'), /dev or prod/);
  const env = { ...process.env }; delete env.MOTION_DATA_DIR;
  const inspect = (environment: string) => JSON.parse(execFileSync(process.execPath, ['--input-type=module', '-e',
    "import {defaultDataDir} from './workspace.ts'; import {editorBuild} from './editor-runtime.ts'; import {templateConfig,packageTemplateConfig} from './shared/template-config.ts'; console.log(JSON.stringify({directory:defaultDataDir,build:editorBuild,config:templateConfig(),packaged:packageTemplateConfig()}));"],
  { cwd: pluginRoot, env: { ...env, MOTION_TEMPLATE_ENV: environment }, encoding: 'utf8' }));
  const prod = inspect('prod'), dev = inspect('dev');
  assert.notEqual(dev.directory, prod.directory); assert.notEqual(dev.build, prod.build);
  assert.equal(dev.config.environment, 'dev'); assert.equal(dev.packaged.environment, 'prod');
});

test('published sortOrder takes precedence over legacy featured IDs', async t => {
  const directory = await mkdtemp(path.join(tmpdir(), 'motion-prism-order-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const remote = mockPrism(), data = publication();
  data.content['zh-CN'].templates.push({ ...data.content['zh-CN'].templates[0], templateId: 'hf-moment-M945', sortOrder: 2 });
  remote.update(data);
  const page = await new TemplateCatalog(directory, { fetch: remote.request }).page();
  assert.deepEqual(page.items.slice(0, 2).map(item => item.id), ['test-motion-1', 'hf-moment-M945']);
});

test('gallery, public template tools and project creation use the same published files', async t => {
  const directory = await mkdtemp(path.join(tmpdir(), 'motion-prism-project-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const remote = mockPrism(); t.mock.method(globalThis, 'fetch', remote.request);
  const store = new WorkspaceStore(directory);
  const service = new Phase1Service(store, pluginRoot, {
    origin: () => 'http://127.0.0.1:4173', nativeUrl: () => undefined, openProject: async () => {},
    mutation: task => task(), cancel: async () => {},
  });
  const index = await service.call('openmotion_list_templates', {});
  const detail = await service.call('openmotion_get_template', { templateId: 'test-motion-1' });
  assert.equal(detail.instructions, contents['TEMPLATE.md']);
  assert.equal(detail.catalogVersion, index.catalogVersion);
  const response = await transport(store)('/motion-api/template-catalog?category=builtin');
  assert.equal(response.status, 200);
  const page = await response.json();
  assert.equal(page.total, index.total); assert.equal(page.items[0].id, detail.id);
  const args = { requestId: 'prism-create', projectType: 'template', title: 'Prism project', requirements: '使用默认内容', templateId: detail.id };
  const created = await service.call('openmotion_create_project', args);
  assert.equal(created.source.catalogVersion, index.catalogVersion);
  assert.equal(await readFile(path.join(created.project.directory, 'index.html'), 'utf8'), contents['index.html']);
  assert.equal(await readFile(path.join(created.project.directory, 'animation.js'), 'utf8'), contents['animation.js']);
  assert.equal((await service.call('openmotion_create_project', args)).projectId, created.projectId);
  const before = await readdir(path.dirname(created.project.directory));
  remote.current.content['zh-CN'].templates[0].files[1].sha256 = '0'.repeat(64);
  // A new catalog instance reads the modified manifest from the mock publication.
  const otherStore = new WorkspaceStore(path.join(directory, 'broken'));
  const other = new Phase1Service(otherStore, pluginRoot, service.context);
  await assert.rejects(other.call('openmotion_create_project', { ...args, requestId: 'broken' }), /校验失败/);
  assert.equal(otherStore.projectCatalog().projects.some(project => project.title === args.title), false);
  assert.deepEqual(await readdir(path.dirname(created.project.directory)), before);
  assert.equal(phase1Tools.filter(tool => tool.name === 'openmotion_list_templates').length, 1);
  assert.throws(() => validateInput(phase1Tools.find(tool => tool.name === 'openmotion_list_templates')!.inputSchema, { query: 'x' }), /INVALID_ARGUMENT/);
});

test('template files cannot escape the destination; known built-ins work without the network', async t => {
  const directory = await mkdtemp(path.join(tmpdir(), 'motion-prism-path-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const remote = mockPrism();
  const catalog = new TemplateCatalog(directory, { fetch: remote.request });
  const template = await catalog.get('test-motion-1');
  template.files![0].path = '../outside.html';
  template.files!.push({ ...template.files![0], path: 'index.html' });
  await assert.rejects(catalog.copy(template, path.join(directory, 'project'), pluginRoot), /路径无效/);
  await assert.rejects(stat(path.join(directory, 'outside.html')), { code: 'ENOENT' });
  remote.offline();
  assert.equal((await catalog.get('product-promo')).kind, 'builtin');
});

test('reopening a template reuses verified files without sharing mutable project files', async t => {
  const directory = await mkdtemp(path.join(tmpdir(), 'motion-prism-files-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const remote = mockPrism();
  const catalog = new TemplateCatalog(directory, { fetch: remote.request });
  const template = await catalog.get('test-motion-1');
  await catalog.copy(template, path.join(directory, 'first'), pluginRoot);
  await writeFile(path.join(directory, 'first', 'index.html'), 'User edits');
  const requests = remote.requests.length;
  remote.offline();
  const reopened = new TemplateCatalog(directory, { fetch: remote.request });
  await reopened.copy(template, path.join(directory, 'second'), pluginRoot);
  assert.equal(remote.requests.length, requests);
  assert.equal(await readFile(path.join(directory, 'second', 'index.html'), 'utf8'), contents['index.html']);
  assert.equal((await reopened.detail('test-motion-1')).instructions, contents['TEMPLATE.md']);
});

test('gallery carries Prism facets and ordering without leaking project files', async t => {
  const directory = await mkdtemp(path.join(tmpdir(), 'motion-library-facets-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const data = publication();
  Object.assign(data.content['zh-CN'], { brands: [{ name: 'Figma', logoUrl: 'https://example.com/figma.svg' }] });
  Object.assign(data.content['zh-CN'].templates[0], { motionDocumentUrl: 'https://example.com/motion.zip', motionGuideUrl: 'https://example.com/guide', brand: 'Figma', featuredOrder: 0, creationModels: ['Model A'], colors: ['blue'], industries: ['Design'], width: 1920, height: 1080 });
  Object.assign(data.content['zh-CN'].templates[0].original, { promotionalUseCases: 'Launch, Demo', visualPresentation: 'UI, Typography' });
  const catalog = new TemplateCatalog(directory, { fetch: async () => Response.json(data) });
  const { items } = await catalog.page({ category: 'all' });
  assert.equal(items[0].motionDocumentUrl, 'https://example.com/motion.zip'); assert.equal(items[0].motionGuideUrl, 'https://example.com/guide');
  assert.equal(items[0].brand, 'Figma'); assert.equal(items[0].featuredOrder, 0);
  assert.equal(items[0].brandLogoUrl, 'https://example.com/figma.svg');
  assert.deepEqual(items[0].uses, ['Launch', 'Demo']); assert.deepEqual(items[0].styles, ['UI', 'Typography']);
  assert.deepEqual(items[0].creationModels, ['Model A']); assert.equal(items[0].hasHtmlProject, true);
  assert.equal('files' in items[0], false);
});

test('one cached publication serves concurrent locales and locale-specific downloads', async t => {
  const directory = await mkdtemp(path.join(tmpdir(), 'motion-prism-locales-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const remote = mockPrism(), data = publication();
  const localized = (title: string, document: string) => ({ templates: data.content['zh-CN'].templates.map(item => ({ ...item,
    original: { ...item.original, templateName: title }, motionDocumentUrl: document,
  })) });
  Object.assign(data.content, { en: localized('English template', 'https://example.com/en.zip'), 'pt-br': localized('Modelo', 'https://example.com/pt.zip') });
  remote.update(data);
  const catalog = new TemplateCatalog(directory, { fetch: remote.request });
  const [english, portuguese, chinese, fallback] = await Promise.all(['en', 'pt-BR', 'zh', 'ja'].map(locale => catalog.page({ locale })));
  assert.equal(remote.requests.length, 1);
  assert.equal(english.items[0].title, 'English template');
  assert.equal(portuguese.items[0].title, 'Modelo');
  assert.equal(portuguese.items[0].motionDocumentUrl, 'https://example.com/pt.zip');
  assert.equal(chinese.items[0].title, '测试模板 1');
  assert.equal(fallback.items[0].title, 'English template');
  assert.equal((await catalog.get('test-motion-1')).files[0].url, data.content['zh-CN'].templates[0].files[0].url);
});
