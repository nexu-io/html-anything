# @odsuite/guard

Directory and file engineering policies, consumed through `odsuite guard` from `@odsuite/cli`.
This package exports the checking API and has no executable.

```js
import { guard } from "@odsuite/guard";

const report = await guard({ root: process.cwd() });
console.log(report.ok, report.findings);
```

Reads `<repo>/odsuite.yaml`. Defaults enforce source/test layout, module depth 5, width 8, 500 source lines, style isolation, Vitest/TypeScript/Biome declarations and exact dependency versions.

The scan includes empty directories, does not traverse symlinks, and reports exclusions and links. It does not run tests, compile code, execute repository configuration or prove runtime behavior.

This is a private in-repository suite, consumed through workspace:*; it has no registry release step. Current four-axis layout and bounded repository rules are documented in [AGENTS](../../AGENTS.md) and [odsuite.yaml](../../odsuite.yaml).
