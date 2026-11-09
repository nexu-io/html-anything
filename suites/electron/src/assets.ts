import { readFile, realpath } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";

const types: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

export async function asset(root: string, request: Request, connect = "'none'"): Promise<Response> {
  const url = new URL(request.url);
  if (url.hostname !== "carrier") return new Response("not found", { status: 404 });
  const name = url.pathname === "/" ? "index.html" : decodeURIComponent(url.pathname.slice(1));
  const path = resolve(root, name);
  if (path !== root && !path.startsWith(`${root}/`)) return new Response("forbidden", { status: 403 });
  try {
    const actual = await realpath(path);
    const base = await realpath(root);
    if (!actual.startsWith(`${base}${sep}`)) return new Response("forbidden", { status: 403 });
    return new Response(await readFile(actual), {
      headers: {
        "cache-control": "no-store",
        "content-type": types[extname(path)] ?? "application/octet-stream",
        "content-security-policy": `default-src 'self'; script-src 'self'; connect-src ${connect}; object-src 'none'; base-uri 'none'; frame-src 'none'`,
      },
    });
  } catch (fault) {
    if ((fault as NodeJS.ErrnoException).code === "ENOENT") return new Response("not found", { status: 404 });
    throw fault;
  }
}
export const nodeBanner =
  'import { createRequire as odsuiteRequire } from "node:module";const require=odsuiteRequire(import.meta.url);';
