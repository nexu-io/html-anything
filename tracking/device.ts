import { createHmac } from 'node:crypto';
import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { promisify } from 'node:util';

export type DeviceIdentity = { device_id: string; device_id_source: 'platform' | 'unavailable' };
export const unknownDevice: DeviceIdentity = { device_id: 'unknown', device_id_source: 'unavailable' };
const run = promisify(execFile);

export function deviceIdentity(platform: string, identifier: string): DeviceIdentity {
  const normalized = identifier.trim().toLowerCase().replaceAll('-', '');
  if (!['darwin', 'win32', 'linux'].includes(platform) || !/^[0-9a-f]{32}$/.test(normalized)
    || /^0+$|^f+$/.test(normalized)) return unknownDevice;
  return { device_id: 'omd_' + createHmac('sha256', Buffer.from(normalized, 'hex')).update('openmotion:device:v1\0' + platform).digest('hex'),
    device_id_source: 'platform' };
}

async function readDeviceIdentity(): Promise<DeviceIdentity> {
  try {
    let identifier: string | undefined;
    if (process.platform === 'darwin') {
      const { stdout } = await run('/usr/sbin/ioreg', ['-rd1', '-c', 'IOPlatformExpertDevice'], { timeout: 2000, maxBuffer: 64 * 1024 });
      identifier = /"IOPlatformUUID"\s*=\s*"([0-9a-f-]+)"/i.exec(stdout)?.[1];
    } else if (process.platform === 'win32') {
      const { stdout } = await run('reg.exe', ['query', 'HKLM\\SOFTWARE\\Microsoft\\Cryptography', '/v', 'MachineGuid', '/reg:64'],
        { timeout: 2000, maxBuffer: 64 * 1024, windowsHide: true });
      identifier = /MachineGuid\s+REG_SZ\s+([0-9a-f-]+)/i.exec(stdout)?.[1];
    } else if (process.platform === 'linux') {
      identifier = await readFile('/etc/machine-id', 'utf8').catch(() => readFile('/var/lib/dbus/machine-id', 'utf8'));
    }
    return identifier ? deviceIdentity(process.platform, identifier) : unknownDevice;
  } catch { return unknownDevice; }
}

let pending: Promise<DeviceIdentity> | undefined;
// Cache only in memory: project/data directories never define or replace device identity.
export function loadDeviceIdentity(): Promise<DeviceIdentity> { return pending ??= readDeviceIdentity(); }
