import { skillAliases } from './public-names.mjs';
import { createHash } from 'node:crypto';
import { readFile, realpath } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
export { workflowEntryGuide } from './workflow-entry.js';

export const workflowRegistry = {
  production: {
    status: 'ready',
    sections: {
      start: 'skills/openmotion-production/SKILL.md',
      intake: 'skills/openmotion-production/references/intake.md',
      templates: 'skills/openmotion-production/references/templates.md',
      production: 'skills/openmotion-production/references/production.md',
      verification: 'skills/openmotion-production/references/verification.md',
      context: 'skills/openmotion-production/references/context.md',
      native: 'skills/openmotion-production/references/native.md',
      edit: 'skills/openmotion-production/references/edit.md',
      portable: 'skills/openmotion-production/references/portable-project.md',
      materials: 'skills/openmotion-production/references/materials.md',
      fal: 'skills/openmotion-production/references/media-providers/fal.md',
      opendesign: 'skills/openmotion-production/references/media-providers/opendesign.md',
      atlascloud: 'skills/openmotion-production/references/media-providers/atlascloud.md',
      wavespeed: 'skills/openmotion-production/references/media-providers/wavespeed.md',
    },
  },
  director: {
    status: 'ready',
    sections: {
      start: 'skills/openmotion-director/SKILL.md',
      actions: 'skills/openmotion-director/references/action-script.md',
      craft: 'skills/openmotion-director/references/motion-craft.md',
      phrases: 'skills/openmotion-director/references/motion-phrases.md',
      decisions: 'skills/openmotion-director/references/production-decisions.md',
      sound: 'skills/openmotion-director/references/sound-narrative.md',
      review: 'skills/openmotion-director/references/motion-review.md',
      examples: 'skills/openmotion-director/references/examples.md',
    },
  },
  template: { status: 'ready', sections: { start: 'skills/openmotion-template-to-video/SKILL.md' } },
  recreate: {
    status: 'ready',
    sections: {
      start: 'skills/openmotion-recreate/SKILL.md',
      rebuild: 'skills/openmotion-recreate/references/rebuild.md',
      verification: 'skills/openmotion-recreate/references/verify.md',
    },
  },
  'video-to-template': {
    status: 'ready',
    sections: {
      start: 'skills/openmotion-video-to-template/SKILL.md',
      measure: 'skills/openmotion-video-to-template/references/measure.md',
      rebuild: 'skills/openmotion-video-to-template/references/rebuild.md',
      project: 'skills/openmotion-production/references/portable-project.md',
      verification: 'skills/openmotion-video-to-template/references/verify.md',
      sources: 'skills/openmotion-video-to-template/references/rule-sources.md',
    },
  },
} as const;

// Keep the original production section export and getWorkflow(section) API.
export const workflowFiles = workflowRegistry.production.sections;
export const workflowNames = Object.keys(workflowRegistry);
export const workflowSections = [...new Set(Object.values(workflowRegistry).flatMap(workflow => Object.keys(workflow.sections)))];
export const phase1WorkflowNames = ['production', 'director', 'template', 'recreate', 'video-to-template'];
export const phase1Skills = ['openmotion-production', 'openmotion-director', 'openmotion-template-to-video', 'openmotion-recreate', 'openmotion-video-to-template'];
export const compatibilitySkills = Object.keys(skillAliases).filter(name => phase1Skills.includes(skillAliases[name as keyof typeof skillAliases]));
export const packagedSkills = [...phase1Skills, ...compatibilitySkills];
export function workflowResources() {
  return Object.entries(workflowRegistry).filter(([name]) => phase1WorkflowNames.includes(name)).flatMap(([workflow, definition]) => Object.keys(definition.sections).map(section => ({
    uri: `openmotion://workflow/${workflow}/${section}`, name: `${workflow}/${section}`, title: `OpenMotion · ${workflow}/${section}`, mimeType: 'application/json',
  }))).concat([{ uri: 'openmotion://engine/SKILL.md', name: 'Hyperframes pinned authoring guide', title: 'OpenMotion · Hyperframes authoring guide', mimeType: 'text/markdown' }]);
}
export async function readWorkflowResource(uri: unknown, dataDirectory: string) {
  if (typeof uri !== 'string') throw new Error('INVALID_RESOURCE_URI');
  const match = /^(?:openmotion|motion):\/\/workflow\/([a-z]+(?:-[a-z]+)*)\/([a-z]+)$/.exec(uri);
  if (match && phase1WorkflowNames.includes(match[1])) return { uri, mimeType: 'application/json', text: JSON.stringify({ ...await getWorkflow(match[2], match[1]), workflows: phase1WorkflowNames }) };
  const engine = /^(?:openmotion|motion):\/\/engine\/([a-zA-Z0-9_/-]+\.md)$/.exec(uri);
  if (!engine) throw new Error('INVALID_RESOURCE_URI');
  const { ensureRuntime } = await import('../hyperframes.ts');
  const root = await realpath(path.join(await ensureRuntime(dataDirectory, false), 'node_modules/hyperframes/dist/skills/hyperframes'));
  const file = await realpath(path.join(root, engine[1]));
  if (!file.startsWith(root + path.sep)) throw new Error('INVALID_RESOURCE_URI');
  return { uri, mimeType: 'text/markdown', text: await readFile(file, 'utf8') };
}

