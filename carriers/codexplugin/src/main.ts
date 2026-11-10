#!/usr/bin/env node
import { isAbsolute } from "node:path";
import { channel, namespace } from "@odsuite/protocol";
import { connect } from "./index.js";

const root = process.env.OPEN_MOTION_ROOT;
const lane = process.env.OPEN_MOTION_CHANNEL;
const scope = process.env.OPEN_MOTION_NAMESPACE;
if (!root || !isAbsolute(root) || !lane || !scope)
  throw new Error("absolute OPEN_MOTION_ROOT, OPEN_MOTION_CHANNEL and OPEN_MOTION_NAMESPACE are required");
await connect({
  root,
  scope: { channel: channel(lane), namespace: namespace(scope) },
});
