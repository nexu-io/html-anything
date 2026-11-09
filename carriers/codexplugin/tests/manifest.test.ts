import { expect, it } from "vitest";
import { metadata } from "@/manifest.js";

it("describes one local Codex entry and shares the product release version", () => {
  const value = metadata("0.6.1-beta.2");
  expect(value.plugin.version).toBe("0.6.1-beta.2");
  expect(value.plugin.name).toBe("open-motion");
  expect(value.plugin.mcpServers).toBe("./mcp.json");
  expect(value.mcp.mcpServers["open-motion"].args).toEqual([`\${PLUGIN_ROOT}/main.mjs`]);
  expect(value.mcp.mcpServers["open-motion"].env_vars).toContain("OPEN_MOTION_ROOT");
  expect(() => metadata("0.6.1-stable.1")).toThrow();
});
