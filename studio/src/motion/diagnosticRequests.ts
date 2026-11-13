import { diagnosticsActive, nextDiagnosticRequest, recordBrowserDiagnostic } from './diagnostics';

// Only fixed route names survive; IDs, file names, queries, bodies and headers never enter the log.
function routeName(input: RequestInfo | URL): string | undefined {
  if (typeof input !== 'string' || input.length > 4096) return;
  const path = input.split(/[?#]/, 1)[0];
  const workspace = path.match(/^\/(motion|design)-api\/(project\/status|projects|sessions|runtime|preview\/open|tracking\/preferences|template-catalog|integration)$/);
  if (workspace) return `workspace.${workspace[2]}`;
  const transition = path.match(/^\/(?:motion|design)-api\/(projects|templates|sessions)\/[^/]+(?:\/(open|artifacts|messages))?$/);
  if (transition) return `workspace.${transition[1]}.${transition[2] ?? 'item'}`;
  const native = path.match(/^\/api\/projects\/[^/]+(?:\/(files|upload|render|renders|history|file-mutations|gsap-mutations|gsap-mutations-batch|gsap-mutation-rollback|rename-file|delete-file|duplicate-file)(?:\/.*)?)?$/);
  if (native) return `native.${native[1] ?? 'project'}`;
  if (/^\/api\/render\/[^/]+(?:\/cancel)?$/.test(path)) return 'native.render-job';
}

export function diagnosticFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const route = diagnosticsActive() ? routeName(input) : undefined;
  if (!route) return globalThis.fetch(input, init);
  const method = (init?.method ?? 'GET').toUpperCase();
  const write = !['GET', 'HEAD'].includes(method);
  const safeMethod = ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(method) ? method : 'OTHER';
  const request = nextDiagnosticRequest(), start = performance.now();
  const context = `request=${request} method=${safeMethod} route=${route}`;
  if (write) recordBrowserDiagnostic('activity_request', `${context} outcome=started`);
  return (async () => {
    try {
      const response = await globalThis.fetch(input, init);
      const durationMs = Math.round(performance.now() - start);
      if (write || !response.ok || durationMs >= 2000) recordBrowserDiagnostic(response.ok ? 'activity_request' : 'request_failed',
        `${context} outcome=${response.ok ? 'response' : 'http_error'} status=${response.status} durationMs=${durationMs}`, '',
        !response.ok || !write ? `${safeMethod}:${route}:${response.status}` : undefined);
      return response;
    } catch (error) {
      const aborted = (error as { name?: string })?.name === 'AbortError';
      if (!aborted || write) recordBrowserDiagnostic(aborted ? 'activity_request' : 'request_failed',
        `${context} outcome=${aborted ? 'aborted' : (error as { name?: string })?.name === 'TimeoutError' ? 'timeout' : 'network_error'} durationMs=${Math.round(performance.now() - start)}`,
        '', `${safeMethod}:${route}:${aborted ? 'aborted' : 'network_error'}`);
      throw error;
    }
  })();
}
