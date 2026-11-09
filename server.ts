import { isMain } from './shared/entry.ts';
import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { access, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { WorkspaceStore, Conflict, createBlankProject, validateProjectTitle } from './workspace.ts';
import { cliPath, ensureRuntime, execute, HYPERFRAMES_VERSION, inspectProject, pluginRoot, runHyperframes, startStudio, stopCommands } from './hyperframes.ts';
import type { Studio } from './hyperframes.ts';
import { VERSION } from './preview.ts';
import { templates } from './template-library.ts';
import { templateRecipe } from './template-catalog.ts';
import { templateCatalogFor } from './prism-templates.ts';
import { isEditableTemplate } from './shared/catalog.ts';
import { proxyStudio, serveEditorFile } from './editor-server.ts';
import { publicTools as mcpTools } from './mcp.ts';
import { startOwnedStudio } from './shared/owned-studio.mjs';
import { sharedEditorEnabled, ensureEditor, editorRequest } from './editor-runtime.ts';
import { agentGuide, integrationConfig, integrationHost, type IntegrationInfo } from './shared/integration.ts';
import { validateInstruction } from './shared/conversation.ts';
import { creationMode, creationModes, artifactViewers, type CreativeSession, type CreationMode } from './shared/session.ts';
import { gatewayFor } from './gateway/service.ts';
import { WorkspaceBrowser } from './browser.ts';
import { Phase1Service } from './phase1.ts';
import { recoverProjectTransactions } from './phase1-versions.ts';
import { verifyExport } from './scripts/verify-export.ts';
import { createAppTracking, closeTracking, type OmTracking } from './shared/tracking.ts';
import { browserEvents } from './tracking/events.ts';
import { validPending } from './tracking/core.ts';
import { omEvents } from './tracking/events.ts';

const sharedStore = new WorkspaceStore();
export type Service = { studio?: Studio; runtimeRoot?: string; ffmpeg?: boolean; switching?: boolean; studioPort?: number; browser?: WorkspaceBrowser; editorToken?: string; ensureStudio?: (projectId?: string) => Promise<Studio>; launchStudio?: (directory: string, port: number) => Promise<Studio>; phase1?: Phase1Service; phase1Mutation?: Promise<void>; tracking?: OmTracking };
const service: Service = {};
const working = new Set<string>();
const runningExports = new Map<string, AbortController>();

export async function cancelExport(store: WorkspaceStore, projectId: string, jobId: string) {
  return store.lock(async () => {
    const job = await store.job(jobId);
    if (!job || job.projectId !== projectId) throw new Error('EXPORT_NOT_FOUND: 任务不属于该项目');
    if (job.state === 'pending') { job.state = 'cancelled'; job.stage = 'cancelled'; }
    else if (job.state === 'running') job.state = 'cancelling';
    await store.saveJob(job);
    if (job.state === 'cancelled') await rm(store.snapshotDirectory(job.id), { recursive: true, force: true });
    if (job.state === 'cancelling') runningExports.get(job.id)?.abort();
    const { token, workerPid, ...safe } = job; return safe;
  });
}

export async function renderNext(store: WorkspaceStore, runtimeRoot: string, tracking?: OmTracking) {
  const pending = await store.job();
  if (pending?.projectId) store = store.forProject(pending.projectId);
  const key = store.directory;
  if (working.has(key)) return;
  working.add(key);
  let job;
  let control: AbortController | undefined;
  try {
    job = await store.claimExport();
    if (!job) return;
    control = new AbortController(); runningExports.set(job.id, control);
    const stage = async (value: string, verification?: unknown) => store.lock(async () => {
      const current = await store.job(job!.id);
      if (!current || current.state !== 'running') throw new Error('COMMAND_CANCELLED');
      current.stage = value; if (verification) current.verification = verification;
      await store.saveJob(current);
    });
    const directory = store.snapshotDirectory(job.id);
    await stage('checking');
    const lint = await inspectProject(runtimeRoot, directory, 'lint', control.signal);
    if (lint.exitCode) throw new Error('Hyperframes lint 失败：' + JSON.stringify(lint.result));
    const output = path.join(store.directory, 'exports', job.id + '.mp4');
    await mkdir(path.dirname(output), { recursive: true });
    // The service owns this job; a short-lived Agent client must not cancel it.
    await stage('rendering');
    const result = await runHyperframes(runtimeRoot, directory, ['render', '.', '--output', output, '--format', 'mp4', ...(job.phase1 ? ['--fps', String(job.expected!.fps)] : []), '--json'], 25 * 60_000, { HYPERFRAMES_RENDER_DETACHED: '1' }, control.signal);
    await writeFile(path.join(store.directory, 'jobs', job.id, 'render.log'), result.stdout + '\n' + result.stderr, { mode: 0o600 });
    if (result.code) throw new Error('Hyperframes render 失败：' + (result.stderr || result.stdout).slice(-1800));
    // Never label an absent or non-MP4 output as completed, even after exit code 0.
    const file = await (await import('node:fs/promises')).open(output, 'r');
    try {
      const header = Buffer.alloc(12); await file.read(header, 0, 12, 0);
      if (header.subarray(4, 8).toString() !== 'ftyp') throw new Error('Hyperframes 未生成有效的 MP4');
    } finally { await file.close(); }
    if (job.phase1) {
      await stage('verifying');
      const report = await verifyExport(output, job.expected!, undefined, control.signal);
      await stage('verified', report);
      if (report.status !== 'passed') throw new Error('EXPORT_VERIFICATION_FAILED: ' + JSON.stringify(report.checks));
    }
    const finished = await store.finishExport(job.id, job.token!);
    if (finished.state === 'cancelled') await rm(output, { force: true });
  } catch (error) {
    if (!job) throw error;
    await rm(path.join(store.directory, 'exports', job.id + '.mp4'), { force: true });
    const current = await store.job(job.id);
    if (current && ['running', 'cancelling'].includes(current.state)) await store.finishExport(job.id, job.token!, error instanceof Error ? error.message : '渲染失败');
  } finally {
    if (job && tracking) {
      const final = await store.job(job.id).catch(() => null);
      if (final && ['completed', 'failed', 'cancelled'].includes(final.state)) tracking.track('export_result', {
        job_id: final.id, job_state: final.state as 'completed' | 'failed' | 'cancelled',
        duration_ms: Math.min(86_400_000, Math.max(0, Date.now() - final.createdAt)),
        technical_check: (final.verification as any)?.status === 'passed' ? 'passed'
          : (final.verification as any)?.status === 'failed' ? 'failed' : 'unknown',
      }, undefined, 'worker');
    }
    if (job) runningExports.delete(job.id);
    if (job) await rm(store.snapshotDirectory(job.id), { recursive: true, force: true });
    working.delete(key);
  }
}

function json(res: ServerResponse, status: number, data: unknown) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(data));
}
async function input(req: IncomingMessage, maxBytes = 9 * 1024 * 1024) {
  if (!req.headers['content-type']?.startsWith('application/json')) throw new Error('需要 application/json');
  let size = 0; const chunks: Buffer[] = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > maxBytes) throw new Error('提交内容超过大小限制');
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString());
}
function revision(value: unknown): asserts value is string {
  if (typeof value !== 'string' || !/^[a-f0-9]{64}$/.test(value)) throw new Error('需要 motion_get_project 返回的 expectedRevision');
}

