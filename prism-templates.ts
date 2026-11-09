import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { templatePage, type GalleryTemplate } from './shared/catalog.ts';
import { templateConfig } from './shared/template-config.ts';
import { libraryTemplates, templateRecipe } from './template-catalog.ts';
import { copyTemplate } from './template-library.ts';

type TemplateFile = { path: string; url: string; bytes: number; sha256: string };
type PrismTemplate = {
  templateId: string; sortOrder: number; original: Record<string, string>;
  indexUrl: string; previewUrl: string; coverUrl: string; files: TemplateFile[];
  conversionStatus?: string; conversionNotes?: string;
};
type Publication = {
  resourceId: string; environment: string; channel: string; publicationId: string;
  defaultLocale: string; content: Record<string, { templates: PrismTemplate[] }>;
};
type Snapshot = { etag: string | null; publication: Publication };
export type EditableTemplate = GalleryTemplate & { files?: TemplateFile[]; catalogVersion?: string; conversionStatus?: string; conversionNotes?: string };
const builtinTemplates = libraryTemplates.filter(template => template.kind === 'builtin');
const hash = (value: string | Buffer) => createHash('sha256').update(value).digest('hex');

async function atomicWrite(filename: string, content: string): Promise<void> {
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
  private readonly request: typeof fetch;

  constructor(dataDirectory: string, options: { environment?: string; resourceId?: string; locale?: string; fetch?: typeof fetch } = {}) {
    const config = templateConfig();
    this.environment = options.environment ?? config.environment;
    if (!['dev', 'prod'].includes(this.environment)) throw new Error('MOTION_TEMPLATE_ENV must be dev or prod');
    this.resourceId = options.resourceId ?? config.resourceId;
    this.locale = options.locale ?? config.locale;
    const origin = this.environment === 'dev' ? 'https://r.powerformer.net' : 'https://r.open-design.ai';
    this.url = `${origin}/resources/${encodeURIComponent(this.resourceId)}/channels/default/main.json`;
    this.directory = path.resolve(dataDirectory, 'template-cache', hash(this.url + this.locale).slice(0, 16));
    this.request = options.fetch ?? fetch;
  }

  private entries(publication: Publication): PrismTemplate[] {
    if (publication.resourceId !== this.resourceId || publication.environment !== this.environment || publication.channel !== 'default' || !publication.publicationId) {
      throw new Error('模板目录的发布身份不匹配');
    }
    const entries = publication.content?.[this.locale]?.templates;
    if (!Array.isArray(entries) || entries.some(item => !item.templateId || !item.original?.templateName || !Array.isArray(item.files))) {
      throw new Error(`模板目录缺少 ${this.locale} 模板数据`);
    }
    return entries;
  }

  async refresh(): Promise<Snapshot> {
    if (this.pending) return this.pending;
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

  private templates(snapshot: Snapshot): EditableTemplate[] {
    const remote: EditableTemplate[] = [...this.entries(snapshot.publication)].sort((a, b) => a.sortOrder - b.sortOrder).map(item => ({
      id: item.templateId, title: item.original.templateName, subtitle: item.original.category || 'Motion',
      description: item.original.summary || '', kind: 'prism' as const, collection: 'example' as const,
      tags: [item.original.promotionalUseCases, item.original.visualPresentation, item.original.motionTags].filter(Boolean).flatMap(value => value.split(/[,，·]/).map(tag => tag.trim()).filter(Boolean)),
      duration: Number(item.original.durationSeconds) || undefined,
      author: item.original.author || item.original.attributionNickname || '',
      sourceUrl: item.original.sourceUrl, previewUrl: item.previewUrl, posterUrl: item.coverUrl,
      files: item.files, catalogVersion: snapshot.publication.publicationId,
      conversionStatus: item.conversionStatus, conversionNotes: item.conversionNotes,
    }));
    return [...remote, ...builtinTemplates];
  }

  async index() {
    const snapshot = await this.refresh();
    const items = this.templates(snapshot);
    const indexPath = path.join(this.directory, `templates.${hash(snapshot.publication.publicationId).slice(0, 16)}.index.jsonl`);
    const lines = items.map(item => JSON.stringify({ templateId: item.id, name: item.title, summary: item.description,
      category: item.subtitle, tags: item.tags, durationSeconds: item.duration, kind: item.kind })).join('\n') + '\n';
    await atomicWrite(indexPath, lines);
    return { indexPath, total: items.length, catalogVersion: snapshot.publication.publicationId, warning: this.warning };
  }

  async page(options: Parameters<typeof templatePage>[1] & { covered?: boolean } = {}) {
    const snapshot = await this.refresh();
    const items = this.templates(snapshot).map(({ files: _files, ...item }) => item);
    const visible = options.covered ? items.filter(item => item.posterUrl) : items;
    return { ...templatePage(visible, options), catalogTotal: items.length, catalogVersion: snapshot.publication.publicationId, warning: this.warning };
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
    const guide = template.files?.find(file => file.path === 'TEMPLATE.md');
    const instructions = guide ? (await this.downloadFile(guide)).toString('utf8') : templateRecipe(template);
    return { ...template, instructions, workflowGuide: { workflow: 'template', section: 'start', status: 'ready' }, warning: this.warning };
  }

  private async downloadFile(file: TemplateFile): Promise<Buffer> {
    const url = new URL(file.url);
    if (url.protocol !== 'https:' || url.hostname !== 'r.open-design.ai' || !url.pathname.startsWith('/files/')) throw new Error('模板文件地址无效');
    const response = await this.request(url, { redirect: 'error', signal: AbortSignal.timeout(30_000) });
    if (!response.ok) throw new Error(`模板文件下载失败：${file.path}（HTTP ${response.status}）`);
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length !== file.bytes || hash(bytes) !== file.sha256) throw new Error(`模板文件校验失败：${file.path}`);
    return bytes;
  }

  async copy(template: EditableTemplate, directory: string, runtimeRoot: string): Promise<void> {
    if (template.kind === 'builtin') return copyTemplate(template.id, directory, runtimeRoot);
    if (!template.files?.some(file => file.path === 'index.html')) throw new Error('模板缺少 index.html');
    for (const file of template.files) {
      if (!file.path || path.isAbsolute(file.path) || file.path.includes('\\') || file.path.split('/').some(part => !part || part === '..' || part === '.')) throw new Error('模板文件路径无效');
      const bytes = await this.downloadFile(file);
      const target = path.join(directory, file.path);
      await mkdir(path.dirname(target), { recursive: true });
      await writeFile(target, bytes, { flag: 'wx' });
    }
  }
}

const catalogs = new Map<string, TemplateCatalog>();
export function templateCatalogFor(dataDirectory: string): TemplateCatalog {
  const key = path.resolve(dataDirectory);
  let catalog = catalogs.get(key);
  if (!catalog) { catalog = new TemplateCatalog(key); catalogs.set(key, catalog); }
  return catalog;
}
