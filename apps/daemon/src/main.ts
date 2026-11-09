#!/usr/bin/env node

import { decode } from "@odsuite/carrier";
import { serve } from "./service.js";

const data = process.env.ODSUITE_RUNTIME_DATA;
const origin = process.env.ODSUITE_RUNTIME_ORIGIN;
const socket = process.env.ODSUITE_RUNTIME_SOCKET;
const token = process.env.ODSUITE_RUNTIME_TOKEN;
if (!data || !origin || !socket || !token) throw new Error("daemon resources are required");

const environment = process.env.ODSUITE_RUNTIME_CARRIER;
const service = await serve({
  data,
  origin,
  socket,
  token,
  ...(environment ? { environment: decode(environment) } : {}),
});
const stop = async () => {
  await service.close();
  process.exitCode = 0;
};

process.once("SIGINT", () => void stop());
process.once("SIGTERM", () => void stop());
process.stdout.write("ready\n");
