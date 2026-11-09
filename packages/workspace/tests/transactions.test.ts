import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import { expect, it } from "vitest";
import { initialFiles, Workspace } from "@";

it("serializes two actual processes replaying one command without duplicate sessions", async () => {
  const root = mkdtempSync(join(tmpdir(), "workspace-writers-"));
  const request = { requestId: randomUUID(), title: "concurrent", mode: "motion" };
  const entry = fileURLToPath(new URL("../dist/index.mjs", import.meta.url));
  const code = `import{Workspace}from ${JSON.stringify(entry)};const db=new Workspace(process.argv[1]);console.log(JSON.stringify(db.execute('session_create',JSON.parse(process.argv[2]))));db.close();`;
  try {
    const run = () =>
      new Promise<string>((done, reject) => {
        const child = spawn(process.execPath, ["--input-type=module", "-e", code, root, JSON.stringify(request)], {
          stdio: ["ignore", "pipe", "pipe"],
        });
        let output = "",
          errors = "";
        child.stdout.on("data", (chunk) => {
          output += chunk;
        });
        child.stderr.on("data", (chunk) => {
          errors += chunk;
        });
        child.once("error", reject);
        child.once("exit", (status) => (status === 0 ? done(output.trim()) : reject(new Error(errors))));
      });
    const outputs = await Promise.all([run(), run()]);
    expect(outputs[0]).toBe(outputs[1]);
    const db = new Workspace(root);
    try {
      expect(db.execute("workspace_state", {}).sessions).toHaveLength(1);
    } finally {
      db.close();
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}, 10000);
it("rejects corrupt source snapshots rather than silently repairing or publishing them", () => {
  const root = mkdtempSync(join(tmpdir(), "workspace-integrity-"));
  const db = new Workspace(root);
  try {
    const session = db.execute("session_create", { requestId: randomUUID(), mode: "motion", title: "session" });
    const artifact = db.execute("artifact_create", {
      requestId: randomUUID(),
      sessionId: session.id,
      title: "native",
      files: initialFiles(),
    });
    const raw = new DatabaseSync(join(root, "workspace.sqlite"));
    raw.prepare("UPDATE revisions SET files=?").run(JSON.stringify([{ path: "index.html", content: "tampered" }]));
    raw.close();
    expect(() => db.execute("project_read", { sessionId: session.id, artifactId: artifact.id })).toThrow(
      "content mismatch",
    );
  } finally {
    db.close();
    rmSync(root, { recursive: true, force: true });
  }
});

it("rolls back a real storage failure without orphan projects, snapshots or selection changes", () => {
  const root = mkdtempSync(join(tmpdir(), "workspace-storage-failure-"));
  const db = new Workspace(root);
  const raw = new DatabaseSync(join(root, "workspace.sqlite"));
  try {
    const session = db.execute("session_create", {
      requestId: randomUUID(),
      title: "preserved",
      mode: "motion",
      instruction: "保留需求",
    });
    raw.exec(
      "CREATE TRIGGER fail_artifact BEFORE INSERT ON artifacts BEGIN SELECT RAISE(ABORT,'injected storage failure'); END",
    );
    const request = { requestId: randomUUID(), sessionId: session.id, title: "native", files: initialFiles() };
    expect(() => db.execute("artifact_create", request)).toThrow("injected storage failure");
    expect(raw.prepare("SELECT count(*) AS n FROM projects").get()?.n).toBe(0);
    expect(raw.prepare("SELECT count(*) AS n FROM revisions").get()?.n).toBe(0);
    expect(db.execute("session_get", { sessionId: session.id }).messages[0]?.content).toBe("保留需求");
    raw.exec("DROP TRIGGER fail_artifact");
    const artifact = db.execute("artifact_create", request);
    const selected = db.execute("artifact_open", {
      requestId: randomUUID(),
      sessionId: session.id,
      artifactId: artifact.id,
      expectedSelection: 0,
      expectedCurrent: null,
    });
    const current = db.execute("project_read", { sessionId: session.id, artifactId: artifact.id });
    raw.exec(
      "CREATE TRIGGER fail_save BEFORE UPDATE ON projects BEGIN SELECT RAISE(ABORT,'injected storage failure'); END",
    );
    const save = {
      requestId: randomUUID(),
      sessionId: session.id,
      artifactId: artifact.id,
      expectedRevision: current.revision,
      files: [{ path: "index.html", content: "changed" }],
    };
    expect(() => db.execute("project_save", save)).toThrow("injected storage failure");
    expect(db.execute("project_read", { sessionId: session.id, artifactId: artifact.id })).toEqual(current);
    expect(db.execute("workspace_state", {}).selection).toEqual(selected);
    expect(raw.prepare("SELECT count(*) AS n FROM revisions").get()?.n).toBe(1);
    raw.exec("DROP TRIGGER fail_save");
    expect(db.execute("project_save", save).revision).not.toBe(current.revision);
  } finally {
    raw.close();
    db.close();
    rmSync(root, { recursive: true, force: true });
  }
});
