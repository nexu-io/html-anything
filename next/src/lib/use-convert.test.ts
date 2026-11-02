import { describe, expect, it } from 'vitest';
import { conversionOutcome } from './use-convert';

describe('conversionOutcome', () => {
  it('accepts a zero exit code with HTML', () => {
    expect(conversionOutcome(0, '<html></html>')).toEqual({ status: 'done' });
  });

  it('rejects a zero exit code with no HTML', () => {
    expect(conversionOutcome(0, '   ')).toEqual({
      status: 'error',
      message: 'Agent exited successfully but returned no HTML.',
    });
  });

  it('rejects a non-zero exit code', () => {
    expect(conversionOutcome(2, '<html></html>')).toEqual({
      status: 'error',
      message: 'Agent process exited with code 2.',
    });
  });

  it('preserves a streamed agent error', () => {
    expect(conversionOutcome(undefined, '', 'Synthetic transport error')).toEqual({
      status: 'error',
      message: 'Synthetic transport error',
    });
  });

  it('rejects a stream without a terminal exit code', () => {
    expect(conversionOutcome(undefined, '<html></html>')).toEqual({
      status: 'error',
      message: 'Agent process ended without an exit code.',
    });
  });
});
