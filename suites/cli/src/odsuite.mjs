#!/usr/bin/env node
import { run } from "../dist/index.mjs";

process.exitCode = await run(process.argv.slice(2), process.cwd(), {
  stdout: (value) => process.stdout.write(value),
  stderr: (value) => process.stderr.write(value),
});
