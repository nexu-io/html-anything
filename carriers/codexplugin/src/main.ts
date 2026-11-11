#!/usr/bin/env node
import { dirname, isAbsolute } from "node:path";
import { fileURLToPath } from "node:url";
import { open as installation } from "@odsuite/installer";
import { channel, namespace } from "@odsuite/protocol";
import { RuntimeReleaseMismatch } from "@open-motion/standalone/admission";
import { connect } from "./index.js";

const root = process.env.OPEN_MOTION_ROOT;
const lane = process.env.OPEN_MOTION_CHANNEL;
const domain = process.env.OPEN_MOTION_NAMESPACE;
if (!root || !isAbsolute(root) || !lane || !domain)
  throw new Error("absolute OPEN_MOTION_ROOT, OPEN_MOTION_CHANNEL and OPEN_MOTION_NAMESPACE are required");
try {
  const home = process.env.OPEN_MOTION_INSTALLATION_HOME,
    product = process.env.OPEN_MOTION_INSTALLATION_PRODUCT,
    requestId = process.env.OPEN_MOTION_INSTALLATION_REQUEST;
  if ([home, product, requestId].some((value) => value !== undefined)) {
    if (!home || !product || !requestId)
      throw Error("installation home, base product and request binding are required");
    const scope = { channel: channel(lane), namespace: namespace(domain) };
    const session = await installation({
      home,
      product,
      scope,
    });
    try {
      await session.use({
        requestId,
        application: dirname(fileURLToPath(import.meta.url)),
        data: root,
        carrier: "codexplugin",
      });
    } finally {
      await session.close();
    }
  }
  await connect({
    root,
    scope: { channel: channel(lane), namespace: namespace(domain) },
  });
} catch (error) {
  if (!(error instanceof RuntimeReleaseMismatch)) throw error;
  process.stderr.write(`${JSON.stringify(error.diagnostic())}
`);
  process.exitCode = 1;
}
