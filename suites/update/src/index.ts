import { type Artifact, canonical, type Digest, type Envelope, type Pointer, verify } from "@odsuite/protocol";
import { Feed, type Release } from "@odsuite/publish";
import type { Attachment, Expose } from "@odsuite/sidecar";

export interface Source {
  head: Feed["head"];
  release: Feed["release"];
}

export interface Host {
  cachedContent(artifact: Artifact): Promise<Uint8Array | undefined>;
  cacheContent(name: string, release: Release): Promise<void>;
  cachedRelease(value: Envelope): Promise<Release>;
  releaseContent(name: string): Promise<void>;
  readonly anchor: Digest;
  readonly currentTarget: Digest;
  content(): Promise<Release>;
  expose<M>(service: string, options: Omit<Expose<M>, "identity">): Promise<Attachment>;
}
export interface Status {
  current: Digest;
  phase: "idle" | "checking" | "prepared" | "activating" | "failed" | "stopped";
  checks: number;
  revision?: number;
  prepared?: { target: Digest; changed: ("capsule" | "web" | "daemon")[] };
  error?: string;
}
export interface Methods {
  status: { input: unknown; output: Status };
}
export interface Options {
  source?: Source;
  /** Observation only; must not await shutdown from the accepted check. */
  onError?: (error: unknown) => void;
  layer?: "leaf" | "capsule";
  endpoint: string;
  publickey: string;
  intervalMs?: number;
  timeoutMs?: number;
  maxBytes?: number;
  activate?: (release: Release) => Promise<{ generation: Digest }>;
}
export async function watch(host: Host, options: Options) {
  const interval = options.intervalMs ?? 5000;
  if (!Number.isSafeInteger(interval) || interval < 50 || interval > 3600000)
    throw new Error("invalid discovery interval");
  const initial = await host.content();
  let ignored: Digest | undefined;
  const layer = options.layer ?? "leaf";
  let current = initial;
  const refused = new Map<Digest, string>();
  const feed = options.source ?? new Feed(options.endpoint, options.publickey, options);
  let state: Status = { current: initial.envelope.digest, phase: "idle", checks: 0 };
  let pending: Promise<void> | undefined;
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let controller: AbortController | undefined;
  let reference: string;
  let lane: Parameters<Feed["head"]>[0];
  let observed: { revision: number; head?: Pointer } | undefined;
  let prepared: Envelope | undefined;
  const status = (): Status => structuredClone(state);
  const check = (): Promise<void> => {
    if (stopped) return Promise.reject(new Error("discovery is stopped"));
    if (pending) return pending;
    const abort = new AbortController();
    controller = abort;
    state = { ...state, phase: "checking", checks: state.checks + 1, error: undefined };
    const execute = async () => {
      try {
        if (host.currentTarget !== current.envelope.digest) current = await host.content();
        state.current = current.envelope.digest;
        const head = await feed.head(lane, abort.signal);
        if (
          observed &&
          (head.revision < observed.revision ||
            (head.revision === observed.revision && canonical(head.head ?? null) !== canonical(observed.head ?? null)))
        )
          throw new Error("distribution revision regressed or conflicted");
        const samePrepared = prepared?.digest === head.head?.generation && observed?.head?.proof === head.head?.proof;
        observed = head;
        state.revision = head.revision;
        if (head.head && refused.has(head.head.generation))
          throw new Error(`candidate activation refused: ${refused.get(head.head.generation)}`);
        if (!head.head || head.head.generation === current.envelope.digest) {
          await host.releaseContent(reference);
          prepared = undefined;
          state = { ...state, phase: "idle", prepared: undefined };
          return;
        }
        if (head.head.generation === ignored) {
          state = { ...state, phase: "idle", prepared: undefined };
          return;
        }
        if (samePrepared && !options.activate) {
          state = { ...state, phase: "prepared" };
          return;
        }
        const release = await feed.release(lane, head.head, {
          signal: abort.signal,
          cached: (artifact) => host.cachedContent(artifact),
        });
        const before = current.envelope.generation,
          after = release.envelope.generation;
        if (
          layer === "leaf" &&
          (before.carrier !== after.carrier ||
            canonical(before.capsule) !== canonical(after.capsule) ||
            canonical(before.blobs) !== canonical(after.blobs))
        )
          throw new Error("candidate requires capsule, blob or carrier update");
        if (layer === "capsule" && canonical(before.capsule) === canonical(after.capsule)) {
          await host.releaseContent(reference);
          ignored = release.envelope.digest;
          state = { ...state, phase: "idle", prepared: undefined };
          return;
        }
        const changed = (["capsule", "web", "daemon"] as const).filter(
          (kind) => canonical(before[kind]) !== canonical(after[kind]),
        );
        if (!changed.length) throw new Error("candidate has no changed units");
        for (const asset of release.assets) {
          abort.signal.throwIfAborted();
          if (!verify(asset.artifact, asset.bytes)) throw new Error("candidate integrity mismatch");
        }
        abort.signal.throwIfAborted();
        await host.cacheContent(reference, release);
        prepared = release.envelope;
        state = { ...state, phase: "prepared", prepared: { target: prepared.digest, changed: [...changed] } };
        if (options.activate) {
          state.phase = "activating";
          try {
            const result = await options.activate(release);
            if (result.generation !== release.envelope.digest) throw new Error("activation receipt target mismatch");
            current = release;
            await host.releaseContent(reference);
            prepared = undefined;
            state = { ...state, phase: "idle", current: result.generation, prepared: undefined };
          } catch (error) {
            refused.set(release.envelope.digest, String(error));
            // A controller may report failure after its commit persisted. Read its
            // current content rather than inventing a rollback in the watcher.
            try {
              const actual = await host.content();
              current = actual;
              state.current = actual.envelope.digest;
            } catch {
              /* Runtime failure remains explicit; current is last confirmed. */
            }
            throw error;
          }
        }
      } catch (error) {
        if (!stopped) state = { ...state, phase: "failed", error: String(error).slice(0, 1000) };
        if (!stopped) options.onError?.(error);
      }
    };
    pending = execute().finally(() => {
      pending = undefined;
      controller = undefined;
    });
    return pending;
  };
  const schedule = async () => {
    await check();
    if (!stopped)
      timer = setTimeout(() => {
        void schedule();
      }, interval);
  };
  const disarm = () => {
    stopped = true;
    clearTimeout(timer);
    controller?.abort(new Error("discovery stopped"));
  };
  const attachment = await host.expose<Methods>(layer === "capsule" ? "bootstrapupdates" : "updates", {
    handlers: { status },
    lifecycle: {
      initialize: async (context) => {
        lane = context.identity.channel;
        if (context.identity.generation !== host.anchor) throw new Error("discovery host generation mismatch");
        reference = `observer:${context.identity.service}:${context.incarnation}`;
        for (const asset of initial.assets) {
          if (!verify(asset.artifact, asset.bytes)) throw new Error("initial content integrity mismatch");
        }
        // Start after initialize returns, so service publication precedes polling.
        timer = context.background(() =>
          setTimeout(() => {
            void schedule();
          }, 0),
        );
      },
      quiesce: async () => {
        disarm();
        await pending;
      },
      stop: async () => {
        await host.releaseContent(reference);
        state = { ...state, phase: "stopped" };
      },
    },
  });
  return {
    status,
    check,
    close: async () => {
      disarm();
      await pending;
      await attachment.close();
    },
    candidate: async (): Promise<Release | undefined> => {
      if (stopped) throw new Error("discovery is stopped");
      const value = prepared ? structuredClone(prepared) : undefined;
      if (!value || !["prepared", "checking"].includes(state.phase)) return undefined;
      return host.cachedRelease(value);
    },
  };
}
