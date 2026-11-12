import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { templatePage, type GalleryTemplate } from './shared/catalog.ts';
import { catalogLocale } from './shared/template-locale.ts';
import { templateConfig } from './shared/template-config.ts';
import { libraryTemplates, templateRecipe } from './template-catalog.ts';
import { copyTemplate } from './template-library.ts';
import { loadRepositoryCatalog, readRepositoryFile, repositoryCatalogRoot } from './shared/repository-template-catalog.ts';

type TemplateFile = { path: string; url: string; bytes: number; sha256: string };
type PrismTemplate = {
  templateId: string; sortOrder: number; original: Record<string, string>;
  indexUrl: string; previewUrl: string; coverUrl: string; files: TemplateFile[];
  conversionStatus?: string; conversionNotes?: string;
  motionDocumentUrl?: string; motionGuideUrl?: string; projectFileUrl?: string; authorAvatarUrl?: string;
  brand?: string; creationModels?: string[]; colors?: string[]; industries?: string[];
  width?: number; height?: number; featuredOrder?: number | null;
};
type Publication = {
  resourceId: string; environment: string; channel: string; publicationId: string;
  defaultLocale: string; content: Record<string, { templates: PrismTemplate[] }>;
};
type Snapshot = { etag: string | null; publication: Publication; repository?: Awaited<ReturnType<typeof loadRepositoryCatalog>> };
export type EditableTemplate = GalleryTemplate & { files?: TemplateFile[]; catalogVersion?: string; conversionStatus?: string; conversionNotes?: string };
const splitTags = (value = '') => value.split(/[,，]/).map(tag => tag.trim()).filter(Boolean);
const builtinTemplates = libraryTemplates.filter(template => template.kind === 'builtin');
const hash = (value: string | Buffer) => createHash('sha256').update(value).digest('hex');

async function atomicWrite(filename: string, content: string | Buffer): Promise<void> {
  await mkdir(path.dirname(filename), { recursive: true });
  const temporary = filename + '.' + randomUUID();
  await writeFile(temporary, content);
  await rename(temporary, filename);
}

/** One disk-backed catalog shared by the gallery and Agent tools. */
export class TemplateCatalog {
  private snapshot?: Snapshot;
  private checkedAt = 0;
  private pending?: Promise<Snapshot>;
  private warning?: string;
  readonly environment: string;
  readonly resourceId: string;
  readonly locale: string;
  readonly url: string;
  readonly directory: string;
  readonly source: 'repository' | 'cms';
  readonly repositoryRoot: string;
  private readonly request: typeof fetch;

  constructor(dataDirectory: string, options: { environment?: string; resourceId?: string; locale?: string; fetch?: typeof fetch; source?: 'repository' | 'cms'; repositoryRoot?: string } = {}) {
    const config = templateConfig();
    this.environment = options.environment ?? config.environment;
    if (!['dev', 'prod'].includes(this.environment)) throw new Error('MOTION_TEMPLATE_ENV must be dev or prod');
    this.resourceId = options.resourceId ?? config.resourceId;
    this.locale = options.locale ?? config.locale;
    this.source = options.source ?? config.source;
    this.repositoryRoot = options.repositoryRoot ?? repositoryCatalogRoot;
    const origin = this.environment === 'dev' ? 'https://r.powerformer.net' : 'https://r.open-design.ai';
    this.url = `${origin}/resources/${encodeURIComponent(this.resourceId)}/channels/default/main.json`;
    this.directory = path.resolve(dataDirectory, 'template-cache', hash(this.url + this.locale).slice(0, 16));
    this.request = options.fetch ?? fetch;
  }

  private entries(publication: Publication, requested = this.locale): PrismTemplate[] {
    if (this.source === 'cms' && (publication.resourceId !== this.resourceId || publication.environment !== this.environment || publication.channel !== 'default' || !publication.publicationId)) {
      throw new Error('模板目录的发布身份不匹配');
    }
    const locale = catalogLocale(Object.keys(publication.content ?? {}), requested, publication.defaultLocale);
    const entries = publication.content?.[locale]?.templates;
    if (!Array.isArray(entries) || entries.some(item => !item.templateId || !item.original?.templateName || !Array.isArray(item.files))) {
      throw new Error(`模板目录缺少 ${locale} 模板数据`);
    }
    return entries;
  }

  async refresh(): Promise<Snapshot> {
    if (this.pending) return this.pending;
    if (this.source === 'repository') {
      this.pending = loadRepositoryCatalog(this.repositoryRoot).then(repository => ({ publication: repository.publication as Publication, etag: null, repository }))
        .finally(() => { this.pending = undefined; });
      return this.pending;
    }
    const interval = this.environment === 'dev' ? 2_000 : 60_000;
    if (this.snapshot && Date.now() - this.checkedAt < interval) return this.snapshot;
    this.pending = this.download().finally(() => { this.pending = undefined; });
    return this.pending;
  }

