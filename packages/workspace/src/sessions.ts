import { randomUUID } from "node:crypto";
import { Fault, type Input, type Message, type Session, type SessionDetail } from "./contract.js";
import type { Database } from "./database.js";
export class Sessions {
  constructor(private db: Database) {}
  list(): Session[] {
    return this.db.all(
      "SELECT id,title,mode,created_at AS createdAt,last_artifact_id AS activeArtifactId FROM sessions ORDER BY created_at,id",
    ) as unknown as Session[];
  }
  get(id: string): SessionDetail {
    const session = this.db.one(
      "SELECT id,title,mode,created_at AS createdAt,last_artifact_id AS activeArtifactId FROM sessions WHERE id=?",
      id,
    );
    if (!session) throw new Fault("missing", "session does not exist");
    return {
      ...session,
      messages: this.db.all(
        "SELECT id,session_id AS sessionId,role,content,created_at AS createdAt FROM messages WHERE session_id=? ORDER BY created_at,rowid",
        id,
      ),
      artifacts: this.db.all(
        "SELECT id,session_id AS sessionId,project_id AS projectId,'motion-project' AS kind,title,created_at AS createdAt FROM artifacts WHERE session_id=? ORDER BY created_at,rowid",
        id,
      ),
    } as unknown as SessionDetail;
  }
  create(input: Input<"session_create">): SessionDetail {
    const id = randomUUID();
    this.db.run(
      "INSERT INTO sessions(id,title,mode,created_at) VALUES(?,?,?,?)",
      id,
      input.title,
      input.mode,
      Date.now(),
    );
    if (input.instruction)
      this.message({ requestId: input.requestId, sessionId: id, role: "user", content: input.instruction });
    return this.get(id);
  }
  rename(input: Input<"session_rename">): SessionDetail {
    this.get(input.sessionId);
    this.db.run("UPDATE sessions SET title=? WHERE id=?", input.title, input.sessionId);
    return this.get(input.sessionId);
  }
  message(input: Input<"message_append">): Message {
    this.get(input.sessionId);
    const result: Message = {
      id: randomUUID(),
      sessionId: input.sessionId,
      role: input.role,
      content: input.content,
      createdAt: Date.now(),
    };
    this.db.run(
      "INSERT INTO messages VALUES(?,?,?,?,?)",
      result.id,
      result.sessionId,
      result.role,
      result.content,
      result.createdAt,
    );
    return result;
  }
}
