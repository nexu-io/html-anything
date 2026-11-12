import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm, readFile, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { resolveInstalled } from '../scripts/resolve-installed.mjs';

test('installation onboarding routes only to existing Skills', async () => {
  const script = await readFile(new URL('../scripts/install-motion.command', import.meta.url), 'utf8');
  assert.match(script, /scripts\/install-onboarding\.mjs/);
  const contract = await readFile(new URL('../docs/install.md', import.meta.url), 'utf8');
  assert.match(contract, /After acceptance, use openmotion-template-to-video/);
  await access(new URL('../skills/openmotion-template-to-video/SKILL.md', import.meta.url));
  const guide = new URL('../docs/usage.md', import.meta.url);
  const guideText = await readFile(guide, 'utf8');
  assert.match(guideText, /install\.md#installation-success-reply/);
  const canonical = new URL('../skills/openmotion-template-to-video/SKILL.md', import.meta.url);
  for (const [url, body] of [
    ...await Promise.all(['../README.md', '../docs/README.zh-CN.md'].map(async file => {
      const url = new URL(file, import.meta.url);
      return [url, await readFile(url, 'utf8')] as const;
    }))
  ] as const) {
    const links = [...body.matchAll(/\]\(((?:\.\.\/)?skills\/[^)]+\/SKILL\.md)\)/g)]
      .map(([, link]) => new URL(link, url));
    assert.ok(links.some(link => link.href === canonical.href), `Missing template onboarding in ${url.pathname}`);
    for (const link of links) await access(link);
  }
  for (const [, skillPath] of guideText.matchAll(/\]\((\.\.\/skills\/[^)]+)\)/g)) {
    await access(new URL(skillPath.split('#')[0], guide));
  }
});

test('preview resolves versioned cache and compatible local cache without changing user configuration', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'motion-install-'));
  try {
    const project = path.join(root, 'project'); const codex = path.join(root, 'codex');
    const manifest = JSON.stringify({ name: 'motion', version: '0.2.0' });
    await mkdir(path.join(project, '.codex-plugin'), { recursive: true });
    await writeFile(path.join(project, '.codex-plugin/plugin.json'), manifest);
    const local = path.join(codex, 'plugins/cache/motion-local/motion/local');
    const versioned = path.join(codex, 'plugins/cache/motion-local/motion/0.2.0');
    for (const directory of [local, versioned]) {
      await mkdir(path.join(directory, '.codex-plugin'), { recursive: true });
      await writeFile(path.join(directory, '.codex-plugin/plugin.json'), manifest);
      await writeFile(path.join(directory, 'server.ts'), '');
    }
    assert.equal(resolveInstalled(project, codex), versioned);
    await rm(versioned, { recursive: true }); assert.equal(resolveInstalled(project, codex), local);
    await writeFile(path.join(local, '.codex-plugin/plugin.json'), JSON.stringify({ name: 'motion', version: '0.1.0' }));
    assert.throws(() => resolveInstalled(project, codex), /未找到 OpenMotion 0.2.0/);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('source and complete installers register the canonical plugin and caches prefer it over legacy entries', async () => {
  for (const file of ['scripts/bundle/install.command', 'scripts/bundle/install.ps1']) {
    const script = await readFile(new URL('../' + file, import.meta.url), 'utf8');
    assert.match(script, /openmotion@openmotion-test/);
    assert.doesNotMatch(script, /(?:^|\s)motion@/m);
  }
  const script = await readFile(new URL('../scripts/install-motion.command', import.meta.url), 'utf8');
  assert.match(script, /plugin add openmotion@openmotion-local/);
  const root = await mkdtemp(path.join(tmpdir(), 'openmotion-cache-'));
  try {
    const project = path.join(root, 'project'), codex = path.join(root, 'codex');
    await mkdir(path.join(project, '.codex-plugin'), { recursive: true });
    await writeFile(path.join(project, '.codex-plugin/plugin.json'), JSON.stringify({ name: 'openmotion', version: '0.2.0' }));
    for (const [cache, name] of [['motion-local/motion', 'motion'], ['openmotion-local/openmotion', 'openmotion']]) {
      const directory = path.join(codex, 'plugins/cache', cache, '0.2.0');
      await mkdir(path.join(directory, '.codex-plugin'), { recursive: true });
      await writeFile(path.join(directory, '.codex-plugin/plugin.json'), JSON.stringify({ name, version: '0.2.0' }));
      await writeFile(path.join(directory, 'server.ts'), '');
    }
    assert.equal(resolveInstalled(project, codex), path.join(codex, 'plugins/cache/openmotion-local/openmotion/0.2.0'));
  } finally { await rm(root, { recursive: true, force: true }); }
});
