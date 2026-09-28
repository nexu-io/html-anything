import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { createEventBatcher, useConvert } from '../use-convert';
import { useStore } from '../store';

// act() refuses to run unless React knows it is inside a test environment
(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

describe('createEventBatcher', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('buffers events until the 100ms window closes, preserving arrival order', async () => {
    const seen: Array<[string, unknown]> = [];
    const b = createEventBatcher((event, data) => seen.push([event, data]));
    b.push('meta', { key: 'model' });
    b.push('stderr', { text: 'noise' });
    expect(seen).toHaveLength(0);
    await vi.advanceTimersByTimeAsync(100);
    expect(seen).toEqual([
      ['meta', { key: 'model' }],
      ['stderr', { text: 'noise' }],
    ]);
  });

  it('passes the first delta through immediately, draining the buffer first', () => {
    const seen: string[] = [];
    const b = createEventBatcher((event) => seen.push(event));
    b.push('meta', { key: 'model' });
    b.push('meta', { key: 'session' });
    b.push('delta', { text: '<p>' });
    expect(seen).toEqual(['meta', 'meta', 'delta']);
  });

  it('buffers deltas after the first one', async () => {
    const seen: string[] = [];
    const b = createEventBatcher((event) => seen.push(event));
    b.push('delta', { text: 'a' });
    b.push('delta', { text: 'b' });
    expect(seen).toEqual(['delta']);
    await vi.advanceTimersByTimeAsync(100);
    expect(seen).toEqual(['delta', 'delta']);
  });

  it('passes done and error through immediately, draining the buffer first', () => {
    const seen: string[] = [];
    const b = createEventBatcher((event) => seen.push(event));
    b.push('meta', { key: 'model' });
    b.push('done', { code: 0 });
    expect(seen).toEqual(['meta', 'done']);
    b.push('meta', { key: 'cost_usd' });
    b.push('error', { message: 'boom' });
    expect(seen).toEqual(['meta', 'done', 'meta', 'error']);
  });

  it('does not re-deliver drained events; a post-terminal event opens a fresh window', async () => {
    const seen: string[] = [];
    const b = createEventBatcher((event) => seen.push(event));
    b.push('meta', { key: 'a' });
    b.push('done', { code: 0 });
    await vi.advanceTimersByTimeAsync(1000);
    expect(seen).toEqual(['meta', 'done']);
    b.push('meta', { key: 'b' });
    expect(seen).toEqual(['meta', 'done']);
    await vi.advanceTimersByTimeAsync(100);
    expect(seen).toEqual(['meta', 'done', 'meta']);
  });

  it('flush() drains synchronously and cancels the pending timer', async () => {
    const seen: string[] = [];
    const b = createEventBatcher((event) => seen.push(event));
    b.push('meta', { key: 'a' });
    b.flush();
    expect(seen).toEqual(['meta']);
    await vi.advanceTimersByTimeAsync(1000);
    expect(seen).toEqual(['meta']);
    b.push('meta', { key: 'b' });
    expect(seen).toEqual(['meta']);
    await vi.advanceTimersByTimeAsync(100);
    expect(seen).toEqual(['meta', 'meta']);
  });

  it('dispose() only clears the timer and never delivers', async () => {
    const seen: string[] = [];
    const b = createEventBatcher((event) => seen.push(event));
    b.push('meta', { key: 'a' });
    b.dispose();
    await vi.advanceTimersByTimeAsync(1000);
    expect(seen).toHaveLength(0);
  });
});

