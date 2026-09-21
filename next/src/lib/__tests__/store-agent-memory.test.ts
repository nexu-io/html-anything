import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

let storeModule: typeof import("../store");

beforeAll(async () => {
  const values = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
    clear: () => values.clear(),
    key: (index: number) => [...values.keys()][index] ?? null,
    get length() {
      return values.size;
    },
  });
  storeModule = await import("../store");
});

afterAll(() => vi.unstubAllGlobals());

describe("configured agent memory preference", () => {
  beforeEach(() => {
    localStorage.clear();
    storeModule.useStore.setState({
      selectedAgent: undefined,
      configuredAgentMemoryByAgent: {},
    });
  });

  it("does not carry an opt-in from one agent to another", () => {
    const { isConfiguredAgentMemoryEnabled, useStore } = storeModule;
    useStore.getState().setSelectedAgent("agent-a");
    useStore.getState().setUseConfiguredAgentMemory("agent-a", true);
    const capturedAgent = useStore.getState().selectedAgent;

    expect(
      isConfiguredAgentMemoryEnabled(
        useStore.getState().configuredAgentMemoryByAgent,
        capturedAgent,
      ),
    ).toBe(true);

    useStore.getState().setSelectedAgent("agent-b");

    expect(
      isConfiguredAgentMemoryEnabled(
        useStore.getState().configuredAgentMemoryByAgent,
        useStore.getState().selectedAgent,
      ),
    ).toBe(false);
    expect(
      isConfiguredAgentMemoryEnabled(
        useStore.getState().configuredAgentMemoryByAgent,
        capturedAgent,
      ),
    ).toBe(true);
  });
});
