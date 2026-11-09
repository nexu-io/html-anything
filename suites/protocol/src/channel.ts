import type { Channel } from "./identity.js";
import type { Digest } from "./json.js";

export interface Pointer {
  generation: Digest;
  proof: Digest;
}

export interface Distribution {
  channel: Channel;
  head?: Pointer;
  revision: number;
}

export interface Publication {
  expected: number;
  pointer: Pointer;
}

export type Publish =
  | { changed: boolean; ok: true; state: Distribution }
  | { actual: number; fault: "conflict"; ok: false; state: Distribution };

function equal(left: Pointer | undefined, right: Pointer): boolean {
  return left?.generation === right.generation && left.proof === right.proof;
}

export function publish(state: Distribution, event: Publication): Publish {
  if (equal(state.head, event.pointer)) {
    return { changed: false, ok: true, state };
  }

  if (state.revision !== event.expected) {
    return {
      actual: state.revision,
      fault: "conflict",
      ok: false,
      state,
    };
  }

  return {
    changed: true,
    ok: true,
    state: {
      channel: state.channel,
      head: event.pointer,
      revision: state.revision + 1,
    },
  };
}
