import { execFile } from "node:child_process";
import { generateKeyPairSync } from "node:crypto";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join, resolve as resolvepath } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { Library } from "@odsuite/blob";
import { guard } from "@odsuite/guard";
import { type Channel, channel, type Digest, digest, gates, namespace, startup } from "@odsuite/protocol";
import { Authority, Feed, type Service as Publisher, serve as publish } from "@odsuite/publish";
import { compose, type Product, resolve as release } from "@odsuite/release";
import { Generations } from "@odsuite/runtime";
import { Client, type Service as Sidecar, serve as sidecar } from "@odsuite/sidecar";
import { asset } from "@open-motion/electron";

import { type Definition, type Id, matrix, type Status } from "./matrix.js";
import { installed, type Selections } from "./package.js";
import { type Evidence, encode, parse, type Report } from "./schema.js";

export interface Options {
  chromium?: boolean;
  output: string;
  packaged?: boolean;
  root: string;
}

const execute = promisify(execFile);

function definition(id: Id): Definition {
  const value = matrix.find((item) => item.id === id);
  if (!value) throw new Error(`scenario absent:${id}`);
  return value;
}

function evidence(
  id: Id,
  status: Status,
  actual: string,
  milliseconds: number,
  values: Partial<Evidence> = {},
): Evidence {
  const item = definition(id);
  return {
    actual,
    artifacts: values.artifacts ?? [],
    built: values.built ?? [],
    diagnostics: values.diagnostics ?? [],
    downloaded: values.downloaded ?? [],
    expected: item.expected,
    gate: item.gate,
    id,
    milliseconds,
    pids: values.pids ?? [],
    restored: values.restored ?? [],
    status,
    survivors: values.survivors ?? [],
    transitions: values.transitions ?? [],
  };
}

async function timed<T>(action: () => Promise<T>): Promise<{ milliseconds: number; value: T }> {
  const start = performance.now();
  const value = await action();
  return { milliseconds: Math.round((performance.now() - start) * 1000) / 1000, value };
}

function pem() {
  const pair = generateKeyPairSync("ed25519");
  return {
    privatekey: pair.privateKey.export({ format: "pem", type: "pkcs8" }).toString(),
    publickey: pair.publicKey.export({ format: "pem", type: "spki" }).toString(),
  };
}

function path(name: "capsule" | "carrier" | "daemon" | "web"): string {
  return dirname(
    fileURLToPath(
      import.meta.resolve(
        name === "capsule"
          ? "@open-motion/electron/capsule"
          : name === "carrier"
            ? "@open-motion/electron"
            : `@open-motion/${name}`,
      ),
    ),
  );
}

async function installation(client: Client, temporary: string, selections: Selections): Promise<Evidence> {
  try {
    const qualified = await timed(() =>
      installed(
        client,
        temporary,
        {
          carrier: path("carrier"),
          daemon: path("daemon"),
          web: path("web"),
        },
        selections,
      ),
    );
    return evidence("PKG-01", "passed", "two channel identities installed and launched", qualified.milliseconds, {
      artifacts: qualified.value.artifacts,
      built: qualified.value.built,
      pids: qualified.value.pids,
      restored: qualified.value.restored,
      survivors: qualified.value.survivors,
      transitions: qualified.value.transitions,
    });
  } catch (fault) {
    const error = fault as Error;
    return evidence("PKG-01", "failed", error.message, 0, {
      diagnostics: [error.stack ?? error.message],
    });
  }
}

