// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { EventEmitter } from 'node:events';
import { PassThrough, Writable } from 'node:stream';
import { NextRequest } from 'next/server';

const { mockSpawn } = vi.hoisted(() => ({ mockSpawn: vi.fn() }));
vi.mock('node:child_process', () => ({ spawn: mockSpawn }));
vi.mock('node:fs', async () => {
  const actual = await vi.importActual<typeof import('node:fs')>('node:fs');
  return { ...actual, existsSync: (file: string) => file === '/test/claude' };
});
vi.mock('@/lib/templates/loader', () => ({
  loadSkill: () => ({ body: 'Render HTML.', zhName: 'Test', aspectHint: 'desktop' }),
}));

import { POST } from '@/app/api/convert/route';
import { detectAgents } from '../detect';

const models = detectAgents().find((agent) => agent.id === 'claude')!.models;
const firstMiniMax = models.find((model) => model.id.startsWith('MiniMax-'))!.id;

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

describe.each([
  'https://api.minimax.io/anthropic',
  'https://api.minimaxi.com/anthropic',
])('MiniMax conversion through %s', (endpoint) => {
  it.each([firstMiniMax, 'MiniMax-M3', 'MiniMax-M2.7', 'my-custom-model', 'sonnet', undefined])(
    'forwards model %s from the HTTP request to the CLI boundary',
    async (model) => {
      vi.stubEnv('ANTHROPIC_BASE_URL', endpoint);
      let prompt = '';
      const stdin = new Writable({
        write(chunk, _encoding, callback) {
          prompt += chunk.toString();
          callback();
        },
      });
      const stdout = new PassThrough();
      const child = Object.assign(new EventEmitter(), {
        stdin, stdout, stderr: new PassThrough(),
      });
      mockSpawn.mockReturnValue(child);
      const content = 'Render this image: ![sample](data:image/png;base64,aGVsbG8=)';
      const request = new NextRequest('http://localhost/api/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent: 'claude', templateId: 'test', content, model,
          binOverride: '/test/claude',
        }),
      });
      const response = await POST(request);
      const responseText = response.text();
      stdout.end(`${JSON.stringify({ type: 'assistant', message: { content: [{ type: 'text', text: '<html>ok</html>' }] } })}\n`);
      await new Promise((resolve) => setImmediate(resolve));
      child.emit('close', 0);
      const sse = await responseText;

      expect(firstMiniMax).toBe('MiniMax-M3.1-Flash');
      expect(mockSpawn).toHaveBeenCalledExactlyOnceWith('/test/claude', [
        '-p', '--output-format', 'stream-json', '--verbose',
        '--include-partial-messages', '--permission-mode', 'bypassPermissions',
        ...(model ? ['--model', model] : []),
      ], expect.objectContaining({
        env: expect.objectContaining({ ANTHROPIC_BASE_URL: endpoint }),
        stdio: ['pipe', 'pipe', 'pipe'],
      }));
      expect(prompt).toContain(content);
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toContain('text/event-stream');
      expect(sse).toContain('"type":"delta","text":"<html>ok</html>"');
      expect(sse).toContain('"type":"done","code":0');
    },
  );
});
