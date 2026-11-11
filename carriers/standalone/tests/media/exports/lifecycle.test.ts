import { createHash, randomUUID } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { browser } from "@odsuite/automation";

import { channel, namespace } from "@odsuite/protocol";
import { observeProcesses, readDirectory } from "@odsuite/sidecar";
import type { Tools } from "@open-motion/render";
import { expect, it } from "vitest";
import { open } from "@";

type Resource = Tools["browser"]["resource"];
const source = (duration: number) =>
  `<html><body><main data-composition-id="main" data-width="160" data-height="90" data-duration="${duration}"><svg width="160" height="90"><rect id="square" width="40" height="40" fill="red"/></svg></main><script>window.__timelines={main:gsap.timeline({paused:true}).to('#square',{attr:{x:100},duration:${duration},ease:'none'})};</script></body></html>`;
it.runIf(Boolean(process.env.OPEN_MOTION_NATIVE_MANIFEST))(
  "exports through the actual Web UI, downloads verified films and preserves jobs across carrier restart",
  async () => {
    const manifestPath = resolve(process.env.OPEN_MOTION_NATIVE_MANIFEST!),
      manifest = JSON.parse(await readFile(manifestPath, "utf8")),
      evidence = fileURLToPath(new URL(`../../../../../.artifacts/export-browser/${randomUUID()}/`, import.meta.url)),
      root = join(evidence, "sidecar"),
      scope = { channel: channel("dev"), namespace: namespace("export-browser") };
    await mkdir(evidence, { recursive: true });
    const tool = (name: string) => {
      const item = manifest[name] as { path: string; resource: Resource; executable: string };
      return {
        resource: item.resource,
        executable: item.executable,
        load: async () => createReadStream(resolve(dirname(manifestPath), item.path)),
      };
    };
    const tools: Tools = { browser: tool("browser"), ffmpeg: tool("ffmpeg"), ffprobe: tool("ffprobe") };
    let runtime: Awaited<ReturnType<typeof open>> | undefined, driver: Awaited<ReturnType<typeof browser>> | undefined;
    const report: Record<string, unknown> = {};
    try {
      runtime = await open({ root, scope, tools, version: "0.6.1-dev.1" });
      const session = await runtime.execute("session_create", {
          requestId: randomUUID(),
          title: "Web exports",
          mode: "motion",
        }),
        artifact = await runtime.execute("artifact_create", {
          requestId: randomUUID(),
          sessionId: session.id,
          title: "Film",
          files: [{ path: "index.html", content: source(1) }],
        }),
        owner = { sessionId: session.id, artifactId: artifact.id };
      await runtime.execute("artifact_open", {
        ...owner,
        requestId: randomUUID(),
        expectedSelection: 0,
        expectedCurrent: null,
      });
      driver = await browser({ evidence, viewport: { width: 1600, height: 1100 } });
      const page = driver.page;
      page.setDefaultTimeout(10000);
      await page.goto((await runtime.status()).web);
      const panel = page.getByLabel("影片导出", { exact: true });
      await panel.locator("summary").click();
      let drop = true;
      await page.route("**/api/export_create", async (route) => {
        const response = await route.fetch();
        if (drop) {
          drop = false;
          await response.body();
          await route.abort("failed");
        } else await route.fulfill({ response });
      });
      await panel.getByRole("button", { name: "导出 MP4（30fps）", exact: true }).click();
      await panel.getByRole("button", { name: "重试导出提交", exact: true }).click();
      await expect
        .poll(async () => (await runtime!.execute("export_list", owner)).jobs[0]?.state, { timeout: 60000 })
        .toBe("succeeded");
      await panel.getByRole("button", { name: "下载 MP4", exact: true }).waitFor();
      const downloadEvent = page.waitForEvent("download");
      await panel.getByRole("button", { name: "下载 MP4", exact: true }).click();
      const download = await downloadEvent,
        film = join(evidence, "web-film.mp4");
      await download.saveAs(film);
      const first = (await runtime.execute("export_list", owner)).jobs[0]!;
      expect(
        `sha256:${createHash("sha256")
          .update(await readFile(film))
          .digest("hex")}`,
      ).toBe(first.result?.verification.digest);
      expect(first.result?.verification.frames).toBe(30);
      expect((await readFile(film)).subarray(4, 8).toString()).toBe("ftyp");
      const previousTicket = await runtime.execute("export_download", { ...owner, id: first.id });
      expect((await fetch(previousTicket.url, { method: "HEAD" })).status).toBe(200);
      let project = await runtime.execute("project_read", owner);
      project = await runtime.execute("project_save", {
        ...owner,
        requestId: randomUUID(),
        expectedRevision: project.revision,
        files: [{ path: "index.html", content: source(20) }],
      });
      await page.getByRole("button", { name: "刷新", exact: true }).click();
      await expect.poll(() => page.getByLabel("revision", { exact: true }).textContent()).toBe(project.revision);
      await panel.getByRole("button", { name: "导出 MP4（30fps）", exact: true }).click();
      await expect.poll(async () => (await runtime!.execute("export_list", owner)).jobs.length).toBe(2);
      const second = (await runtime.execute("export_list", owner)).jobs[0]!,
        row = panel.locator(`[data-export-id="${second.id}"]`);
      await row.getByRole("button", { name: "取消导出" }).click();
      await expect
        .poll(async () => (await runtime!.execute("export_read", { ...owner, id: second.id })).state, {
          timeout: 15000,
        })
        .toBe("cancelled");
      project = await runtime.execute("project_save", {
        ...owner,
        requestId: randomUUID(),
        expectedRevision: project.revision,
        files: [{ path: "index.html", content: source(1) }],
      });
      await row.getByRole("button", { name: "重试此导出" }).click();
      await expect
        .poll(async () => (await runtime!.execute("export_read", { ...owner, id: second.id })).state, {
          timeout: 90000,
        })
        .toBe("succeeded");
      const retried = await runtime.execute("export_read", { ...owner, id: second.id });
      expect(retried.result?.spec.duration).toBe(20);
      expect(retried.revision).not.toBe(project.revision);
      report.jobs = [first, retried];
      await runtime.close();
      runtime = undefined;
      expect((await readDirectory(root)).manager.phase).toBe("closed");
      expect(await observeProcesses(root)).toEqual([]);
      runtime = await open({ root, scope, tools, version: "0.6.1-dev.1" });
      await page.goto((await runtime.status()).web);
      expect((await runtime.execute("export_read", { ...owner, id: second.id })).result).toEqual(retried.result);
      const fresh = await runtime.execute("export_download", { ...owner, id: first.id });
      expect(
        createHash("sha256")
          .update(Buffer.from(await (await fetch(fresh.url)).arrayBuffer()))
          .digest("hex"),
      ).toBe(first.result?.verification.digest.slice(7));
      await expect.poll(() => panel.locator("[data-export-id]").count()).toBe(2);
      await panel.locator("summary").click();
      expect(driver.errors).toEqual([]);
      await page.screenshot({ path: join(evidence, "restored.png"), fullPage: true });
    } finally {
      await driver?.close();
      await runtime?.close();
    }
    report.closed = (await readDirectory(root)).manager.phase;
    report.processes = await observeProcesses(root);
    await writeFile(join(evidence, "result.json"), JSON.stringify(report, null, 2));
  },
  180000,
);
