import assert from 'node:assert/strict';
import test from 'node:test';
import { makeParser } from '../src/lib/agents/argv';
import { HtmlStreamExtractor } from '../src/lib/agents/html-stream';

test('suppresses prose before the HTML document starts', () => {
  const stream = new HtmlStreamExtractor();

  assert.equal(stream.push('I will create the page first.\n'), '');
  assert.equal(
    stream.push('<!DOCTYPE html><html><body>Ready</body></html>'),
    '<!DOCTYPE html><html><body>Ready</body></html>',
  );
});

test('keeps partial HTML streaming after the document starts', () => {
  const stream = new HtmlStreamExtractor();

  assert.equal(stream.push('prefix <ht'), '');
  assert.equal(stream.push('ml><body>One'), '<html><body>One');
  assert.equal(stream.push(' two'), ' two');
  assert.equal(stream.push('</body></html> trailing text'), '</body></html>');
  assert.equal(stream.push('ignored'), '');
});

test('bounds preamble buffering before the HTML start appears', () => {
  const stream = new HtmlStreamExtractor(8);

  assert.equal(stream.push('0123456789'), '');
  assert.deepEqual(stream.state(), {
    started: false,
    completed: false,
    bufferedChars: 8,
  });
});

test('parses current Codex agent_message item.completed payloads', () => {
  const parse = makeParser('codex');
  const html = '<!DOCTYPE html><html><body>Ready</body></html>';

  assert.deepEqual(
    parse(
      JSON.stringify({
        type: 'item.completed',
        item: { type: 'agent_message', text: html },
      }),
    ),
    [{ kind: 'delta', text: html }],
  );
});

test('keeps compatibility with older Codex assistant_message payloads', () => {
  const parse = makeParser('codex');

  assert.deepEqual(
    parse(
      JSON.stringify({
        type: 'item.completed',
        item: { item_type: 'assistant_message', text: 'done' },
      }),
    ),
    [{ kind: 'delta', text: 'done' }],
  );
});

test('parses Codex lifecycle and usage metadata', () => {
  const parse = makeParser('codex');
  const usage = { input_tokens: 12, output_tokens: 5 };

  assert.deepEqual(parse(JSON.stringify({ type: 'thread.started', thread_id: 'abc123' })), [
    { kind: 'meta', key: 'session', value: 'abc123' },
  ]);
  assert.deepEqual(parse(JSON.stringify({ type: 'turn.started' })), [
    { kind: 'meta', key: 'status', value: 'turn.started' },
  ]);
  assert.deepEqual(parse(JSON.stringify({ type: 'turn.completed', usage })), [
    { kind: 'meta', key: 'usage', value: usage },
  ]);
});
