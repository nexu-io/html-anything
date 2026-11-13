import { expect, it } from "vitest";
import { Client } from "@/transport/client.js";

it("retries a lost preview response with the same read-view identity and retires it explicitly", async () => {
  let lose = true;
  const ids: string[] = [];
  const closes: string[] = [];
  const client = new Client("http://127.0.0.1:48000", "capability", async (input, init) => {
    const body = JSON.parse(String(init?.body));
    if (String(input).endsWith("/preview/close")) {
      closes.push(body.id);
      expect(init?.keepalive).toBe(true);
      return new Response('{"closed":true}');
    }
    ids.push(body.id);
    if (lose) {
      lose = false;
      throw new Error("response lost after open");
    }
    return new Response(JSON.stringify({ id: body.id, revision: body.expectedRevision }));
  });
  const project = {
    sessionId: crypto.randomUUID(),
    artifactId: crypto.randomUUID(),
    revision: `sha256:${"a".repeat(64)}`,
  };
  await expect(client.preview(project)).rejects.toThrow("response lost");
  const view = await client.preview(project);
  expect(ids[0]).toBe(view.id);
  expect(ids[1]).toBe(view.id);
  await client.closePreview(view.id);
  expect(closes).toEqual([view.id]);
  const next = await client.preview(project);
  expect(next.id).not.toBe(view.id);
});
