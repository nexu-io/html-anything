import { createConnection } from "node:net";
import { selfWitness } from "../process/observe.js";
import { decorate } from "./sessionwire.js";
import { encode, type Request, type Response } from "./wire.js";

const limit = 64 * 1024;

function decode(input: Buffer, end: number): Response {
  const value: unknown = JSON.parse(
    new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(input.subarray(0, end)),
  );

  if (!value || typeof value !== "object" || !("ok" in value)) {
    throw new TypeError("invalid response");
  }

  return value as Response;
}

export async function call(endpoint: string, request: Request, timeout: number): Promise<unknown> {
  const payload = encode({ ...decorate(endpoint, request), actor: await selfWitness() });
  return new Promise((resolve, reject) => {
    const socket = createConnection(endpoint);
    const chunks: Buffer[] = [];
    let bytes = 0;
    let settled = false;
    const finish = (operation: () => void) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      operation();
    };

    socket.setTimeout(timeout, () => finish(() => reject(new Error("request timeout"))));
    socket.once("connect", () => socket.write(payload));
    socket.once("end", () => finish(() => reject(new Error("response ended before completion"))));
    socket.once("error", (error) => finish(() => reject(error)));
    socket.on("data", (chunk: Buffer) => {
      bytes += chunk.length;
      if (bytes > limit) {
        finish(() => reject(new Error("response exceeds limit")));
        return;
      }
      chunks.push(chunk);

      const end = chunk.indexOf(10);
      if (end < 0) return;

      try {
        const response = decode(Buffer.concat(chunks, bytes), bytes - chunk.length + end);
        if (!response.ok) finish(() => reject(new Error(response.error)));
        else finish(() => resolve(response.value));
      } catch (error) {
        finish(() => reject(error));
      }
    });
  });
}