async function delivery(
  client: Client,
  temporary: string,
  primary: Generations,
  secondary: Generations,
  update: Product,
): Promise<Evidence[]> {
  let attempt = await primary.stage(update.envelope, update.assets);
  let refused = false;
  try {
    await primary.commit(attempt);
  } catch {
    refused = true;
  }
  const selections = {
    beta: await secondary.mount(),
    stable: await primary.prepare(attempt),
  };
  const served = await asset(selections.stable.web, new Request("open-motion://carrier/"));
  const escaped = await asset(selections.stable.web, new Request("open-motion://carrier/%2e%2e%2fsecret"));
  const packaged = await installation(client, temporary, selections);
  if (packaged.status !== "passed") {
    await primary.fail(attempt, packaged.actual);
    return [
      packaged,
      evidence("PKG-06", "failed", "mounted runtime did not reach protocol checks", 0),
      evidence("PKG-07", "failed", "mounted runtime did not reach readiness", 0),
      evidence("PKG-09", "failed", "mounted runtime did not retire", 0),
      evidence("UPD-ALL", "failed", "candidate launch failed before commit", 0),
    ];
  }
  for (const gate of gates) attempt = await primary.ready(attempt, gate);
  const committed = await primary.commit(attempt);
  const mounted = await primary.mount();
  await writeFile(join(mounted.web, "index.html"), "tampered");
  let tampered = false;
  try {
    await primary.mount();
  } catch {
    tampered = true;
  }
  await rm(mounted.web, { force: true, recursive: true });
  const repaired = await primary.mount();
  const activated = committed.state.current === update.envelope.digest && repaired.target === update.envelope.digest;
  const protectedpath = served.status === 200 && escaped.status === 403 && tampered;
  return [
    packaged,
    evidence("PKG-06", protectedpath ? "passed" : "failed", "private root contained access and rejected tamper", 0, {
      artifacts: [repaired.target],
      transitions: ["serve", "escape", "tamper", "reject", "restore"],
    }),
    evidence(
      "PKG-07",
      refused ? "unqualified" : "failed",
      "premature commit refused; runtime readiness is harness-declared",
      0,
      {
        artifacts: [repaired.target],
        transitions: ["prepare", "refuse", "ready", "commit"],
      },
    ),
    evidence(
      "PKG-09",
      packaged.survivors.length === 0 ? "passed" : "failed",
      "installed Daemons retired physically",
      0,
      {
        pids: packaged.pids,
        survivors: packaged.survivors,
        transitions: ["launch", "release", "retire"],
      },
    ),
    evidence(
      "UPD-ALL",
      activated ? "unqualified" : "failed",
      "fixture committed; fixed-host four-content update not witnessed",
      0,
      {
        artifacts: [repaired.target],
        restored: ["capsule", "daemon", "web", "model"],
        transitions: ["stage", "prepare", "launch", "ready", "commit", "mount"],
      },
    ),
  ];
}

async function qualification(
  client: Client,
  temporary: string,
  primary: Generations,
  secondary: Generations,
  update: Product,
): Promise<Evidence[]> {
  try {
    return await delivery(client, temporary, primary, secondary, update);
  } catch (fault) {
    const error = fault as Error;
    const values = { diagnostics: [error.stack ?? error.message] };
    return [
      evidence("PKG-01", "failed", error.message, 0, values),
      evidence("PKG-06", "failed", error.message, 0, values),
      evidence("PKG-07", "failed", error.message, 0, values),
      evidence("PKG-09", "failed", error.message, 0, values),
      evidence("UPD-ALL", "failed", error.message, 0, values),
    ];
  }
}

async function product(lane: Channel, version: string, model: string): Promise<Product> {
  return compose(release({}, { channel: lane, version }), {
    blobs: [{ path: model, slot: "model" }],
    capsule: path("capsule"),
    carrier: 1,
    daemon: path("daemon"),
    web: path("web"),
  });
}

async function commit(capsule: Generations, feed: Feed): Promise<Digest> {
  let attempt = await capsule.update(feed);
  if (!attempt) throw new Error("candidate missing");
  for (const gate of gates) attempt = await capsule.ready(attempt, gate);
  const current = (await capsule.commit(attempt)).state.current;
  if (!current) throw new Error("committed generation missing");
  return current;
}

async function versions(root: string): Promise<Report["tools"] & { revision: string }> {
  const [{ stdout: revision }, { stdout: pnpm }] = await Promise.all([
    execute("git", ["rev-parse", "HEAD"], { cwd: root }),
    execute("pnpm", ["--version"], { cwd: root }),
  ]);
  const require = createRequire(import.meta.url);
  const electron = JSON.parse(await readFile(require.resolve("electron/package.json"), "utf8")) as { version: string };
  return { electron: electron.version, node: process.versions.node, pnpm: pnpm.trim(), revision: revision.trim() };
}