  private async download(): Promise<Snapshot> {
    const filename = path.join(this.directory, 'catalog.json');
    if (!this.snapshot) {
      try {
        const cached: Snapshot = JSON.parse(await readFile(filename, 'utf8'));
        this.entries(cached.publication);
        this.snapshot = cached;
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') this.warning = '模板缓存不可用，重新下载';
      }
    }
    try {
      const response = await this.request(this.url, {
        headers: this.snapshot?.etag ? { 'If-None-Match': this.snapshot.etag } : {},
        signal: AbortSignal.timeout(10_000),
      });
      if (response.status !== 304 || !this.snapshot) {
        if (!response.ok) throw new Error(`模板目录下载失败（HTTP ${response.status}）`);
        const publication: Publication = await response.json();
        this.entries(publication);
        const candidate = { publication, etag: response.headers.get('etag') };
        await atomicWrite(filename, JSON.stringify(candidate));
        this.snapshot = candidate;
      }
      this.warning = undefined;
    } catch (error) {
      if (!this.snapshot) throw error;
      this.warning = `模板更新失败，使用已缓存目录：${(error as Error).message}`;
    }
    this.checkedAt = Date.now();
    return this.snapshot!;
  }

  private templates(snapshot: Snapshot, requested = this.locale): EditableTemplate[] {
    const remote: EditableTemplate[] = [...this.entries(snapshot.publication, requested)].sort((a, b) => a.sortOrder - b.sortOrder).map(item => ({
      id: item.templateId, title: item.original.templateName, subtitle: item.original.category || 'Motion',
      description: item.original.summary || '', kind: 'prism' as const, collection: 'example' as const,
      tags: [item.original.promotionalUseCases, item.original.visualPresentation, item.original.motionTags].filter(Boolean).flatMap(value => value.split(/[,，·]/).map(tag => tag.trim()).filter(Boolean)),
      duration: Number(item.original.durationSeconds) || undefined,
      author: item.original.author || item.original.attributionNickname || '',
      sourceUrl: item.original.sourceUrl, previewUrl: item.previewUrl, posterUrl: item.coverUrl,
      files: item.files, catalogVersion: snapshot.repository?.version ?? snapshot.publication.publicationId,
      conversionStatus: item.conversionStatus, conversionNotes: item.conversionNotes,
      motionDocumentUrl: snapshot.repository ? `/api/template-source/${item.templateId}/motion.md` : item.motionDocumentUrl,
      motionGuideUrl: snapshot.repository ? `/api/template-source/${item.templateId}/preview.html` : item.motionGuideUrl,
      ...(snapshot.repository ? { localSource: snapshot.repository.sources.get(item.templateId) } : {}),
      projectFileUrl: item.projectFileUrl, authorAvatarUrl: item.authorAvatarUrl,
      styleDescription: item.original.styleDescription, reviewFocus: item.original.reviewFocus,
      brand: item.brand, uses: splitTags(item.original.promotionalUseCases), styles: splitTags(item.original.visualPresentation),
      industries: item.industries ?? [], creationModels: item.creationModels ?? [], colors: item.colors ?? [],
      width: item.width, height: item.height, sortOrder: item.sortOrder, featuredOrder: item.featuredOrder ?? null,
      hasHtmlProject: item.files.some(file => file.path === 'index.html'),
    }));
    return [...remote, ...builtinTemplates];
  }

  async index() {
    const snapshot = await this.refresh();
    const items = this.templates(snapshot);
    const catalogVersion = snapshot.repository?.version ?? snapshot.publication.publicationId;
    const indexPath = path.join(this.directory, `templates.${hash(catalogVersion).slice(0, 16)}.index.jsonl`);
    const lines = items.map(item => JSON.stringify({ templateId: item.id, name: item.title, summary: item.description,
      category: item.subtitle, tags: item.tags, durationSeconds: item.duration, kind: item.kind, localSource: item.localSource })).join('\n') + '\n';
    await atomicWrite(indexPath, lines);
    return { indexPath, total: items.length, catalogVersion, source: this.source, warning: this.warning };
  }

  async page(options: Parameters<typeof templatePage>[1] & { covered?: boolean; locale?: string } = {}) {
    const snapshot = await this.refresh();
    const items = this.templates(snapshot, options.locale).map(({ files: _files, ...item }) => item);
    const visible = options.covered ? items.filter(item => item.posterUrl) : items;
    return { ...templatePage(visible, options), catalogTotal: items.length, catalogVersion: snapshot.repository?.version ?? snapshot.publication.publicationId, source: this.source, warning: this.warning };
  }

