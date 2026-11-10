import { createHash } from "node:crypto";
import { posix } from "node:path";
import { Fault } from "@open-motion/workspace/contract";
import { craft } from "./guidance/craft.js";
import { planning } from "./guidance/planning.js";
import { reconstruction } from "./guidance/reconstruction.js";
import { review } from "./guidance/review.js";
import { routes } from "./guidance/routes.js";
import { technical } from "./guidance/technical.js";

export const instructions =
  "OpenMotion shares native projects between people and Agents. Read open-motion://guidance/context and the relevant complete versioned bodies before dependent operations, reusing retained bodies by documentId/contentHash. Route determined local edits to production, new concepts/motion/sound design to director, editable templates to template, a finished reference to recreate, and a requested reusable template to videotemplate. Keep actual workspace ownership/revisions and stable request identities; preserve current user presentation/background preferences. Source saves, host display, technical film checks and creative acceptance are distinct evidence. Current tools do not imply reference-video acquisition, provider generation, arbitrary media import or portable packaging. Discover actual tools and host capabilities; never fabricate execution, launch another service, assume legacy endpoints or steal chat/desktop focus.";

const bodies = { ...technical, ...routes, ...planning, ...craft, ...review, ...reconstruction };
type Id = keyof typeof bodies;
const sourceCommit = "03d6df8615a2cb87727241406b9671c184ff497a";
const uri = (id: string) => `open-motion://guidance/${id}`;
const hash = (content: string) => `sha256:${createHash("sha256").update(content).digest("hex")}`;

export const guidanceSkills = [
  {
    name: "motion-production",
    entry: "production",
    description:
      "Continue an existing editable OpenMotion project using established creative decisions: local content or chosen-media changes, preview, technical repair, export and handoff. New narrative/motion/sound design uses motion-director; selected templates, reference reconstruction and reusable templates have their own routes.",
  },
  {
    name: "motion-director",
    entry: "director",
    description:
      "Direct original motion concepts, dynamic narrative, movement and sound design, major restructuring or creative review. Local creative work stays scoped; locked picture permits sound-only design. Determined engineering edits use motion-production.",
  },
  {
    name: "motion-template-to-video",
    entry: "template",
    description:
      "Use an actual editable template or selected catalog source for an unchanged starter or content/brand/material adaptation while preserving agreed structure and motion. Includes an explicitly accepted first experience. Video-only references and reusable-template creation use their own routes.",
  },
  {
    name: "motion-recreate",
    entry: "recreate",
    description:
      "Rebuild a finished reference motion video as this user's editable film, including changes when editable source is absent. Inspect actual reference and user material; preserve scope and compare observed results. Loose inspiration, existing templates and reusable-template packages use their own routes.",
  },
  {
    name: "motion-video-to-template",
    entry: "videotemplate",
    description:
      "Rebuild a reference motion video as a reusable editable native template with source, permitted dependencies and requested preview/package evidence. Keep faithful reconstruction distinct from later adaptation; report unavailable reference analysis, media or packaging capabilities honestly.",
  },
] as const;

type Skill = (typeof guidanceSkills)[number]["name"];
const owner: Record<Id, [Skill, string]> = {
  production: ["motion-production", "SKILL.md"],
  native: ["motion-production", "references/native.md"],
  templates: ["motion-production", "references/templates.md"],
  verification: ["motion-production", "references/verification.md"],
  context: ["motion-production", "references/context.md"],
  edit: ["motion-production", "references/edit.md"],
  intake: ["motion-production", "references/intake.md"],
  portable: ["motion-production", "references/portable-project.md"],
  director: ["motion-director", "SKILL.md"],
  actionscript: ["motion-director", "references/action-script.md"],
  craft: ["motion-director", "references/motion-craft.md"],
  phrases: ["motion-director", "references/motion-phrases.md"],
  examples: ["motion-director", "references/examples.md"],
  decisions: ["motion-director", "references/production-decisions.md"],
  sound: ["motion-director", "references/sound-narrative.md"],
  review: ["motion-director", "references/motion-review.md"],
  template: ["motion-template-to-video", "SKILL.md"],
  recreate: ["motion-recreate", "SKILL.md"],
  rebuild: ["motion-recreate", "references/rebuild.md"],
  recreateverify: ["motion-recreate", "references/verify.md"],
  videotemplate: ["motion-video-to-template", "SKILL.md"],
  measure: ["motion-video-to-template", "references/measure.md"],
  videorebuild: ["motion-video-to-template", "references/rebuild.md"],
  rules: ["motion-video-to-template", "references/rule-sources.md"],
  videoverify: ["motion-video-to-template", "references/verify.md"],
};
const file = (id: Id) => posix.join(...owner[id]);
const ids = Object.keys(bodies) as Id[];
function references(content: string) {
  return [...new Set(content.match(/open-motion:\/\/guidance\/[a-z]+/g) ?? [])];
}
for (const id of ids) {
  for (const reference of references(bodies[id]))
    if (!ids.some((candidate) => uri(candidate) === reference)) throw Error("guidance reference is not registered");
}
export function listGuidance() {
  return ids.map((id) => ({
    uri: uri(id),
    name: id,
    mimeType: "application/json",
    contentHash: hash(bodies[id]),
  }));
}
export function readGuidance(value: string) {
  const id = ids.find((candidate) => uri(candidate) === value);
  if (!id) throw new Fault("missing", "guidance document is not registered");
  const content = bodies[id];
  return {
    documentId: value,
    contentHash: hash(content),
    content,
    references: references(content),
    source: {
      commit: sourceCommit,
      paths: [
        `skills/${file(id)}`,
        ...(id === "production" ? ["skills/motion-production/references/production.md"] : []),
      ],
    },
  };
}

/** Build-only projection: callers receive finite files, never a reader or an arbitrary path resolver. */
export function localGuidance() {
  const files: { path: string; content: string }[] = [];
  const documents = ids.map((id) => {
    const document = readGuidance(uri(id)),
      path = file(id),
      body = document.content.replace(/open-motion:\/\/guidance\/[a-z]+/g, (reference) => {
        const target = ids.find((candidate) => uri(candidate) === reference);
        if (!target) throw Error("guidance reference is not registered");
        return posix.relative(posix.dirname(path), file(target));
      }),
      skill = guidanceSkills.find((entry) => entry.entry === id),
      content = skill
        ? `---\nname: ${skill.name}\ndescription: ${JSON.stringify(skill.description)}\n---\n\n${body}`
        : body;
    files.push({ path: `skills/${path}`, content });
    return {
      documentId: document.documentId,
      contentHash: document.contentHash,
      localContentHash: hash(content),
      path,
      references: document.references,
      source: document.source,
    };
  });
  files.push({
    path: "skills/manifest.json",
    content: `${JSON.stringify({ schema: 1, skills: guidanceSkills, documents }, null, 2)}\n`,
  });
  return files;
}
