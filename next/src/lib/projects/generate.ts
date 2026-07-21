import {
  PROJECT_GENERATION_DEADLINE_MS,
  PROJECT_HTML_MAX_BYTES,
  ProjectError,
  type CreateProjectInput,
  type ReadyProjectResponse,
} from "./contracts";
import type { InvokeEvent, InvokeOpts } from "../agents/invoke";
import { extractHtml } from "../extract-html";
import type { LoadedSkill } from "../templates/loader";
import { assemblePrompt } from "../templates/shared";
import type { ProjectStore } from "./storage";

const encoder = new TextEncoder();

export type GenerateProjectDependencies = {
  store: ProjectStore;
  publicBaseUrl: string | undefined;
  loadSkill(id: string): LoadedSkill | null;
  invokeAgent(opts: InvokeOpts): ReadableStream<InvokeEvent>;
  deadlineMs?: number;
};

export async function collectCompleteHtml(
  stream: ReadableStream<InvokeEvent>,
  signal: AbortSignal,
): Promise<string> {
  if (signal.aborted) throw generationTimeout();

  const reader = stream.getReader();
  let output = "";
  let outputBytes = 0;
  let sawDone = false;
  let abortReject: ((error: ProjectError) => void) | undefined;
  const aborted = new Promise<never>((_resolve, reject) => {
    abortReject = reject;
  });
  const onAbort = () => abortReject?.(generationTimeout());
  signal.addEventListener("abort", onAbort, { once: true });

  try {
    while (true) {
      let item: ReadableStreamReadResult<InvokeEvent>;
      try {
        item = await Promise.race([reader.read(), aborted]);
      } catch (error) {
        if (signal.aborted) throw generationTimeout();
        if (error instanceof ProjectError) throw error;
        throw generationFailed();
      }
      if (item.done) break;

      const event = item.value;
      if (event.type === "delta") {
        outputBytes = appendedUtf8Length(output, outputBytes, event.text);
        output += event.text;
        assertOutputLimit(outputBytes);
      } else if (event.type === "html") {
        output = event.text;
        outputBytes = encoder.encode(output).byteLength;
        assertOutputLimit(outputBytes);
      } else if (event.type === "error") {
        throw generationFailed();
      } else if (event.type === "done") {
        if (event.code !== 0) throw generationFailed();
        sawDone = true;
      }
    }
  } finally {
    signal.removeEventListener("abort", onAbort);
    if (signal.aborted || !sawDone) {
      await reader.cancel().catch(() => undefined);
    }
    try {
      reader.releaseLock();
    } catch {
      // A hostile stream may keep a read pending after cancellation.
    }
  }

  if (!sawDone) throw generationFailed();
  if (!/(?:<!doctype html|<html(?:\s|>))/iu.test(output)) {
    throw generationFailed();
  }

  let html: string;
  try {
    html = extractHtml(output).trim();
  } catch {
    throw generationFailed();
  }
  if (
    !/^(?:<!doctype html|<html(?:\s|>))/iu.test(html) ||
    !/<\/html>$/iu.test(html)
  ) {
    throw generationFailed();
  }
  assertOutputLimit(encoder.encode(html).byteLength);
  return html;
}

export async function generateAndStoreProject(
  input: CreateProjectInput,
  deps: GenerateProjectDependencies,
): Promise<ReadyProjectResponse> {
  validatePublicBaseUrl(deps.publicBaseUrl);
  const deadlineMs = validateDeadline(deps.deadlineMs);

  const existing = await deps.store.findReadyCreation(input);
  if (existing !== null) return existing;

  const skill = deps.loadSkill(input.templateId);
  if (skill === null) {
    throw new ProjectError("template_not_found", "Project template was not found.");
  }
  const prompt = assemblePrompt({
    body: skill.body,
    content: input.content,
    format: input.format,
  });
  const prepared = await deps.store.prepare(input, prompt);
  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(), deadlineMs);
  timeout.unref?.();

  let html: string;
  try {
    const invokeOptions: InvokeOpts = {
      agent: prepared.input.agent,
      prompt,
      cwd: prepared.paths.workspaceRoot,
      signal: abortController.signal,
      ...(prepared.input.model === undefined
        ? {}
        : { model: prepared.input.model }),
    };
    const stream = deps.invokeAgent(invokeOptions);
    html = await collectCompleteHtml(stream, abortController.signal);
  } catch (error) {
    const failure = normalizeGenerationError(error);
    await deps.store.markFailed(prepared, diagnosticFor(failure));
    throw failure;
  } finally {
    clearTimeout(timeout);
  }

  return deps.store.markReady(prepared, html);
}

function validatePublicBaseUrl(value: string | undefined): string {
  try {
    if (typeof value !== "string" || value.trim() !== value) {
      throw configurationError();
    }
    const url = new URL(value);
    if (
      url.protocol !== "https:" ||
      url.username !== "" ||
      url.password !== "" ||
      url.pathname !== "/" ||
      url.search !== "" ||
      url.hash !== "" ||
      url.origin === "null"
    ) {
      throw configurationError();
    }
    return url.origin;
  } catch (error) {
    if (error instanceof ProjectError) throw error;
    throw configurationError();
  }
}

function validateDeadline(value: number | undefined): number {
  const deadline = value ?? PROJECT_GENERATION_DEADLINE_MS;
  if (!Number.isSafeInteger(deadline) || deadline <= 0) {
    throw new ProjectError(
      "configuration_missing",
      "Project generation deadline is invalid.",
    );
  }
  return deadline;
}

function appendedUtf8Length(
  current: string,
  currentBytes: number,
  addition: string,
): number {
  let bytes = currentBytes + encoder.encode(addition).byteLength;
  if (
    current.length > 0 &&
    addition.length > 0 &&
    isHighSurrogate(current.charCodeAt(current.length - 1)) &&
    isLowSurrogate(addition.charCodeAt(0))
  ) {
    bytes -= 2;
  }
  return bytes;
}

function isHighSurrogate(value: number): boolean {
  return value >= 0xd800 && value <= 0xdbff;
}

function isLowSurrogate(value: number): boolean {
  return value >= 0xdc00 && value <= 0xdfff;
}

function assertOutputLimit(bytes: number): void {
  if (bytes > PROJECT_HTML_MAX_BYTES) {
    throw new ProjectError("limit_exceeded", "Generated HTML exceeds its limit.");
  }
}

function normalizeGenerationError(error: unknown): ProjectError {
  if (
    error instanceof ProjectError &&
    ["generation_timeout", "generation_failed", "limit_exceeded"].includes(
      error.code,
    )
  ) {
    return error;
  }
  return generationFailed();
}

function diagnosticFor(error: ProjectError): string {
  if (error.code === "generation_timeout") return "Project generation timed out.";
  if (error.code === "limit_exceeded") return "Generated HTML exceeded its limit.";
  return "Agent generation failed.";
}

function generationFailed(): ProjectError {
  return new ProjectError("generation_failed", "Project generation failed.");
}

function generationTimeout(): ProjectError {
  return new ProjectError("generation_timeout", "Project generation timed out.");
}

function configurationError(): ProjectError {
  return new ProjectError(
    "configuration_missing",
    "Public project base URL is not configured.",
  );
}
