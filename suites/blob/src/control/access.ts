import { view } from "../files.js";
import { compatible, exact, key, resource } from "../format.js";
import type { Resource, State } from "../types.js";

/** Caller holds the factory lane; GC cannot interleave with buffered reads. */
export async function locate(value: Resource, cache: string, state: State, referenced = false) {
  const spec = resource(value);
  compatible(spec);
  const id = key(spec);
  if (state.entries[id]?.phase !== "ready") throw Error("cached content missing; reconciliation required");
  if (referenced && !state.references.some((r) => r.keys.includes(id)))
    throw Error("materialized path requires a retained reference");
  return exact(spec, view(cache, id));
}
