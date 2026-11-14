import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';

const run = promisify(execFile);

test('native device identity survives process, project, data-directory and local identity replacement', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'motion-device-native-'));
  const deviceModule = new URL('../tracking/device.ts', import.meta.url).href;
  const nodeModule = new URL('../tracking/node.ts', import.meta.url).href;
  async function observe(data: string, project: string, version: string) {
    await mkdir(project, { recursive: true });
    const script = `
      const { loadDeviceIdentity } = await import(${JSON.stringify(deviceModule)});
      const { loadIdentity, createPosthogSender } = await import(${JSON.stringify(nodeModule)});
      const identity = await loadIdentity(${JSON.stringify(data)});
      const sender = createPosthogSender({ identity, appVersion: ${JSON.stringify(version)},
        device: loadDeviceIdentity, env: 'test', host: 'https://us.i.posthog.com', token: 'phc_test',
        fetch: async (_url, init) => {
          const p = JSON.parse(init.body).batch[0].properties;
          process.stdout.write(JSON.stringify({device:p.device_id,source:p.device_id_source,distinct:p.distinct_id,installation:p.installation_id}));
          return Response.json({status:1});
        } });
      await sender([{event:'page_view',event_id:crypto.randomUUID(),occurred_at:new Date().toISOString(),entrypoint:'studio',properties:{}}], new AbortController().signal);
    `;
    const { stdout } = await run(process.execPath, ['--experimental-strip-types', '--input-type=module', '-e', script],
      { cwd: project, timeout: 10_000, maxBuffer: 64 * 1024, windowsHide: true });
    return JSON.parse(stdout);
  }
  try {
    const a = path.join(directory, 'a'), b = path.join(directory, 'b');
    const first = await observe(a, path.join(directory, 'project-one'), '0.6.7');
    const other = await observe(b, path.join(directory, 'project-two'), '0.6.8');
    await rm(a, { recursive: true });
    const recreated = await observe(a, path.join(directory, 'project-three'), '0.6.9');
    assert([first, other, recreated].every(value => value.source === 'platform'), 'Native system ID must be readable on the test host');
    assert([first, other, recreated].every(value => /^omd_[0-9a-f]{64}$/.test(value.device) && value.distinct === value.device), 'Known devices must define the PostHog identity');
    assert(new Set([first.device, other.device, recreated.device]).size === 1, 'Device identity must stay stable');
    assert(new Set([first.installation, other.installation, recreated.installation]).size === 3, 'Installation identities must remain directory-local');
    // Print coverage only, never real machine identifiers or their hashes.
    console.log(JSON.stringify({ platform: process.platform, recognized: true, processes: 3, installations: 3, devices: 1, network_requests: 0 }));
  } finally { await rm(directory, { recursive: true, force: true }); }
});
