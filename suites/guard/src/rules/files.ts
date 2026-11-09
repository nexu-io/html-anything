import { basename, extname } from "node:path";
import { sources } from "../config/defaults.js";
import { rule } from "../config/match.js";
import { owner } from "../scan/modules.js";
import type { Context, Finding } from "../types.js";

export function file(context: Context, path: string, content?: string): Finding[] {
  const findings: Finding[] = [];
  const extension = extname(path).slice(1);
  const name = basename(path);
  if (
    rule(context.policy, path, "file.name").enabled &&
    !context.policy.names.includes(name) &&
    !/^[a-z][a-z0-9]*(?:\.(?:config|test|tests|d))?(?:\.[a-z0-9]+)?$/.test(name)
  ) {
    findings.push({
      path,
      rule: "file.name",
      message: "source name must be one lowercase word with an optional role suffix",
    });
  }
  if (!sources.has(extension)) return findings;
  const limit = rule(context.policy, path, "file.lines");
  if (content !== undefined && limit.enabled) {
    const rows = content ? content.split(/\r\n|\n|\r/).length - Number(/(?:\r\n|\n|\r)$/.test(content)) : 0;
    if (limit.max !== undefined && rows > limit.max)
      findings.push({ path, rule: "file.lines", message: `${rows} physical lines exceeds ${limit.max}` });
  }
  const module = owner(path, context.modules);
  if (module && rule(context.policy, path, "file.test").enabled) {
    const relative = module.path === "." ? path : path.slice(module.path.length + 1);
    const test = /\.(?:test|spec)\./.test(name);
    if ((relative.startsWith("tests/") && !relative.endsWith(".test.ts")) || (test && !relative.startsWith("tests/"))) {
      findings.push({ path, rule: "file.test", message: "tests must live under tests/**/*.test.ts" });
    }
  }
  if (module && rule(context.policy, path, "module.layout").enabled) {
    const relative = module.path === "." ? path : path.slice(module.path.length + 1);
    const configured = !relative.includes("/") && /^[a-z]+\.config\.[cm]?[jt]s$/.test(name);
    if (!relative.startsWith("src/") && !relative.startsWith("tests/") && !configured) {
      findings.push({
        path,
        rule: "module.layout",
        message: "module source belongs in src/ or tests/; only root tool configs are allowed outside",
      });
    }
  }
  return findings;
}
