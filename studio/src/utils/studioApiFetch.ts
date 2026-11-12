import { STUDIO_API_SAME_ORIGIN_CREDENTIALS } from "../components/editor/manualEditingAvailability";
import { parseProjectIdFromHash } from './projectRouting';
import { diagnosticFetch } from '../motion/diagnosticRequests';

const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

function studioApiCredentials(): RequestCredentials {
  if (STUDIO_API_SAME_ORIGIN_CREDENTIALS) return "same-origin";
  const host = globalThis.location?.hostname;
  return !host || LOOPBACK_HOSTS.has(host) ? "omit" : "same-origin";
}

export function studioApiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  return diagnosticFetch(typeof input === 'string' ? studioProjectUrl(input) : input, { ...init, credentials: studioApiCredentials() });
}

export function studioProjectUrl(input: string, projectId?: string | null): string {
  if (!input.startsWith('/api/') || input === '/api/projects' || input.startsWith('/api/projects/')) return input;
  const location = globalThis.location;
  const id = projectId ?? (location && (new URLSearchParams(location.search).get('project') ?? parseProjectIdFromHash(location.hash)));
  if (!id) return input;
  const url = new URL(input, 'http://studio.local');
  if (!url.searchParams.has('projectId')) url.searchParams.set('projectId', id);
  return url.pathname + url.search;
}
