import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { NextRequest } from "next/server";
import type { InvokeEvent } from "@/lib/agents/invoke";

vi.mock("@/lib/agents/invoke", () => ({
  invokeAgent: vi.fn(),
}));

import { POST } from "../route";
import { invokeAgent } from "@/lib/agents/invoke";

/** Mock invokeAgent by returning a stream of InvokeEvent OBJECTS (the route
 *  reads value.type off each chunk, then encodes to SSE itself). */
function fakeInvokeStream(events: InvokeEvent[]): ReadableStream<InvokeEvent> {
  return new ReadableStream({
    start(controller) {
      for (const ev of events) controller.enqueue(ev);
      controller.close();
    },
  });
}

async function readSse(res: Response): Promise<Array<{ event: string; data: unknown }>> {
  const out: Array<{ event: string; data: unknown }> = [];
  const reader = res.body?.getReader();
  if (!reader) return out;
  const dec = new TextDecoder();
  let buf = "";
  let lastEvent = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let blank: number;
    while ((blank = buf.indexOf("\n\n")) !== -1) {
      const rawBlock = buf.slice(0, blank);
      buf = buf.slice(blank + 2);
      // A single chunk may contain multiple SSE events; split them.
      for (const block of rawBlock.split("\n\n")) {
        if (!block.trim()) continue;
        const lines = block.split("\n");
        let event = lastEvent;
        const dataLines: string[] = [];
        for (const l of lines) {
          if (l.startsWith("event:")) event = l.slice(6).trim();
          else if (l.startsWith("data:")) dataLines.push(l.slice(5).trim());
        }
        if (event) lastEvent = event;
        if (dataLines.length) {
          out.push({ event, data: JSON.parse(dataLines.join("\n")) });
        }
      }
    }
  }
  return out;
}

function post(body: unknown): Promise<Response> {
  const req = new NextRequest("http://127.0.0.1/api/convert", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return POST(req);
}

describe("POST /api/convert", () => {
  beforeEach(() => {
    vi.mocked(invokeAgent).mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns 400 for missing required fields", async () => {
    const res = await post({ agent: "claude", templateId: "deck-swiss-international" });
    expect(res.status).toBe(400);
  });

  it("returns 400 for unknown template", async () => {
    const res = await post({ agent: "claude", templateId: "not-real", content: "hi" });
    expect(res.status).toBe(400);
  });

  it("streams start, deltas, and done from the mocked agent", async () => {
    vi.mocked(invokeAgent).mockReturnValue(
      fakeInvokeStream([
        { type: "start", bin: "/bin/claude", argv: ["-p"], promptBytes: 100 },
        { type: "delta", text: "<html>" },
        { type: "delta", text: "</html>" },
        { type: "done", code: 0 },
      ]),
    );

    const res = await post({ agent: "claude", templateId: "deck-swiss-international", content: "hi" });
    expect(res.status).toBe(200);
    const events = await readSse(res);
    expect(events.map((e) => e.event)).toEqual(["start", "delta", "delta", "done"]);
    expect(events.filter((e) => e.event === "delta").map((e) => (e.data as { text: string }).text).join("")).toBe("<html></html>");
  });

  it("propagates an error event from the agent", async () => {
    vi.mocked(invokeAgent).mockReturnValue(
      fakeInvokeStream([
        { type: "start", bin: "/bin/claude", argv: ["-p"], promptBytes: 100 },
        { type: "error", message: "agent crashed" },
        { type: "done", code: 1 },
      ]),
    );

    const res = await post({ agent: "claude", templateId: "deck-swiss-international", content: "hi" });
    expect(res.status).toBe(200);
    const events = await readSse(res);
    expect(events.some((e) => e.event === "error")).toBe(true);
  });

  it("applies the 2 MiB body cap", async () => {
    const res = await post({
      agent: "claude",
      templateId: "deck-swiss-international",
      content: "x".repeat(3 * 1024 * 1024),
    });
    expect(res.status).toBe(413);
  });

  it("ignores cwd in the request body (security: not accepted)", async () => {
    vi.mocked(invokeAgent).mockImplementation((opts: { cwd?: string }) => {
      // Route should NOT pass cwd through; assert the mock was called without it.
      expect(opts.cwd).toBeUndefined();
      return fakeInvokeStream([{ type: "done", code: 0 }]);
    });
    const res = await post({
      agent: "claude",
      templateId: "deck-swiss-international",
      content: "hi",
      cwd: "/tmp/evil",
    });
    expect(res.status).toBe(200);
    expect(vi.mocked(invokeAgent)).toHaveBeenCalled();
  });
});