export async function run(options: Options): Promise<Report> {
  const root = resolvepath(options.root);
  const output = resolvepath(root, options.output);
  const temporary = await mkdtemp(join(tmpdir(), "qualification-"));
  const scenarios: Evidence[] = [];
  const libraries: Library[] = [];
  let host: Sidecar | undefined;
  let server: Publisher | undefined;
  let failure: Error | undefined;
  try {
    const checked = await timed(() => guard({ root }));
    scenarios.push(
      evidence(
        "BUILD-01",
        checked.value.ok ? "passed" : "failed",
        checked.value.ok ? `${checked.value.paths} repository paths accepted` : "repository policy failed",
        checked.milliseconds,
        { diagnostics: checked.value.findings.map((item) => `${item.path}:${item.rule}`) },
      ),
    );
    const model = join(temporary, "model.bin");
    await writeFile(model, "qualification model");
    const stable = channel("stable");
    const beta = channel("beta");
    const built = await timed(async () => {
      const first = await product(stable, "1.0.0", model);
      const repeated = await product(stable, "1.0.0", model);
      if (first.envelope.digest !== repeated.envelope.digest) throw new Error("generation drift");
      return { first, preview: await product(beta, "1.0.0-beta.1", model) };
    });
    scenarios.push(
      evidence("BUILD-03", "passed", "generation identity repeated exactly", built.milliseconds, {
        artifacts: [built.value.first.envelope.digest, built.value.preview.envelope.digest],
        built: ["capsule", "daemon", "web", "model"],
      }),
    );
    const endpoint = join(temporary, "sidecar.sock");
    host = await sidecar(endpoint);
    let client = new Client(host.endpoint, host.authority);
    const managed = async (scope: string, lane: Channel) => {
      const factory = host!.factory({ namespace: namespace(scope), channel: lane });
      let library!: Library;
      await factory.expose({
        identity: { service: "electron", generation: digest(scope + lane) },
        handlers: {},
        lifecycle: {
          initialize: async (context) => {
            library = await Library.open({ factory, context, name: "content" });
          },
          stop: async () => {},
        },
      });
      libraries.push(library);
      return new Generations(client, namespace(scope), lane, library);
    };
    const release = namespace("release");
    const data = await client.grant(
      { namespace: release, channel: channel("stable") },
      { kind: "data", name: "publish", scope: "factory" },
    );
    const socket = await client.grant(
      { namespace: release, channel: channel("stable") },
      {
        kind: "socket",
        name: "publish",
        owner: "server",
        scope: "attempt",
      },
    );
    const port = await client.grant(
      { namespace: release, channel: channel("stable") },
      {
        kind: "port",
        name: "publish",
        owner: "server",
        scheme: "http",
        scope: "attempt",
      },
    );
    const keys = pem();
    const authority = await Authority.open({ privatekey: keys.privatekey, root: data.value });
    server = await publish(authority, socket.value);
    await client.forward({ namespace: release, channel: channel("stable") }, port.lease, socket.lease);
    const feed = new Feed(port.value, keys.publickey);
    const published = await timed(async () => {
      await authority.publish(stable, 0, built.value.first.envelope, built.value.first.assets);
      await authority.publish(beta, 0, built.value.preview.envelope, built.value.preview.assets);
      const primary = await managed("primary", stable);
      const secondary = await managed("secondary", beta);
      const current = await commit(primary, feed);
      const preview = await commit(secondary, feed);
      return { current, preview, primary, secondary };
    });
    scenarios.push(
      evidence("PUB-01", "passed", "two isolated channels restored and committed", published.milliseconds, {
        artifacts: [published.value.current, published.value.preview],
        downloaded: ["capsule", "daemon", "web", "model"],
        transitions: ["discover", "verify", "stage", "arm", "ready", "commit"],
      }),
    );
    const repeated = await timed(() =>
      authority.publish(stable, 0, built.value.first.envelope, built.value.first.assets),
    );
    scenarios.push(
      evidence("PUB-02", "passed", `head remained revision ${repeated.value.revision}`, repeated.milliseconds),
    );
    const update = await product(stable, "2.0.0", model);
    await authority.publish(stable, 1, update.envelope, update.assets);
    const refused = await timed(async () => {
      try {
        await published.value.primary.update(new Feed(port.value, pem().publickey));
        return false;
      } catch {
        return true;
      }
    });
    scenarios.push(
      evidence("PUB-10", refused.value ? "passed" : "failed", "unknown trust root rejected", refused.milliseconds),
    );
    const attempt = await published.value.primary.update(feed);
    if (!attempt) throw new Error("upgrade attempt missing");
    await server.close();
    server = undefined;
    await Promise.all(libraries.splice(0).map((library) => library.close()));
    await host.close();
    host = undefined;
    host = await sidecar(endpoint);
    client = new Client(host.endpoint, host.authority);
    const interrupted = await timed(() => client.binding(namespace("primary"), stable));
    const blocked = startup(interrupted.value.state).mode === "blocked";
    scenarios.push(
      evidence(
        "REC-04",
        blocked ? "passed" : "failed",
        "restart preserved a blocked failed attempt",
        interrupted.milliseconds,
        {
          transitions: ["running", "restart", "failed", "blocked"],
        },
      ),
    );
    const recovered = await timed(async () => {
      const capsule = await managed("primary", stable);
      let recovery = await capsule.recover(published.value.current);
      for (const gate of gates) recovery = await capsule.ready(recovery, gate);
      await capsule.commit(recovery);
      return capsule;
    });
    const restored = (await recovered.value.factory.binding()).state.current === published.value.current;
    scenarios.push(
      evidence("REC-07", restored ? "passed" : "failed", "explicit old generation recovered", recovered.milliseconds, {
        artifacts: [published.value.current],
        restored: ["capsule", "daemon", "web", "model"],
        transitions: ["recover", "begin", "ready", "commit"],
      }),
    );
    if (options.packaged) {
      const primary = recovered.value;
      const secondary = await managed("secondary", beta);
      scenarios.push(...(await qualification(client, temporary, primary, secondary, update)));
    }
  } catch (fault) {
    failure = fault as Error;
  } finally {
    if (server) await server.close();
    await Promise.all(libraries.splice(0).map((library) => library.close()));
    if (host) await host.close();
    await rm(temporary, { force: true, recursive: true });
  }
  const add = (item: Evidence) => {
    if (!scenarios.some((current) => current.id === item.id)) scenarios.push(item);
  };
  if (failure) {
    for (const item of matrix.slice(0, 7)) {
      add(
        evidence(item.id, "failed", failure.message, 0, {
          diagnostics: [failure.stack ?? failure.message],
        }),
      );
    }
  }
  add(evidence("PKG-01", "unqualified", "platform package not built", 0));
  add(evidence("PKG-06", "unqualified", "private mounted protocol not supplied", 0));
  add(evidence("PKG-07", "unqualified", "mounted runtime readiness not supplied", 0));
  add(evidence("PKG-09", "unqualified", "installed runtime retirement not supplied", 0));
  add(evidence("PKG-10", "unqualified", "a caller boolean is not bound Chromium execution evidence", 0));
  add(evidence("UPD-ALL", "unqualified", "packaged four-piece activation not supplied", 0));
  add(evidence("G5-NATIVE", "unqualified", "native credentials and installers are out of scope", 0));
  add(evidence("G6-REMOTE", "unqualified", "remote object storage and CDN are out of scope", 0));
  for (const item of matrix) {
    add(evidence(item.id, "failed", "scenario did not execute", 0));
  }
  scenarios.sort(
    (left, right) => matrix.findIndex((item) => item.id === left.id) - matrix.findIndex((item) => item.id === right.id),
  );
  const tools = await versions(root);
  const failed = scenarios.some((item) => item.status === "failed");
  const partial = scenarios.some((item) => item.status === "unqualified");
  const report = parse({
    architecture: process.arch,
    platform: process.platform,
    result: failed ? "failed" : partial ? "partial" : "passed",
    revision: tools.revision,
    scenarios,
    schema: 1,
    tools: { electron: tools.electron, node: tools.node, pnpm: tools.pnpm },
  });
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, encode(report), { mode: 0o600 });
  return report;
}