async function openProject(store: WorkspaceStore, context: Service, expectedRevision: string, target: { templateId: string } | { projectId: string } | { title: string; instruction?: string }, expectedProjectId?: string, sessionTarget?: { sessionId?: string; title?: string; templateId?: string; instruction?: string }) {
  if (!context.runtimeRoot) throw new Error('Hyperframes 服务尚未就绪');
  if (context.switching) throw new Error('正在打开工程，请稍候');
  context.switching = true;
  const runtimeRoot = context.runtimeRoot;
  try {
    return await store.lock(async () => {
      if (expectedProjectId && store.projectId !== expectedProjectId) throw new Conflict();
      if ((await store.get()).revision !== expectedRevision) throw new Conflict();
      const template = 'templateId' in target ? await templateCatalogFor(store.directory).get(target.templateId) : undefined;
      const creating = Boolean(template) || 'title' in target;
      const id = creating ? crypto.randomUUID() : (target as { projectId: string }).projectId;
      const entry = creating ? { id, title: template?.title ?? (target as { title: string }).title, templateId: template?.id, createdAt: Date.now() } : undefined;
      if (!entry && !store.projectCatalog().projects.some(item => item.id === id)) throw new Error('工程不存在');
      if (sessionTarget?.sessionId && !store.projectCatalog().sessions!.some(item => item.id === sessionTarget.sessionId)) throw new Error('会话不存在');
      if (!entry && store.projectCatalog().activeId === id) {
        if (!context.studio?.alive()) context.studio = context.launchStudio ? await context.launchStudio(store.projectDirectoryFor(id), context.studioPort || 4174) : await startStudio(runtimeRoot, store.projectDirectoryFor(id), path.join(store.directory, 'studio.log'), context.studioPort || 4174);
        await context.studio.openProject?.(id);
        await store.selectProject(id);
        return { ...(await store.status()), studioUrl: context.studio.url };
      }
      const directory = store.projectDirectoryFor(id);
      let candidate: Studio | undefined;
      let committed = false;
      try {
        if (template) await templateCatalogFor(store.directory).copy(template, directory, runtimeRoot);
        else if ('title' in target) await createBlankProject(directory, runtimeRoot, target.title);
        await store.safePath('index.html', directory);
        const oldStudio = context.studio;
        const oldPort = oldStudio ? Number(new URL(oldStudio.url).port) : undefined;
        const candidatePort = oldPort === undefined ? context.studioPort || 4174 : oldPort === 65535 ? 4174 : oldPort + 1;
        candidate = oldStudio?.alive() && oldStudio.openProject ? oldStudio : context.launchStudio ? await context.launchStudio(directory, candidatePort) : await startStudio(runtimeRoot, directory, path.join(store.directory, 'studio.log'), candidatePort);
        // Native Studio writes are independent of our lock. Recheck before switching.
        if ((await store.get()).revision !== expectedRevision) throw new Conflict();
        await store.selectProject(id, entry, sessionTarget?.instruction ?? ('instruction' in target ? target.instruction : undefined), sessionTarget);
        context.studio = candidate; committed = true;
        await candidate.openProject?.(id);
        if (oldStudio !== candidate) await oldStudio?.close();
        return { ...(await store.status()), studioUrl: candidate.url };
      } finally {
        if (!committed) {
          if (candidate !== context.studio) await candidate?.close();
          if (creating) await rm(directory, { recursive: true, force: true });
        }
      }
    });
  } finally { context.switching = false; }
}

