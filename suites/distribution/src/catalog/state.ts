import { randomUUID } from "node:crypto";
import { lstat, mkdir, open, readFile, rename, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { canonical } from "@odsuite/protocol";
import type { Head } from "../signature.js";

/** A signed selection under the caller's granted data path, not runtime authority. */
export class CatalogState<T extends { head: Head }> {
  value?: T;
  constructor(
    private root: string,
    private name: string,
    private checked: (head: unknown, metadata: unknown) => T,
  ) {}
  async load() {
    if (this.value) return;
    const path = join(this.root, this.name);
    try {
      const info = await lstat(path);
      if (!info.isFile() || info.size > 1024 * 1024) throw Error("invalid catalog selection file");
      const bytes = await readFile(path);
      if (bytes.length > 1024 * 1024) throw Error("catalog selection exceeds limit");
      const saved = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
      this.value = this.checked(saved.head, saved.metadata);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  }
  assert(head: Head) {
    const old = this.value?.head;
    if (old && (head.revision < old.revision || (head.revision === old.revision && canonical(head) !== canonical(old))))
      throw Error("distribution revision regressed or conflicted");
  }
  async commit(next: T) {
    this.assert(next.head);
    await mkdir(this.root, { recursive: true, mode: 0o700 });
    const path = join(this.root, this.name),
      temporary = `${path}.${randomUUID()}.tmp`;
    try {
      await writeFile(temporary, canonical(next), { flag: "wx", mode: 0o600, flush: true });
      await rename(temporary, path);
      if (process.platform !== "win32") {
        const dir = await open(this.root, "r");
        try {
          await dir.sync();
        } finally {
          await dir.close();
        }
      }
    } finally {
      await rm(temporary, { force: true });
    }
    this.value = next;
  }
}
