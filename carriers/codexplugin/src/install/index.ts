import { lstat, mkdir, readFile, realpath, rename, writeFile } from "node:fs/promises";
import { basename, dirname, isAbsolute, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { canonical, digest, type FactoryScope, factoryScope } from "@odsuite/protocol";
import { parseReleaseVersion } from "@odsuite/release";
import type { Context, Factory } from "@odsuite/sidecar";
import { command } from "./command.js";
import { checkSkills, projections, projectSkills } from "./skills.js";

export interface Options {
  factory: Factory;
  context: Context;
  application: string;
  installation?: { home: string; requestId: string };
  profile: string;
  skills: string;
  root: string;
  scope: FactoryScope;
  version: string;
  codex?: string;
  worker?: string;
}
export interface Receipt {
  application: string;
  installation?: { home: string; requestId: string };
  profile: string;
  skills: string;
  root: string;
  scope: FactoryScope;
  version: string;
  server: "open-motion";
  state: "registered";
  manifestHash: string;
}
interface Transport {
  type: "stdio";
  command: string;
  args: string[];
  env: Record<string, string>;
}
interface Intent {
  schema: 1;
  installation: string;
  id: string;
  receipt: Receipt;
  transport: Transport;
  previous?: Transport;
  configurationHash?: string;
  previousConfigurationHash?: string;
  state: "intent" | "registered";
}
async function json<T>(path: string): Promise<T | undefined> {
  try {
    const info = await lstat(path);
    if (!info.isFile() || info.size > 1024 * 1024) throw Error("Registration record must be a bounded regular file");
    return JSON.parse(await readFile(path, "utf8")) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
    throw error;
  }
}
async function save(path: string, value: unknown) {
  await writeFile(`${path}.next`, canonical(value), { mode: 0o600, flush: true });
  await rename(`${path}.next`, path);
}
async function path(value: string, missingParents = false) {
  if (!isAbsolute(value) || resolve(value) !== value) throw Error("Registration paths must be absolute and normalized");
  if (dirname(value) === value) throw Error("Registration paths cannot be a filesystem root");
  let ancestor = dirname(value);
  for (;;) {
    try {
      if ((await realpath(ancestor)) !== ancestor) throw Error("Registration path parent must be canonical");
      break;
    } catch (error) {
      if (!missingParents || (error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      const parent = dirname(ancestor);
      if (parent === ancestor) throw error;
      ancestor = parent;
    }
  }
  try {
    if (!(await lstat(value)).isDirectory()) throw Error("Registration path must be a regular directory");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  return value;
}
const same = (left: unknown, right: unknown) => canonical(left) === canonical(right);
function matches(value: unknown, expected: Transport) {
  const actual = value as Partial<Transport> & { cwd?: string | null; env_vars?: string[] | null };
  return (
    actual?.type === "stdio" &&
    actual.command === expected.command &&
    same(actual.args, expected.args) &&
    same(actual.env ?? {}, expected.env) &&
    !actual.cwd &&
    !actual.env_vars?.length
  );
}

/** Explicit host adaptation; injected installation authority owns all resources. */
async function registration(options: Options, verify = false): Promise<Receipt> {
  const scope = factoryScope(options.scope);
  if (
    !same(scope, options.factory.scope) ||
    !same(scope, { channel: options.context.identity.channel, namespace: options.context.identity.namespace })
  )
    throw Error("Registration authority scope mismatch");
  parseReleaseVersion(options.version, scope.channel);
  const [application, profile, skills, root] = await Promise.all([
    path(options.application),
    path(options.profile),
    path(options.skills, true),
    path(options.root, true),
  ] as const);
  if (basename(skills) !== "skills" || basename(dirname(skills)) !== ".agents")
    throw Error(
      "Skills must use a supported user/workspace .agents/skills root; workspace discovery requires that host cwd",
    );
  const paths = [application, profile, skills, root];
  // Only this selected container may be created; runtime data remains sidecar's responsibility.
  await path(dirname(skills));
  for (const a of paths)
    for (const b of paths)
      if (a !== b && b.startsWith(`${a}${sep}`))
        throw Error("Registration application/profile/Skills/data paths must not overlap");
  if (new Set(paths).size !== paths.length) throw Error("Registration paths must be distinct");
  const runtime = await json<{ carrier: string; version: string; channel: string }>(join(application, "runtime.json"));
  if (
    runtime?.carrier !== "codexplugin" ||
    runtime.version !== options.version ||
    runtime.channel !== scope.channel ||
    !(await lstat(join(application, "main.mjs"))).isFile()
  )
    throw Error("Installed Codex runtime identity does not match registration");
  const projected = await projections(application),
    manifestHash = digest(canonical(projected.map((entry) => entry.projection)));
  const receipt: Receipt = {
    application: application,
    ...(options.installation ? { installation: structuredClone(options.installation) } : {}),
    profile: profile,
    skills: skills,
    root: root,
    scope,
    version: options.version,
    server: "open-motion",
    state: "registered",
    manifestHash,
  };
  if (options.installation) {
    await path(options.installation.home);
    if (
      !/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(options.installation.requestId)
    )
      throw Error("invalid installation request binding");
  }
  const transport: Transport = {
    type: "stdio",
    command: process.execPath,
    args: [join(application, "main.mjs")],
    env: {
      OPEN_MOTION_ROOT: root,
      OPEN_MOTION_CHANNEL: scope.channel,
      OPEN_MOTION_NAMESPACE: scope.namespace,
      ...(options.installation
        ? {
            OPEN_MOTION_INSTALLATION_HOME: options.installation.home,
            OPEN_MOTION_INSTALLATION_REQUEST: options.installation.requestId,
          }
        : {}),
    },
  };
  const installation = digest(canonical({ authority: options.context.roots.data, profile, skills, root, scope }));
  const id = digest(canonical({ receipt, transport }));
  const record = join(options.context.roots.data, `codex-${digest(profile).slice(7, 23)}.json`);
  const runner = {
    ...options,
    profile: profile,
    worker: options.worker ?? fileURLToPath(new URL("./installworker.mjs", import.meta.url)),
    codex: options.codex ?? "codex",
  };
  if (!isAbsolute(runner.worker)) throw Error("Codex worker must be an absolute path");
  return options.factory.session(async () => {
    await options.factory.grant({ kind: "installation", name: "codexprofile", scope: "factory", target: profile });
    await options.factory.grant({
      kind: "installation",
      name: "codexskills",
      scope: "factory",
      target: dirname(skills),
    });
    await mkdir(profile, { recursive: true, mode: 0o700 });
    await mkdir(skills, { recursive: true, mode: 0o700 });
    try {
      if (!(await lstat(join(profile, "config.toml"))).isFile()) throw Error("Codex config must be a regular file");
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
    const marker = join(profile, ".open-motion.json"),
      claimed = await json<{ installation: string }>(marker);
    if (claimed && claimed.installation !== installation)
      throw Error("Codex profile registration belongs to another installation");
    const previous = await json<Intent>(record);
    if (previous && (previous.schema !== 1 || previous.installation !== installation))
      throw Error("Codex registration journal does not match its installation");
    if (previous && previous.state !== "registered" && previous.id !== id)
      throw Error("An unfinished Codex registration intent must be reconciled first");
    const current = await command(runner, ["mcp", "get", "open-motion", "--json"]);
    let actual: { transport: unknown; enabled?: boolean } | undefined;
    if (current.code === 0) actual = JSON.parse(current.stdout);
    else if (current.code !== 1 || !/No MCP server named ['"]open-motion['"] found/.test(current.stderr))
      throw Error("Codex MCP configuration could not be read; registration intent retained");
    const allowedPrevious = previous?.id === id ? previous.previous : previous?.transport;
    if (
      actual &&
      (!claimed ||
        !previous ||
        (!matches(actual.transport, transport) && (!allowedPrevious || !matches(actual.transport, allowedPrevious))))
    )
      throw Error("Existing Codex MCP entry is not the exact owned transport; refusing replacement");
    if (actual?.enabled === false) throw Error("Owned Codex MCP entry is disabled; refusing to override host policy");
    const actualHash = actual ? digest(canonical(actual)) : undefined;
    if (previous?.state === "registered" && previous.configurationHash && actualHash !== previous.configurationHash)
      throw Error("Owned Codex MCP configuration has changed; refusing to override host policy");
    if (
      actual &&
      previous?.state === "intent" &&
      !matches(actual.transport, transport) &&
      previous.previousConfigurationHash !== actualHash
    )
      throw Error("Previous Codex MCP configuration has changed during registration");
    await checkSkills(skills, installation);
    if (verify) {
      if (
        !previous ||
        previous.state !== "registered" ||
        previous.id !== id ||
        !actual ||
        !matches(actual.transport, transport)
      )
        throw Error("Owned Codex registration is not the expected current transport");
      return receipt;
    }
    const intent: Intent =
      previous?.id === id
        ? previous
        : {
            schema: 1,
            installation,
            id,
            receipt,
            transport,
            ...(previous
              ? { previous: previous.transport, previousConfigurationHash: previous.configurationHash }
              : {}),
            state: "intent",
          };
    await save(record, intent);
    if (!claimed)
      await writeFile(marker, canonical({ schema: 1, owner: "open-motion", installation }), {
        flag: "wx",
        mode: 0o600,
        flush: true,
      });
    await projectSkills(skills, application, installation, id);
    if (!actual || !matches(actual.transport, transport)) {
      const args = [
        "mcp",
        "add",
        "open-motion",
        ...Object.entries(transport.env).flatMap(([key, value]) => ["--env", `${key}=${value}`]),
        "--",
        transport.command,
        ...transport.args,
      ];
      const added = await command(runner, args);
      if (added.code !== 0) throw Error("Codex MCP registration result is unknown; retry the same intent to reconcile");
    }
    const observed = await command(runner, ["mcp", "get", "open-motion", "--json"]);
    const configuration = observed.code === 0 ? JSON.parse(observed.stdout) : undefined;
    if (!configuration || configuration.enabled === false || !matches(configuration.transport, transport))
      throw Error("Codex registration could not be confirmed; retry the same intent");
    await save(record, { ...intent, state: "registered", configurationHash: digest(canonical(configuration)) });
    return receipt;
  });
}

export const register = (options: Options) => registration(options);
export const verifyRegistration = (options: Options) => registration(options, true);
export async function registrations(options: {
  factory: Factory;
  context: Context;
  root: string;
  scope: FactoryScope;
  allowPendingVersion?: string;
}) {
  const { readdir } = await import("node:fs/promises");
  const names = (await readdir(options.context.roots.data)).filter((name) => /^codex-[a-f0-9]{16}\.json$/.test(name));
  if (names.length > 16) throw Error("Codex registration set exceeds limit");
  const records: Receipt[] = [];
  for (const name of names.sort()) {
    const value = await json<Intent>(join(options.context.roots.data, name));
    if (
      !value ||
      value.schema !== 1 ||
      (value.state !== "registered" &&
        !(
          value.state === "intent" &&
          options.allowPendingVersion !== undefined &&
          value.receipt?.version === options.allowPendingVersion
        )) ||
      !value.receipt ||
      value.receipt.server !== "open-motion" ||
      value.receipt.state !== "registered" ||
      value.receipt.root !== options.root ||
      !same(value.receipt.scope, options.scope)
    )
      throw Error("Codex registration intent must reconcile before activation");
    for (const field of ["application", "profile", "skills", "root"] as const)
      if (
        typeof value.receipt[field] !== "string" ||
        !isAbsolute(value.receipt[field]) ||
        resolve(value.receipt[field]) !== value.receipt[field]
      )
        throw Error("invalid owned Codex registration");
    if (name !== `codex-${digest(value.receipt.profile).slice(7, 23)}.json`)
      throw Error("Codex registration profile identity changed");
    records.push(value.receipt);
  }
  return records;
}
