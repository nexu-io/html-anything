import { randomUUID } from "node:crypto";
import { mkdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { channel, namespace } from "@odsuite/protocol";
import { decode, readProduct } from "@odsuite/release";
import { Client } from "@odsuite/sidecar";
import { Activation } from "./control/activation.js";
import { Bootstrap, claim } from "./control/bootstrap.js";
import type { SessionOptions } from "./control/core.js";
import { type Attempt, Generations } from "./generations.js";

export type { ActivationCheckpoint, CapsuleRenderer, Receipt, Renderer, SessionOptions } from "./control/core.js";
export class Session extends Activation {
  private blocking?: Promise<void>;
  block(reason: string): Promise<void> {
    this.blocked = true;
    this.phase = "blocked";
    this.documentFenced = true;
    this.error = reason;
    this.blocking ??= (async () => {
      await this.handoff?.catch(() => {});
      await this.activation?.catch(() => {});
      await this.product?.drainCalls();
      await this.product?.pauseUpdates();
      await this.drainLibraries();
      await this.factory.session(async () => {
        await this.product?.close();
        await this.agent?.close();
        await this.documentsController.stop();
        this.phase = "blocked";
        this.documentFenced = true;
      });
    })();
    return this.blocking;
  }
  static async open(options: SessionOptions, bootstrap?: Bootstrap): Promise<Session> {
    await mkdir(options.root, { recursive: true, mode: 0o700 });
    // The Electron adapter holds an OS single-instance lock for this root.
    const prior = claim(bootstrap ?? (await Bootstrap.open(options)), options);
    const host = prior.host;
    const client = new Client(host.endpoint, host.authority);
    const scope = namespace(options.namespace);
    const lane = channel(options.manifest.channel);
    const generations = new Generations(client, scope, lane, prior.library, options.carrier);
    const factory = generations.factory;
    let attempt: Attempt | undefined;
    try {
      const current = (await factory.binding()).state;
      await generations.resources.synchronize(current);
      if (options.recover) {
        if (!current.current) throw new Error("no committed generation to recover");
        attempt = await generations.recover(current.current);
      } else if (options.candidate || !current.current) {
        const product = await readProduct(options.candidate ?? options.seed);
        const incoming = product.manifest;
        if (
          incoming.channel !== lane ||
          incoming.identity.appid !== options.manifest.identity.appid ||
          incoming.identity.origin !== options.manifest.identity.origin
        )
          throw new Error("candidate identity mismatch");
        if (current.current !== product.envelope.digest)
          attempt = await generations.stage(product.envelope, product.assets);
      }
      const mount = attempt ? await generations.prepare(attempt) : await generations.mount();
      const manifest = decode(await readFile(join(mount.capsule, "release.json"), "utf8"));
      if (
        manifest.channel !== lane ||
        manifest.identity.appid !== options.manifest.identity.appid ||
        manifest.identity.origin !== options.manifest.identity.origin
      )
        throw new Error("mounted identity mismatch");
      const session = new Session(options, host, factory, generations, mount, manifest, attempt?.nonce ?? randomUUID());
      if (prior.electron.context.identity.generation !== mount.target)
        throw new Error("bootstrap selected content changed");
      session.electron = prior.electron;
      session.attempt = attempt;
      return session;
    } catch (fault) {
      if (attempt) await generations.fail(attempt, String(fault));
      await prior.library.close();
      await host.close();
      throw fault;
    }
  }

  async close(error = "runtime stopped before readiness"): Promise<{ status: string; survivors: number[] }> {
    if (this.closed) return { status: "stopped", survivors: [] };
    this.closing ??= this.closeWithin(error)
      .catch((fault) => {
        this.phase = "failed";
        this.error = String(fault);
        throw fault;
      })
      .finally(() => {
        this.closing = undefined;
      });
    return this.closing;
  }
  private async closeWithin(error: string) {
    this.documentFenced = true;
    await this.blocking;
    await this.activation?.catch(() => {});
    await this.handoff?.catch(() => {});
    await this.product?.drainCalls();
    await this.product?.pauseUpdates();
    await this.drainLibraries();
    await this.factory.session(async () => {
      if (this.attempt && !this.ready) {
        await this.generations.fail(this.attempt, error);
        this.attempt = undefined;
      }
      await this.product?.close();
      await this.agent?.close();
      await this.documentsController.stop();
      await this.electron?.close();
    });
    await this.generations.resources.library.close();
    await this.host.close();
    this.closed = true;
    this.phase = "stopped";
    return { status: "stopped", survivors: [] as number[] };
  }
}
