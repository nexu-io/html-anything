import { gates } from "@odsuite/protocol";
import type { Release } from "@odsuite/publish";
import { type ActivationCheckpoint, type CapsuleRenderer, Core, type Receipt, type Renderer } from "./core.js";
import { capsulePlan, leaf, unitFile } from "./units.js";

export class Activation extends Core {
  async applyLeaf(release: Release, renderer: Renderer): Promise<Receipt> {
    if (this.closed || this.closing || this.blocked || !this.ready || this.switching || this.phase !== "ready")
      throw new Error("runtime is not accepting leaf activation");
    this.product?.assertReady();
    return this.factory.session(async () => {
      if (this.phase !== "ready") throw new Error("runtime is not accepting leaf activation");
      const before = await this.content(),
        plan = leaf(before, release, this.factory.scope.channel);
      const old = this.current;
      let daemonTouched = false,
        webTouched = false,
        committing = false;
      this.phase = "preparing";
      this.target = release.envelope.digest;
      this.error = undefined;
      try {
        this.attempt = await this.generations.stage(release.envelope, release.assets);
        const next = await this.generations.prepare(this.attempt);
        await this.checkpoint("prepared");
        this.phase = "activating";
        if (plan.changed.includes("web")) {
          this.documentFenced = true;
          this.witness = "";
          webTouched = true;
        }
        if (plan.changed.includes("daemon")) {
          daemonTouched = true;
          await this.agent?.close();
          this.agent = undefined;
          await this.checkpoint("daemon-stopped");
          await this.launch(next, release.envelope.generation);
        }
        this.view = next;
        this.viewGeneration = release.envelope.generation;
        this.webVersion = plan.next.web.version;
        if (plan.changed.includes("web")) {
          webTouched = true;
          this.witness = await renderer.reload();
        } else this.witness = await renderer.probe();
        if (!this.witness || !this.agent) throw new Error("leaf renderer evidence missing");
        this.agent.exact(await this.agent.request("health"));
        for (const gate of gates) this.attempt = await this.generations.ready(this.attempt, gate);
        await this.checkpoint("ready");
        committing = true;
        await this.generations.commit(this.attempt);
        await this.checkpoint("committed");
        this.attempt = undefined;
        this.current = next;
        this.phase = "ready";
        this.target = undefined;
      } catch (error) {
        this.error = String(error);
        this.phase = "failed";
        if (committing) {
          const binding = await this.factory.binding();
          if (binding.state.current === release.envelope.digest && !binding.state.attempt) {
            this.current = this.view;
            this.attempt = undefined;
            throw new Error(`leaf commit persisted; cleanup failed: ${this.error}`);
          }
        }
        let restored = false;
        try {
          this.view = old;
          this.viewGeneration = before.envelope.generation;
          this.webVersion = (await unitFile(old.web, "web"))?.version;
          if (daemonTouched) {
            await this.agent?.close();
            this.agent = undefined;
            await this.launch(old, before.envelope.generation);
          }
          this.witness = webTouched ? await renderer.reload() : await renderer.probe();
          this.agent?.exact(await this.request("health"));
          restored = !!this.witness;
        } catch (rollback) {
          this.error += `; rollback: ${String(rollback)}`;
        }
        if (this.attempt) {
          await this.generations.fail(this.attempt, this.error);
          this.attempt = undefined;
        }
        throw new Error(`leaf activation failed; baseline restored=${restored}: ${this.error}`);
      }
      return this.snapshot();
    });
  }
  applyCapsule(release: Release, renderer: CapsuleRenderer): Promise<Receipt> {
    if (this.closed || this.closing || this.blocked || this.switching || !this.ready || this.phase !== "ready")
      return Promise.reject(new Error("runtime is not accepting capsule activation"));
    this.switching = true;
    this.handoff = this.replaceCapsule(release, renderer).finally(() => {
      this.switching = false;
      this.handoff = undefined;
    });
    return this.handoff;
  }
  private async replaceCapsule(release: Release, renderer: CapsuleRenderer): Promise<Receipt> {
    capsulePlan(await this.content(), release, this.factory.scope.channel, this.options.carrier);
    // Drain the product-owned leaf controller before acquiring its lifecycle lane.
    // The stable Capsule observer is a separate owner and remains alive throughout.
    try {
      await this.product!.drainCalls();
      await this.product!.pauseUpdates();
    } catch (error) {
      this.phase = "failed";
      this.error = String(error);
      throw error;
    }
    let resume: "old" | "new" | undefined;
    let result: Receipt | undefined;
    let failure: { fault: unknown } | undefined;
    try {
      result = await this.factory.session(async () => {
        const before = await this.content();
        let plan: ReturnType<typeof capsulePlan>;
        try {
          plan = capsulePlan(before, release, this.factory.scope.channel, this.options.carrier);
        } catch (error) {
          resume = "old";
          throw error;
        }
        const old = this.current,
          oldProduct = this.product!;
        let oldDrained = false,
          newStarted = false,
          daemonTouched = false,
          committing = false;
        this.phase = "preparing";
        this.target = release.envelope.digest;
        this.error = undefined;
        try {
          this.attempt = await this.generations.stage(release.envelope, release.assets);
          const next = await this.generations.prepare(this.attempt);
          await this.checkpoint("prepared");
          this.phase = "activating";
          await oldProduct.close();
          oldDrained = true;
          this.documentFenced = true;
          this.witness = "";
          await this.checkpoint("capsule-stopped");
          this.product = this.makeProduct(next, release.envelope.generation.capsule.digest, plan.next.identity.version);
          newStarted = true;
          this.payload = await this.product.initialize();
          this.view = next;
          this.viewGeneration = release.envelope.generation;
          this.webVersion = plan.contracts.web.version;
          await renderer.compose(this.payload);
          if (plan.changed.includes("daemon")) {
            daemonTouched = true;
            await this.agent!.close();
            this.agent = undefined;
            await this.checkpoint("daemon-stopped");
            await this.launch(next, release.envelope.generation);
          }
          this.witness = await renderer.reload();
          if (!this.witness || !this.agent) throw new Error("capsule runtime evidence missing");
          this.agent.exact(await this.agent.request("health"));
          for (const gate of gates) this.attempt = await this.generations.ready(this.attempt, gate);
          await this.checkpoint("ready");
          committing = true;
          const committedNonce = this.attempt.nonce;
          await this.generations.commit(this.attempt);
          this.current = next;
          this.attempt = undefined;
          await this.checkpointCommitted(release.envelope.digest, old.target, committedNonce);
          this.phase = "ready";
          this.target = undefined;
          resume = "new";
        } catch (error) {
          this.error = String(error);
          this.phase = "failed";
          if (committing) {
            const binding = await this.factory.binding();
            if (binding.state.current === release.envelope.digest && !binding.state.attempt) {
              this.current = this.view;
              this.attempt = undefined;
              throw new Error(`capsule commit persisted; postcommit failed: ${this.error}`);
            }
          }
          let restored = false;
          if (oldDrained) {
            try {
              if (newStarted) await this.product!.close();
              this.view = old;
              this.viewGeneration = before.envelope.generation;
              this.webVersion = (await unitFile(old.web, "web"))?.version;
              this.product = this.makeProduct(
                old,
                before.envelope.generation.capsule.digest,
                plan.previous.identity.version,
              );
              this.payload = await this.product.initialize();
              await renderer.compose(this.payload);
              if (daemonTouched) {
                await this.agent?.close();
                this.agent = undefined;
                await this.launch(old, before.envelope.generation);
              }
              this.witness = await renderer.reload();
              this.agent!.exact(await this.agent!.request("health"));
              restored = !!this.witness;
            } catch (rollback) {
              this.error += `; rollback: ${String(rollback)}`;
            }
          }
          if (this.attempt) {
            await this.generations.fail(this.attempt, this.error);
            this.attempt = undefined;
          }
          throw new Error(`capsule activation failed; baseline restored=${restored}: ${this.error}`);
        }
        return this.snapshot();
      });
    } catch (fault) {
      failure = { fault };
    }
    // Starting a new product observer is outside the commit lane. It observes
    // the already committed collection and cannot become a second committer.
    if (resume === "old") {
      this.product!.resumeCalls();
      await this.product!.resumeUpdates();
    }
    if (resume === "new")
      try {
        await this.product!.ready();
      } catch (error) {
        this.phase = "failed";
        this.error = String(error);
        throw new Error(`capsule commit persisted; controller start failed: ${this.error}`);
      }
    if (failure) throw failure.fault;
    return result!;
  }

  private async checkpointCommitted(
    target: import("@odsuite/protocol").Digest,
    previous: import("@odsuite/protocol").Digest,
    nonce: string,
  ) {
    await this.options.onActivation?.(Object.freeze({ stage: "committed", target, nonce, previous }));
  }
  protected async checkpoint(stage: ActivationCheckpoint["stage"]) {
    if (!this.attempt) throw new Error("activation attempt missing");
    await this.options.onActivation?.(
      Object.freeze({
        stage,
        target: this.attempt.target,
        nonce: this.attempt.nonce,
        previous: this.current.target,
      }),
    );
  }
}
