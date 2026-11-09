import { createConnection } from "node:net";
import { selfWitness } from "../process/observe.js";
import { decorate } from "./sessionwire.js";
import { encode, type Request, type Response } from "./wire.js";

const limit = 64 * 1024;

function decode(input: string, end: number): Response {
  const value: unknown = JSON.parse(input.slice(0, end));

  if (!value || typeof value !== "object" || !("ok" in value)) {
    throw new TypeError("invalid response");
  }

  return value as Response;
}

export async function call(endpoint: string, request: Request, timeout: number): Promise<unknown> {
  const payload = encode({ ...decorate(endpoint, request), actor: await selfWitness() });
  return new Promise((resolve, reject) => {
    const socket = createConnection(endpoint);
    let input = "";
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
      input += chunk.toString("utf8");
      if (Buffer.byteLength(input) > limit) {
        finish(() => reject(new Error("response exceeds limit")));
        return;
      }

      const end = input.indexOf("\n");
      if (end < 0) return;

      try {
        const response = decode(input, end);
        if (!response.ok) finish(() => reject(new Error(response.error)));
        else finish(() => resolve(response.value));
      } catch (error) {
        finish(() => reject(error));
      }
    });
  });
}