async function openEditor(store: WorkspaceStore, context: Service) {
  if (context.ensureStudio) { await context.ensureStudio(store.projectId); return; }
  if (!context.runtimeRoot) throw new Error('Hyperframes 服务尚未就绪');
  if (context.switching) throw new Error('正在打开工程，请稍候');
  if (context.studio?.alive()) return;
  context.switching = true;
  try {
    await store.initialize(context.runtimeRoot);
    context.studio = await startStudio(context.runtimeRoot, store.projectDirectory, path.join(store.directory, 'studio.log'), context.studioPort || 4174);
  } finally { context.switching = false; }
}

async function createSession(store: WorkspaceStore, data: Record<string, any>) {
  const mode = creationMode(data.mode ?? 'motion');
  if (data.id !== undefined && typeof data.id !== 'string') throw new Error('会话编号无效');
  const template = data.templateId ? await templateCatalogFor(store.directory).get(data.templateId) : undefined;
  const instruction = data.instruction === undefined ? template ? `使用模板 ${template.title}（${template.id}）继续创作。` : undefined : validateInstruction(data.instruction);
  const catalog = store.projectCatalog(), existing = catalog.sessions!.find(item => item.id === data.id);
  const title = validateProjectTitle(data.title ?? (data.instruction ? instruction!.replace(/\s+/g, ' ').slice(0, 40) : template?.title || existing?.title || `新会话 ${catalog.sessions!.length + 1}`));
  return store.createSession({ id: data.id, mode: mode.id, title, templateId: template?.id, instruction });
}

// The HTTP, MCP and embedded clients share this mode factory; viewers do not create sessions.
const artifactFactories: Record<CreationMode, (store: WorkspaceStore, context: Service, session: CreativeSession, data: Record<string, any>) => Promise<unknown>> = {
  motion: async (store, context, session, data) => {
    const templateId = data.templateId ?? (session.artifacts.length === 0 ? session.templateId : undefined);
    const template = templateId ? await templateCatalogFor(store.directory).get(templateId) : undefined;
    const title = validateProjectTitle(data.title ?? (session.artifacts.length ? `Motion ${session.artifacts.length + 1}` : session.title));
    return openProject(store, context, data.expectedRevision, template && isEditableTemplate(template) ? { templateId: template.id } : { title }, data.expectedProjectId, { sessionId: session.id, templateId: template?.id });
  },
};
async function createArtifact(store: WorkspaceStore, context: Service, session: CreativeSession, data: Record<string, any>) {
  revision(data.expectedRevision);
  return artifactFactories[creationMode(session.mode).id](store, context, session, data);
}
async function legacyCreation(store: WorkspaceStore, context: Service, data: Record<string, any>) {
  revision(data.expectedRevision);
  if ((await store.get()).revision !== data.expectedRevision || (data.expectedProjectId && store.projectCatalog().activeId !== data.expectedProjectId)) throw new Conflict();
  const session = await createSession(store, data);
  return createArtifact(store, context, session, data);
}

