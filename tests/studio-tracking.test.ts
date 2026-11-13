import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
import { createTracker, deviceContext, validField, validProperties } from '../tracking/core.ts';
import { studioEvents, omEvents } from '../tracking/events.ts';
import { studioUsageEvents, audioEffects, audioPresets, audioParams, audioJobs, audioValueCategories } from '../tracking/studio-events.ts';
import { studioUsageProperties } from '../tracking/studio-properties.ts';
import { createPosthogSender } from '../tracking/node.ts';
import { identifyHost, validHostContext, previewTrackingContext } from '../tracking/host.ts';
import { studioTrackingFixtures } from './studio-tracking-fixtures.ts';
import { fixture } from './fixtures.ts';
import { transport } from './http.ts';
import type { PendingEvent } from '../tracking/core.ts';
import { pluginRoot } from '../hyperframes.ts';
import { Phase1Service } from '../phase1.ts';

test('all 78 retained Studio producers have a closed contract and accepted real-shaped payload', async () => {
  assert.equal(Object.keys(studioTrackingFixtures).length, 78);
  assert.deepEqual(Object.keys(studioUsageEvents).sort(), Object.keys(studioTrackingFixtures).sort());
  for (const [name, input] of Object.entries(studioTrackingFixtures)) {
    const properties = studioUsageProperties(name, { ...input, prompt: 'PRIVATE_PROMPT', distinct_id: 'PRIVATE_ID' });
    assert(properties, name); assert(validProperties(studioEvents, name, properties), name);
    assert(!JSON.stringify(properties).includes('PRIVATE'), name);
    assert(!validProperties(studioEvents, name, { ...properties, prompt: 'PRIVATE' }), name);
  }
  // Parse the real producers so new unregistered calls cannot hide behind a schema-only test.
  const { glob } = await import('node:fs/promises');
  const found = new Set<string>();
  for await (const file of glob('studio/src/**/*.{ts,tsx}')) {
    if (file.includes('.test.')) continue;
    const source = ts.createSourceFile(file, await readFile(file, 'utf8'), ts.ScriptTarget.Latest, true);
    function visit(node: ts.Node) {
      if (ts.isCallExpression(node) && node.arguments[0] && ts.isStringLiteral(node.arguments[0])) {
        const callee = node.expression.getText(source), name = node.arguments[0].text;
        if (['trackStudioEvent', 'trackEvent'].includes(callee)) found.add(name);
        if (file.endsWith('/audioFxTelemetry.ts') && callee === 'track') found.add('audio_fx_' + name);
      }
      ts.forEachChild(node, visit);
    }
    visit(source);
  }
  assert.deepEqual([...found].sort(), Object.keys(studioUsageEvents).sort());
});

test('migration keeps signed/fractional measurements and only safe summaries', () => {
  assert.equal(studioUsageProperties('playback', { action: 'speed_change', rate: 1.25 })?.rate, 1.25);
  assert.equal(studioUsageProperties('audio_fx_param_committed', studioTrackingFixtures.audio_fx_param_committed)?.value, -18.5);
  assert.deepEqual(studioUsageProperties('sdk_resolver_shadow_attempt', studioTrackingFixtures.sdk_resolver_shadow_attempt), { attempt_count: 10, operation_count: 2 });
  const shadow = studioUsageProperties('sdk_resolver_shadow', studioTrackingFixtures.sdk_resolver_shadow)!;
  assert.equal(shadow.element_not_found_count, 1); assert.equal(shadow.value_mismatch_count, 1);
  assert.equal(studioUsageProperties('studio_feedback', studioTrackingFixtures.studio_feedback)?.has_comment, true);
  assert.equal(studioUsageProperties('crash', studioTrackingFixtures.crash)?.error_name, 'OtherError');
  assert.equal(studioUsageProperties('unknown', {}), null);
  assert.equal(studioUsageProperties('playback', { action: 'PRIVATE' }), null);
  assert.equal(studioUsageProperties('sdk_resolver_shadow_attempt', { counts: '{bad' }), null);
  assert.equal(studioUsageProperties('audio_fx_preset_removed', { preset: 'PRIVATE_CUSTOM_PRESET' })?.preset, 'other');
  const category = studioUsageProperties('audio_fx_param_committed', { effect: 'saturate', param: 'type', value: 'tanh', surface: 'details' });
  assert.equal(category?.value_category, 'tanh'); assert.equal(category?.value, undefined);
  assert.equal(studioUsageProperties('audio_fx_param_committed', { effect: 'PRIVATE_EFFECT', param: 'PRIVATE_PARAM', value: 'PRIVATE_VALUE', surface: 'details' })?.value_category, 'other');
  for (const value of [NaN, Infinity, -Infinity, 86_400_001]) assert(!validField({ min: -86_400_000, max: 86_400_000 }, value));
});

