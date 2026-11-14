import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { deviceIdentity, unknownDevice } from '../tracking/device.ts';
import { createPosthogSender, createNodeTracking, loadIdentity } from '../tracking/node.ts';
import { deviceContext } from '../tracking/core.ts';
import { omEvents } from '../tracking/events.ts';
import { fixture } from './fixtures.ts';
import type { PendingEvent } from '../tracking/core.ts';

test('device identity normalizes valid OS identifiers and rejects missing or placeholder values', () => {
  const raw = '12345678-1234-5678-90AB-1234567890AB';
  const devices = ['darwin', 'win32', 'linux'].map(platform => {
    const one = deviceIdentity(platform, raw);
    assert.deepEqual(one, deviceIdentity(platform, raw.replaceAll('-', '').toLowerCase()));
    assert.match(one.device_id, /^omd_[0-9a-f]{64}$/); assert.equal(one.device_id_source, 'platform');
    assert.notEqual(one.device_id, deviceIdentity(platform, '223456781234567890ab1234567890ab').device_id);
    assert(!one.device_id.includes('12345678')); return one.device_id;
  });
  assert.equal(new Set(devices).size, 3);
  assert.deepEqual(deviceIdentity('unsupported', raw), unknownDevice);
  for (const value of ['', '0'.repeat(32), 'f'.repeat(32), '/PRIVATE/path', 'PRIVATE_TOKEN']) {
    assert.deepEqual(deviceIdentity('darwin', value), unknownDevice);
  }
});

test('known devices share PostHog identity across directories and app versions', () => fixture(async store => {
  const raw = '123456781234567890ab1234567890ab', device = deviceIdentity('darwin', raw);
  const first = await loadIdentity(path.join(store.directory, 'first')), second = await loadIdentity(path.join(store.directory, 'second'));
  assert.notEqual(first.installation_id, second.installation_id);
  const event: PendingEvent = { event: 'page_view', event_id: crypto.randomUUID(), occurred_at: new Date().toISOString(), entrypoint: 'studio',
    ...deviceContext(), properties: { page_name: 'studio', view_id: crypto.randomUUID(), embedded: true, has_project: true } };
  const bodies: any[] = [];
  const options = { host: 'https://us.i.posthog.com', token: 'phc_test', env: 'test' as const, device: async () => device,
    fetch: async (_url: unknown, init?: RequestInit) => { bodies.push(JSON.parse(String(init?.body))); return Response.json({ status: 1 }); } };
  for (const [identity, appVersion] of [[first, '0.6.7'], [second, '0.6.8']] as const) {
    assert.equal(await createPosthogSender({ ...options, identity, appVersion })([event], new AbortController().signal), 'accepted');
  }
  const properties = bodies.map(body => body.batch[0].properties);
  assert.equal(new Set(properties.map(value => value.installation_id)).size, 2);
  assert(properties.every(value => value.device_id === device.device_id && value.distinct_id === device.device_id
    && value.device_id_source === 'platform'));
  assert(!JSON.stringify(bodies).includes(raw));
  await createPosthogSender({ ...options, identity: first, appVersion: '0.6.7', device: async () => unknownDevice })([event], new AbortController().signal);
  const unknown = bodies[2].batch[0].properties;
  assert.equal(unknown.device_id, 'unknown'); assert.equal(unknown.device_id_source, 'unavailable');
  assert.equal(unknown.distinct_id, first.installation_id);
}, false));

test('disabled or opted-out tracking does not read platform identity', async () => {
  let reads = 0;
  const options = { registry: omEvents, entrypoint: 'mcp' as const, host: 'https://us.i.posthog.com', token: 'phc_test',
    identity: { installation_id: crypto.randomUUID(), utm_source: null, created_at: new Date().toISOString() },
    appVersion: '0.6.7', env: 'test' as const, device: async () => { reads++; return unknownDevice; },
    fetch: async () => { assert.fail('Opt-out must not send'); } };
  for (const state of [{ enabled: false }, { enabled: true, isEnabled: () => false }]) {
    const tracking = createNodeTracking({ ...options, ...state });
    try {
      tracking.track('mcp_tool_finished', { tool_name: 'motion_get_project', call_id: crypto.randomUUID(), accepted: true, outcome: 'success', duration_ms: 1 });
      assert.equal(await tracking.flush(), 'disabled'); assert.equal(reads, 0);
    } finally { tracking.close(); }
  }
});
