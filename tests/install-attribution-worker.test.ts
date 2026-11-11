import test from 'node:test';
import assert from 'node:assert/strict';
import worker, { attributeGuide, guideKey } from '../workers/install-guide/index.ts';
const guide = '<!-- openmotion-utm-source-supported -->\n`openmotion setup --host codex`\n`openmotion setup --host deepseek --profile PROFILE`\n`openmotion prepare`';
test('worker keeps untagged and older guides unchanged and annotates only setup commands', async () => {
  assert.equal(attributeGuide(guide,null),guide);
  assert.equal(attributeGuide(guide,'$(bad)'),guide);
  assert.equal(attributeGuide('openmotion setup --host codex','producthunt'),'openmotion setup --host codex');
  // A value starting with a hyphen stays one unambiguous option value for the installer.
  assert.ok(attributeGuide(guide,'--help').includes('`openmotion setup --host codex --utm-source=--help`'));
  assert.ok(attributeGuide(guide,'-x').includes('`openmotion setup --host codex --utm-source=-x`'));
  const env = { RELEASES: { async get(key: string) { assert.equal(key,'open-motion/dev/install.md');return {body:new Response(guide).body!,text:async()=>guide,httpEtag:'etag',writeHttpMetadata(){}}; } } };
  for (const source of ['', 'producthunt', 'partner']) {
    const response = await worker.fetch(new Request('https://releases.open-design.ai/open-motion/dev/install.md'+(source?'?utm_source='+source:'')),env);
    assert.equal(response.headers.get('cache-control'),'no-store');
    const text = await response.text();
    if (!source) assert.equal(text,guide);
    else { assert.ok(text.includes('setup --host codex --utm-source='+source));assert.ok(text.includes('setup --host deepseek --utm-source='+source+' --profile PROFILE')); }
    assert.ok(text.includes('`openmotion prepare`'));
  }
});


test('public installation domains select their own environment without a fallback', async () => {
  for (const [host,key] of [['open-design.powerformer.net','open-motion/dev/install.md'],['open-design.ai','open-motion/install.md']]) {
    const url = new URL('https://' + host + '/motion/install.md?utm_source=producthunt');
    assert.equal(guideKey(url),key);
    const env = { RELEASES: { async get(actual: string) { assert.equal(actual,key); return null; } } };
    assert.equal((await worker.fetch(new Request(url),env)).status,404);
  }
  assert.equal(guideKey(new URL('https://unknown.example/motion/install.md')),null);
  assert.equal(guideKey(new URL('https://open-design.ai/motion/templates/')),null);
  assert.equal(guideKey(new URL('https://releases.open-design.ai/open-motion/dev/install.md')),'open-motion/dev/install.md');
});