describe('useConvert().run', () => {
  let root: Root | null = null;
  let container: HTMLElement | null = null;
  let api: ReturnType<typeof useConvert> | null = null;
  let renderCount = 0;

  // useConvert is a hook — render a null harness once per test to capture it.
  // RenderProbe subscribes to the active task's log length, so renderCount
  // tracks how many store batches React committed, not how many events
  // arrived — the bounded quantity the batching fix exists to guarantee.
  function RenderProbe() {
    useStore((s) => s.tasks.find((t) => t.id === s.activeTaskId)?.log.length ?? 0);
    renderCount++;
    return null;
  }

  function Harness() {
    api = useConvert();
    return createElement(RenderProbe);
  }

  function sseFrame(event: string, data: unknown) {
    return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  }

  type ReadResult = { value?: Uint8Array; done: boolean };

  // Duck-typed fetch: returns a Response-like whose body reader yields the
  // given SSE frames one read() at a time. With hangUntilAbort the reader
  // never reports done — it rejects with an AbortError once the request
  // signal aborts, like a network read stalled mid-stream.
  function stubStreamFetch(frames: string[], opts?: { hangUntilAbort?: boolean }) {
    const enc = new TextEncoder();
    let i = 0;
    let signal: AbortSignal | undefined;
    let hanging = false;
    const read = (): Promise<ReadResult> => {
      if (i < frames.length) {
        return Promise.resolve({ value: enc.encode(frames[i++]), done: false });
      }
      if (!opts?.hangUntilAbort) {
        return Promise.resolve({ value: undefined, done: true });
      }
      hanging = true;
      return new Promise((_resolve, reject) => {
        const abort = () => {
          const err = new Error('aborted');
          err.name = 'AbortError';
          reject(err);
        };
        if (signal?.aborted) abort();
        else signal?.addEventListener('abort', abort, { once: true });
      });
    };
    const res = { ok: true, body: { getReader: () => ({ read }) } };
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url: unknown, init?: { signal?: AbortSignal }) => {
        signal = init?.signal;
        return res;
      }),
    );
    return { isHanging: () => hanging };
  }

  async function renderHarness() {
    await act(async () => {
      root!.render(createElement(Harness));
    });
  }

  function runReq(taskId: string) {
    return {
      taskId,
      agent: 'test-agent',
      templateId: 'article-magazine',
      content: 'hello world',
    };
  }

  function taskOf(taskId: string) {
    const task = useStore.getState().tasks.find((t) => t.id === taskId);
    expect(task).toBeDefined();
    return task!;
  }

  beforeEach(() => {
    localStorage.clear();
    renderCount = 0;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    if (root) {
      act(() => root!.unmount());
      root = null;
    }
    container?.remove();
    container = null;
    api = null;
  });

  it('marks the task errored with a truncation log when the stream ends without done/error', async () => {
    const taskId = useStore.getState().newTask({ name: 'no-terminal' });
    stubStreamFetch([
      sseFrame('start', { bin: '/usr/bin/agent', promptBytes: 12 }),
      sseFrame('delta', { text: '<p>partial' }),
      sseFrame('meta', { key: 'model', value: 'test-model' }),
    ]);
    await renderHarness();

    await act(async () => {
      await api!.run(runReq(taskId));
    });

    const task = taskOf(taskId);
    expect(task.status).toBe('error');
    const truncation = task.log.find((l) => l.text === '连接中断，未收到结束事件');
    expect(truncation?.kind).toBe('error');
    // streamed content still landed (delta pass-through + final flush)
    expect(task.html).toBe('<p>partial');
    expect(task.stats.model).toBe('test-model');
    // no terminal → the diff-edit baseline must stay untouched
    expect(task.baseHtml).toBeUndefined();
    expect(task.log.some((l) => l.kind === 'done')).toBe(false);
  });

  it('finishes done and commits the diff-edit baseline when the stream ends with done', async () => {
    const taskId = useStore.getState().newTask({ name: 'happy-path' });
    stubStreamFetch([
      sseFrame('start', { bin: '/usr/bin/agent', promptBytes: 12 }),
      sseFrame('delta', { text: '<p>hello' }),
      sseFrame('meta', { key: 'model', value: 'test-model' }),
      sseFrame('done', { code: 0 }),
    ]);
    await renderHarness();

    await act(async () => {
      await api!.run(runReq(taskId));
    });

    const task = taskOf(taskId);
    expect(task.status).toBe('done');
    expect(task.log.some((l) => l.kind === 'done' && l.text.includes('agent 进程退出'))).toBe(true);
    expect(task.html).toBe('<p>hello');
    expect(task.stats.model).toBe('test-model');
    expect(task.stats.endedAt).toBeDefined();
    expect(task.baseHtml).toBe(task.html);
  });

  it('marks the task errored without committing a baseline when the stream ends with error', async () => {
    const taskId = useStore.getState().newTask({ name: 'error-terminal' });
    stubStreamFetch([
      sseFrame('start', { bin: '/usr/bin/agent', promptBytes: 12 }),
      sseFrame('delta', { text: '<p>partial' }),
      sseFrame('error', { message: 'agent binary not found' }),
    ]);
    await renderHarness();

    await act(async () => {
      await api!.run(runReq(taskId));
    });

    const task = taskOf(taskId);
    expect(task.status).toBe('error');
    expect(task.log.some((l) => l.kind === 'error' && l.text === 'agent binary not found')).toBe(true);
    // streamed data stays visible …
    expect(task.html).toBe('<p>partial');
    // … but the partial HTML must not be committed as the diff-edit baseline
    expect(task.baseHtml).toBeUndefined();
    expect(task.log.some((l) => l.kind === 'done')).toBe(false);
  });

  it('keeps the previous baseline and error status when error is followed by done', async () => {
    // openclaw's close handler emits error for an empty response or a JSON
    // parse failure, then an unconditional done — the trailing done must not
    // turn the failed run into a success (invoke.ts child close handler)
    const taskId = useStore.getState().newTask({ name: 'error-then-done' });
    useStore.setState((st) => ({
      tasks: st.tasks.map((t) =>
        t.id === taskId ? { ...t, baseContent: 'old content', baseHtml: '<p>old base</p>' } : t,
      ),
    }));
    stubStreamFetch([
      sseFrame('start', { bin: '/usr/bin/agent', promptBytes: 12 }),
      sseFrame('delta', { text: '<p>partial' }),
      sseFrame('error', { message: 'OpenClaw returned an empty assistant message' }),
      sseFrame('done', { code: 0 }),
    ]);
    await renderHarness();

    await act(async () => {
      await api!.run(runReq(taskId));
    });

    const task = taskOf(taskId);
    expect(task.status).toBe('error');
    expect(task.log.some((l) => l.kind === 'error' && l.text === 'OpenClaw returned an empty assistant message')).toBe(true);
    // the done frame still lands in the log …
    expect(task.log.some((l) => l.kind === 'done' && l.text.includes('agent 进程退出'))).toBe(true);
    // … streamed data stays visible, and the previous baseline survives
    expect(task.html).toBe('<p>partial');
    expect(task.baseHtml).toBe('<p>old base</p>');
    expect(task.baseContent).toBe('old content');
  });

  it('lands buffered events in order before the 已取消 log when cancelled mid-stream', async () => {
    const taskId = useStore.getState().newTask({ name: 'cancel' });
    const probe = stubStreamFetch(
      [
        sseFrame('meta', { key: 'model', value: 'test-model' }),
        sseFrame('meta', { key: 'session', value: 's1' }),
      ],
      { hangUntilAbort: true },
    );
    await renderHarness();

    let runP: Promise<void> | undefined;
    await act(async () => {
      runP = api!.run(runReq(taskId));
    });
    await vi.waitFor(() => expect(probe.isHanging()).toBe(true));

    act(() => api!.cancel(taskId));
    await act(async () => {
      await runP;
    });

    const task = taskOf(taskId);
    expect(task.status).toBe('idle');
    const texts = task.log.map((l) => l.text);
    const modelIdx = texts.indexOf('model = test-model');
    const sessionIdx = texts.indexOf('session = s1');
    const cancelIdx = texts.indexOf('已取消');
    expect(modelIdx).toBeGreaterThanOrEqual(0);
    expect(sessionIdx).toBeGreaterThan(modelIdx);
    expect(cancelIdx).toBeGreaterThan(sessionIdx);
  });

  it('delivers every event of a high-rate meta burst while keeping re-renders bounded', async () => {
    const taskId = useStore.getState().newTask({ name: 'burst' });
    // one network chunk carrying 200 meta frames — the burst shape from the
    // issue. Unfixed code re-renders the full task list once per event; the
    // batcher must land all 200 in a handful of store batches.
    const burst = Array.from({ length: 200 }, (_, i) =>
      sseFrame('meta', { key: 'model', value: `m${i}` }),
    ).join('');
    stubStreamFetch([burst, sseFrame('done', { code: 0 })]);
    await renderHarness();

    await act(async () => {
      await api!.run(runReq(taskId));
    });

    const task = taskOf(taskId);
    expect(task.status).toBe('done');
    expect(task.log.filter((l) => l.kind === 'meta')).toHaveLength(200);
    expect(renderCount).toBeLessThanOrEqual(10);
  });
});
