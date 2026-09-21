import { describe, expect, it } from 'vitest';
import { appendConfiguredAgentMemoryPolicy } from '../agent-memory';

describe('configured agent memory policy', () => {
  it('leaves normal prompt assembly byte-for-byte unchanged while disabled', () => {
    const prompt = 'normal prompt\nwith exact whitespace\n';
    expect(
      appendConfiguredAgentMemoryPolicy(prompt, {
        enabled: false,
      }),
    ).toBe(prompt);
  });

  it('adds only transparent read-only guidance while enabled', () => {
    const result = appendConfiguredAgentMemoryPolicy('prompt', {
      enabled: true,
    });

    expect(result).toContain('mode="read-only"');
    expect(result).toContain('Use only the read-only search_memories or retrieve_answer tools');
    expect(result).toContain('Do not call save_memory');
    expect(result).toContain("cannot inspect or enforce the selected agent's tool permissions");
    expect(result).toContain('or enforce a response-size limit');
    expect(result).not.toContain('ONE save_memory call');
  });
});
