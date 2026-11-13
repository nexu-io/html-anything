import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { resolveDesignSystemFile } from '../index.js';
import { DesignSource, SourceError } from './store.js';

const packageDirectory = fileURLToPath(new URL('../', import.meta.url));
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.ttf': 'font/ttf', '.txt': 'text/plain; charset=utf-8' };
const json = (response, status, data) => { response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' }); response.end(JSON.stringify(data)); };
async function input(request) {
  if (request.headers['content-type']?.split(';')[0] !== 'application/json') throw new SourceError(415, '需要 application/json。');
  const chunks = []; let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 64 * 1024) throw new SourceError(413, '修改内容过大，请分批保存。');
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString()); }
  catch { throw new SourceError(400, '修改内容不是有效 JSON。'); }
}

/** The authoring server depends only on this package and Node built-ins. */
export function createDesignSystemServer({ directory = packageDirectory } = {}) {
  const source = new DesignSource(directory);
  const server = createServer(async (request, response) => {
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Content-Security-Policy', "default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; font-src 'self'; script-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'");
    try {
      const host = request.headers.host;
      const address = server.address();
      const allowedHosts = [`127.0.0.1:${address.port}`, `localhost:${address.port}`];
      if (!allowedHosts.includes(host)) throw new SourceError(403, '只允许本机访问。');
      const url = new URL(request.url || '/', `http://${host}`);
      if (url.pathname.startsWith('/api/')) {
        if (request.headers['sec-fetch-site'] === 'cross-site') throw new SourceError(403, '请在设计系统页面内访问。');
        if (url.pathname === '/api/design-system' && request.method === 'GET') {
          const snapshot = await source.snapshot();
          if (request.headers['if-none-match'] === `"${snapshot.revision}"`) { response.writeHead(304); response.end(); return; }
          response.setHeader('ETag', `"${snapshot.revision}"`);
          return json(response, 200, snapshot);
        }
        if (url.pathname === '/api/design-system/tokens' && request.method === 'PUT') {
          if (request.headers.origin !== `http://${host}` || request.headers['x-design-system-client'] !== 'workbench') throw new SourceError(403, '保存只接受当前设计系统页面的请求。');
          const data = await input(request);
          if (!data || Object.keys(data).some(key => !['expectedRevision', 'changes'].includes(key))) throw new SourceError(400, '保存请求包含不支持的字段。');
          return json(response, 200, await source.save(data.expectedRevision, data.changes));
        }
        throw new SourceError(404, '接口不存在。');
      }
      if (!['GET', 'HEAD'].includes(request.method)) throw new SourceError(405, '不支持此操作。');
      const relative = url.pathname === '/' ? 'index.html' : url.pathname === '/favicon.svg' ? 'brand/favicon.svg' : resolveDesignSystemFile(url.pathname);
      if (!relative) throw new SourceError(404, '页面不存在。');
      let bytes = await readFile(await source.ordinaryFile(relative));
      if (relative === 'index.html') bytes = Buffer.from(bytes.toString().replace('name="design-system-editable" content="false"', 'name="design-system-editable" content="true"'));
      response.writeHead(200, { 'Content-Type': types[path.extname(relative)] || 'application/octet-stream', 'Content-Length': bytes.length });
      response.end(request.method === 'HEAD' ? undefined : bytes);
    } catch (error) {
      const status = error instanceof SourceError ? error.status : error.code === 'ENOENT' ? 404 : 500;
      json(response, status, { error: status === 500 ? '设计系统保存失败，请检查本地服务日志。' : error.message, ...(error.details || {}) });
      if (status === 500) console.error(error);
    }
  });
  return server;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const arg = process.argv.find(value => value.startsWith('--port='));
  const port = Number(arg?.slice(7) || process.env.DESIGN_SYSTEM_PORT || 4187);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid design-system port');
  const server = createDesignSystemServer();
  server.listen(port, '127.0.0.1', () => console.log(`OpenMotion Design System: http://127.0.0.1:${port}\nSource: ${path.join(packageDirectory, 'tokens.json')}`));
}
