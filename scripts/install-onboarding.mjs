import assert from 'node:assert/strict';
import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runFile } from './runtime-assets.mjs';

export async function installationInstructions(appRoot) {
  const guide = await readFile(path.join(appRoot, 'docs/install.md'), 'utf8');
  const sections = [...guide.matchAll(/<!-- installation-onboarding:start -->([\s\S]*?)<!-- installation-onboarding:end -->/g)];
  assert.equal(sections.length, 1, 'Installation guide must contain one onboarding contract');
  assert(sections[0][1].trim(), 'Installation onboarding contract is empty');
  return sections[0][1].trim();
}

// Inspect shipped manifests and files only; never copy a project or download assets here.
export async function bundledOnboardingTemplates(appRoot) {
  const templates = [];
  // These unchanged examples have been reviewed for self-contained sample content.
  // A new bundled directory is not automatically a no-input/no-generation experience.
  const reviewed = new Set(['product-promo', 'nyt-graph', 'decision-tree']);
  const directory = path.join(appRoot, 'template-library');
  for (const entry of await readdir(directory, { withFileTypes: true }).catch(() => [])) {
    if (!entry.isDirectory() || !reviewed.has(entry.name)) continue;
    try {
      const root = path.join(directory, entry.name);
      const item = JSON.parse(await readFile(path.join(root, 'registry-item.json'), 'utf8'));
      assert.equal(item.name, entry.name);
      assert(item.title && Array.isArray(item.files) && item.files.some(file => file.target === 'index.html'));
      for (const file of item.files) {
        assert(typeof file.path === 'string' && !file.path.includes('\\') && !path.isAbsolute(file.path) && !file.path.split('/').includes('..'));
        await access(path.join(root, file.path));
      }
      await access(path.join(appRoot, 'node_modules/gsap/dist/gsap.min.js'));
      templates.push({ templateId: item.name, name: String(item.title).slice(0, 120),
        summary: String(item.description || '').slice(0, 240), durationSeconds: item.duration,
        kind: 'builtin', eligibility: 'confirmed', requirements: 'Unchanged bundled example; no user assets or paid generation required.' });
    } catch { /* An incomplete example must not become an eligible offer. */ }
  }
  return templates.sort((a, b) => a.templateId.localeCompare(b.templateId));
}

export async function prepareInstallationOnboarding({ appRoot, dataDirectory, templateEnvironment }) {
  // A missing canonical contract fails before host registration.
  const instructions = await installationInstructions(appRoot);
  const bundled = await bundledOnboardingTemplates(appRoot);
  let catalog;
  try {
    catalog = JSON.parse(await runFile(process.execPath, ['--experimental-strip-types', path.join(appRoot, 'scripts/onboarding-catalog.ts'),
      ...(dataDirectory ? [dataDirectory] : [])], {
      cwd: appRoot, timeout: 5_000, killSignal: 'SIGKILL',
      env: { ...process.env, MOTION_TEMPLATE_ENV: templateEnvironment },
    }));
    assert(Array.isArray(catalog.templates), 'Invalid onboarding catalog');
  } catch {
    catalog = { source: 'bundled', environment: templateEnvironment, catalogVersion: null,
      catalogTotal: null, included: bundled.length, truncated: false, stale: false,
      warning: 'Remote catalog unavailable; using verified bundled examples only.', templates: bundled };
  }
  return { hostSessionVerified: false, instructions, catalog };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const appRoot = path.resolve(process.argv[2] || fileURLToPath(new URL('../', import.meta.url)));
  const defaults = JSON.parse(await readFile(path.join(appRoot, 'shared/template-config.json'), 'utf8'));
  console.log(JSON.stringify(await prepareInstallationOnboarding({ appRoot,
    dataDirectory: process.env.MOTION_DATA_DIR, templateEnvironment: process.env.MOTION_TEMPLATE_ENV || defaults.environment }), null, 2));
}
