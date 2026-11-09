import type { LibrarySession } from "../types.js";

/** Methods expire with the lane; accepted work drains even after callback failure. */
export async function scoped<T>(methods: LibrarySession, operation: (library: LibrarySession) => Promise<T>) {
  let active = true;
  let tail: Promise<unknown> = Promise.resolve();
  const pending = new Set<Promise<unknown>>();
  const accepted: Promise<unknown>[] = [];
  const facade = Object.fromEntries(
    Object.entries(methods).map(([name, method]) => [
      name,
      (...args: unknown[]) => {
        if (!active) return Promise.reject(Error("blob session expired"));
        const work = tail.then(() => method(...args));
        tail = work.catch(() => {});
        pending.add(work);
        accepted.push(work);
        void work.then(
          () => pending.delete(work),
          () => pending.delete(work),
        );
        return work;
      },
    ]),
  ) as unknown as LibrarySession;
  try {
    const value = await operation(facade);
    active = false;
    await Promise.all(accepted);
    return value;
  } finally {
    active = false;
    await Promise.allSettled([...pending]);
  }
}
