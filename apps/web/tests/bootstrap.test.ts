import { expect, it, vi } from "vitest";
import { bootstrap } from "@/lib/bootstrap.js";
import { start } from "@/lib/start.js";

const facts = {
  schema: 1,
  carrier: "standalone",
  system: { platform: "linux", release: "6.1", arch: "x64" },
  runtime: { name: "node", version: "24.18.0" },
};
it("uses an injected host or an explicit same-origin bootstrap document with validated environment", async () => {
  const injected = { daemon: "http://127.0.0.1:4000", token: "test" };
  const transport = vi
    .fn<typeof fetch>()
    .mockResolvedValue(new Response(JSON.stringify({ ...injected, environment: facts })));
  const url = new URL("http://127.0.0.1:4010/bootstrap.json");
  expect(await bootstrap(injected, url, transport)).toBe(injected);
  expect(transport).not.toHaveBeenCalled();
  expect((await bootstrap(undefined, url, transport)).environment).toEqual(facts);
  expect(transport).toHaveBeenCalledWith(url, {
    credentials: "omit",
    cache: "no-store",
    signal: expect.any(AbortSignal),
  });
  transport.mockResolvedValue(new Response('{"token":"test"}'));
  await expect(bootstrap(undefined, url, transport)).rejects.toThrow("invalid");
  transport.mockResolvedValue(new Response("missing", { status: 404 }));
  await expect(bootstrap(undefined, url, transport)).rejects.toThrow("404");
});

it("shows a safe actionable failure, serializes explicit retries and aborts a pending bootstrap on disposal", async () => {
  const root = document.createElement("main"),
    secret = "private-capability-and-host-details",
    mounted = vi.fn();
  let aborted = false;
  const transport = vi
    .fn<typeof fetch>()
    .mockRejectedValueOnce(Error(secret))
    .mockImplementation(
      (_url, init) =>
        new Promise((_done, reject) => {
          init?.signal?.addEventListener("abort", () => {
            aborted = true;
            reject(init.signal?.reason);
          });
        }),
    );
  const startup = start(root, {
    url: new URL("http://127.0.0.1:4010/bootstrap.json"),
    entry: "#project=original-target",
    transport,
    mounted,
  });
  try {
    await startup.ready;
    expect(root.querySelector('[role="alert"]')?.textContent).toContain("实例已启动后重试");
    expect(root.textContent).not.toContain(secret);
    expect(startup.view).toBeUndefined();
    const retry = root.querySelector<HTMLButtonElement>('button[aria-label="重试连接"]')!;
    retry.click();
    retry.click();
    expect(root.getAttribute("aria-busy")).toBe("true");
    expect(transport).toHaveBeenCalledTimes(2);
    await startup.dispose();
    expect(aborted).toBe(true);
    expect(root.childElementCount).toBe(0);
    expect(root.hasAttribute("aria-busy")).toBe(false);
    expect(mounted).not.toHaveBeenCalled();
  } finally {
    await startup.dispose();
  }
});

it("turns an expired bootstrap deadline into an explicit retry state without exposing transport diagnostics", async () => {
  const deadline = new AbortController(),
    timeout = vi.spyOn(AbortSignal, "timeout").mockReturnValue(deadline.signal),
    root = document.createElement("main");
  const transport = vi.fn<typeof fetch>().mockImplementation(
    (_url, init) =>
      new Promise((_done, reject) => {
        init?.signal?.addEventListener("abort", () => reject(Error("private endpoint timeout")));
      }),
  );
  const startup = start(root, {
    url: new URL("http://127.0.0.1:4010/bootstrap.json"),
    entry: "",
    transport,
  });
  try {
    expect(timeout).toHaveBeenCalledWith(10000);
    deadline.abort();
    await startup.ready;
    expect(root.querySelector('[role="alert"]')).not.toBeNull();
    expect(root.textContent).not.toContain("private endpoint");
    expect(root.querySelector<HTMLButtonElement>("button")?.hidden).toBe(false);
  } finally {
    await startup.dispose();
    timeout.mockRestore();
  }
});
