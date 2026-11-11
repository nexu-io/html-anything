import path from 'node:path';
import { saveInstallationSource } from '../tracking/node.ts';
import { createAppTracking, closeTracking, trackingLocked, trackingPreference } from './tracking.ts';

export async function recordInstallation(directory: string, host: 'codex' | 'claude' | 'deepseek' | 'workbuddy', source?: string) {
  if (trackingLocked() || !trackingPreference(directory)) return;
  await saveInstallationSource(path.join(directory, 'tracking'), source);
  const tracking = await createAppTracking(directory, 'installer');
  tracking.track('installation_result', { outcome: 'success', host_product: host });
  await closeTracking(tracking);
}
