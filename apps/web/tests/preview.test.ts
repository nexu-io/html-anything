import { runtimeProtocolMetadata } from "@open-motion/motion/protocol";
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
  const project = (revision: string) =>
    ({ sessionId: "session", artifactId: "artifact", revision, resources: [] }) as unknown as Project;
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

it("requires actual font loading as well as a timeline and retains the prior frame on a font failure", async () => {
  const closed: string[] = [],
    transport: Transport = async (url, init) => {
      const input = JSON.parse(String(init?.body));
      if (String(url).endsWith("/preview/open"))
        return new Response(JSON.stringify({ id: input.id, revision: input.expectedRevision }));
      closed.push(input.id);
      return new Response("{}");
    },
    project = (revision: string, fonts = false): Project => ({
      id: "project",
      sessionId: "session",
      artifactId: "artifact",
      revision,
      files: [],
      history: { version: 0, canUndo: false, canRedo: false },
      resources: fonts
        ? [
            {
              path: "assets/face.woff2",
              name: "Face",
              digest: `sha256:${"a".repeat(64)}`,
              bytes: 4,
              type: "font/woff2",
              family: "Face",
              postscriptName: "Face",
              weight: [400, 400],
              slant: "normal",
            },
          ]
        : [],
    });
  let current = project("one");
  const host = document.createElement("div");
  document.body.append(host);
  const preview = new NativePreview(host, new Client("http://127.0.0.1:4100", "fixture", transport), () => current, {
    message: () => {},
    ready: () => {},
    time: () => {},
    select: () => {},
  });
  const send = (frame: HTMLIFrameElement, data: unknown) =>
      window.dispatchEvent(new MessageEvent("message", { source: frame.contentWindow, origin: "null", data })),
    candidate = async () => {
      await expect.poll(() => host.querySelector("iframe[hidden]")).not.toBeNull();
      return host.querySelector<HTMLIFrameElement>("iframe[hidden]")!;
    },
    timeline = (frame: HTMLIFrameElement) =>
      send(frame, { source: "hf-preview", type: "timeline", durationSeconds: 1, ...runtimeProtocolMetadata(30) });
  try {
    const first = preview.open(current),
      one = await candidate();
    timeline(one);
    await first;
    current = project("two", true);
    let accepted = false;
    const second = preview.open(current).then(() => {
        accepted = true;
      }),
      two = await candidate();
    timeline(two);
    await Promise.resolve();
    expect(accepted).toBe(false);
    expect(one.hidden).toBe(false);
    send(two, { source: "open-motion-fonts", protocolVersion: 1, ready: true });
    await second;
    expect(preview.revision).toBe("two");
    expect(one.isConnected).toBe(false);
    current = project("three", true);
    const third = preview.open(current),
      rejected = expect(third).rejects.toThrow("工程字体加载失败"),
      three = await candidate();
    send(three, { source: "open-motion-fonts", protocolVersion: 1, ready: false });
    await rejected;
    expect(preview.revision).toBe("two");
    expect(two.isConnected).toBe(true);
    expect(two.hidden).toBe(false);
    expect(three.isConnected).toBe(false);
  } finally {
    await preview.dispose();
    host.remove();
  }
  expect(new Set(closed).size).toBe(3);
});
