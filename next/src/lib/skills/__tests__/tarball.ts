import { promises as fsp } from "node:fs";
import zlib from "node:zlib";
import path from "node:path";

/**
 * Pure-JS tar.gz builder for skills test fixtures. Mirrors the no-system-tar
 * stance already used in production (lib/skills/install.ts parses tarballs by
 * hand with zlib). The system `tar -czf` is intentionally not used: on Windows
 * it misreads drive-letter paths (`C:` -> "Cannot connect to C: resolve
 * failed") and turns every skills fixture red on that platform.
 *
 * POSIX ustar 512-byte header format. Supports regular files (typeFlag "0"),
 * directories ("5"), and hardlink entries ("1") so both happy-path and
 * rejection fixtures can be built from the same helper.
 */

export type TarEntry = {
  name: string;
  size: number;
  typeFlag: string;
  linkName?: string;
  data?: Buffer;
};

function octal(n: number, width: number): Buffer {
  // POSIX tar octal fields: ASCII octal digits, NUL-terminated, zero-padded.
  const s = n.toString(8).padStart(width - 1, "0");
  return Buffer.from(`${s}\0`, "binary");
}

function header(entry: TarEntry): Buffer {
  const h = Buffer.alloc(512);
  h.write(entry.name.slice(0, 100), 0, "utf8");
  octal(0o644, 8).copy(h, 100); // mode
  octal(0, 8).copy(h, 108); // uid
  octal(0, 8).copy(h, 116); // gid
  octal(entry.size, 12).copy(h, 124); // size
  octal(0, 12).copy(h, 136); // mtime
  h.fill(0x20, 148, 156); // checksum field as spaces while computing
  h.write(entry.typeFlag, 156, "binary");
  if (entry.linkName) h.write(entry.linkName.slice(0, 100), 157, "utf8");
  h.write("ustar\0", 257, "binary");
  h.write("00", 263, "binary");
  let sum = 0;
  for (const b of h) sum += b;
  octal(sum, 7).copy(h, 148);
  h[155] = 0x20; // trailing space per spec
  return h;
}

export function buildTarball(entries: TarEntry[]): Buffer {
  const blocks: Buffer[] = [];
  for (const e of entries) {
    blocks.push(header(e));
    if (e.data && e.data.length > 0) {
      blocks.push(e.data);
      const pad = (512 - (e.data.length % 512)) % 512;
      if (pad > 0) blocks.push(Buffer.alloc(pad));
    }
  }
  blocks.push(Buffer.alloc(512));
  blocks.push(Buffer.alloc(512));
  return zlib.gzipSync(Buffer.concat(blocks));
}

/**
 * Pack every regular file under `dir` (recursively) into a .tar.gz written to
 * `outPath`, with entry names `<basename(dir)>/<relative-path>` (plus dir
 * entries so the archive shape matches what GitHub produces). Drop-in
 * replacement for the per-test `spawn("tar", ["-czf", ...])` helper.
 */
export async function tarGzDir(dir: string, outPath: string): Promise<void> {
  const base = path.basename(dir);
  const entries: TarEntry[] = [{ name: `${base}/`, size: 0, typeFlag: "5" }];
  async function walk(d: string, rel: string): Promise<void> {
    for (const ent of await fsp.readdir(d, { withFileTypes: true })) {
      const childRel = rel ? `${rel}/${ent.name}` : ent.name;
      if (ent.isDirectory()) {
        entries.push({ name: `${base}/${childRel}/`, size: 0, typeFlag: "5" });
        await walk(path.join(d, ent.name), childRel);
      } else if (ent.isFile()) {
        const data = await fsp.readFile(path.join(d, ent.name));
        entries.push({ name: `${base}/${childRel}`, size: data.length, typeFlag: "0", data });
      } else if (ent.isSymbolicLink()) {
        // Preserve symlinks as typeFlag "2" entries (with linkName) so the
        // preflight's forbidden-entry-type guard is exercised the same way
        // system tar would — it archives symlinks rather than following them.
        const linkTarget = await fsp.readlink(path.join(d, ent.name));
        entries.push({ name: `${base}/${childRel}`, size: 0, typeFlag: "2", linkName: String(linkTarget) });
      }
    }
  }
  await walk(dir, "");
  await fsp.writeFile(outPath, buildTarball(entries));
}
