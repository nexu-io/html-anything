import type { Consumer, Use } from "@odsuite/blob";
import type { Digest } from "@odsuite/protocol";
import type { ContentResources } from "./content.js";

/** One actual renderer owner; epochs never acquire their own process identity. */
export class Documents {
  private held: { epoch: string; uses: Use[] }[] = [];
  private reads = new Map<Promise<unknown>, string>();
  private stopRenderer?: () => Promise<void>;
  private accepting = true;
  constructor(
    private content: ContentResources,
    private owner: () => Consumer,
  ) {}
  async open(target: Digest, epoch: string, stop: () => Promise<void>) {
    if (!this.accepting) throw Error("document controller stopped");
    const uses = await this.content.use(target, ["web"], { ...this.owner(), epoch: `web:${epoch}` });
    this.held.push({ epoch, uses });
    this.stopRenderer = stop;
  }
  async read<T>(epoch: string, operation: () => Promise<T>) {
    if (!this.accepting || !this.held.some((h) => h.epoch === epoch)) throw Error("document resource is not held");
    const work = Promise.resolve().then(operation);
    this.reads.set(work, epoch);
    try {
      return await work;
    } finally {
      this.reads.delete(work);
    }
  }
  async ready(epoch: string) {
    await Promise.allSettled([...this.reads].filter(([, e]) => e !== epoch).map(([p]) => p));
    for (const item of this.held.filter((h) => h.epoch !== epoch)) await this.content.release(item.uses);
    this.held = this.held.filter((h) => h.epoch === epoch);
  }
  async stop() {
    this.accepting = false;
    await this.stopRenderer?.();
    await Promise.allSettled([...this.reads.keys()]);
    for (const item of this.held) await this.content.release(item.uses);
    this.held = [];
  }
}
