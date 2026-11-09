import { join } from "node:path";

export type Platform = "mac" | "linux" | "win";
export type Architecture = "arm64" | "x64";
export const nativePlatform = (): Platform => {
  if (process.platform === "darwin") return "mac";
  if (process.platform === "linux") return "linux";
  if (process.platform === "win32") return "win";
  throw new Error("unsupported native packaging platform");
};
export function target(platform: string = nativePlatform(), arch: string = process.arch) {
  if (!["mac", "linux", "win"].includes(platform) || !["arm64", "x64"].includes(arch))
    throw new Error("unsupported package target");
  return { platform: platform as Platform, arch: arch as Architecture };
}
export function layout(output: string, executable: string, platform: Platform, arch: Architecture) {
  const suffix = arch === "x64" ? "" : `-${arch}`;
  if (platform === "mac") {
    const app = join(output, arch === "x64" ? "mac" : `mac-${arch}`, `${executable}.app`);
    return {
      app,
      executable: join(app, "Contents", "MacOS", executable),
      resources: join(app, "Contents", "Resources"),
    };
  }
  const app = join(output, `${platform}${suffix}-unpacked`);
  return {
    app,
    executable: join(app, `${executable}${platform === "win" ? ".exe" : ""}`),
    resources: join(app, "resources"),
  };
}

export async function separate(output: string, inputs: string[]): Promise<void> {
  const { realpath } = await import("node:fs/promises");
  const { basename, dirname, isAbsolute, relative, resolve, sep } = await import("node:path");
  async function canonical(path: string): Promise<string> {
    try {
      return await realpath(path);
    } catch (fault) {
      if ((fault as NodeJS.ErrnoException).code !== "ENOENT") throw fault;
      return join(await canonical(dirname(path)), basename(path));
    }
  }
  const destination = await canonical(resolve(output));
  const contains = (a: string, b: string) => {
    const path = relative(a, b);
    return !isAbsolute(path) && path !== ".." && !path.startsWith(`..${sep}`);
  };
  for (const input of inputs) {
    const source = await canonical(resolve(input));
    if (contains(destination, source) || contains(source, destination))
      throw new Error("package output must be separate from all inputs");
  }
}
