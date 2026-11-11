import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TemplateCatalog } from '../prism-templates.ts';
import { bundledOnboardingTemplates } from './install-onboarding.mjs';

export async function onboardingCatalog(appRoot: string, dataDirectory: string, request: typeof fetch = fetch, timeout = 3_000) {
  // Covers response-body consumption as well as headers.
  const deadline = AbortSignal.timeout(timeout);
  const catalog = new TemplateCatalog(dataDirectory, { fetch: (input, init) => request(input, {
    ...init, signal: AbortSignal.any([deadline, ...(init?.signal ? [init.signal] : [])]),
  }) });
  const page = await catalog.page({ category: 'builtin', limit: 24 });
  const bundled = await bundledOnboardingTemplates(appRoot);
  const remote = page.items.filter(item => item.kind === 'prism' && item.hasHtmlProject === true
    && !bundled.some(builtin => builtin.templateId === item.id)).map(item => ({
    templateId: item.id, name: item.title.slice(0, 120), summary: item.description.slice(0, 240),
    tags: item.tags.slice(0, 6).map(tag => tag.slice(0, 40)), durationSeconds: item.duration,
    kind: item.kind, eligibility: 'unknown', requirements: 'HTML source available; asset and paid-generation requirements are not confirmed.',
  }));
  const templates = [...remote, ...bundled];
  return { source: page.warning ? 'cached' : 'remote', environment: catalog.environment,
    catalogVersion: page.catalogVersion, catalogTotal: page.catalogTotal, included: templates.length,
    truncated: page.total > templates.length, stale: Boolean(page.warning), warning: page.warning, templates };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const appRoot = fileURLToPath(new URL('../', import.meta.url));
  const dataDirectory = process.argv[2] || (await import('../workspace.ts')).defaultDataDir;
  console.log(JSON.stringify(await onboardingCatalog(appRoot, dataDirectory)));
}
