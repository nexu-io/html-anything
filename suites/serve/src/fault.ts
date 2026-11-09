export interface Fault {
  path: string;
  mode: "missing" | "corrupt" | "truncate" | "stall";
}
export function fault(input: unknown): Fault | undefined {
  if (input === null) return undefined;
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("invalid static fault");
  const value = input as Fault;
  if (
    Object.keys(value).sort().join(":") !== "mode:path" ||
    typeof value.path !== "string" ||
    !/^\/[a-zA-Z0-9/._-]+$/.test(value.path) ||
    value.path.split("/").includes("..") ||
    !["missing", "corrupt", "truncate", "stall"].includes(value.mode)
  )
    throw new Error("invalid static fault");
  return { path: value.path, mode: value.mode };
}
