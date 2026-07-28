import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { parseLine, makeParser, envFor } from "../argv";

describe("parseLine opencode", () => {
  it("extracts text from nested part payload", () => {
    const line = JSON.stringify({
      type: "text",
      sessionID: "ses_test",
      part: {
        type: "text",
        text: "<html><body>ok</body></html>",
      },
    });

    expect(parseLine("opencode", line)).toContainEqual({
      kind: "delta",
      text: "<html><body>ok</body></html>",
    });
  });

  it("emits one delta when top-level and nested text are both present", () => {
    const line = JSON.stringify({
      type: "text",
      text: "<html><body>ok</body></html>",
      part: {
        type: "text",
        text: "<html><body>ok</body></html>",
      },
    });

    expect(parseLine("opencode", line)).toEqual([
      {
        kind: "delta",
        text: "<html><body>ok</body></html>",
      },
    ]);
  });

  it("falls back to top-level text when nested text is empty", () => {
    const line = JSON.stringify({
      type: "text",
      content: "<html>ok</html>",
      part: {
        type: "text",
        text: "",
      },
    });

    expect(parseLine("opencode", line)).toEqual([
      {
        kind: "delta",
        text: "<html>ok</html>",
      },
    ]);
  });

  it("extracts session only from step start payload", () => {
    expect(
      parseLine(
        "opencode",
        JSON.stringify({
          type: "step_start",
          sessionID: "ses_test",
          part: {
            type: "step-start",
          },
        }),
      ),
    ).toContainEqual({
      kind: "meta",
      key: "session",
      value: "ses_test",
    });

    expect(
      parseLine(
        "opencode",
        JSON.stringify({
          type: "text",
          sessionID: "ses_test",
          part: {
            type: "text",
            text: "ok",
          },
        }),
      ),
    ).not.toContainEqual({
      kind: "meta",
      key: "session",
      value: "ses_test",
    });
  });

  it("extracts usage from step finish payload and accumulates successive steps", () => {
    const line1 = JSON.stringify({
      type: "step_finish",
      part: {
        type: "step-finish",
        tokens: {
          input: 10,
          output: 2,
          cache: {
            read: 3,
            write: 4,
          },
        },
        cost: 0.01,
      },
    });

    const line2 = JSON.stringify({
      type: "step_finish",
      part: {
        type: "step-finish",
        tokens: {
          input: 5,
          output: 1,
          cache: {
            read: 1,
            write: 1,
          },
        },
        cost: 0.005,
      },
    });

    const parser = makeParser("opencode");
    expect(parser(line1)).toEqual([
      {
        kind: "meta",
        key: "usage",
        value: {
          input_tokens: 10,
          output_tokens: 2,
          cache_read_input_tokens: 3,
          cache_creation_input_tokens: 4,
        },
      },
      {
        kind: "meta",
        key: "cost_usd",
        value: 0.01,
      },
    ]);

    expect(parser(line2)).toEqual([
      {
        kind: "meta",
        key: "usage",
        value: {
          input_tokens: 15,
          output_tokens: 3,
          cache_read_input_tokens: 4,
          cache_creation_input_tokens: 5,
        },
      },
      {
        kind: "meta",
        key: "cost_usd",
        value: 0.015,
      },
    ]);
  });
});

describe("envFor", () => {
  const SECRET_KEYS = ["ANTHROPIC_API_KEY", "OPENAI_API_KEY", "GEMINI_API_KEY", "DATABASE_URL", "MY_APP_TOKEN"];
  const stash: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const k of SECRET_KEYS) stash[k] = process.env[k];
  });

  afterEach(() => {
    for (const [k, v] of Object.entries(stash)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  });

  it("keeps non-secret env so the agent still runs", () => {
    const env = envFor("claude");
    expect(env.PATH).toBe(process.env.PATH);
    expect(typeof env.HOME === "string" || typeof env.USERNAME === "string").toBe(true);
  });

  it("keeps the agent's own auth secret", () => {
    process.env.ANTHROPIC_API_KEY = "sk-ant";
    expect(envFor("claude").ANTHROPIC_API_KEY).toBe("sk-ant");
  });

  it("strips another agent's auth secret", () => {
    process.env.OPENAI_API_KEY = "sk-oai";
    expect(envFor("claude").OPENAI_API_KEY).toBeUndefined();
  });

  it("strips generic secret-shaped env the agent does not own", () => {
    process.env.DATABASE_URL = "postgres://host/db";
    process.env.MY_APP_TOKEN = "tok-xyz";
    expect(envFor("claude").DATABASE_URL).toBeUndefined();
    expect(envFor("claude").MY_APP_TOKEN).toBeUndefined();
  });

  it("gemini keeps its own key and sets the trust flag", () => {
    process.env.GEMINI_API_KEY = "gem-key";
    const env = envFor("gemini");
    expect(env.GEMINI_API_KEY).toBe("gem-key");
    expect(env.GEMINI_CLI_TRUST_WORKSPACE).toBe("true");
  });
});
