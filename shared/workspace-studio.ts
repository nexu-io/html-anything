import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { WorkspaceStore } from '../workspace.ts';
import { HYPERFRAMES_VERSION, repairGeneratedRegistry } from '../hyperframes.ts';
import { isMain } from './entry.ts';
import { withAvailableHistorySteps } from './studio-history-availability.ts';

export async function startWorkspaceStudio(runtimeRoot: string, dataDirectory: string, initialDirectory: string, port: number) {
  const require = createRequire(path.join(runtimeRoot, 'package.json'));
  const cli = path.dirname(require.resolve('hyperframes/package.json'));
  const manifest = JSON.parse(await readFile(path.join(cli, 'package.json'), 'utf8'));
  if (manifest.version !== HYPERFRAMES_VERSION) throw new Error('Unsupported Hyperframes workspace host version');
  // shortcut: 0.9.7 exposes the complete host only in its bundle; use a public host factory when upstream provides one.
  const bundles = (await readdir(path.join(cli, 'dist'))).filter(name => /^studioServer-[\w-]+\.js$/.test(name));
  if (bundles.length !== 1) throw new Error('Hyperframes workspace host bundle is missing or ambiguous');
  const { createStudioServer } = await import(pathToFileURL(path.join(cli, 'dist', bundles[0])).href);
  if (typeof createStudioServer !== 'function') throw new Error('Hyperframes workspace host factory is unavailable');
  const { getRequestListener } = await import(pathToFileURL(require.resolve('@hono/node-server')).href);
  const historyModule = path.join(path.dirname(require.resolve('@hyperframes/studio-server/package.json')), 'dist/history/index.js');
  const { DEFAULT_HISTORY_ROOT } = await import(pathToFileURL(historyModule).href);
  const historyRoot = process.env.HYPERFRAMES_HISTORY_ROOT ?? DEFAULT_HISTORY_ROOT;
  const store = new WorkspaceStore(dataDirectory);
  const hosts = new Map<string, Promise<any>>();
  let origin = '', closing = false;
  const hostFor = (id: string): Promise<any> => {
    store.forProject(id);
    let opening = hosts.get(id);
    if (!opening) {
      opening = (async () => {
        const scoped = store.forProject(id);
        await scoped.safePath('index.html');
        await repairGeneratedRegistry(scoped.projectDirectory);
        if (closing) throw new Error('Studio is stopping');
        const host = createStudioServer({ projectDir: scoped.projectDirectory, projectName: id,
          origin: () => origin, historyRoot });
        const openHistory = host.adapter.history;
        const histories = new WeakMap();
        host.adapter.history = async () => {
          const history = await openHistory();
          // Native window/close requests compare history objects by identity.
          if (history && !histories.has(history)) histories.set(history, withAvailableHistorySteps(history, historyRoot));
          return history && histories.get(history);
        };
        return host;
      })().catch(error => { hosts.delete(id); throw error; });
      hosts.set(id, opening);
    }
    return opening;
  };
  const json = (value: unknown, status = 200) => Response.json(value, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
  const fetchRequest = async (request: Request) => {
    try {
      const url = new URL(request.url);
      if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) return json({ error: 'Local hosts only' }, 403);
      if (!['GET', 'HEAD'].includes(request.method) && request.headers.get('origin') !== url.origin) return json({ error: 'Same-origin writes only' }, 403);
      if (closing) return json({ error: 'Studio is stopping' }, 503);
      const matched = url.pathname.match(/^\/api\/projects\/([^/]+)/);
      const pathId = matched ? decodeURIComponent(matched[1]) : undefined;
      const queryId = url.searchParams.get('projectId') ?? undefined;
      if (pathId && queryId && pathId !== queryId) return json({ error: 'PROJECT_SCOPE_MISMATCH' }, 400);
      const id = pathId ?? queryId;
      if (id !== undefined) store.forProject(id);
      if (url.pathname === '/__hyperframes_config') {
        if (id) await hostFor(id);
        return json({ isHyperframes: true, version: HYPERFRAMES_VERSION, pid: process.pid,
          projectDir: id ? store.projectDirectoryFor(id) : initialDirectory, dataDirectory, multiProject: true });
      }
      if (url.pathname === '/api/projects') return json({ projects: store.projectCatalog().projects.map(project => ({ id: project.id, title: project.title, dir: store.projectDirectoryFor(project.id) })) });
      const sharedResource = url.pathname === '/' || url.pathname.startsWith('/assets/') || /^\/api\/(?:runtime\.js|vendor\/|fonts|environment\/|assets\/global)/.test(url.pathname);
      const catalog = store.projectCatalog();
      const target = id ?? (catalog.projects.length === 1 || sharedResource ? catalog.projects.find(project => store.projectDirectoryFor(project.id) === initialDirectory)?.id : undefined);
      if (!target) return json({ error: 'PROJECT_NOT_BOUND: specify projectId' }, 400);
      const host = await hostFor(target);
      return await host.app.fetch(request);
    } catch (error) {
      return json({ error: error instanceof Error ? error.message : 'Studio request failed' }, /PROJECT_NOT_FOUND|ENOENT/.test(String(error)) ? 404 : 400);
    }
  };
  const server = createServer(getRequestListener(fetchRequest));
  await new Promise<void>((resolve, reject) => {
    server.once('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); }
      else reject(error);
    });
    server.listen(port, '127.0.0.1', resolve);
  });
  origin = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
  return { server, origin, close: async () => {
    closing = true;
    server.closeAllConnections(); server.close();
    const contexts = await Promise.allSettled(hosts.values());
    await Promise.all(contexts.map(async context => { if (context.status === 'fulfilled') { context.value.watcher.close(); await context.value.shutdown(); } }));
  } };
}

if (isMain(import.meta.url)) {
  const [runtimeRoot, dataDirectory, initialDirectory, port] = process.argv.slice(2);
  const running = await startWorkspaceStudio(runtimeRoot, dataDirectory, initialDirectory, Number(port));
  console.log(JSON.stringify({ ok: true, result: { ready: true, projectDir: initialDirectory, studioUrl: running.origin } }));
  const stop = () => { void running.close().finally(() => process.exit(0)); };
  process.once('SIGTERM', stop); process.once('SIGINT', stop);
}
