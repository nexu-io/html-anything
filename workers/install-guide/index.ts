type GuideObject = { body: ReadableStream; text(): Promise<string>; writeHttpMetadata(headers: Headers): void };
type Environment = { RELEASES: { get(key: string): Promise<GuideObject | null> } };
const marker = '<!-- openmotion-utm-source-supported -->';

export function attributeGuide(text: string, source: string | null): string {
  if (!source || !/^[A-Za-z0-9_.-]{1,64}$/.test(source) || !text.includes(marker)) return text;
  return text.replace(/openmotion setup --host (codex|claude|deepseek|workbuddy)\b/g,
    command => `${command} --utm-source ${source}`);
}

export default {
  async fetch(request: Request, env: Environment): Promise<Response> {
    const url = new URL(request.url);
    if (!/^\/open-motion\/(?:dev\/)?install\.md$/.test(url.pathname)) return new Response('Not found', { status: 404 });
    if (!['GET', 'HEAD'].includes(request.method)) return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
    const object = await env.RELEASES.get(url.pathname.slice(1));
    if (!object) return new Response('Not found', { status: 404 });
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('Content-Type', 'text/markdown; charset=utf-8');
    // The guide is small. Do not cache transformed responses or reuse an R2 ETag across channels.
    headers.set('Cache-Control', 'no-store');
    const source = url.searchParams.get('utm_source');
    if (!source) return new Response(request.method === 'HEAD' ? null : object.body, { headers });
    const text = attributeGuide(await object.text(), source);
    return new Response(request.method === 'HEAD' ? null : text, { headers });
  },
};
