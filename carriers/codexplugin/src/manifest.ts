import { parseReleaseVersion } from "@odsuite/release";
export function metadata(version: string) {
  parseReleaseVersion(version);
  return {
    plugin: {
      name: "open-motion",
      version,
      description: "Open Motion local managed runtime",
      mcpServers: "./mcp.json",
      skills: "./skills/",
      requires_local_executor: true,
    },
    mcp: {
      mcpServers: {
        "open-motion": {
          type: "stdio",
          command: "node",
          args: [`\${PLUGIN_ROOT}/main.mjs`],
          cwd: `\${PLUGIN_ROOT}`,
          env_vars: ["OPEN_MOTION_ROOT", "OPEN_MOTION_CHANNEL", "OPEN_MOTION_NAMESPACE", "OPEN_MOTION_VERSION"],
        },
      },
    },
  };
}
