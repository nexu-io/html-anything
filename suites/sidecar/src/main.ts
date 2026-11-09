#!/usr/bin/env node

import { serve } from "./runtime/server.js";

const endpoint = process.env.ODSUITE_RUNTIME_SIDECAR_ENDPOINT;
const authority = process.env.ODSUITE_RUNTIME_SIDECAR_AUTHORITY;

if (!endpoint || !authority) {
  throw new Error("sidecar endpoint and authority are required");
}

const service = await serve(endpoint, { authority: authority });
const stop = async () => {
  await service.close();
  process.exitCode = 0;
};

process.once("SIGINT", () => void stop());
process.once("SIGTERM", () => void stop());
process.stdout.write("ready\n");
