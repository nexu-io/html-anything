import assert from 'node:assert/strict';
import { cp, readFile, writeFile, lstat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const applicationRoot = fileURLToPath(new URL('../', import.meta.url));
const directory = path.join(applicationRoot, 'mcp-ui/template-recommendations');
const sourceInputs = [
  'mcp-ui/template-recommendations/app.ts',
  'mcp-ui/template-recommendations/i18n.ts',
  'mcp-ui/template-recommendations/app.css',
  'mcp-ui/template-recommendations/types.ts',
  'mcp-ui/tsconfig.json',
  'scripts/build-template-cards.mjs',
].sort();
const buildOutputs = ['mcp-ui/template-recommendations/build/app.js', 'mcp-ui/template-recommendations/build/app.css'].sort();
const identityPath = 'mcp-ui/template-recommendations/build/identity.json';
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

async function identityFiles(root, names) {
  return Promise.all(names.map(async name => {
    const filename = path.join(root, name);
    const info = await lstat(filename);
    assert(info.isFile() && !info.isSymbolicLink(), 'Build input/output must be a regular file: ' + name);
    const bytes = await readFile(filename);
    return { path: name, bytes: bytes.length, sha256: sha256(bytes) };
  }));
}

async function buildIdentity(root) {
  const info = async name => JSON.parse(await readFile(path.join(root, 'node_modules', name, 'package.json'), 'utf8'));
  const [sdk, vite, pkg] = await Promise.all([info('@modelcontextprotocol/ext-apps'), info('vite'),
    readFile(path.join(root, 'package.json'), 'utf8').then(JSON.parse)]);
  assert.equal(sdk.version, '2.0.4', 'Build with the reviewed browser SDK version');
  assert.equal(pkg.devDependencies?.['@modelcontextprotocol/ext-apps'], sdk.version, 'Browser SDK must remain an exact build dependency');
  assert.equal(pkg.devDependencies?.vite, vite.version, 'Vite must match the pinned build dependency');
  return {
    schemaVersion: 1,
    sdk: { name: '@modelcontextprotocol/ext-apps', version: sdk.version,
      browserEntrySha256: sha256(await readFile(path.join(root, 'node_modules/@modelcontextprotocol/ext-apps/dist/src/app-with-deps.js'))) },
    vite: vite.version,
    inputs: await identityFiles(root, sourceInputs),
    outputs: await identityFiles(root, buildOutputs),
  };
}

/** Source packaging checks freshness without importing any development runtime. */
export async function checkTemplateCardsBuild(root = applicationRoot) {
  try {
    const saved = JSON.parse(await readFile(path.join(root, identityPath), 'utf8'));
    assert.deepEqual(saved, await buildIdentity(root), 'Browser inputs or generated output changed after build');
    return saved;
  } catch (cause) {
    throw new Error('TEMPLATE_CARDS_BUILD_OUTDATED: run npm run build:template-cards before packaging', { cause });
  }
}

// Source builds produce a self-contained browser bundle. Installed runtimes
// read these frozen assets and never import Vite or the MCP Apps package.
export async function buildTemplateCards() {
  const sdk = JSON.parse(await readFile(path.join(applicationRoot, 'node_modules/@modelcontextprotocol/ext-apps/package.json'), 'utf8'));
  assert.equal(sdk.version, '2.0.4', 'Build with the reviewed browser SDK version');
  const { build } = await import('vite');
  await build({
    configFile: false,
    root: applicationRoot,
    logLevel: 'warn',
    build: {
      lib: {
        entry: path.join(directory, 'app.ts'),
        name: 'OpenMotionTemplateCards',
        formats: ['iife'],
        fileName: () => 'app.js',
      },
      outDir: path.join(directory, 'build'),
      emptyOutDir: true,
      minify: 'esbuild',
      sourcemap: false,
      cssCodeSplit: false,
      rollupOptions: { output: { inlineDynamicImports: true } },
    },
  });
  await cp(path.join(directory, 'app.css'), path.join(directory, 'build/app.css'));
  await writeFile(path.join(applicationRoot, identityPath), JSON.stringify(await buildIdentity(applicationRoot), null, 2) + '\n');
  await checkTemplateCardsBuild();

  // Validate the same bytes and final JSON envelope that production will serve,
  // including source fingerprints, media identities, metadata and the budget.
  const { loadTemplatePresentation } = await import('../shared/mcp-template-recommendations.ts');
  const presentation = loadTemplatePresentation({ directory, applicationRoot });
  const bytes = Buffer.byteLength(JSON.stringify({ jsonrpc: '2.0', id: 1, result: { contents: [presentation.content] } }));
  console.log(`Template cards: ${bytes} UTF-8 response bytes, resource ${presentation.resourceVersion}`);
  return { bytes, resourceVersion: presentation.resourceVersion, uri: presentation.uri };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await buildTemplateCards();
