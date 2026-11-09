import type { Project } from "@open-motion/workspace/contract";
import { expect, it } from "vitest";
import { Client, type Transport } from "@";
import { NativePreview } from "@/lib/components/preview.js";

it("does not acknowledge disposal while an older preview acquisition is still in flight", async () => {
  const releases: (() => void)[] = [],
    closed: string[] = [];
  const transport: Transport = async (url, init) => {
    const input = JSON.parse(String(init?.body));
    if (String(url).endsWith("/preview/open")) {
      await new Promise<void>((done) => {
        releases.push(done);
      });
      return new Response(JSON.stringify({ id: input.id, revision: input.expectedRevision }));
    }
    if (!String(url).endsWith("/preview/close")) throw new Error("unexpected request");
    closed.push(input.id);
    return new Response("{}");
  };
  const project = (revision: string) => ({ sessionId: "session", artifactId: "artifact", revision }) as Project;
  let current = project("one");
  const client = new Client("http://127.0.0.1:4100", "fixture", transport),
    host = document.createElement("div"),
    preview = new NativePreview(host, client, () => current, {
      message: () => {},
      ready: () => {},
      time: () => {},
      select: () => {},
    });
  const first = preview.open(current);
  await expect.poll(() => releases.length).toBe(1);
  current = project("two");
  const second = preview.open(current);
  await expect.poll(() => releases.length).toBe(2);
  let disposed = false;
  const drain = preview.dispose().then(() => {
    disposed = true;
  });
  releases[1]?.();
  await second;
  expect(disposed).toBe(false);
  releases[0]?.();
  await first;
  await drain;
  expect(disposed).toBe(true);
  expect(new Set(closed).size).toBe(2);
  expect(host.querySelector("iframe")).toBeNull();
});
