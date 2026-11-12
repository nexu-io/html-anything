---
name: presenter-story
description: Compatibility alias for openmotion-presenter-story in OpenMotion. Use openmotion-presenter-story for new work.
disable-model-invocation: true
---

# OpenMotion compatibility entry

For this explicit invocation, read [openmotion-presenter-story](../openmotion-presenter-story/SKILL.md) and continue the current task. Resolve its references and run its commands from the canonical Skill folder. This entry adds no creative or production steps.

If a single-folder installer copied only this alias, install its matching canonical dependency before continuing:

```sh
npx skills add https://github.com/nexu-io/openmotion/tree/af755bcdd7f8af257186ff8723aedf78b176577a/library/skills --skill openmotion-presenter-story
```

Choose the same host and installation scope as this alias. Read the installed `openmotion-presenter-story/SKILL.md` and continue this invocation without asking the user to repeat their request. The immutable source above contains the matching workflow and resources. When installing from a checkout or full plugin package, `node scripts/install-library-skill.mjs presenter-story <destination-skills-directory>` installs both entries together without duplicating resources.
