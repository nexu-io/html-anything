import type { Capsule } from "@odsuite/runtime";

export function create(): Capsule {
  return {
    handlers: {},
    ready: async () => {},
    initialize: async () => ({
      loading: "Loading",
      window: { title: "open-motion fixture" },
      witness: "capsule:fixture",
    }),
    stop: async () => {},
  };
}