  async get(id: string): Promise<EditableTemplate> {
    const builtin = builtinTemplates.find(item => item.id === id);
    if (builtin) return builtin;
    const snapshot = await this.refresh();
    const template = this.templates(snapshot).find(item => item.id === id);
    if (!template) throw new Error('模板不存在，请重新获取模板目录');
    return template;
  }

  async detail(id: string) {
    const template = await this.get(id);
    if (template.localSource) {
      const instructions = (await readRepositoryFile(this.repositoryRoot, id + '/TEMPLATE.md')).toString('utf8');
      const content = (await readRepositoryFile(this.repositoryRoot, id + '/source/motion.md')).toString('utf8');
      return { ...template, instructions, motionDocument: { path: template.localSource.motionPath, content }, source: this.source,
        workflowGuide: { workflow: template.hasHtmlProject ? 'template' : 'production', section: 'start', status: 'ready' } };
    }
    const guide = template.files?.find(file => file.path === 'TEMPLATE.md');
    const instructions = guide ? (await this.downloadFile(guide)).toString('utf8') : templateRecipe(template);
    return { ...template, instructions, workflowGuide: { workflow: 'template', section: 'start', status: 'ready' }, warning: this.warning };
  }

  async sourceFile(id: string, name: string): Promise<Buffer> {
    if (this.source !== 'repository') throw new Error('Repository template source is unavailable');
    const catalog = JSON.parse((await readRepositoryFile(this.repositoryRoot, 'catalog.json')).toString());
    if (!/^[a-z][a-z0-9-]+$/.test(id) || !catalog.templateIds.includes(id)) throw new Error('Repository template not found');
    const manifest = JSON.parse((await readRepositoryFile(this.repositoryRoot, id + '/source/manifest.json')).toString());
    if (name !== 'manifest.json' && !manifest.files.some((file: { path: string }) => file.path === name)) throw new Error('Repository template source file not found');
    return readRepositoryFile(this.repositoryRoot, id + '/source/' + name);
  }

  private async downloadFile(file: TemplateFile): Promise<Buffer> {
    const url = new URL(file.url);
    if (url.protocol !== 'https:' || url.hostname !== 'r.open-design.ai' || !url.pathname.startsWith('/files/')) throw new Error('模板文件地址无效');
    const cachedPath = path.join(this.directory, 'files', hash(file.url));
    const matches = (bytes: Buffer) => bytes.length === file.bytes && hash(bytes) === file.sha256;
    try {
      const cached = await readFile(cachedPath);
      if (matches(cached)) return cached;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
    const response = await this.request(url, { redirect: 'error', signal: AbortSignal.timeout(30_000) });
    if (!response.ok) throw new Error(`模板文件下载失败：${file.path}（HTTP ${response.status}）`);
    const bytes = Buffer.from(await response.arrayBuffer());
    if (!matches(bytes)) throw new Error(`模板文件校验失败：${file.path}`);
    await atomicWrite(cachedPath, bytes);
    return bytes;
  }

  async copy(template: EditableTemplate, directory: string, runtimeRoot: string): Promise<void> {
    if (template.kind === 'builtin') return copyTemplate(template.id, directory, runtimeRoot);
    if (!template.files?.some(file => file.path === 'index.html')) throw new Error('模板缺少 index.html');
    for (const file of template.files) {
      if (!file.path || path.isAbsolute(file.path) || file.path.includes('\\') || file.path.split('/').some(part => !part || part === '..' || part === '.')) throw new Error('模板文件路径无效');
    }
    const files = template.files.values();
    const workers = await Promise.allSettled(Array.from({ length: Math.min(4, template.files.length) }, async () => {
      for (const file of files) {
        const bytes = await this.downloadFile(file);
        const target = path.join(directory, file.path);
        await mkdir(path.dirname(target), { recursive: true });
        await writeFile(target, bytes, { flag: 'wx' });
      }
    }));
    // Settle all writes before the caller removes a failed project directory.
    const failed = workers.find(result => result.status === 'rejected');
    if (failed) throw failed.reason;
  }
}

const catalogs = new Map<string, TemplateCatalog>();
export function templateCatalogFor(dataDirectory: string): TemplateCatalog {
  const key = path.resolve(dataDirectory);
  let catalog = catalogs.get(key);
  if (!catalog) { catalog = new TemplateCatalog(key); catalogs.set(key, catalog); }
  return catalog;
}
