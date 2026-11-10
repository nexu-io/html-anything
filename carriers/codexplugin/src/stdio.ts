import { McpServer } from "@modelcontextprotocol/server";
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import { instructions, register } from "@open-motion/daemon/mcp";
import type { Standalone } from "@open-motion/standalone";
export async function listen(runtime: Pick<Standalone, "status" | "execute">, onClose: () => Promise<void>) {
  let handle: ReturnType<typeof serveStdio> | undefined, closing: Promise<void> | undefined;
  let done: () => void = () => {},
    failed: (e: unknown) => void = () => {};
  const closed = new Promise<void>((yes, no) => {
    done = yes;
    failed = no;
  });
  const close = () => {
    closing ??= Promise.resolve()
      .then(async () => {
        try {
          await handle?.close();
        } finally {
          await onClose();
          process.stdin.off("end", stop);
          process.stdin.off("error", stop);
          process.off("SIGINT", stop);
          process.off("SIGTERM", stop);
        }
      })
      .then(done, (error) => {
        failed(error);
        throw error;
      });
    return closing;
  };
  const stop = () => {
    void close().catch((error) => {
      process.stderr.write(`${error}\n`);
      process.exitCode = 1;
    });
  };
  const status = await runtime.status();
  handle = serveStdio(
    () => {
      const server = new McpServer(
        { name: "open-motion", version: status.manifest.identity.version },
        { instructions },
      );
      server.registerTool(
        "runtime_status",
        {
          title: "Open Motion runtime status",
          description: "Read active carrier environment, Web URL and Daemon health.",
          annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
        },
        async () => {
          const result = await runtime.status();
          return { content: [{ type: "text", text: JSON.stringify(result) }], structuredContent: { ...result } };
        },
      );
      register(server, (operation, input) => runtime.execute(operation, input));
      server.server.onclose = stop;
      return server;
    },
    {
      onerror: (error) => {
        process.stderr.write(`${error}\n`);
        process.exitCode = 1;
      },
    },
  );
  process.stdin.once("end", stop);
  process.stdin.once("error", stop);
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);
  return { close, closed };
}
