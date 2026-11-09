import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { parse } from "@babel/parser";
import type { Context, Finding, Module } from "../types.js";

interface Node {
  type: string;
  [key: string]: unknown;
}

function field(value: unknown, name: string): Node | undefined {
  if (!value || typeof value !== "object") return undefined;
  const properties = (value as Node).properties as Node[] | undefined;
  return properties?.find((property) => (property.key as Node)?.name === name)?.value as Node | undefined;
}

export async function vitest(context: Context, module: Module): Promise<Finding[]> {
  const path = module.path === "." ? "vitest.config.ts" : `${module.path}/vitest.config.ts`;
  if (!context.entries.some((entry) => entry.path === path && entry.kind === "file"))
    return [{ path, rule: "module.vitest", message: "module requires vitest.config.ts" }];
  let config: Node | undefined;
  try {
    const program = parse(await readFile(join(context.root, path), "utf8"), {
      sourceType: "module",
      plugins: ["typescript"],
    });
    const exported = program.program.body.find((item) => item.type === "ExportDefaultDeclaration");
    if (exported?.type === "ExportDefaultDeclaration") {
      const declaration = exported.declaration;
      config = (declaration.type === "CallExpression" ? declaration.arguments[0] : declaration) as unknown as Node;
    }
  } catch (error) {
    return [{ path, rule: "module.vitest", message: `cannot establish Vitest discovery: ${(error as Error).message}` }];
  }
  const include = field(field(config, "test"), "include");
  const elements = include?.elements as Node[] | undefined;
  if (!elements?.some((item) => item?.type === "StringLiteral" && item.value === "tests/**/*.test.ts"))
    return [{ path, rule: "module.vitest", message: "test.include must explicitly contain tests/**/*.test.ts" }];
  return [];
}
