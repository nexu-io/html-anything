import { basename, join, resolve } from "node:path";
import { metadata } from "@odsuite/distribution";
import { managerReady } from "@odsuite/sidecar";
import { open, registration, scope } from "./domain.js";
import { jobPaths, json, save } from "./files.js";
import { Transaction } from "./transaction.js";
import type { Job, Journal } from "./types.js";

const at = process.argv.indexOf("--job"),
  path = process.argv[at + 1];
if (at < 0 || !path) throw Error("installation job required");
const job = await json<Job>(path);
if (job?.schema !== 1 || !/^[-a-f0-9]{36}$/.test(job.id) || !/^[-a-f0-9]{36}$/.test(job.nonce))
  throw Error("invalid installation job");
job.metadata = metadata(job.metadata);
let transaction: Transaction | undefined,
  armed = false,
  cancelled = false,
  wake: () => void = () => {};
const signal = new Promise<void>((done) => (wake = done));
const domain = await open(
  job.root,
  job.target,
  job.metadata.product,
  job.metadata.channel,
  {
    status: async () => structuredClone(transaction?.record),
    register: async (value): Promise<boolean> => {
      if (value.root !== job.runtime.root || value.version !== job.shell.version)
        throw Error("installation is active; runtime admission is blocked");
      return registration(domain.context, value, job.metadata.product, job.metadata.channel);
    },
    arm: async (value) => {
      if (value.id !== job.id || value.nonce !== job.nonce) throw Error("installation arm mismatch");
      if (!armed) {
        armed = true;
        wake();
      }
      return true;
    },
    confirm: async (value) => {
      if (!transaction) throw Error("installation transaction is not ready");
      return transaction.confirm(value);
    },
  },
  async () => {
    if (armed && transaction && !["confirmed", "failed"].includes(transaction.record.phase))
      throw Error("installation is active; explicit interruption/recovery required");
    if (!armed) {
      if (transaction) {
        transaction.record.error = "cancelled before arm";
        await transaction.persist("failed");
      }
      cancelled = true;
      wake();
    }
  },
);
try {
  jobPaths(job, domain.context);
  if (
    resolve(job.home) !== join(domain.context.roots.data, "transactions", job.id) ||
    resolve(path) !== join(job.home, "job.json") ||
    basename(job.executor) !== job.appName
  )
    throw Error("installation job escaped owner roots");
  const record = await json<Journal>(join(job.home, "record.json"));
  if (!record) throw Error("installation record missing");
  transaction = new Transaction(job, record);
  await transaction.verify();
  transaction.record.manager = await managerReady(domain.service, job.root, scope(job.metadata.channel));
  await save(join(job.home, "record.json"), transaction.record);
} catch (error) {
  if (transaction) {
    transaction.record.error = String(error);
    await transaction.persist("failed");
  }
  await domain.close();
  throw error;
}
process.on("SIGTERM", () => {
  if (armed && transaction && !["confirmed", "failed"].includes(transaction.record.phase)) process.exit(1);
  void domain.close().then(() => process.exit(1));
});
await signal;
if (cancelled) {
  await domain.close();
  process.exit(1);
}
try {
  await transaction.run();
  await domain.close();
  process.exit(0);
} catch (error) {
  process.stderr.write(`${String(error)}\n`);
  await domain.close();
  process.exit(1);
}
