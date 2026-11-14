import { createHash, randomUUID } from 'node:crypto';
import { lstatSync, readFileSync, realpathSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { templates } from '../template-library.ts';

export const templatePresentationName = 'openmotion_show_template_recommendations';
export const templatePresentationMime = 'text/html;profile=mcp-app';
export const templatePresentationCapability = 'io.modelcontextprotocol/ui';
export const templatePresentationLimit = 1.5 * 1024 * 1024;
const applicationRoot = fileURLToPath(new URL('../', import.meta.url));
const uiDirectory = path.join(applicationRoot, 'mcp-ui/template-recommendations');
const supportedIds = ['product-promo', 'nyt-graph', 'decision-tree'];
const supportedLanguages = ['zh', 'en', 'ja', 'ko', 'fr', 'es', 'pt'];
const digest = (value: string | Buffer) => createHash('sha256').update(value).digest('hex');

type AssetFile = { path: string; sha256: string; bytes: number; mimeType?: string };
type PreviewTemplate = {
  id: string; title: string; description: string; durationSeconds: number;
  width: number; height: number; video: AssetFile; poster: AssetFile; sourceFiles: AssetFile[];
};
type ToolDefinition = {
  name: string; title: string; description: string; inputSchema: any;
  annotations: { readOnlyHint: boolean; openWorldHint: boolean };
  _meta: Record<string, unknown>;
};
export type TemplatePresentation = Readonly<{
  uri: string; resourceVersion: string; tool: ToolDefinition;
  descriptor: { uri: string; name: string; mimeType: string };
  content: { uri: string; mimeType: string; text: string; _meta: Record<string, unknown> };
  templates: readonly Readonly<PreviewTemplate>[];
}>;
export type McpClientState = { presentation?: TemplatePresentation };
export function createMcpClientState(): McpClientState { return {}; }

function requireValue(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error('TEMPLATE_PRESENTATION_INVALID: ' + message);
}
function regularFile(root: string, relative: string): Buffer {
  requireValue(typeof relative === 'string' && relative.length > 0 && !path.isAbsolute(relative)
    && !relative.includes('\\') && relative.split('/').every(part => part && part !== '.' && part !== '..'), 'invalid asset path');
  const realRoot = realpathSync(root);
  let current = realRoot;
  for (const part of relative.split('/')) {
    current = path.join(current, part);
    requireValue(!lstatSync(current).isSymbolicLink(), 'symbolic assets are not supported');
  }
  const info = lstatSync(current);
  requireValue(info.isFile() && info.size <= 1024 * 1024, 'asset must be a regular file below 1 MiB');
  return readFileSync(current);
}
function verifiedFile(root: string, file: AssetFile): Buffer {
  requireValue(file && typeof file === 'object' && /^[a-f0-9]{64}$/.test(file.sha256)
    && Number.isSafeInteger(file.bytes) && file.bytes > 0, 'invalid asset identity');
  const bytes = regularFile(root, file.path);
  requireValue(bytes.length === file.bytes && digest(bytes) === file.sha256, 'asset identity differs: ' + file.path);
  return bytes;
}
function freeze<T>(value: T): Readonly<T> {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
}
const safeJson = (value: unknown) => JSON.stringify(value).replaceAll('<', '\\u003c').replaceAll('\u2028', '\\u2028').replaceAll('\u2029', '\\u2029');

/** Read only the approved, prebuilt assets. No engine, service, or network is involved. */
export function loadTemplatePresentation(options: { directory?: string; applicationRoot?: string } = {}): TemplatePresentation {
  const directory = options.directory ?? uiDirectory;
  const appRoot = options.applicationRoot ?? applicationRoot;
  const manifest = JSON.parse(regularFile(directory, 'manifest.json').toString('utf8'));
  requireValue(manifest.schemaVersion === 1 && Array.isArray(manifest.templates) && manifest.templates.length === 3, 'invalid manifest');
  const packageInfo = JSON.parse(regularFile(appRoot, 'package.json').toString('utf8'));
  requireValue(manifest.runtime?.hyperframes === packageInfo.dependencies.hyperframes
    && manifest.runtime?.gsap === packageInfo.dependencies.gsap, 'preview runtime differs');
  const seen = new Set<string>();
  const previews = (manifest.templates as PreviewTemplate[]).map(template => {
    const canonical = templates.find(item => item.id === template.id);
    requireValue(canonical && supportedIds.includes(template.id) && !seen.has(template.id), 'unsupported or duplicate template');
    seen.add(template.id);
    requireValue(template.title === canonical.title && template.durationSeconds === canonical.duration
      && typeof template.description === 'string' && template.width === 960 && template.height === 540, 'template metadata differs');
    requireValue(Array.isArray(template.sourceFiles) && template.sourceFiles.length > 0, 'missing source identity');
    const sourcePaths = new Set<string>();
    for (const source of template.sourceFiles) {
      requireValue(typeof source.path === 'string' && (source.path.startsWith('template-library/' + template.id + '/')
        || ['template-library/LICENSE', 'template-library/NOTICE.md'].includes(source.path)) && !sourcePaths.has(source.path), 'invalid source identity');
      sourcePaths.add(source.path);
      verifiedFile(appRoot, source);
    }
    const registryPath = 'template-library/' + template.id + '/registry-item.json';
    requireValue(sourcePaths.has(registryPath), 'missing source registry identity');
    const registry = JSON.parse(regularFile(appRoot, registryPath).toString('utf8'));
    requireValue(Array.isArray(registry.files) && registry.files.every((file: { path: string }) =>
      sourcePaths.has('template-library/' + template.id + '/' + file.path)), 'incomplete template source identity');
    requireValue(template.video?.path === 'assets/' + template.id + '.mp4' && template.video.mimeType === 'video/mp4'
      && template.poster?.path === 'assets/' + template.id + '.jpg' && template.poster.mimeType === 'image/jpeg', 'invalid preview media');
    const video = verifiedFile(directory, template.video), poster = verifiedFile(directory, template.poster);
    requireValue(video.subarray(4, 8).toString() === 'ftyp' && poster[0] === 0xff && poster[1] === 0xd8, 'invalid preview bytes');
    return { id: template.id, title: template.title, description: template.description, durationSeconds: template.durationSeconds,
      videoBase64: video.toString('base64'), posterBase64: poster.toString('base64'), posterMimeType: 'image/jpeg' };
  });
  const script = regularFile(directory, 'build/app.js').toString('utf8');
  const css = regularFile(directory, 'build/app.css').toString('utf8');
  const metadata = { ui: { prefersBorder: false, csp: { connectDomains: [], resourceDomains: ['blob:'] } },
    'openai/ui': { preferredDisplayMode: 'inline' } };
  const skeleton = '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>{{css}}</style></head><body><main id="openmotion-template-cards"></main><script>window.__OPENMOTION_TEMPLATE_CARDS__={{bootstrap}};</script><script>{{script}}</script></body></html>';
  // This identity precedes HTML injection, avoiding a self-referential content hash.
  const resourceVersion = digest(JSON.stringify({ skeleton, manifest, metadata, css, script }));
  const text = skeleton.replace('{{css}}', () => css.replace(/<\/style/gi, '<\\/style'))
    .replace('{{bootstrap}}', () => safeJson({ resourceVersion, templates: previews }))
    .replace('{{script}}', () => script.replace(/<\/script/gi, '<\\/script'));
  const contentHash = digest(JSON.stringify({ text, metadata }));
  const uri = `ui://openmotion/template-recommendations/${contentHash}/index.html`;
  const content = { uri, mimeType: templatePresentationMime, text, _meta: metadata };
  requireValue(Buffer.byteLength(JSON.stringify({ jsonrpc: '2.0', id: 1, result: { contents: [content] } })) <= templatePresentationLimit, 'resource exceeds 1.5 MiB');
  const tool: ToolDefinition = {
    name: templatePresentationName, title: 'OpenMotion · Show Template Recommendations',
    description: 'Show three approved, full-video template previews in this chat, in the supplied order. Always set language to the language of the latest user request (or their explicit requested output language), regardless of the host interface locale. Supported: zh, en, ja, ko, fr, es, pt; use en for other languages. For first-run onboarding, after visibly opening the template library, set onboarding=true to include the persistent welcome above the cards; do not send a separate welcome or verification summary. This read-only presentation does not create or select a project. Use only when discovered natively; otherwise keep the template-library handoff.',
    inputSchema: { type: 'object', properties: { templateIds: { type: 'array', minItems: 3, maxItems: 3,
      items: { type: 'string', enum: supportedIds }, uniqueItems: true },
      language: { type: 'string', enum: supportedLanguages, description: 'Language of the latest user request, or their explicit requested output language. Always supply this field; do not infer it from the host UI locale.' },
      onboarding: { type: 'boolean', description: 'Include the persistent first-run welcome. Use only after the right-hand template library is visibly open.' } }, required: ['templateIds'], additionalProperties: false },
    annotations: { readOnlyHint: true, openWorldHint: false },
    _meta: { ui: { resourceUri: uri }, 'openai/ui': { preferredModelDisplayMode: 'inline' } },
  };
  return freeze({ uri, resourceVersion, tool, descriptor: { uri, name: 'OpenMotion template recommendations', mimeType: templatePresentationMime }, content, templates: manifest.templates });
}

/** Reinitialization must clear capabilities even when a previous init supported UI. */
export function negotiateTemplatePresentation(state: McpClientState | undefined, profile: string, capabilities: any): void {
  if (!state) return;
  state.presentation = undefined;
  const mimeTypes = capabilities?.extensions?.[templatePresentationCapability]?.mimeTypes;
  if (profile !== 'phase1' || process.env.OPENMOTION_TEMPLATE_CARDS === '0'
    || !Array.isArray(mimeTypes) || !mimeTypes.includes(templatePresentationMime)) return;
  try { state.presentation = loadTemplatePresentation(); }
  catch { /* Optional presentation failure must leave the domain tools available. */ }
}

export function showTemplateRecommendations(presentation: TemplatePresentation, args: { templateIds: string[]; onboarding?: boolean; language?: string }) {
  requireValue(Array.isArray(args.templateIds), 'templateIds is required');
  if (args.onboarding !== undefined && typeof args.onboarding !== 'boolean') throw new Error('INVALID_ARGUMENT: onboarding must be boolean');
  if (args.language !== undefined && !supportedLanguages.includes(args.language)) throw new Error('INVALID_ARGUMENT: unsupported presentation language');
  if (args.templateIds.length !== 3 || new Set(args.templateIds).size !== 3
    || args.templateIds.some(id => !supportedIds.includes(id))) throw new Error('INVALID_ARGUMENT: choose three distinct approved template IDs');
  const cards = args.templateIds.map((templateId, index) => {
    const template = presentation.templates.find(item => item.id === templateId)!;
    const actionRequestId = randomUUID();
    return { position: index + 1, templateId, title: template.title, description: template.description,
      durationSeconds: template.durationSeconds, actionRequestId,
      createArgs: { requestId: actionRequestId, projectType: 'template' as const, templateId,
        title: template.title, requirements: `Use the ${template.title} template with its unchanged sample content. Preserve its structure and animation. Do not export a video unless requested.` } };
  });
  return { schemaVersion: 1, resourceVersion: presentation.resourceVersion, recommendationId: randomUUID(), cards,
    ...(args.language !== undefined ? { language: args.language } : {}),
    ...(args.onboarding === true ? { onboarding: true as const } : {}),
    selectionGuide: 'Previewing is read-only. The Recreate template button only appends an editable prompt to the active composer through the negotiated OpenAI message extension with send=false; it never submits a task. Wait for the user to send their brief and attachments before creating or exporting. Follow the existing template Skill with the exact chosen template ID and the complete submitted requirements, including requested HTML/MP4 delivery. The legacy frozen createArgs apply only to an explicitly accepted unchanged sample copy; never substitute them for a customized submitted brief. Reuse confirmed projects and stable operation IDs for the same intent, and reconcile an unknown write before retrying. A numbered reply maps to this result order; redisplaying cards never authorizes another copy.' };
}
