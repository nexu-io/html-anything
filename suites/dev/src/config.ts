import { access, readFile, realpath } from "node:fs/promises";
import { dirname, isAbsolute, join, resolve, sep } from "node:path";
import { type FactoryScope, factoryScope } from "@odsuite/protocol";
import { formatReleaseVersion, parseReleaseVersion } from "@odsuite/release";
import { scopedManagerRoot } from "@odsuite/sidecar";
import { parse } from "yaml";
import type { Plan } from "./types.js";
export async function repository(cwd: string, explicit?: string): Promise<string> {
  let root = await realpath(resolve(cwd, explicit ?? "."));
  for (;;) {
    try {
      await Promise.all([access(join(root, "package.json")), access(join(root, "pnpm-workspace.yaml"))]);
      return root;
    } catch {
      if (explicit || dirname(root) === root) throw new Error("dev requires a workspace root");
      root = dirname(root);
    }
  }
}
export function managerRoot(repo: string, scope: FactoryScope) {
  scope = factoryScope(scope);
  return scopedManagerRoot(join(repo, ".state", "dev"), scope);
}
export async function plan(options: {
  repo: string;
  scope: FactoryScope;
  carrier: string;
  watch?: boolean;
  headless?: boolean;
}): Promise<Plan> {
  const scope = factoryScope(options.scope),
    repo = await realpath(options.repo);
  if (!/^[a-z][a-z0-9]*$/.test(options.carrier)) throw new Error("invalid carrier");
  const config = parse(await readFile(join(repo, "odsuite.yaml"), "utf8"));
  const dev = config?.dev;
  if (
    config?.schemaVersion !== 1 ||
    !dev ||
    typeof dev !== "object" ||
    Object.keys(dev).some((k) => !["carriers", "channels"].includes(k))
  )
    throw new Error("invalid dev configuration");
  const declared = dev.carriers?.[options.carrier];
  if (
    !declared ||
    typeof declared !== "object" ||
    Object.keys(declared).some((k) => !["entry", "unsupported"].includes(k))
  )
    throw new Error("carrier is not declared for development");
  if (typeof declared.unsupported === "string")
    throw new Error(`carrier ${options.carrier} is unsupported: ${declared.unsupported}`);
  if (
    typeof declared.entry !== "string" ||
    isAbsolute(declared.entry) ||
    !declared.entry.startsWith(`carriers/${options.carrier}/`) ||
    !declared.entry.endsWith(".mjs")
  )
    throw new Error("invalid carrier dev adapter");
  const entry = resolve(repo, declared.entry);
  if (!entry.startsWith(join(repo, "carriers", options.carrier) + sep))
    throw new Error("carrier adapter escapes its module");
  const product = JSON.parse(await readFile(join(repo, "package.json"), "utf8"));
  const base = parseReleaseVersion(product.version).baseVersion;
  const channel = dev.channels?.[scope.channel];
  if (
    channel !== undefined &&
    (!channel ||
      typeof channel !== "object" ||
      Array.isArray(channel) ||
      Object.keys(channel).some((k) => k !== "number"))
  )
    throw new Error("invalid dev channel declaration");
  if (scope.channel === "stable" && channel?.number !== undefined)
    throw new Error("stable cannot declare a prerelease number");
  const version = formatReleaseVersion(
    scope.channel,
    base,
    scope.channel === "stable" ? undefined : dev.channels?.[scope.channel]?.number,
  );
  return {
    repo,
    root: managerRoot(repo, scope),
    scope,
    carrier: options.carrier,
    entry,
    version,
    watch: options.watch ?? true,
    headless: options.headless ?? false,
  };
}
