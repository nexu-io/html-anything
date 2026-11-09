import { release } from "node:os";
import { Environments } from "@odsuite/carrier";
export function collect() {
  return new Environments().register({
    schema: 1,
    carrier: "standalone",
    system: { platform: process.platform, arch: process.arch, release: release() },
    runtime: { name: "node", version: process.versions.node },
  });
}
