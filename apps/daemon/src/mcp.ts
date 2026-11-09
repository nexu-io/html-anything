import type { McpServer, StandardSchemaWithJSON } from "@modelcontextprotocol/server";
import { descriptions, Fault, type Input, type Operation, type Output, schemas } from "@open-motion/workspace/contract";
export type Execute = <K extends Operation>(operation: K, input: Input<K>) => Promise<Output<K>>;
/** Business tool descriptors and routing belong to the application; hosts only attach transports. */
export function register(server: McpServer, execute: Execute): void {
  for (const operation of Object.keys(schemas) as Operation[]) {
    const schema: StandardSchemaWithJSON = schemas[operation];
    server.registerTool(
      operation,
      {
        description: descriptions[operation],
        inputSchema: schema,
        annotations: {
          readOnlyHint: !("requestId" in schemas[operation].shape),
          destructiveHint: ["project_save", "project_undo", "project_redo", "resource_remove"].includes(operation),
          idempotentHint: true,
          openWorldHint: false,
        },
      },
      async (input: unknown) => {
        try {
          const result = await execute(operation, input as Input<typeof operation>);
          // Binary data is present once in structured output, keeping the stock stdio envelope bounded.
          const text =
            operation === "resource_read" ? { resource: (result as Output<"resource_read">).resource } : result;
          return { content: [{ type: "text", text: JSON.stringify(text) }], structuredContent: { ...result } };
        } catch (error) {
          return {
            isError: true,
            content: [{ type: "text", text: (error as Error).message }],
            structuredContent: {
              error: { code: error instanceof Fault ? error.code : "transport", message: (error as Error).message },
            },
          };
        }
      },
    );
  }
}
