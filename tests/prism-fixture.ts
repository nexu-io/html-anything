import { createHash } from 'node:crypto';

export const resourceId = '1500c9af-186b-457f-b74d-a58113f657d8';
export const catalogUrl = `https://r.open-design.ai/resources/${resourceId}/channels/default/main.json`;
export const contents = {
  'index.html': '<!doctype html><html><head><script src="assets/gsap.min.js"></script></head><body><main id="main" data-composition-id="main" data-width="320" data-height="180" data-start="0" data-duration="1"><div class="clip" data-start="0" data-duration="1" data-track-index="1">Prism template</div></main><script src="animation.js"></script></body></html>',
  'animation.js': 'window.__timelines={main:gsap.timeline({paused:true}).to(".clip",{opacity:0.5,duration:1})};',
  'TEMPLATE.md': '# Editable test template\nReplace the title; keep the animation timing.',
};
export function publication(generation = 1, environment = 'prod') {
  return {
    resourceId, environment, channel: 'default', publicationId: `test-publication-${generation}`,
    defaultLocale: 'zh-CN', content: { 'zh-CN': { templates: [{
      templateId: 'test-motion-1', sortOrder: 1,
      original: { templateName: `测试模板 ${generation}`, summary: '一个可修改文字的动画', category: '动效片段', durationSeconds: '1', promotionalUseCases: '品牌宣传', author: 'Test author', sourceUrl: 'https://example.com/source' },
      indexUrl: 'https://example.com/index.html', coverUrl: 'https://example.com/poster.jpg', previewUrl: 'https://example.com/preview.mp4',
      files: Object.entries(contents).map(([path, content]) => {
        const sha256 = createHash('sha256').update(content).digest('hex');
        return { path, sha256, bytes: Buffer.byteLength(content), url: `https://r.open-design.ai/files/${sha256}` };
      }),
    }] } },
  };
}

export function mockPrism() {
  let current = publication();
  let offline = false;
  const requests: { url: string; etag: string | null }[] = [];
  const request: typeof fetch = async (input, init) => {
    const url = String(input);
    requests.push({ url, etag: new Headers(init?.headers).get('If-None-Match') });
    if (offline) throw new Error('offline');
    if (url.endsWith('/main.json')) {
      const etag = `"${current.publicationId}"`;
      if (new Headers(init?.headers).get('If-None-Match') === etag) return new Response(null, { status: 304 });
      return Response.json(current, { headers: { etag } });
    }
    const file = current.content['zh-CN'].templates[0].files.find(file => file.url === url);
    return file ? new Response(contents[file.path as keyof typeof contents]) : new Response('missing', { status: 404 });
  };
  return { request, requests, get current() { return current; }, update: (next = publication(2)) => { current = next; }, offline: () => { offline = true; } };
}
