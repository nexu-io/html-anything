// @vitest-environment happy-dom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ProjectSnapshot } from "./projects/contracts";
import { useStore } from "./store";
import { useConvert } from "./use-convert";

vi.mock("./history/db", () => ({
  deleteTaskRuns: vi.fn(async () => undefined),
  putRun: vi.fn(async () => null),
}));

const PROJECT_ID = "AbCdEfGhIjKlMnOpQrStUg";
const ORIGINAL_HTML = "<!doctype html><html><body>original</body></html>";
const reactTestEnvironment = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT: boolean;
};

function snapshot(): ProjectSnapshot {
  return {
    project: {
      schemaVersion: 1,
      projectId: PROJECT_ID,
      slug: "demo",
      name: "Demo",
      instruction: "Build a demo.",
      templateId: "landing-page",
      format: "markdown",
      agent: "codex",
      sources: [],
      status: "ready",
      createdAt: "2026-07-21T00:00:00.000Z",
      updatedAt: "2026-07-21T00:00:00.000Z",
    },
    content: "# Demo",
    html: ORIGINAL_HTML,
    url: `https://host.ts.net/projects/${PROJECT_ID}`,
    artifactDirectory: "artifacts/html-anything/demo",
  };
}

async function renderConvert(): Promise<{
  root: Root;
  run: ReturnType<typeof useConvert>["run"];
  cancel: ReturnType<typeof useConvert>["cancel"];
}> {
  let convert: ReturnType<typeof useConvert> | undefined;
  function Harness() {
    convert = useConvert();
    return null;
  }
  const root = createRoot(document.createElement("div"));
  await act(async () => root.render(createElement(Harness)));
  return {
    root,
    run: (request) => convert!.run(request),
    cancel: (taskId) => convert!.cancel(taskId),
  };
}

beforeEach(() => {
  reactTestEnvironment.IS_REACT_ACT_ENVIRONMENT = true;
  localStorage.clear();
  useStore.setState({ tasks: [], activeTaskId: "" });
});

afterEach(() => {
  reactTestEnvironment.IS_REACT_ACT_ENVIRONMENT = false;
  vi.unstubAllGlobals();
});

