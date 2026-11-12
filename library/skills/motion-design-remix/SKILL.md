---
name: motion-design-remix
description: Compatibility alias for openmotion-design-remix in OpenMotion. Use openmotion-design-remix for new work.
disable-model-invocation: true
---

# OpenMotion compatibility entry

For this explicit invocation, read [openmotion-design-remix](../openmotion-design-remix/SKILL.md) and continue the current task. Resolve its references and run its commands from the canonical Skill folder. This entry adds no creative or production steps.

If a single-folder installer copied only this alias, install its matching canonical dependency before continuing:

```sh
npx skills add https://github.com/nexu-io/openmotion/tree/af755bcdd7f8af257186ff8723aedf78b176577a/library/skills --skill openmotion-design-remix
```

Choose the same host and installation scope as this alias. Read the installed `openmotion-design-remix/SKILL.md` and continue this invocation without asking the user to repeat their request. The immutable source above contains the matching workflow and resources. When installing from a checkout or full plugin package, `node scripts/install-library-skill.mjs motion-design-remix <destination-skills-directory>` installs both entries together without duplicating resources.
