import { lstat, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { phase1Skills } from '../shared/workflow.ts';

const root = fileURLToPath(new URL('../', import.meta.url));

// New documentation and developer scripts require an explicit distribution decision.
const motionDesignRemixFiles = [
  'library/skills/motion-design-remix/LICENSE',
  'library/skills/motion-design-remix/NOTICE.md',
  'library/skills/motion-design-remix/SKILL.md',
  'library/skills/motion-design-remix/assets/canopy-part-title/assets/leaf-surface-color.webp',
  'library/skills/motion-design-remix/assets/canopy-part-title/assets/leaf-surface-normal.webp',
  'library/skills/motion-design-remix/assets/canopy-part-title/index.html',
  'library/skills/motion-design-remix/assets/code-3d-extrude/index.html',
  'library/skills/motion-design-remix/assets/code-particle-assemble/index.html',
  'library/skills/motion-design-remix/assets/liquid-glass-widgets/assets/hyperframes-logo-dark.svg',
  'library/skills/motion-design-remix/assets/liquid-glass-widgets/index.html',
  'library/skills/motion-design-remix/assets/liquid-glass-widgets/lib/liquid-glass.iife.js',
  'library/skills/motion-design-remix/assets/ui-3d-reveal/index.html',
  'library/skills/motion-design-remix/assets/wireframe-portal-title/assets/fonts/Geist-Bold.ttf',
  'library/skills/motion-design-remix/assets/wireframe-portal-title/assets/fonts/Geist-OFL.txt',
  'library/skills/motion-design-remix/assets/wireframe-portal-title/assets/fonts/Geist-Regular.ttf',
  'library/skills/motion-design-remix/assets/wireframe-portal-title/assets/fonts/Geist-SemiBold.ttf',
  'library/skills/motion-design-remix/assets/wireframe-portal-title/index.html',
  'library/skills/motion-design-remix/cases.json',
  'library/skills/motion-design-remix/evidence.json',
  'library/skills/motion-design-remix/presets/canopy-part-title.json',
  'library/skills/motion-design-remix/presets/code-3d-extrude.json',
  'library/skills/motion-design-remix/presets/code-particle-assemble.json',
  'library/skills/motion-design-remix/presets/liquid-glass-widgets.json',
  'library/skills/motion-design-remix/presets/ui-3d-reveal.json',
  'library/skills/motion-design-remix/presets/wireframe-portal-title.json',
  'library/skills/motion-design-remix/previews/canopy-part-title.gif',
  'library/skills/motion-design-remix/previews/canopy-part-title.jpg',
  'library/skills/motion-design-remix/previews/canopy-part-title.mp4',
  'library/skills/motion-design-remix/previews/code-3d-extrude.gif',
  'library/skills/motion-design-remix/previews/code-3d-extrude.jpg',
  'library/skills/motion-design-remix/previews/code-3d-extrude.mp4',
  'library/skills/motion-design-remix/previews/code-particle-assemble.gif',
  'library/skills/motion-design-remix/previews/code-particle-assemble.jpg',
  'library/skills/motion-design-remix/previews/code-particle-assemble.mp4',
  'library/skills/motion-design-remix/previews/encoding.json',
  'library/skills/motion-design-remix/previews/liquid-glass-widgets.gif',
  'library/skills/motion-design-remix/previews/liquid-glass-widgets.jpg',
  'library/skills/motion-design-remix/previews/liquid-glass-widgets.mp4',
  'library/skills/motion-design-remix/previews/ui-3d-reveal.gif',
  'library/skills/motion-design-remix/previews/ui-3d-reveal.jpg',
  'library/skills/motion-design-remix/previews/ui-3d-reveal.mp4',
  'library/skills/motion-design-remix/previews/wireframe-portal-title.gif',
  'library/skills/motion-design-remix/previews/wireframe-portal-title.jpg',
  'library/skills/motion-design-remix/previews/wireframe-portal-title.mp4',
  'library/skills/motion-design-remix/references/canopy-part-title/MOTION_DESIGN.md',
  'library/skills/motion-design-remix/references/code-3d-extrude/MOTION_DESIGN.md',
  'library/skills/motion-design-remix/references/code-particle-assemble/MOTION_DESIGN.md',
  'library/skills/motion-design-remix/references/liquid-glass-widgets/MOTION_DESIGN.md',
  'library/skills/motion-design-remix/references/ui-3d-reveal/MOTION_DESIGN.md',
  'library/skills/motion-design-remix/references/wireframe-portal-title/MOTION_DESIGN.md',
  'library/skills/motion-design-remix/scripts/encode-previews.mjs',
  'library/skills/motion-design-remix/scripts/materialize.mjs',
  'library/skills/motion-design-remix/scripts/render-previews.mjs',
  'library/skills/motion-design-remix/sources.json',
];

const presenterStoryFiles = [
  'docs/readme/people/aiwithsachi.gif',
  'docs/readme/people/aiwithsachi.jpg',
  'docs/readme/people/ali-abdaal-workflow-comparison.gif',
  'docs/readme/people/ali-abdaal-workflow-comparison.jpg',
  'docs/readme/people/ali-abdaal-workflow.gif',
  'docs/readme/people/ali-abdaal-workflow.jpg',
  'docs/readme/people/careerwithriya-comparison.gif',
  'docs/readme/people/careerwithriya-comparison.jpg',
  'docs/readme/people/careerwithriya.gif',
  'docs/readme/people/careerwithriya.jpg',
  'docs/readme/people/dan-martell-tools.gif',
  'docs/readme/people/dan-martell-tools.jpg',
  'docs/readme/people/harpercarrollai.gif',
  'docs/readme/people/harpercarrollai.jpg',
  'docs/readme/people/john-tagudin-capso-comparison.gif',
  'docs/readme/people/john-tagudin-capso-comparison.jpg',
  'docs/readme/people/john-tagudin-capso.gif',
  'docs/readme/people/john-tagudin-capso.jpg',
  'docs/readme/people/kevinstratvert.gif',
  'docs/readme/people/kevinstratvert.jpg',
  'docs/readme/people/khris-sheer-founder.gif',
  'docs/readme/people/khris-sheer-founder.jpg',
  'docs/readme/people/manifest.json',
  'docs/readme/people/motiongit-kinetic.gif',
  'docs/readme/people/motiongit-kinetic.jpg',
  'docs/readme/people/ugc-rachelll.gif',
  'docs/readme/people/ugc-rachelll.jpg',
  'library/skills/presenter-story/SKILL.md',
  'library/skills/presenter-story/references/presenter-listicle/MOTION_DESIGN.md',
  'library/skills/presenter-story/references/product-walkthrough/MOTION_DESIGN.md',
  'library/skills/presenter-story/references/workflow-demo/MOTION_DESIGN.md',
];

export const distributionDocuments = [
  'README.md', 'README.zh-CN.md', 'CONTRIBUTING.md', 'CONTRIBUTING.zh-CN.md', 'AGENTS.md', 'CLAUDE.md', 'docs/README.md',
  'docs/product/architecture.md', 'docs/product/changes.md', 'docs/product/media-generation-design.md', 'docs/product/studio-vision.md',
  'docs/agent-adapters.md', 'docs/browser-runtime.md', 'docs/design-system.md', 'docs/editor-fork.md',
  'docs/hyperframes.md', 'docs/mcp-phase1-tools.md', 'docs/model-gateway.md', 'docs/motion-director.md',
  'docs/motion-extension-scope.md', 'docs/npm-installation.md', 'docs/project-workspace.md',
  'docs/repository-migration.md', 'docs/session-architecture.md', 'docs/shared-editor.md',
  'docs/README.zh-CN.md', 'docs/usage.md', 'docs/motion-md.md', 'docs/motion-md.zh-CN.md',
  'docs/collections/README.md', 'docs/collections/README.zh-CN.md',
  'docs/examples/product-launch.MOTION.md', 'docs/examples/product-launch.MOTION.zh-CN.md',
  'docs/readme/ASSETS.md', 'docs/readme/opendesign-symbol.svg',
  'docs/readme/editor.jpg', 'docs/readme/workspace.jpg',
  'docs/product-tour.md',
  'docs/readme/product-tour/codex-embedded.png', 'docs/readme/product-tour/standalone-studio.png',
  'docs/readme/product-tour/claude-code-skills.png', 'docs/readme/product-tour/cli-checks.png',
  'docs/readme/product-tour/connect-agent.png', 'docs/readme/product-tour/template-to-agent.png',
  'docs/media-kit.md', 'docs/readme/cover.png', 'docs/readme/cover-motion.gif', 'docs/readme/social-preview.jpg',
  'docs/readme/library.png', 'docs/readme/community.png', 'docs/readme/collaboration-coming.png',
  'docs/readme/stay-tuned.png', 'docs/readme/stay-tuned-starred.png', 'docs/readme/stay-tuned.gif',
  'docs/examples.md', 'docs/examples.zh-CN.md', 'docs/readme/examples/manifest.json',
  'docs/readme/examples/talking-head.gif', 'docs/readme/examples/talking-head.jpg',
  'docs/readme/examples/story-recut.gif', 'docs/readme/examples/story-recut.jpg',
  'docs/readme/examples/product-launch.gif', 'docs/readme/examples/product-launch.jpg',
  'docs/readme/examples/viral-remix.gif', 'docs/readme/examples/viral-remix.jpg',
  'docs/readme/examples/explainer.gif', 'docs/readme/examples/explainer.jpg',
  'docs/readme/examples/data-story.gif', 'docs/readme/examples/data-story.jpg',
  'docs/readme/examples/music-visual.gif', 'docs/readme/examples/music-visual.jpg',
  'docs/readme/gallery/manifest.json',
  'docs/readme/gallery/app-showcase.gif', 'docs/readme/gallery/firecrawl.gif', 'docs/readme/gallery/ui-3d-reveal.gif',
  'docs/readme/gallery/pond.gif', 'docs/readme/gallery/kimi-k3.gif', 'docs/readme/gallery/elevenlabs-reception.gif',
  'docs/readme/gallery/glass-shard-title.gif', 'docs/readme/gallery/canopy-title.gif', 'docs/readme/gallery/wireframe-title.gif',
  'docs/readme/gallery/iskra-light.gif', 'docs/readme/gallery/liquid-glass-widgets.gif', 'docs/readme/gallery/cyera.gif',
  'docs/readme/gallery/code-3d.gif', 'docs/readme/gallery/glyph.gif', 'docs/readme/gallery/flight-map.gif',
  'docs/readme/gallery/aurora.gif', 'docs/readme/gallery/linear-loops.gif', 'docs/readme/gallery/code-particles.gif',
  'library/README.md', 'library/README.zh-CN.md', 'library/ENTRY_TEMPLATE.md',
  'library/skills/brandkit/SKILL.md', 'library/templates/README.md',
  'library/components/README.md', 'library/components/title-reveal/README.md',
  'library/design-systems/ink-water/MOTION_DESIGN.md', 'library/brandkits/openmotion/BRANDKIT.md',
  'docs/motion-design-examples.md', 'docs/motion-design-examples.zh-CN.md', ...motionDesignRemixFiles, ...presenterStoryFiles,
  'docs/skills.md', 'docs/template-catalog.md', 'docs/test-packages.md', 'docs/templates/requirement.md',
];

export async function distributionFiles(profile: string): Promise<string[]> {
  if (!['phase1', 'legacy'].includes(profile)) throw new Error('Unknown distribution profile: ' + profile);
  const files = [
    ...distributionDocuments, 'LICENSE', '.codex-plugin/plugin.json', '.mcp.json', 'marketplace.example.json',
    'package.json', 'package-lock.json',
    'server.ts', 'browser.ts', 'workspace.ts', 'mcp.ts', 'mcp-tools.ts', 'editor-runtime.ts',
    'phase1.ts', 'phase1-versions.ts', 'preview.ts', 'hyperframes.ts', 'template-library.ts',
    'template-catalog.ts', 'editor-server.ts',
    'scripts/runtime-assets.mjs', 'scripts/npm-runtime.mjs', 'scripts/runtime-lock.json',
    'scripts/verify-export.ts', 'scripts/export-adapters.ts', 'scripts/package.ts', 'scripts/distribution.ts',
    'shared/workflow-entry.js', 'studio/LICENSE', 'studio/README.md', 'template-library/LICENSE', 'shared/editor-launch.pl',
  ];
  async function walk(directory: string, extensions: RegExp) {
    for (const entry of await readdir(path.join(root, directory), { withFileTypes: true })) {
      if (entry.name.startsWith('.') || ['node_modules', 'tests', '__tests__'].includes(entry.name)) continue;
      const file = directory + '/' + entry.name;
      if (entry.isSymbolicLink()) throw new Error('Distribution must not follow symlinks: ' + file);
      if (entry.isDirectory()) await walk(file, extensions);
      else if (entry.isFile() && !/\.(?:test|spec)\./.test(entry.name) && extensions.test(entry.name)) files.push(file);
    }
  }
  for (const directory of ['shared', 'gateway']) await walk(directory, /\.(?:ts|mjs|json)$/);
  await walk('web', /\.(?:ts|js|json|html|css|svg|jpg|png|webp|ttf|woff2?|txt)$/);
  for (const directory of ['templates', 'template-library']) await walk(directory, /\.(?:html|js|json|css|svg|jpg|png|webp|md|txt)$/);
  for (const skill of phase1Skills) await walk('skills/' + skill, /\.(?:md|mjs|ts|py|json)$/);
  await walk('studio/build', /\.(?:html|js|css|json|svg|png|jpg|webp|woff2?|ttf|txt)$/);
  await walk('studio/public', /\.(?:html|js|css|json|svg|png|jpg|webp|woff2?|ttf|txt)$/);
  for (const file of files) if (!(await lstat(path.join(root, file))).isFile()) throw new Error('Distribution requires a regular file: ' + file);
  return [...new Set(files)].sort();
}
