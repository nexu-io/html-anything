#!/usr/bin/env node
import { dirname, isAbsolute } from "node:path";
import { fileURLToPath } from "node:url";
import { open as installation } from "@odsuite/installer";
import { channel, namespace } from "@odsuite/protocol";
import { resolve as release } from "@odsuite/release";
import { RuntimeReleaseMismatch } from "@open-motion/standalone/admission";
import { connect } from "./index.js";

const root = process.env.OPEN_MOTION_ROOT;
const lane = process.env.OPEN_MOTION_CHANNEL;
const domain = process.env.OPEN_MOTION_NAMESPACE;
if (!root || !isAbsolute(root) || !lane || !domain)
  throw new Error("absolute OPEN_MOTION_ROOT, OPEN_MOTION_CHANNEL and OPEN_MOTION_NAMESPACE are required");
declare const OPEN_MOTION_VERSION: string;
try {
  const home = process.env.OPEN_MOTION_INSTALLATION_HOME,
    requestId = process.env.OPEN_MOTION_INSTALLATION_REQUEST;
  if (home || requestId) {
    if (!home || !requestId) throw Error("installation home and request binding are both required");
    const scope = { channel: channel(lane), namespace: namespace(domain) };
    const session = await installation({
      home,
      product: release({}, { channel: scope.channel, version: OPEN_MOTION_VERSION }).identity.appid,
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
