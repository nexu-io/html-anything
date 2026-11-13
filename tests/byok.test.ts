import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fixture } from './fixtures.ts';
import { gatewayFor } from '../gateway/service.ts';
import { Phase1Service } from '../phase1.ts';
import { pluginRoot } from '../hyperframes.ts';
import { providerOrigin } from '../gateway/network.ts';
import type { Fetcher } from '../gateway/network.ts';

const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a2ioAAAAASUVORK5CYII=', 'base64');
const mp4 = Buffer.concat([Buffer.from('00000018667479706d703432000000006d703432', 'hex'), Buffer.alloc(32)]);
const audio = Buffer.concat([Buffer.from('ID3'), Buffer.alloc(40)]);
function service(store: any) { return new Phase1Service(store, pluginRoot, { origin: () => 'http://127.0.0.1:4173', nativeUrl: () => undefined,
  openProject: async () => {}, mutation: async task => task(), cancel: async () => {} }); }
async function finish(store: any, id: string) { const g = gatewayFor(store); await g.tick(); await Promise.all([...g.active.values()].map(task => task.done)); return g.getJob(id); }

test('public media tool reads guides, generates fal media once and binds job queries to their project', () => fixture(async store => {
  const api = service(store), gateway = gatewayFor(store); gateway.options.detect = async () => []; gateway.options.pollMs = 1;
  let submissions = 0;
  gateway.options.fetcher = (async (url, init = {}) => {
    assert.equal(new Headers(init.headers).get('Authorization'), 'Key test-fal-private');
    if (init.method === 'POST') { submissions++; assert.equal(JSON.parse(String(init.body)).prompt, 'cup'); return Response.json({ request_id: 'remote', status_url: 'https://queue.fal.run/request/status', response_url: 'https://queue.fal.run/request/result' }); }
    return Response.json(String(url).endsWith('status') ? { status: 'COMPLETED' } : { images: [{ url: 'https://cdn.example/image.png' }] });
  }) as Fetcher;
  gateway.options.download = async () => png;
  await gateway.configureProvider('fal', { apiKey: 'test-fal-private' });
  assert.equal((await stat(path.join(gateway.root, 'secrets.json'))).mode & 0o777, 0o600);
  const inspect = await api.call('openmotion_media_use', { action: 'inspect' });
  assert.deepEqual(inspect.providers.map((p: any) => [p.id, p.enabled]), [['atlascloud', false], ['fal', true], ['opendesign', false], ['wavespeed', false]]);
  assert.doesNotMatch(JSON.stringify(inspect), /test-fal-private/);
  const reference = await api.call('openmotion_media_use', { action: 'reference', provider: 'fal' });
  assert.match(reference.content, /https:\/\/fal.ai\/docs\//);
  assert.equal(reference.workflow, 'production');
  assert.equal(reference.documentId, 'skills/openmotion-production/references/media-providers/fal.md');
  assert(inspect.references.every((ref: any) => ref.uri.startsWith('openmotion://workflow/production/')));
  const args = { action: 'generate', provider: 'fal', model: 'fal-ai/flux/schnell', projectId: store.projectId, requestId: 'same-task', modality: 'image', prompt: 'cup', parameters: { image_size: 'square_hd' } };
  const queued = await api.call('openmotion_media_use', args);
  assert.equal(queued.job.state, 'queued');
  assert.equal((await api.call('openmotion_media_use', args)).job.id, queued.job.id);
  await assert.rejects(api.call('openmotion_media_use', { ...args, prompt: 'different' }), /Idempotency/);
  const completed = await finish(store, queued.job.id); assert.equal(completed.state, 'completed', completed.error); assert.equal(submissions, 1);
  const result = await api.call('openmotion_media_use', { action: 'status', projectId: store.projectId, jobId: queued.job.id });
  assert.deepEqual(await readFile(path.join(store.projectDirectory, result.job.assets[0].path)), png);
  await assert.rejects(api.call('openmotion_media_use', { ...args, apiKey: 'must-not-accept' }), /unknown/);
  await assert.rejects(api.call('openmotion_media_use', { ...args, projectId: undefined }), /projectId/);
  await assert.rejects(api.call('openmotion_media_use', { action: 'status', projectId: crypto.randomUUID(), jobId: queued.job.id }), /PROJECT_NOT_FOUND/);
  await gateway.close();
}));

for (const kind of ['image', 'video', 'audio'] as const) test(`Cloud ${kind} preserves authentication, task identity and downloads into the project`, () => fixture(async store => {
  const api = service(store), gateway = gatewayFor(store); gateway.options.detect = async () => []; gateway.options.pollMs = 1;
  gateway.options.download = async () => kind === 'image' ? png : audio;
  const methods: string[] = [];
  gateway.options.fetcher = (async (url, init = {}) => {
    const target = String(url); assert(target.startsWith('https://cloud.example/api/v1/media/'));
    assert.equal(new Headers(init.headers).get('Authorization'), 'Bearer test-cloud-private');
    methods.push(`${init.method ?? 'GET'} ${new URL(target).pathname}`);
    if (init.method === 'POST') {
      assert.match(new Headers(init.headers).get('Idempotency-Key')!, /^[a-f0-9-]{36}$/);
      const body = JSON.parse(String(init.body));
      if (kind === 'audio') { assert.equal(body.voice, 'voice-1'); assert.equal(body.parameters.text, 'hello'); assert.equal(body.parameters.speed, 1); }
      else assert.equal(body.prompt, 'hello');
      return Response.json({ task_id: 'cloud-task' }, { status: 202 });
    }
    if (target.endsWith('/content')) return new Response(mp4);
    return Response.json({ status: 'succeeded', assets: [{ url: 'https://cdn.example/output' }] });
  }) as Fetcher;
  await gateway.configureProvider('opendesign', { apiKey: 'test-cloud-private', baseUrl: 'https://cloud.example/v1' });
  const args = { action: 'generate', provider: 'opendesign', projectId: store.projectId, requestId: `cloud-${kind}`, model: kind === 'audio' ? 'elevenlabs-v3' : 'test-model', modality: kind,
    mode: kind === 'audio' ? 'text-to-speech' : `text-to-${kind}`, prompt: 'hello', parameters: kind === 'audio' ? { voice: 'voice-1', speed: 1 } : { duration: 5 } };
  const queued = await api.call('openmotion_media_use', args);
  const job = await finish(store, queued.job.id); assert.equal(job.state, 'completed', job.error);
  assert.equal(job.remoteId, 'cloud-task'); assert.equal(job.providerOrigin, 'https://cloud.example');
  assert.equal(methods.length, kind === 'video' ? 3 : 2);
  assert.equal((await api.call('openmotion_media_use', args)).job.id, job.id);
  assert.doesNotMatch(JSON.stringify(job), /test-cloud-private/);
  await gateway.close();
}));

test('Cloud discovery uses workspace credentials; origin changes stop queued calls and missing voice fails before charging', () => fixture(async store => {
  const gateway = gatewayFor(store); gateway.options.detect = async () => []; gateway.options.pollMs = 1;
  let calls = 0;
  gateway.options.fetcher = (async (_url, init = {}) => {
    calls++; assert.equal(new Headers(init.headers).get('Authorization'), 'Bearer cloud-key');
    return Response.json({ models: [{ model: 'workspace-image', kind: 'image' }, { model: 'workspace-video', kind: 'video' }] });
  }) as Fetcher;
  await gateway.configureProvider('opendesign', { apiKey: 'cloud-key', baseUrl: 'https://cloud.example' });
  const models = await gateway.listModels({ provider: 'opendesign', refresh: true });
  assert(models.models.some(m => m.modelId === 'workspace-image')); assert.equal(calls, 1);
  const first = await gateway.submit({ projectId: store.projectId, model: 'opendesign:workspace-image', modality: 'image', prompt: 'cup' });
  await gateway.configureProvider('opendesign', { baseUrl: 'https://changed.example' });
  assert.match((await finish(store, first.id)).error!, /origin changed/); assert.equal(calls, 1);
  const speech = await gateway.submit({ projectId: store.projectId, model: 'opendesign:elevenlabs-v3', modality: 'audio', prompt: 'hello' });
  assert.match((await finish(store, speech.id)).error!, /voice ID/); assert.equal(calls, 1);
  await gateway.configureProvider('opendesign', { apiKey: null });
  assert.equal((await gateway.status()).providers.find(p => p.id === 'opendesign')!.enabled, false);
  await gateway.close();
}));

test('custom Cloud origins reject credentials, private IPs, paths and non-HTTPS URLs', () => {
  assert.equal(providerOrigin('https://cloud.example/v1/'), 'https://cloud.example');
  for (const raw of ['http://cloud.example', 'https://localhost', 'https://127.0.0.1', 'https://[::1]', 'https://10.0.0.1', 'https://user:pass@cloud.example', 'https://cloud.example/path', 'https://cloud.example?key=secret']) assert.throws(() => providerOrigin(raw));
});

for (const provider of ['atlascloud', 'wavespeed'] as const) for (const kind of ['image', 'video', 'audio'] as const) {
  test(`${provider} ${kind} uses the public tool, one authenticated submit and project-owned output`, () => fixture(async store => {
    const api = service(store), gateway = gatewayFor(store); gateway.options.detect = async () => []; gateway.options.pollMs = 1;
    const model = kind === 'audio' ? 'minimax/speech-test' : `vendor/test-${kind}`;
    const expected = kind === 'image' ? png : kind === 'video' ? mp4 : audio;
    let submits = 0, polls = 0;
    gateway.options.download = async () => expected;
    gateway.options.fetcher = (async (raw, init = {}) => {
      const url = String(raw);
      assert.equal(new Headers(init.headers).get('Authorization'), `Bearer private-${provider}`);
      if (init.method === 'POST') {
        submits++;
        const body = JSON.parse(String(init.body));
        assert.equal(body[kind === 'audio' ? 'text' : 'prompt'], 'test input');
        assert.equal(body.voice_id, kind === 'audio' ? 'voice-test' : undefined);
        if (provider === 'atlascloud') {
          assert.equal(url, `https://api.atlascloud.ai/api/v1/model/generate${kind === 'image' ? 'Image' : kind === 'video' ? 'Video' : 'Audio'}`);
          assert.equal(body.model, model);
        } else {
          assert.equal(url, `https://api.wavespeed.ai/api/v3/${model}`);
          assert.equal(body.model, undefined);
        }
        return Response.json({ code: 200, data: { id: 'remote-test', status: 'created', urls: { get: 'https://untrusted.example/do-not-follow' } } });
      }
      assert.equal(url, provider === 'atlascloud' ? 'https://api.atlascloud.ai/api/v1/model/prediction/remote-test' : 'https://api.wavespeed.ai/api/v3/predictions/remote-test/result');
      return Response.json({ code: 200, data: ++polls === 1 ? { status: 'processing' } : { status: 'completed', outputs: ['https://cdn.example/output'] } });
    }) as Fetcher;
    await gateway.configureProvider(provider, { apiKey: `private-${provider}` });
    const inspected = await api.call('openmotion_media_use', { action: 'inspect' });
    assert.equal(inspected.providers.find((p: any) => p.id === provider).enabled, true);
    const guide = await api.call('openmotion_media_use', { action: 'reference', provider });
    assert.match(guide.content, new RegExp(provider === 'wavespeed' ? 'wavespeed.ai/docs/' : 'atlascloud.ai/docs/'));
    const request = { action: 'generate', provider, model, projectId: store.projectId, requestId: `${provider}-${kind}`, modality: kind,
      mode: kind === 'audio' ? 'text-to-speech' : `text-to-${kind}`, prompt: 'test input', parameters: kind === 'audio' ? { voice_id: 'voice-test' } : {} };
    const submitted = await api.call('openmotion_media_use', request);
    assert.equal((await api.call('openmotion_media_use', request)).job.id, submitted.job.id);
    const job = await finish(store, submitted.job.id);
    assert.equal(job.state, 'completed', job.error); assert.equal(job.remoteId, 'remote-test');
    assert.equal(submits, 1); assert.equal(polls, 2);
    assert.deepEqual(await readFile(path.join(store.projectDirectory, job.assets[0].path)), expected);
    assert.doesNotMatch(JSON.stringify(job), /private-/);
    await gateway.configureProvider(provider, { apiKey: null });
    assert.equal((await gateway.status()).providers.find(p => p.id === provider)!.enabled, false);
    await gateway.close();
  }));
}

test('WaveSpeed discovers authenticated media models and excludes text, training and 3D outputs', () => fixture(async store => {
  const api = service(store), gateway = gatewayFor(store); gateway.options.detect = async () => [];
  let calls = 0;
  gateway.options.fetcher = (async (url, init = {}) => {
    calls++; assert.equal(String(url), 'https://api.wavespeed.ai/api/v3/models');
    assert.equal(new Headers(init.headers).get('Authorization'), 'Bearer wavespeed-discovery');
    return Response.json({ code: 200, data: [
      { model_id: 'vendor/image', name: 'Image test', type: 'text-to-image' },
      { model_id: 'vendor/video', type: 'image-to-video' },
      { model_id: 'vendor/voice', type: 'text-to-audio' },
      { model_id: 'vendor/caption', type: 'image-to-text' },
      { model_id: 'vendor/3d', type: 'image-to-3d' },
      { model_id: 'vendor/train', type: 'training' },
      { model_id: '../invalid', type: 'text-to-image' },
    ] });
  }) as Fetcher;
  assert.equal((await api.call('openmotion_media_use', { action: 'models', provider: 'wavespeed', refresh: true })).setupRequired, true);
  assert.equal(calls, 0);
  await gateway.configureProvider('wavespeed', { apiKey: 'wavespeed-discovery' });
  const result = await api.call('openmotion_media_use', { action: 'models', provider: 'wavespeed', refresh: true });
  assert.deepEqual(result.catalogs[0].models.map((m: any) => m.modality), ['image', 'video', 'audio']);
  assert.equal(calls, 1); assert.doesNotMatch(JSON.stringify(result), /wavespeed-discovery/);
  await gateway.close();
}));

test('WaveSpeed stops deleted tasks, rejects unsafe remote IDs and records auth rejection without paid retries', () => fixture(async store => {
  const gateway = gatewayFor(store); gateway.options.detect = async () => []; gateway.options.pollMs = 1;
  for (const outcome of ['deleted', 'unsafe-id', 'unauthorized'] as const) {
    let submits = 0;
    gateway.options.fetcher = (async (_url, init = {}) => {
      if (init.method === 'POST') {
        submits++;
        if (outcome === 'unauthorized') return new Response('private-provider-diagnostics', { status: 401 });
        return Response.json({ code: 200, data: { id: outcome === 'unsafe-id' ? '../outside' : 'safe-id', status: 'created' } });
      }
      return Response.json({ code: 200, data: { status: 'deleted' } });
    }) as Fetcher;
    await gateway.configureProvider('wavespeed', { apiKey: 'test-wavespeed-key' });
    const submitted = await gateway.submit({ projectId: store.projectId, model: 'wavespeed:vendor/image', modality: 'image', prompt: 'test' });
    const job = await finish(store, submitted.id);
    assert.equal(job.state, 'failed'); assert.equal(submits, 1); assert.deepEqual(job.assets, []);
    assert.match(job.error!, outcome === 'deleted' ? /deleted/ : outcome === 'unsafe-id' ? /prediction ID/ : /401/);
    assert.doesNotMatch(JSON.stringify(job), /test-wavespeed-key|private-provider-diagnostics/);
  }
  assert.equal((await gateway.status()).providers.find(p => p.id === 'wavespeed')!.verification, 'rejected');
  await gateway.close();
}));
