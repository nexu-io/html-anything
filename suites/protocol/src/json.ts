import { createHash } from "node:crypto";

export type Digest = `sha256:${string}`;

const pattern = /^sha256:[a-f0-9]{64}$/;

export function digest(value: string | Uint8Array): Digest {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

export function valid(value: unknown): value is Digest {
  return typeof value === "string" && pattern.test(value);
}

export function canonical(value: unknown): string {
  if (value === null || typeof value === "boolean" || typeof value === "string") {
    return JSON.stringify(value);
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new TypeError("JSON numbers must be finite");
    }

    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map(canonical).join(",")}]`;
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const entries = Object.keys(record)
      .sort()
      .map((key) => {
        const item = record[key];

        if (item === undefined) {
          throw new TypeError(`undefined value at ${key}`);
        }

        return `${JSON.stringify(key)}:${canonical(item)}`;
      });

    return `{${entries.join(",")}}`;
  }

  throw new TypeError(`unsupported JSON value: ${typeof value}`);
}
