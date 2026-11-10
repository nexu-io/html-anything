import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { channel, digest, namespace } from "@odsuite/protocol";
import { observeProcesses, readDirectory } from "@odsuite/sidecar";
import type { Tools } from "@open-motion/render";
import { initialFiles } from "@open-motion/workspace/contract";
import { expect, it } from "vitest";
import { open } from "@";

it("owns export intent beyond HTTP requests, cancels actual work and restores interrupted/queued jobs", async () => {
  const evidence = fileURLToPath(new URL(`../../../../.artifacts/export-jobs/${randomUUID()}/`, import.meta.url)),
    root = join(evidence, "sidecar"),
    scope = { channel: channel("dev"), namespace: namespace("exports") };
  await mkdir(evidence, { recursive: true });
  let fail = false;
  const tool = {
      resource: {
        type: "directory" as const,
        artifact: { kind: "blob" as const, slot: "fixture", bytes: 0, digest: digest("") },
      },
      executable: "tool",
      load: async (signal: AbortSignal): Promise<Uint8Array> => {
        if (fail) throw Error("fixture tool unavailable");
        return new Promise((_done, reject) => {
          if (signal.aborted) reject(signal.reason);
          else signal.addEventListener("abort", () => reject(signal.reason), { once: true });
        });
      },
    },
    tools: Tools = { browser: tool, ffmpeg: tool, ffprobe: tool };
  let runtime: Awaited<ReturnType<typeof open>> | undefined;
  const report: Record<string, unknown> = {};
  try {
    runtime = await open({ root, scope, tools, version: "0.6.1-dev.1" });
    const session = await runtime.execute("session_create", {
        requestId: randomUUID(),
        title: "Exports",
        mode: "motion",
      }),
      other = await runtime.execute("session_create", { requestId: randomUUID(), title: "Other", mode: "motion" }),
      artifact = await runtime.execute("artifact_create", {
        requestId: randomUUID(),
        sessionId: session.id,
        title: "Film",
        files: initialFiles(),
      }),
      owner = { sessionId: session.id, artifactId: artifact.id },
      project = await runtime.execute("project_read", owner),
      input = { ...owner, requestId: randomUUID(), revision: project.revision, fps: { num: 12, den: 1 } },
      first = await runtime.execute("export_create", input),
      second = await runtime.execute("export_create", { ...input, requestId: randomUUID() });
    await expect
      .poll(
        async () =>
          (await runtime!.manager.factory(scope).directory()).instances.some(
            (p) => p.service === "render" && p.phase === "ready" && !!p.process,
          ),
        { timeout: 15000 },
      )
      .toBe(true);
    const changed = await runtime.execute("project_save", {
      ...owner,
      requestId: randomUUID(),
      expectedRevision: project.revision,
      files: initialFiles().map((f) => ({
        ...f,
        content: f.content.replace("<title>Motion</title>", "<title>Changed after queue</title>"),
      })),
    });
    expect(await runtime.execute("export_create", input)).toEqual(first);
    expect((await runtime.execute("export_list", owner)).jobs).toHaveLength(2);
    await expect(runtime.execute("export_create", { ...input, fps: { num: 30, den: 1 } })).rejects.toThrow(
      "identity reused",
    );
    await expect(runtime.execute("export_read", { ...owner, sessionId: other.id, id: first.id })).rejects.toThrow(
      "belong",
    );
    const cancel = { ...owner, id: second.id, requestId: randomUUID(), expectedVersion: second.version };
    const cancelled = await runtime.execute("export_cancel", cancel);
    expect(cancelled.state).toBe("cancelled");
    expect(await runtime.execute("export_cancel", cancel)).toEqual(cancelled);
    let current = await runtime.execute("export_read", { ...owner, id: first.id });
    await runtime.execute("export_cancel", {
      ...owner,
      id: first.id,
      requestId: randomUUID(),
      expectedVersion: current.version,
    });
    await expect
      .poll(async () => (await runtime!.execute("export_read", { ...owner, id: first.id })).state, { timeout: 15000 })
      .toBe("cancelled");
    fail = true;
    const retried = await runtime.execute("export_retry", {
      ...owner,
      id: second.id,
      requestId: randomUUID(),
      expectedVersion: cancelled.version,
    });
    expect(retried.revision).toBe(project.revision);
    expect(retried.attempt).not.toBe(second.attempt);
    await expect
      .poll(async () => (await runtime!.execute("export_read", { ...owner, id: second.id })).state, { timeout: 15000 })
      .toBe("failed");
    await expect(runtime.execute("export_download", { ...owner, id: second.id })).rejects.toThrow("no verified film");
    fail = false;
    const third = await runtime.execute("export_create", { ...input, requestId: randomUUID() }),
      fourth = await runtime.execute("export_create", { ...input, requestId: randomUUID() });
    await expect
      .poll(
        async () =>
          (await runtime!.manager.factory(scope).directory()).instances.some(
            (p) => p.service === "render" && p.phase === "ready" && !!p.process,
          ),
        { timeout: 15000 },
      )
      .toBe(true);
    await runtime.close();
    runtime = undefined;
    expect((await readDirectory(root)).manager.phase).toBe("closed");
    expect(await observeProcesses(root)).toEqual([]);
    fail = true;
    runtime = await open({ root, scope, tools, version: "0.6.1-dev.1" });
    current = await runtime.execute("export_read", { ...owner, id: third.id });
    expect(current.state).toBe("interrupted");
    await expect
      .poll(async () => (await runtime!.execute("export_read", { ...owner, id: fourth.id })).state, { timeout: 15000 })
      .toBe("failed");
    expect((await runtime.execute("project_read", owner)).revision).toBe(changed.revision);
    expect((await runtime.execute("project_snapshot", { ...owner, revision: first.revision })).files).toEqual(
      project.files,
    );
    const page = await runtime.execute("export_list", { ...owner, limit: 2 });
    expect(page.jobs.map((j) => j.id)).toEqual([fourth.id, third.id]);
    expect(page.next).toBe(third.id);
    const older = await runtime.execute("export_list", { ...owner, limit: 2, before: page.next! });
    expect(older.jobs.map((j) => j.id)).toEqual([second.id, first.id]);
    expect(older.next).toBeNull();
    await expect(runtime.execute("export_list", { ...owner, limit: 17 })).rejects.toThrow();
    report.jobs = [...page.jobs, ...older.jobs];
  } finally {
    await runtime?.close();
  }
  report.directory = (await readDirectory(root)).manager.phase;
  report.processes = await observeProcesses(root);
  await writeFile(join(evidence, "result.json"), JSON.stringify(report, null, 2));
}, 60000);
