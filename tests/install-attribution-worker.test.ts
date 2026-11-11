import test from 'node:test';
import assert from 'node:assert/strict';
import worker, { attributeGuide } from '../workers/install-guide/index.ts';
const guide = '<!-- openmotion-utm-source-supported -->\n`openmotion setup --host codex`\n`openmotion setup --host deepseek --profile PROFILE`\n`openmotion prepare`';
test('worker keeps untagged and older guides unchanged and annotates only setup commands', async () => {
  assert.equal(attributeGuide(guide,null),guide);
  assert.equal(attributeGuide(guide,'$(bad)'),guide);
  assert.equal(attributeGuide('openmotion setup --host codex','producthunt'),'openmotion setup --host codex');
  const env = { RELEASES: { async get(key: string) { assert.equal(key,'open-motion/dev/install.md');return {body:new Response(guide).body!,text:async()=>guide,httpEtag:'etag',writeHttpMetadata(){}}; } } };
  for (const source of ['', 'producthunt', 'partner']) {
    const response = await worker.fetch(new Request('https://releases.open-design.ai/open-motion/dev/install.md'+(source?'?utm_source='+source:'')),env);
    assert.equal(response.headers.get('cache-control'),'no-store');
    const text = await response.text();
    if (!source) assert.equal(text,guide);
    else { assert.ok(text.includes('setup --host codex --utm-source '+source));assert.ok(text.includes('setup --host deepseek --utm-source '+source+' --profile PROFILE')); }
    assert.ok(text.includes('`openmotion prepare`'));
  }
});
