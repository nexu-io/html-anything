import { canonical } from "@odsuite/protocol";
import { type Factory, observeOwner, observeWitnesses, type Witness } from "@odsuite/sidecar";
import type { Transaction } from "./install/transaction.js";
import { type Consumption, InstallerFault } from "./types.js";

export async function consume(transaction: Transaction, factory: Factory, input: Consumption) {
  const receipt = await transaction.verified(transaction.store.receipt(input.requestId));
  if (receipt.path !== input.application || receipt.data !== input.data || receipt.carrier !== input.carrier)
    throw new InstallerFault("invalid", "installation consumption binding mismatch");
  const current = transaction.store.read(receipt.carrier);
  if (current?.requestId !== receipt.requestId)
    throw new InstallerFault("conflict", "selected installation changed before use");
  if (canonical(current) !== canonical(receipt))
    throw new InstallerFault("integrity", "selected installation receipt changed before use");
  let controller: Witness;
  if (input.manager) {
    if (input.manager.root !== receipt.data || canonical(input.manager.scope) !== canonical(factory.scope))
      throw new InstallerFault("invalid", "installation manager scope mismatch");
    const actual = await observeOwner(receipt.data, factory.scope);
    if (!actual || canonical(actual) !== canonical(input.manager))
      throw new InstallerFault("conflict", "installation manager witness changed");
    controller = { pid: actual.pid, birth: actual.birth };
  } else {
    const actual = (await factory.directory()).manager;
    if (actual.pid !== process.pid || actual.phase !== "active")
      throw new InstallerFault("integrity", "installation controller witness is unavailable");
    controller = { pid: actual.pid, birth: actual.birth };
  }
  return transaction.store.occupy(receipt, controller);
}
export async function observations(transaction: Transaction) {
  const uses = transaction.store.uses(),
    values = await observeWitnesses(uses.map((use) => use.controller));
  return uses.map((use, index) => ({ ...use, state: values[index]!.state }));
}