const documents = new Map<string, { workflow: string; section: string; documentId: string }>();
for (const [workflow, definition] of Object.entries(workflowRegistry)) for (const [section, documentId] of Object.entries(definition.sections)) {
  if (!documents.has(documentId)) documents.set(documentId, { workflow, section, documentId });
}

/** Resolve packaged Markdown links through the registry, never through a caller-supplied path. */
export function workflowReferences(content: string, documentId: string) {
  if (!documents.has(documentId)) throw new Error('Unknown workflow document: ' + documentId);
  const references = new Map<string, { workflow: string; section: string; documentId: string }>();
  // Inline links and reference-link definitions; ignore fenced examples and inline code.
  const prose = content.replace(/^ {0,3}(`{3,}|~{3,})[^\n]*\n[\s\S]*?^ {0,3}\1[^\n]*(?:\n|$)/gm, '').replace(/(`+)[^\n]*?\1/g, '');
  const links = [
    ...prose.matchAll(/\]\(\s*(?:<([^>]+)>|([^\s)]+))(?:\s+[^)]*)?\)/g),
    ...prose.matchAll(/^ {0,3}\[[^\]]+\]:\s*(?:<([^>]+)>|(\S+))/gm),
  ];
  for (const link of links) {
    const href = link[1] ?? link[2];
    if (/^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(href)) continue;
    const target = decodeURIComponent(href.split(/[?#]/, 1)[0]);
    if (!/\.md$/i.test(target)) continue;
    const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(documentId), target));
    const reference = !target.startsWith('/') && !target.includes('\\') ? documents.get(resolved) : undefined;
    if (!reference) throw new Error(`Unregistered workflow Markdown link in ${documentId}: ${href}`);
    references.set(reference.documentId, reference);
  }
  return [...references.values()];
}

export async function getWorkflow(section: unknown = 'start', workflow: unknown = 'production') {
  if (typeof workflow !== 'string' || !Object.hasOwn(workflowRegistry, workflow)) {
    throw new Error('Unknown workflow. Use ' + workflowNames.join(', ') + '.');
  }
  const definition = workflowRegistry[workflow as keyof typeof workflowRegistry];
  const files: Record<string, string> = definition.sections;
  if (typeof section !== 'string' || !Object.hasOwn(files, section)) {
    throw new Error(`Unknown workflow section for ${workflow}. Use ${Object.keys(files).join(', ')}.`);
  }
  const documentId = files[section];
  const url = new URL('../' + documentId, import.meta.url);
  const content = await readFile(url, 'utf8');
  return {
    workflow, section, status: definition.status, documentId,
    contentHash: createHash('sha256').update(content).digest('hex'),
    content, path: fileURLToPath(url), sections: Object.keys(files), workflows: workflowNames,
    references: workflowReferences(content, documentId),
    readNext: 'Use production/context for required dependencies; changes to existing content also use production/edit. Reuse complete bodies still available. Read missing instructions and target sources in a read-only call that finishes and returns to the model before a later call performs dependent template application, imports, writes or export. Sequential read/write operations inside one outer tool call do not satisfy this boundary. Check actual returned output for truncation; split long reads as needed. Record documentId/contentHash only after complete return. Reload only missing, truncated or changed content, not merely for a new turn. Do not restart routing or repeat completed operations. Guidance is not execution or verification evidence.',
  };
}
