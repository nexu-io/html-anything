import { access } from 'node:fs/promises';

let runtime;
export function trackingRuntime() {
  return runtime ??= (async () => {
    const compiled = new URL('../tracking/runtime.js', import.meta.url);
    try { await access(compiled); }
    catch (error) { if (error.code !== 'ENOENT') throw error; return import('../tracking/runtime.ts'); }
    return import(compiled);
  })();
}

export function installError(error) {
  if (['EACCES', 'EPERM', 'ENOSPC', 'ENOENT'].includes(error?.code)) return error.code;
  const message = String(error?.message ?? '');
  if (/INVALID_SOURCE/.test(message)) return 'INVALID_SOURCE';
  if (/owned|belongs|another (?:data|template|profile)|Keep .* separate/.test(message)) return 'OWNERSHIP_CONFLICT';
  if (/Another OpenMotion install|Timed out waiting/.test(message)) return 'INSTALL_BUSY';
  if (/SHA256/.test(message)) return 'INTEGRITY_FAILED';
  if (/Node.js|native runtime|macOS|Windows/.test(message)) return 'UNSUPPORTED_RUNTIME';
  return 'INSTALL_FAILED';
}

export async function installerTracking(context, source) {
  let tracking, close;
  if (context) try {
    const module = await trackingRuntime();
    tracking = await module.createTracking(context.dataDirectory, 'installer', context.version, source);
    close = module.closeTracking;
  } catch { /* Telemetry must not prevent installation or native preparation. */ }
  const fields = context ? { install_flow_id: context.flowId, attempt_id: crypto.randomUUID(),
    host_product: context.host, ...(context.operation ? { operation: context.operation } : {}),
    ...(source ? { attempt_source: source } : {}) } : {};
  const track = (name, properties = {}) => tracking?.track(name, { ...fields, ...properties });
  const elapsed = start => Math.min(86_400_000, Math.round(performance.now() - start));
  return { track, elapsed,
    async step(step, task, properties = {}) {
      const start = performance.now();
      try {
        const result = await task();
        track('installation_step_result', { step, ...properties, outcome: 'success', duration_ms: elapsed(start) });
        return result;
      } catch (error) {
        track('installation_step_result', { step, ...properties, outcome: 'failure', duration_ms: elapsed(start), error_code: installError(error) });
        throw error;
      }
    },
    close: async () => { if (tracking) await close(tracking).catch(() => {}); },
  };
}
