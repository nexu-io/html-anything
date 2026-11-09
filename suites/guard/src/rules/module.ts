import { rule } from "../config/match.js";
import { json } from "../scan/modules.js";
import type { Context, Finding, Module } from "../types.js";
import { vitest } from "./vitest.js";

function path(module: Module, file: string): string {
  return module.path === "." ? file : `${module.path}/${file}`;
}

function dependencies(module: Module): Record<string, unknown> {
  return { ...(module.manifest.dependencies as object), ...(module.manifest.devDependencies as object) };
}

export async function moduleRules(context: Context): Promise<Finding[]> {
  const findings: Finding[] = [];
  const present = new Map(context.entries.map((entry) => [entry.path, entry.kind]));
  const root = context.modules.find((module) => module.path === ".");
  const rootDependencies = root ? dependencies(root) : {};
  for (const module of context.modules) {
    const manifest = path(module, "package.json");
    if (rule(context.policy, manifest, "dependency.version").enabled) findings.push(...versions(context, module));
    if (module.aggregate || (module.path === "." && context.modules.length > 1)) continue;
    if (rule(context.policy, manifest, "module.layout").enabled) {
      if (present.get(manifest) !== "file")
        findings.push({ path: manifest, rule: "module.layout", message: "workspace module requires package.json" });
      for (const name of ["src", "tests"]) {
        if (present.get(path(module, name)) !== "directory")
          findings.push({ path: path(module, name), rule: "module.layout", message: `module requires ${name}/` });
      }
    }
    if (rule(context.policy, manifest, "module.typescript").enabled) {
      for (const name of ["tsconfig.json", "tsconfig.tests.json"]) {
        const location = path(module, name);
        if (present.get(location) !== "file") {
          findings.push({
            path: location,
            rule: "module.typescript",
            message: "module requires independent source and test TypeScript configs",
          });
          continue;
        }
        findings.push(...typescript(location, name, await json(context.root, location)));
      }
      const version = dependencies(module).typescript ?? rootDependencies.typescript;
      if (typeof version !== "string" || !/^7\.\d+\.\d+$/.test(version))
        findings.push({
          path: manifest,
          rule: "module.typescript",
          message: "module requires an exact TypeScript 7 version",
        });
    }
    if (rule(context.policy, manifest, "module.vitest").enabled) {
      findings.push(...(await vitest(context, module)));
      const version = dependencies(module).vitest ?? rootDependencies.vitest;
      const scripts = module.manifest.scripts as Record<string, unknown> | undefined;
      if (
        typeof version !== "string" ||
        !/^\d+\.\d+\.\d+$/.test(version) ||
        typeof scripts?.test !== "string" ||
        !/^vitest run(?:\s|$)/.test(scripts.test)
      ) {
        findings.push({
          path: manifest,
          rule: "module.vitest",
          message: "module requires Vitest and a vitest run test script",
        });
      }
    }
  }
  if (rule(context.policy, "package.json", "repository.biome").enabled && root) {
    if (
      typeof rootDependencies["@biomejs/biome"] !== "string" ||
      (!present.has("biome.json") && !present.has("biome.jsonc"))
    ) {
      findings.push({
        path: "package.json",
        rule: "repository.biome",
        message: "repository requires Biome and biome.json or biome.jsonc",
      });
    }
  }
  return findings;
}

function typescript(location: string, name: string, value: Record<string, unknown>): Finding[] {
  const options = value.compilerOptions as Record<string, unknown> | undefined;
  const include = value.include;
  const findings: Finding[] = [];
  if (
    !Array.isArray(include) ||
    !include.some(
      (item) =>
        typeof item === "string" &&
        [
          name === "tsconfig.json" ? "src" : "tests",
          name === "tsconfig.json" ? "src/**" : "tests/**",
          name === "tsconfig.json" ? "src/**/*.ts" : "tests/**/*.test.ts",
        ].includes(item),
    )
  )
    findings.push({
      path: location,
      rule: "module.typescript",
      message: "config must explicitly include its source or test tree",
    });
  if (name === "tsconfig.tests.json") {
    const paths = options?.paths as Record<string, unknown> | undefined;
    if (!Array.isArray(paths?.["@"]) || paths["@"].length !== 1 || !["src", "./src"].includes(String(paths["@"][0])))
      findings.push({ path: location, rule: "module.typescript", message: "test config must declare @ -> ./src" });
    if (value.extends !== "./tsconfig.json")
      findings.push({ path: location, rule: "module.typescript", message: "test config must extend ./tsconfig.json" });
  }
  return findings;
}

function versions(context: Context, module: Module): Finding[] {
  const findings: Finding[] = [];
  const names = new Set(context.modules.map((item) => item.name));
  for (const section of ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"]) {
    const values = module.manifest[section];
    if (values === undefined) continue;
    if (!values || typeof values !== "object" || Array.isArray(values))
      throw new Error(`${path(module, "package.json")}.${section} must be an object`);
    for (const [name, value] of Object.entries(values)) {
      if (
        typeof value !== "string" ||
        (names.has(name) ? value !== "workspace:*" : !/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(value))
      ) {
        findings.push({
          path: path(module, "package.json"),
          rule: "dependency.version",
          message: `${section}.${name} must use ${names.has(name) ? "workspace:*" : "an exact x.y.z version"}`,
        });
      }
    }
  }
  return findings;
}
