export type HtmlStreamState = {
  started: boolean;
  completed: boolean;
  bufferedChars: number;
};

const DEFAULT_MAX_BUFFER_CHARS = 4096;
const HTML_START_PATTERNS = [/<!DOCTYPE\s+html/i, /<html(?:\s|>)/i];
const HTML_END_PATTERN = /<\/html\s*>/i;

/**
 * Extracts the HTML document from a chatty agent text stream.
 *
 * Agent adapters should keep parsing native output into plain text deltas.
 * This module sits one level higher: callers that expect HTML can hide prose
 * until the document starts, while callers that expect markdown/plain text keep
 * receiving the original deltas.
 */
export class HtmlStreamExtractor {
  private pending = "";
  private started = false;
  private completed = false;
  private readonly maxBufferChars: number;

  constructor(maxBufferChars = DEFAULT_MAX_BUFFER_CHARS) {
    this.maxBufferChars = maxBufferChars;
  }

  push(chunk: string): string {
    if (!chunk || this.completed) return "";

    if (this.started) {
      return this.emitUntilEnd(chunk);
    }

    this.pending += chunk;
    const startIdx = findHtmlStart(this.pending);
    if (startIdx === -1) {
      this.pending = this.pending.slice(-this.maxBufferChars);
      return "";
    }

    this.started = true;
    const html = this.pending.slice(startIdx);
    this.pending = "";
    return this.emitUntilEnd(html);
  }

  state(): HtmlStreamState {
    return {
      started: this.started,
      completed: this.completed,
      bufferedChars: this.pending.length,
    };
  }

  private emitUntilEnd(text: string): string {
    const end = HTML_END_PATTERN.exec(text);
    if (!end) return text;
    this.completed = true;
    return text.slice(0, end.index + end[0].length);
  }
}

function findHtmlStart(text: string): number {
  const starts = HTML_START_PATTERNS
    .map((pattern) => text.search(pattern))
    .filter((idx) => idx >= 0);
  return starts.length ? Math.min(...starts) : -1;
}
