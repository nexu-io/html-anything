import { createHash, randomBytes } from "node:crypto";
import { constants } from "node:fs";
import { open } from "node:fs/promises";
import type { ServerResponse } from "node:http";
import { join } from "node:path";
import { pipeline } from "node:stream/promises";
import type { Download, Job } from "@open-motion/render/contract";
import { Fault } from "@open-motion/workspace/contract";

/** Temporary read-only business grants; these never allocate an OS path or another listener. */
export class Downloads {
  private tickets = new Map<string, { job: Job; expiresAt: number }>();
  constructor(
    private root?: string,
    private endpoint?: string,
  ) {}
  issue(job: Job): Download {
    if (job.state !== "succeeded" || !job.result || !this.root || !this.endpoint)
      throw new Fault("invalid", "export has no verified film");
    for (const [key, entry] of this.tickets) if (entry.expiresAt <= Date.now()) this.tickets.delete(key);
    if (this.tickets.size >= 128) throw new Fault("invalid", "download grant capacity reached");
    const token = randomBytes(32).toString("hex"),
      expiresAt = Date.now() + 600000;
    this.tickets.set(token, { job: structuredClone(job), expiresAt });
    return {
      url: `${this.endpoint}/exports/files/${token}`,
      digest: job.result.verification.digest,
      bytes: job.result.verification.bytes,
      filename: `open-motion-${job.id}.mp4`,
      expiresAt,
    };
  }
  async serve(url: string, response: ServerResponse, head = false) {
    const token = /^\/exports\/files\/([a-f0-9]{64})$/.exec(url)?.[1],
      entry = token && this.tickets.get(token);
    if (!entry || entry.expiresAt <= Date.now() || !this.root || !entry.job.result) {
      response.writeHead(404, { "cache-control": "no-store" });
      response.end();
      return;
    }
    const result = entry.job.result,
      file = await open(join(this.root, "exports", `${result.id}.mp4`), constants.O_RDONLY | constants.O_NOFOLLOW);
    try {
      const info = await file.stat(),
        hash = createHash("sha256");
      if (!info.isFile() || info.size !== result.verification.bytes)
        throw new Fault("integrity", "export film size/type changed");
      for await (const chunk of file.createReadStream({ autoClose: false })) hash.update(chunk);
      if (`sha256:${hash.digest("hex")}` !== result.verification.digest)
        throw new Fault("integrity", "export film integrity mismatch");
      response.writeHead(200, {
        "content-type": "video/mp4",
        "content-length": info.size,
        "cache-control": "no-store",
        "x-content-type-options": "nosniff",
        "referrer-policy": "no-referrer",
        "content-disposition": `attachment; filename="open-motion-${entry.job.id}.mp4"`,
      });
      if (head) response.end();
      else await pipeline(file.createReadStream({ start: 0, autoClose: false }), response);
    } finally {
      await file.close();
    }
  }
  close() {
    this.tickets.clear();
  }
}
