import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { classifyChanges, checkDocs, documentationContract } from '../.github/scripts/ci-scope.mjs';

test('README installation instructions and executable examples retain their full gate', () => {
  const before = '# Overview\nOriginal copy\n## Install\nChoose your host.\n### Manual\nKeep the configuration.\n## Showcase\nA film.\n```sh\nnpm ci\n```\n';
  assert.equal(documentationContract(before), documentationContract(before.replace('Original copy', 'New copy')));
  for (const [from, to] of [['Choose your host.', 'Infer the host.'], ['Keep the configuration.', 'Remove the configuration.'], ['npm ci', 'npm install']]) {
    assert.notEqual(documentationContract(before), documentationContract(before.replace(from, to)));
  }
  assert.notEqual(documentationContract('[Guide](install.md)'), documentationContract('[Guide](other.md)'));
  assert.notEqual(documentationContract('~~~sh\nnode a.mjs\n~~~'), documentationContract('~~~sh\nnode b.mjs\n~~~'));
});

test('only presentation documents skip Studio and packaging checks', () => {
  assert.equal(classifyChanges(['README.md', 'docs/README.ja.md']).full, false);
  assert.equal(classifyChanges(['README.md']).maintainability, false);
  for (const file of [
    'skills/openmotion-director/SKILL.md', 'skills/openmotion-production/references/native.md',
    'install.md', 'docs/install.md', 'docs/npm-installation.md', 'AGENTS.md', 'CLAUDE.md',
    'docs/examples/product-launch.MOTION.md', 'examples/demo/README.md',
    'docs/readme/hero.png', 'library/templates/catalog/demo/guide.md', 'unknown.md',
  ]) assert.equal(classifyChanges(['README.md', file]).full, true, file);
  assert.equal(classifyChanges([]).full, true, 'An unknown diff must retain the full gate');
});

test('code, dependency and analysis configuration changes retain maintainability checks', () => {
  for (const file of ['server.ts', 'studio/src/App.tsx', 'scripts/runtime-assets.mjs',
    'package.json', 'package-lock.json', 'studio/tsconfig.json',
    '.github/maintainability/jscpd.json', '.github/workflows/ci.yml']) {
    assert.equal(classifyChanges([file]).maintainability, true, file);
  }
  assert.equal(classifyChanges(['skills/openmotion-director/SKILL.md']).maintainability, false);
  assert.equal(classifyChanges(['docs/readme/live-product/manifest.json']).maintainability, false);
});

test('documentation checks validate real local references and reject product inputs', async () => {
  await checkDocs(['README.md', 'README.zh-CN.md', 'docs/README.md', 'docs/README.ja.md', 'docs/README.zh-CN.md']);
  await assert.rejects(checkDocs(['install.md']), /Not a presentation document/);
});

test('Git selection covers all push commits, renames, missing history and manual runs', async t => {
  const dir = await mkdtemp(path.join(tmpdir(), 'motion-ci-scope-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const git = (...args) => execFileSync('git', ['-c', 'core.hooksPath=/dev/null', ...args], {
    cwd: dir, encoding: 'utf8', env: { ...process.env, GIT_AUTHOR_NAME: 'Test', GIT_AUTHOR_EMAIL: 'test@example.invalid',
      GIT_COMMITTER_NAME: 'Test', GIT_COMMITTER_EMAIL: 'test@example.invalid' }, stdio: ['pipe', 'pipe', 'pipe'],
  }).trim();
  const commit = () => { git('add', '.'); git('commit', '-m', 'fixture'); return git('rev-parse', 'HEAD'); };
  git('init', '--initial-branch=main');
  await writeFile(path.join(dir, 'README.md'), 'Initial\n');
  const base = commit();
  await writeFile(path.join(dir, 'README.md'), 'Updated\n');
  const docs = commit();
  const script = fileURLToPath(new URL('../.github/scripts/ci-scope.mjs', import.meta.url));
  const select = async (revision, event = 'push') => {
    const output = path.join(dir, '.git', 'ci-output');
    await writeFile(output, '');
    const result = JSON.parse(execFileSync(process.execPath, [script], { cwd: dir, encoding: 'utf8',
      env: { ...process.env, BASE_SHA: revision, GITHUB_EVENT_NAME: event, GITHUB_OUTPUT: output },
    }));
    const emitted = await readFile(output, 'utf8');
    assert(emitted.includes(`full=${result.full}\n`));
    return result;
  };
  assert.equal((await select(base)).full, false);
  assert.equal((await select(base, 'workflow_dispatch')).full, true);
  assert.equal((await select('a'.repeat(40))).full, true);
  await mkdir(path.join(dir, 'skills'));
  await writeFile(path.join(dir, 'skills/SKILL.md'), 'Product guidance\n');
  commit();
  await writeFile(path.join(dir, 'README.md'), 'Another update\n');
  commit();
  assert.equal((await select(docs)).full, true, 'Earlier product changes in a push must not disappear');
  const beforeRename = git('rev-parse', 'HEAD');
  git('mv', 'skills/SKILL.md', 'README.zh-CN.md');
  commit();
  assert.equal((await select(beforeRename)).full, true, 'A rename out of product guidance includes its deletion');
  // PRs compare the actual merge result with its first parent, even if the event base is stale.
  git('checkout', '-b', 'feature');
  await writeFile(path.join(dir, 'README.md'), 'PR copy\n');
  commit();
  git('checkout', 'main');
  git('merge', '--no-ff', 'feature', '-m', 'merge fixture');
  assert.equal((await select(base, 'pull_request')).full, false);
  const beforeInstructions = git('rev-parse', 'HEAD');
  await writeFile(path.join(dir, 'README.md'), 'PR copy\n```sh\nnpm ci\n```\n');
  commit();
  assert.equal((await select(beforeInstructions)).full, true, 'README command changes keep the full gate');
});

test('CI preserves common gates and reuses only the build from the same job', async () => {
  const ci = await readFile(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8');
  const standalone = ci.split('  standalone:\n')[1];
  for (const name of ['Scan tracked source and test release controls without publication credentials', 'Validate manual package selection']) {
    const step = standalone.split(`      - name: ${name}\n`)[1].split('      - name:')[0];
    assert(!step.includes('        if:'), `${name} must run for presentation docs too`);
  }
  for (const name of ['Download full-bundle media explicitly', 'Install rendering test tools',
    'Install locked Motion dependencies', 'Check and build Studio', 'Studio regression',
    'Validate standalone installation and packaging', 'Build phase-one ZIP and exercise all public tools',
    'Build immutable standalone artifacts', 'Generate candidate installation guide', 'Retain candidate installation guide for review']) {
    const step = standalone.split(`      - name: ${name}\n`)[1].split('      - name:')[0];
    assert(step.includes("steps.scope.outputs.full == 'true'"), name);
  }
  assert(standalone.indexOf('npm run build:studio') < standalone.indexOf('scripts/package.ts --mcp-profile=phase1'));
  assert(!standalone.includes('npm run package:phase1'));
  const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
  assert(pkg.scripts['package:phase1'].startsWith('npm run build:studio &&'), 'The public packaging command still builds its input');
});