test('audio identifier contracts cover the installed pinned engine without accepting user-authored identifiers', async () => {
  const { HF_AUDIO_FX } = await import('@hyperframes/core/audio-fx');
  const { HF_AUDIO_FX_PRESETS } = await import('@hyperframes/core/audio-fx-presets');
  const { HF_AUDIO_FX_JOBS } = await import('@hyperframes/core/audio-fx-jobs');
  assert.deepEqual([...audioEffects].filter(x => x !== 'other').sort(), HF_AUDIO_FX.map(effect => effect.id).sort());
  assert.deepEqual([...audioPresets].filter(x => x !== 'other').sort(), HF_AUDIO_FX_PRESETS.map(x => x.id).sort());
  assert.deepEqual([...audioJobs].filter(x => x !== 'other' && x !== 'none').sort(), HF_AUDIO_FX_JOBS.map(x => x.id).sort());
  const params = Object.values(HF_AUDIO_FX).flatMap(effect => effect.params);
  assert.deepEqual([...audioParams].filter(x => x !== 'other').sort(), [...new Set(params.map(param => param.key))].sort());
  assert.deepEqual([...audioValueCategories].filter(x => x !== 'other').sort(), [...new Set(params.flatMap(param => param.kind === 'enum' ? param.options.map(x => x.value) : []))].sort());
});

test('all retained events traverse real local admission and Node sender; opt-out and forged host are rejected', () => fixture(async store => {
  const indexed: any[] = [];
  const sender = createPosthogSender({ host: 'https://us.i.posthog.com', token: 'phc_test', appVersion: '0.0.0', env: 'test',
    identity: { installation_id: crypto.randomUUID(), utm_source: null, created_at: new Date().toISOString() },
    fetch: async (_url, init) => { indexed.push(...JSON.parse(String(init?.body)).batch); return Response.json({ status: 1 }); } });
  const tracking = createTracker({ registry: omEvents, entrypoint: 'mcp', enabled: true, flushIntervalMs: 0, send: sender });
  const host = identifyHost({ name: 'dsh-mcp-client', version: '0.0.1' }), token = crypto.randomUUID();
  const request = transport(store, { tracking, trackingHosts: new Map([[token, { host, createdAt: Date.now() }]]) });
  const packets: PendingEvent[] = Object.entries(studioTrackingFixtures).map(([event, input]) => ({ event,
    properties: studioUsageProperties(event, input)!, event_id: crypto.randomUUID(), occurred_at: new Date().toISOString(),
    entrypoint: 'studio', ...deviceContext() }));
  const send = (events: unknown[]) => request('/motion-api/tracking?context=' + token, { method: 'POST',
    headers: { 'content-type': 'application/json' }, body: JSON.stringify({ events }) });
  for (let i = 0; i < packets.length; i += 16) {
    assert.equal((await send(packets.slice(i, i + 16))).status, 200);
    assert.equal(await tracking.flush(), 'accepted');
  }
  assert.equal(indexed.length, 78);
  assert(indexed.every(row => row.properties.host_agent === 'deepseek' && row.properties.host_agent_source === 'mcp_client_info'));
  assert(!JSON.stringify(indexed).includes('PRIVATE'));
  assert.equal((await send([{ ...packets[0], host_context: identifyHost({ name: 'codex' }) }])).status, 400);
  tracking.setEnabled(false);
  assert.equal((await send(packets.slice(0, 1))).status, 200); assert.equal(tracking.pending(), 0);
  assert.equal(indexed.length, 78); tracking.close();
}, false));

