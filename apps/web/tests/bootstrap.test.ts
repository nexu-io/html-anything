import { expect, it, vi } from "vitest";
import { bootstrap } from "@/lib/bootstrap.js";

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
  expect(transport).toHaveBeenCalledWith(url, { credentials: "omit", cache: "no-store" });
  transport.mockResolvedValue(new Response('{"token":"test"}'));
  await expect(bootstrap(undefined, url, transport)).rejects.toThrow("invalid");
  transport.mockResolvedValue(new Response("missing", { status: 404 }));
  await expect(bootstrap(undefined, url, transport)).rejects.toThrow("404");
});