export async function handler(req: IncomingMessage, res: ServerResponse, store = sharedStore, context = service) {
  res.setHeader('X-Content-Type-Options', 'nosniff'); res.setHeader('Cache-Control', 'no-store');
  try {
    const host = req.headers.host;
    if (host && !['localhost', '127.0.0.1', '[::1]'].includes(new URL('http://' + host).hostname)) return json(res, 403, { error: '只允许本地访问' });
    if (!['GET', 'HEAD'].includes(req.method || '') && (!req.headers.origin || new URL(req.headers.origin).host !== host)) return json(res, 403, { error: '仅允许当前预览页面发起修改' });
    const projectHeader = req.headers['x-opendesign-project-id'];
    if (projectHeader !== undefined) {
      if (!context.editorToken || req.headers.authorization !== `Bearer ${context.editorToken}` || typeof projectHeader !== 'string') return json(res, 403, { error: '工程范围需要私有编辑器凭据' });
      store = store.forProject(projectHeader);
    }
    const originalUrl = new URL(req.url || '/', 'http://localhost');
    const motionRequest = /^\/(?:motion|design)-api\//.test(originalUrl.pathname);
    const url = new URL(originalUrl);
    if (motionRequest && url.searchParams.has('projectId')) {
      const id = url.searchParams.get('projectId')!;
      if (projectHeader !== undefined && projectHeader !== id) return json(res, 400, { error: 'PROJECT_SCOPE_MISMATCH' });
      store = store.forProject(id);
    }
    if (context.ensureStudio && (url.pathname === '/' || url.pathname.startsWith('/sessions/'))) {
      const projectId = url.searchParams.get('project'), sessionId = url.searchParams.get('session');
      if (projectId !== null) {
        if (store.projectCatalog().projects.some(project => project.id === projectId)) await context.ensureStudio(projectId);
      } else if (sessionId) {
        const session = store.projectCatalog().sessions!.find(session => session.id === sessionId);
        const artifact = session?.artifacts.find(artifact => artifact.id === session.activeArtifactId) ?? session?.artifacts.at(-1);
        if (artifact) await context.ensureStudio(artifact.projectId);
      }
    }
    if (motionRequest) url.pathname = url.pathname.replace(/^\/(?:motion|design)-api\//, '/api/');
    const editorUrl = `http://${host || 'localhost'}/#project/${store.projectId}`;
    if (motionRequest && url.pathname === '/api/tracking' && req.method === 'GET') return json(res, 200, { enabled: context.tracking?.enabled() ?? false });
    if (motionRequest && url.pathname === '/api/tracking' && req.method === 'POST') {
      if (!context.tracking?.enabled()) return json(res, 200, { accepted: 0 });
      const data = await input(req, 64 * 1024);
      if (!data || Object.keys(data).length !== 1 || !Array.isArray(data.events) || data.events.length > 16
        || !data.events.every((event: unknown) => validPending(omEvents, event) && event.entrypoint === 'studio'
          && (browserEvents as readonly string[]).includes(event.event))) return json(res, 400, { error: 'INVALID_TRACKING_BATCH' });
      const statuses = data.events.map((event: unknown) => context.tracking!.ingest(event));
      return json(res, statuses.includes('full') ? 429 : 200, { accepted: statuses.filter((status: string) => status === 'queued').length });
    }
    if (motionRequest && url.pathname === '/api/phase1/call' && req.method === 'POST') {
      if (!context.runtimeRoot) throw new Error('RUNTIME_NOT_READY');
      const authority = store.workspaceStore ?? store;
      context.phase1 ??= new Phase1Service(authority, context.runtimeRoot, {
        origin: () => new URL(editorUrl).origin,
        nativeUrl: () => context.studio?.alive() ? context.studio.url : undefined,
        openProject: async projectId => { await openProject(authority, context, (await authority.get()).revision, { projectId }, authority.projectId); },
        mutation: async task => {
          let release!: () => void;
          context.phase1Mutation = new Promise<void>(resolve => { release = resolve; });
          try { return await task(); } finally { release(); context.phase1Mutation = undefined; }
        },
        cancel: (projectId, jobId) => cancelExport(authority, projectId, jobId),
        tracking: context.tracking,
      });
      const data = await input(req);
      try { return json(res, 200, await context.phase1.call(data.name, data.arguments ?? {})); }
      catch (error) { return json(res, 400, { error: error instanceof Error ? error.message : 'Tool failed', applied: 'unknown' }); }
    }
    if (req.method === 'GET' && ['/api/integration', '/connect/guide', '/connect/config'].includes(url.pathname)) {
      const address = new URL(editorUrl);
      const info: IntegrationInfo = {
        name: 'OpenDesign', version: VERSION, previewUrl: address.origin, dataDirectory: store.directory,
        transport: { type: 'stdio', command: process.execPath, args: ['--experimental-strip-types', path.join(pluginRoot, 'mcp.ts')], cwd: pluginRoot,
          env: { MOTION_DATA_DIR: store.directory, PORT: address.port || '80', ...Object.fromEntries(['MOTION_TEMPLATE_ENV', 'MOTION_TEMPLATE_RESOURCE_ID', 'MOTION_TEMPLATE_LOCALE', 'MOTION_BROWSER_PATH', 'HYPERFRAMES_BROWSER_PATH', 'HYPERFRAMES_FFMPEG_PATH', 'HYPERFRAMES_FFPROBE_PATH', 'FFMPEG_PATH', 'FFPROBE_PATH'].filter(key => process.env[key]).map(key => [key, process.env[key]!])) } },
        tools: mcpTools.map(({ name, description }) => ({ name, description })),
      };
      if (url.pathname === '/api/integration') return json(res, 200, info);
      const selected = integrationHost(url.searchParams.get('host'));
      if (url.pathname === '/connect/guide') {
        const id = url.searchParams.get('template');
        const recipe = id ? '\n\n' + templateRecipe(await templateCatalogFor(store.directory).get(id)) : '';
        res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end(agentGuide(info, selected) + recipe);
      }
      const config = integrationConfig(info, selected);
      res.writeHead(200, { 'Content-Type': config.contentType, 'Content-Disposition': `attachment; filename="${config.filename}"` });
      return res.end(config.text);
    }
    if (req.method === 'GET' && /^\/connect\/?$/.test(url.pathname)) {
      res.writeHead(302, { Location: '/?panel=connections&host=' + integrationHost(url.searchParams.get('host')) }); return res.end();
    }
    if (url.pathname === '/api/health' && req.method === 'GET') return json(res, 200, {
      service: 'motion-preview', protocol: 2, version: VERSION, dataDirectory: store.directory,
      engine: 'hyperframes', engineVersion: HYPERFRAMES_VERSION, editor: 'opendesign-motion', ffmpeg: Boolean(context.ffmpeg),
      ready: Boolean(context.runtimeRoot && (!context.studio || context.studio.alive())), editorReady: Boolean(context.studio?.alive()), studioUrl: context.studio?.alive() ? editorUrl : undefined, nativeStudioUrl: context.studio?.url,
      ...(context.runtimeRoot ? { hyperframesCli: cliPath(context.runtimeRoot), authoringGuide: path.join(context.runtimeRoot, 'node_modules/hyperframes/dist/skills/hyperframes/SKILL.md') } : {}),
    });
    if (motionRequest && url.pathname === '/api/preview/open' && req.method === 'POST') {
      await openEditor(store, context);
      return json(res, 200, { studioUrl: editorUrl, ...(await store.status()) });
    }
    if (url.pathname === '/api/studio' && req.method === 'GET') {
      if (!context.studio?.alive()) return json(res, 503, { error: 'Hyperframes Studio 尚未就绪，请重新打开预览并检查 studio.log' });
      return json(res, 200, { url: editorUrl, projectDirectory: store.projectDirectory, projectId: store.projectCatalog().activeId });
    }
    if (motionRequest && (url.pathname.startsWith('/api/models') || url.pathname.startsWith('/api/generations'))) {
      const gateway = gatewayFor(store);
      if (url.pathname === '/api/models/capabilities' && req.method === 'GET') return json(res, 200, await gateway.status(url.searchParams.get('refresh') === 'true'));
      if (url.pathname === '/api/models' && req.method === 'GET') return json(res, 200, await gateway.listModels({
        provider: url.searchParams.get('provider') ?? undefined, modality: url.searchParams.get('modality') ?? undefined,
        query: url.searchParams.get('query') ?? '', refresh: url.searchParams.get('refresh') === 'true',
        offset: Number(url.searchParams.get('offset') ?? 0), limit: Number(url.searchParams.get('limit') ?? 100),
      }));
      const provider = url.pathname.match(/^\/api\/models\/providers\/([a-z]+)$/);
      if (provider && req.method === 'PUT') return json(res, 200, await gateway.configureProvider(provider[1], await input(req)));
      const route = url.pathname.match(/^\/api\/models\/routes\/([a-z]+)$/);
      if (route && req.method === 'PUT') return json(res, 200, await gateway.setRoute(route[1], (await input(req)).model));
      if (url.pathname === '/api/models/custom' && req.method === 'POST') return json(res, 200, await gateway.registerModel(await input(req)));
      if (url.pathname === '/api/generations' && req.method === 'POST') {
        if (!context.studio?.alive()) return json(res, 503, { error: 'Open the Studio before generating media' });
        return json(res, 202, { job: await gateway.submit(await input(req)) });
      }
      if (url.pathname === '/api/generations' && req.method === 'GET') return json(res, 200, { jobs: (await gateway.listJobs(url.searchParams.get('projectId') ?? undefined)).slice(0, 50) });
      const generation = url.pathname.match(/^\/api\/generations\/([a-f0-9-]+)(\/cancel)?$/);
      if (generation && req.method === 'GET' && !generation[2]) return json(res, 200, { job: await gateway.getJob(generation[1]) });
      if (generation && req.method === 'POST' && generation[2]) return json(res, 200, { job: await gateway.cancel(generation[1]) });
      return json(res, 404, { error: 'Unknown model gateway operation' });
    }
    if (url.pathname === '/api/templates' && req.method === 'GET') return json(res, 200, { templates });
    if (url.pathname === '/api/template-catalog' && req.method === 'GET') return json(res, 200, await templateCatalogFor(store.directory).page({
      category: url.searchParams.get('category') || 'featured', query: url.searchParams.get('query') || '',
      offset: Number(url.searchParams.get('offset') || 0), limit: Number(url.searchParams.get('limit') || 6), grouped: url.searchParams.get('grouped') === 'true',
      covered: url.searchParams.get('covered') === 'true',
    }));
    if (motionRequest && url.pathname === '/api/projects' && req.method === 'GET') return json(res, 200, store.projectCatalog());
    if (motionRequest && url.pathname === '/api/modes' && req.method === 'GET') return json(res, 200, { modes: creationModes, viewers: artifactViewers });
    if (motionRequest && url.pathname === '/api/sessions' && req.method === 'GET') {
      const { sessions, activeSessionId } = store.projectCatalog(); return json(res, 200, { sessions, activeSessionId });
    }
    if (motionRequest && url.pathname === '/api/sessions' && req.method === 'POST') {
      const session = await createSession(store, await input(req));
      return json(res, 201, { sessionId: session.id, session });
    }
    const browserRoute = motionRequest ? url.pathname.match(/^\/api\/sessions\/([a-z0-9-]+)\/browser\/([a-z0-9-]{1,80})(?:\/(events|command|resize|input))?$/) : null;
    if (browserRoute) {
      const [, sessionId, tabId, action] = browserRoute;
      await store.session(sessionId);
      if (!context.runtimeRoot) throw new Error('浏览器服务尚未就绪');
      const browser = context.browser ??= new WorkspaceBrowser(context.runtimeRoot);
      if (!action && req.method === 'POST') return json(res, 200, (await browser.open(sessionId, tabId, (await input(req)).url)).state);
      if (!action && req.method === 'DELETE') { await browser.remove(sessionId, tabId); return json(res, 200, { closed: true }); }
      const tab = await browser.get(sessionId, tabId);
      if (action === 'events' && req.method === 'GET') { await tab.watch(res); return; }
      if (req.method === 'POST') {
        const data = await input(req);
        if (action === 'command') await tab.command(data.action, data.url);
        else if (action === 'resize') await tab.resize(data.width, data.height);
        else if (action === 'input') await tab.input(data);
        else throw new Error('未知浏览器操作');
        return json(res, 200, tab.state);
      }
      return json(res, 405, { error: '浏览器操作不支持此请求方式' });
    }
    const sessionRoute = motionRequest ? url.pathname.match(/^\/api\/sessions\/([a-z0-9-]+)(?:\/(messages|artifacts|open))?$/) : null;
    if (sessionRoute) {
      const [, id, action] = sessionRoute;
      if (req.method === 'GET' && !action) return json(res, 200, await store.session(id));
      if (req.method === 'PATCH' && !action) return json(res, 200, await store.renameSession(id, (await input(req)).title));
      if (req.method === 'POST' && action === 'messages') { const data = await input(req); return json(res, 201, await store.addSessionMessage(id, data.id, data.content, data.role)); }
      if (req.method === 'POST' && (action === 'open' || action === 'artifacts')) {
        const data = await input(req); revision(data.expectedRevision);
        const session = await store.session(id);
        if (action === 'open') {
          if (!session.artifacts.length && !data.projectId) return json(res, 200, await store.selectSession(id));
          const artifact = data.projectId ? session.artifacts.find(item => item.projectId === data.projectId) : session.artifacts.find(item => item.id === session.activeArtifactId) ?? session.artifacts[0];
          if (!artifact) throw new Error('该产物不属于此会话');
          return json(res, 200, await openProject(store, context, data.expectedRevision, { projectId: artifact.projectId }, data.expectedProjectId));
        }
        return json(res, 201, await createArtifact(store, context, session, data));
      }
    }
    if (motionRequest && url.pathname === '/api/projects' && req.method === 'POST') {
      const data = await input(req); revision(data.expectedRevision);
      const title = validateProjectTitle(data.title ?? `未命名项目 ${store.projectCatalog().projects.length + 1}`);
      const instruction = data.instruction === undefined ? undefined : validateInstruction(data.instruction);
      return json(res, 201, await legacyCreation(store, context, { ...data, title, instruction }));
    }
    const conversation = motionRequest ? url.pathname.match(/^\/api\/projects\/([a-z0-9-]+)\/conversation$/) : null;
    if (conversation && req.method === 'GET') return json(res, 200, await store.conversation(conversation[1]));
    if (conversation && req.method === 'POST') {
      const data = await input(req);
      return json(res, 201, await store.addProjectMessage(conversation[1], data.id, data.content));
    }
    const renameProject = motionRequest ? url.pathname.match(/^\/api\/projects\/([a-z0-9-]+)$/) : null;
    if (renameProject && req.method === 'PATCH') {
      const data = await input(req);
      return json(res, 200, await store.renameProject(renameProject[1], data.title));
    }
    const poster = url.pathname.match(/^\/api\/templates\/([a-z-]+)\/poster$/);
    if (poster && req.method === 'GET') {
      if (!templates.some(item => item.id === poster[1])) return json(res, 404, { error: '模板不存在' });
      const image = await readFile(path.join(pluginRoot, 'template-library', poster[1], 'poster.jpg'));
      res.writeHead(200, { 'Content-Type': 'image/jpeg', 'Content-Length': image.length }); res.end(image); return;
    }
    const openTemplate = url.pathname.match(/^\/api\/templates\/([A-Za-z0-9_-]+)\/open$/);
    const openSaved = motionRequest ? url.pathname.match(/^\/api\/projects\/([a-z0-9-]+)\/open$/) : null;
    if ((openTemplate || openSaved) && req.method === 'POST') {
      const data = await input(req); revision(data.expectedRevision);
      return json(res, 200, openTemplate ? await legacyCreation(store, context, { ...data, templateId: openTemplate[1] }) : await openProject(store, context, data.expectedRevision, { projectId: openSaved![1] }, data.expectedProjectId));
    }
    if (url.pathname === '/api/project/status' && req.method === 'GET') return json(res, 200, await store.status());
    if (url.pathname === '/api/project' && req.method === 'GET') return json(res, 200, await store.get());
    if (url.pathname === '/api/project' && req.method === 'PUT') {
      const data = await input(req); revision(data.expectedRevision);
      return json(res, 200, await store.writeFiles(data.expectedRevision, data.files));
    }
    if (url.pathname === '/api/export' && req.method === 'POST') {
      if (!context.runtimeRoot) return json(res, 503, { error: 'Hyperframes 服务尚未就绪' });
      const data = await input(req); revision(data.expectedRevision);
      return json(res, 202, { job: await store.requestExport(data.expectedRevision) });
    }
    const download = url.pathname.match(/^\/api\/exports\/([a-f0-9-]{36})\/file$/);
    if (download && req.method === 'GET') {
      const job = await store.job(download[1]);
      if (!job || job.id !== download[1] || job.state !== 'completed') return json(res, 404, { error: '视频尚未完成或任务不存在' });
      const filename = path.join(store.directory, 'exports', job.id + '.mp4');
      res.writeHead(200, { 'Content-Type': 'video/mp4', 'Content-Length': (await stat(filename)).size, 'Content-Disposition': 'attachment; filename="motion.mp4"' });
      await new Promise<void>((resolve, reject) => {
        const stream = createReadStream(filename);
        stream.on('error', reject); res.on('finish', resolve); res.on('close', () => { stream.destroy(); resolve(); }); stream.pipe(res);
      });
      return;
    }
    if (!motionRequest && (url.pathname.startsWith('/api/') || url.pathname === '/__hyperframes_config')) {
      if (context.phase1Mutation) await context.phase1Mutation;
      const scopedProject = url.pathname.match(/^\/api\/projects\/([^/]+)/);
      if (scopedProject) store.forProject(decodeURIComponent(scopedProject[1]));
      if (!context.studio?.alive()) return json(res, 503, { error: '编辑服务尚未就绪' });
      return await proxyStudio(req, res, url, context.studio.url);
    }
    if (req.method !== 'GET') return json(res, 405, { error: '不支持此操作' });
    if (await serveEditorFile(url, res)) return;
    return json(res, 404, { error: 'Not found' });
  } catch (error) {
    if (res.headersSent) res.destroy();
    else json(res, error instanceof Conflict ? 409 : 400, { error: error instanceof Error ? error.message : '操作失败' });
  }
}

export async function startServer(store = sharedStore, port = Number(process.env.PORT || 4173), options: { editor?: boolean; editorToken?: string; privateHandler?: (req: IncomingMessage, res: ServerResponse) => Promise<boolean> } = { editor: process.env.MOTION_HEADLESS !== '1' }) {
  await access(path.join(pluginRoot, 'studio/build/index.html')).catch(() => { throw new Error('编辑器尚未构建，请先运行 npm run build:studio。'); });
  const runtimeRoot = await ensureRuntime(store.directory);
  await recoverProjectTransactions(store, runtimeRoot);
  const ffmpeg = await execute(process.env.HYPERFRAMES_FFMPEG_PATH || process.env.FFMPEG_PATH || 'ffmpeg', ['-version'], pluginRoot, 5000).then(r => r.code === 0, () => false);
  const context: Service = { runtimeRoot, ffmpeg, studioPort: !port || port === 65535 ? 4174 : port + 1, editorToken: options.editorToken,
    tracking: await createAppTracking(store.directory, 'mcp') };
  context.launchStudio = async (directory, chosenPort) => {
    if (!process.env.OPENMOTION_EDITOR_LOCK_FD) return startStudio(runtimeRoot, directory, path.join(store.directory, 'studio.log'), chosenPort, store.directory);
    const probe = createServer();
    await new Promise<void>((resolve, reject) => { probe.once('error', reject); probe.listen(0, '127.0.0.1', resolve); });
    const available = (probe.address() as any).port;
    await new Promise<void>(resolve => probe.close(() => resolve()));
    return startOwnedStudio(store.directory, runtimeRoot, directory, path.join(store.directory, 'studio.log'), available);
  };
  let opening: Promise<Studio> | undefined;
  context.ensureStudio = async (projectId = store.projectId) => {
    const scoped = store.forProject(projectId);
    if (context.studio?.alive()) { await context.studio.openProject?.(projectId); return context.studio; }
    if (!opening && context.switching) throw new Error('正在打开工程，请稍候');
    if (!opening) opening = (async () => {
      context.switching = true;
      await context.studio?.close();
      await scoped.initialize(runtimeRoot);
      context.studio = await context.launchStudio!(scoped.projectDirectory, !port || port === 65535 ? 4174 : port + 1);
      return context.studio;
    })().finally(() => { opening = undefined; context.switching = false; });
    const studio = await opening;
    await studio.openProject?.(projectId);
    return studio;
  };
  if (options.editor !== false) await context.ensureStudio();
  const server = createServer((req, res) => { void (async () => { if (!options.privateHandler || !await options.privateHandler(req, res)) await handler(req, res, store, context); })().catch(error => { if (!res.headersSent) json(res, 500, { error: (error as Error).message }); else res.destroy(); }); });
  try {
    await new Promise<void>((resolve, reject) => { server.once('error', reject); server.listen(port, '127.0.0.1', resolve); });
  } catch (error) { context.tracking?.close(); await context.studio?.close(); throw error; }
  const gateway = gatewayFor(store);
  const tick = () => {
    void renderNext(store, runtimeRoot, context.tracking).catch(error => console.error(error.message));
    void gateway.tick().catch(() => console.error('Model gateway queue could not be processed'));
  };
  const timer = setInterval(tick, 500); tick();
  return { server, get activeToolCalls() { return context.phase1?.pending ?? 0; }, openProject: async (projectId: string) => openProject(store, context, (await store.get()).revision, { projectId }, store.projectId), get studio() { return context.studio!; }, ensureStudio: context.ensureStudio,
    info: async () => ({ previewUrl: `http://127.0.0.1:${(server.address() as any).port}`, studioUrl: context.studio?.url, engine: 'hyperframes', ready: true, editorReady: Boolean(context.studio?.alive()), ffmpeg, revision: (await store.get()).revision, dataDirectory: store.directory, browserOpened: false, authoringGuide: path.join(runtimeRoot, 'node_modules/hyperframes/dist/skills/hyperframes/SKILL.md'), hyperframesCli: cliPath(runtimeRoot) }),
    close: async () => { clearInterval(timer); await context.browser?.close(); await gateway.close(); server.closeAllConnections(); server.close(); await context.studio?.close(); await closeTracking(context.tracking); } };
}
if (isMain(import.meta.url)) {
  try {
    if (sharedEditorEnabled) {
      const editor = await ensureEditor(sharedStore.directory);
      console.log(JSON.stringify(await editorRequest(editor, '/editor-api/preview', {}), null, 2));
    } else {
      const running = await startServer();
      console.log(`Motion + Hyperframes Studio: http://localhost:${process.env.PORT || 4173}`);
      const stop = async () => { stopCommands(); await running.close(); process.exit(0); };
      process.once('SIGTERM', stop); process.once('SIGINT', stop);
    }
  } catch (error) { console.error(error); process.exitCode = 1; }
}