describe("useConvert project runs", () => {
  it("restores the last valid HTML when a conversion is canceled", async () => {
    const taskId = useStore.getState().loadServerProject(snapshot());
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
        const stream = new ReadableStream<Uint8Array>({
          start(controller) {
            controller.enqueue(
              new TextEncoder().encode(
                'event: delta\ndata: {"text":"<html><body>partial"}\n\n',
              ),
            );
            init?.signal?.addEventListener(
              "abort",
              () => controller.error(new DOMException("Aborted", "AbortError")),
              { once: true },
            );
          },
        });
        return new Response(stream, {
          status: 200,
          headers: { "Content-Type": "text/event-stream" },
        });
      }),
    );
    const harness = await renderConvert();
    let runPromise: Promise<void>;

    await act(async () => {
      runPromise = harness.run({
        taskId,
        agent: "codex",
        templateId: "landing-page",
        content: "# Demo",
        format: "markdown",
        projectId: PROJECT_ID,
      });
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(useStore.getState().tasks.find((task) => task.id === taskId)?.html).toBe(
      "<html><body>partial",
    );

    await act(async () => {
      harness.cancel(taskId);
      await runPromise!;
    });

    expect(useStore.getState().tasks.find((task) => task.id === taskId)?.html).toBe(
      ORIGINAL_HTML,
    );
    await act(async () => harness.root.unmount());
  });

  it("restores the last valid HTML when the conversion stream reports an error", async () => {
    const taskId = useStore.getState().loadServerProject(snapshot());
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          [
            'event: delta\ndata: {"text":"<html><body>partial"}\n\n',
            'event: error\ndata: {"message":"agent failed"}\n\n',
          ].join(""),
          {
            status: 200,
            headers: { "Content-Type": "text/event-stream" },
          },
        ),
      ),
    );
    const harness = await renderConvert();

    await act(async () => {
      await harness.run({
        taskId,
        agent: "codex",
        templateId: "landing-page",
        content: "# Demo",
        format: "markdown",
        projectId: PROJECT_ID,
      });
    });

    expect(useStore.getState().tasks.find((task) => task.id === taskId)).toMatchObject({
      html: ORIGINAL_HTML,
      status: "error",
    });
    await act(async () => harness.root.unmount());
  });

  it.each([
    ["a nonzero terminal event", 'event: done\ndata: {"code":2}\n\n'],
    ["a stream without a terminal event", ""],
  ])("restores the last valid HTML after %s", async (_label, terminalEvent) => {
    const taskId = useStore.getState().loadServerProject(snapshot());
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          `event: delta\ndata: {"text":"<html><body>partial"}\n\n${terminalEvent}`,
          {
            status: 200,
            headers: { "Content-Type": "text/event-stream" },
          },
        ),
      ),
    );
    const harness = await renderConvert();

    await act(async () => {
      await harness.run({
        taskId,
        agent: "codex",
        templateId: "landing-page",
        content: "# Demo",
        format: "markdown",
        projectId: PROJECT_ID,
      });
    });

    expect(useStore.getState().tasks.find((task) => task.id === taskId)).toMatchObject({
      html: ORIGINAL_HTML,
      status: "error",
    });
    await act(async () => harness.root.unmount());
  });

  it("sends only the project ID needed for server-side workspace resolution", async () => {
    const taskId = useStore.getState().loadServerProject(snapshot());
    const fetchMock = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit) =>
        new Response('event: done\ndata: {"code":0}\n\n', {
          status: 200,
          headers: { "Content-Type": "text/event-stream" },
        }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const harness = await renderConvert();

    await act(async () => {
      await harness.run({
        taskId,
        agent: "codex",
        templateId: "landing-page",
        content: "# Demo",
        format: "markdown",
        projectId: PROJECT_ID,
      });
    });

    const body = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    expect(body.projectId).toBe(PROJECT_ID);
    expect(body).not.toHaveProperty("cwd");
    await act(async () => harness.root.unmount());
  });

  it("does not let a stale canceled run clobber a newer conversion", async () => {
    const taskId = useStore.getState().loadServerProject(snapshot());
    let rejectCanceledRun = () => {};
    let call = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
        call += 1;
        const currentCall = call;
        return new Response(
          new ReadableStream<Uint8Array>({
            start(controller) {
              if (currentCall === 1) {
                controller.enqueue(
                  new TextEncoder().encode(
                    'event: delta\ndata: {"text":"<html>A"}\n\n',
                  ),
                );
                init?.signal?.addEventListener(
                  "abort",
                  () => {
                    rejectCanceledRun = () =>
                      controller.error(new DOMException("Aborted", "AbortError"));
                  },
                  { once: true },
                );
              } else {
                controller.enqueue(
                  new TextEncoder().encode(
                    'event: delta\ndata: {"text":"<html>B"}\n\n',
                  ),
                );
                init?.signal?.addEventListener(
                  "abort",
                  () => controller.error(new DOMException("Aborted", "AbortError")),
                  { once: true },
                );
              }
            },
          }),
          { status: 200, headers: { "Content-Type": "text/event-stream" } },
        );
      }),
    );
    const harness = await renderConvert();
    let firstRun: Promise<void>;
    let secondRun: Promise<void>;
    const runRequest = {
      taskId,
      agent: "codex",
      templateId: "landing-page",
      content: "# Demo",
      format: "markdown",
      projectId: PROJECT_ID,
    };

    await act(async () => {
      firstRun = harness.run(runRequest);
      await Promise.resolve();
      await Promise.resolve();
    });
    await act(async () => {
      secondRun = harness.run(runRequest);
      await Promise.resolve();
      await Promise.resolve();
    });
    await act(async () => {
      rejectCanceledRun();
      await firstRun!;
    });

    expect(useStore.getState().tasks.find((task) => task.id === taskId)).toMatchObject({
      html: "<html>B",
      status: "running",
    });

    await act(async () => {
      harness.cancel(taskId);
      await secondRun!;
      await harness.root.unmount();
    });
  });
});