test('host identity uses declared clients, preserves unknown and scopes all handoff URLs', () => {
  for (const name of ['codex', 'codex-mcp-client']) assert.equal(identifyHost({ name }).host_agent, 'codex');
  assert.equal(identifyHost({ name: 'dsh-mcp-client' }, { CODEX_THREAD_ID: 'PRIVATE' }).host_agent, 'deepseek');
  assert.equal(identifyHost({ name: 'PRIVATE_CLIENT' }).host_agent, 'other');
  assert.equal(identifyHost(undefined, { PATH: '/PRIVATE/codex', DSH_HOME: '/PRIVATE/dsh' }).host_agent, 'unknown');
  assert.equal(identifyHost(undefined, { CODEX_THREAD_ID: 'PRIVATE' }).host_agent_source, 'launch_environment');
  assert.equal(identifyHost({ name: 'codex', version: 'PRIVATE_VERSION' }).mcp_client_version, undefined);
  assert(!validHostContext({ ...identifyHost({ name: 'codex' }), raw_name: 'PRIVATE' }));
  const url = 'http://localhost:4173/?templates=1&embed=1', token = crypto.randomUUID();
  const value = previewTrackingContext({ previewUrl: url, previewHandoff: { previewUrl: url,
    nextAction: { codex: { arguments: { target: { url } } } } }, requirements: { url } }, 'http://localhost:4173', token);
  assert.equal(new URL(value.previewUrl).searchParams.get('tracking_context'), token);
  assert.equal(value.previewHandoff.nextAction.codex.arguments.target.url, value.previewUrl);
  assert.equal(value.requirements.url, url);
});

test('concurrent Agent handoffs keep independent page attribution and domain results', () => fixture(async store => {
  const events: PendingEvent[] = [];
  const tracking = createTracker({ registry: omEvents, entrypoint: 'mcp', enabled: true, flushIntervalMs: 0,
    send: async batch => { events.push(...batch); return 'accepted'; } });
  const context = { tracking, runtimeRoot: pluginRoot };
  const request = transport(store, context);
  const hosts = [identifyHost({ name: 'codex-mcp-client', version: '1.0.0' }), identifyHost({ name: 'dsh-mcp-client', version: '0.0.1' })];
  const stableContexts = hosts.map(() => crypto.randomUUID());
  const handoff = (i: number, contextId = stableContexts[i]) => request('/motion-api/phase1/call', { method: 'POST',
    headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: 'motion_open_preview', arguments: { target: 'templates' }, trackingHost: hosts[i], trackingContext: contextId }) }).then(r => r.json());
  const replies = await Promise.all(hosts.map((_, i) => handoff(i)));
  const tokens = replies.map(reply => new URL(reply.previewUrl).searchParams.get('tracking_context'));
  assert(tokens.every(Boolean)); assert.notEqual(tokens[0], tokens[1]);
  assert.deepEqual(tokens, stableContexts);
  assert.equal((await handoff(0)).previewUrl, replies[0].previewUrl, 'repeated delivery keeps the same URL');
  assert.notEqual(new URL((await handoff(1, stableContexts[0])).previewUrl).searchParams.get('tracking_context'), stableContexts[0], 'a different client cannot replace an existing page context');
  for (let i = 0; i < 2; i++) {
    const event = { event: 'playback', properties: { action: 'play' }, event_id: crypto.randomUUID(), occurred_at: new Date().toISOString(), entrypoint: 'studio', ...deviceContext() };
    assert.equal((await request('/motion-api/tracking?context=' + tokens[i], { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ events: [event] }) })).status, 200);
  }
  const service = new Phase1Service(store, pluginRoot, { tracking, origin: () => 'http://localhost:4173', nativeUrl: () => undefined,
    openProject: async () => {}, mutation: async task => task(), cancel: async () => {} });
  for (const host of hosts) await service.call('motion_create_project', { requestId: crypto.randomUUID(), projectType: 'natural_language', title: 'PRIVATE_TITLE', requirements: 'PRIVATE_PROMPT' }, host);
  await tracking.flush();
  assert.deepEqual(events.map(e => e.host_context?.host_agent), ['codex', 'deepseek', 'codex', 'deepseek']);
  assert(!JSON.stringify(events).includes('PRIVATE')); tracking.close();
}, false));
