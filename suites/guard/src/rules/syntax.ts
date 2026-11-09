import { extname } from "node:path";
import { parse } from "@babel/parser";
import type { Finding } from "../types.js";
import { html } from "./html.js";

interface Node {
  type: string;
  [key: string]: unknown;
}

function node(value: unknown): value is Node {
  return !!value && typeof value === "object" && "type" in value && typeof value.type === "string";
}

function word(value: unknown): string | undefined {
  if (!node(value)) return undefined;
  if (value.type === "Identifier" || value.type === "JSXIdentifier") return value.name as string;
  if (value.type === "StringLiteral") return value.value as string;
  return undefined;
}

function member(value: unknown): string | undefined {
  if (!node(value)) return undefined;
  if (["MemberExpression", "OptionalMemberExpression"].includes(value.type)) return word(value.property);
  return word(value);
}

function root(value: unknown): string | undefined {
  if (!node(value)) return undefined;
  if (["MemberExpression", "OptionalMemberExpression"].includes(value.type)) return root(value.object);
  if (value.type === "CallExpression") return root(value.callee);
  return word(value);
}

export function syntax(path: string, content: string): Finding[] {
  const extension = extname(path);
  const typed = [".ts", ".tsx", ".mts", ".cts"].includes(extension);
  const findings: Finding[] = [];
  const parsed = parse(content, {
    sourceType: "unambiguous",
    plugins: [
      ...(typed ? ["typescript" as const] : []),
      ...([".tsx", ".jsx"].includes(extension) ? ["jsx" as const] : []),
    ],
  });
  function mark(value: Node, message: string): void {
    const location = value.loc as { start: { line: number; column: number } } | undefined;
    findings.push({
      path,
      rule: "file.style",
      message,
      line: location?.start.line,
      column: location ? location.start.column + 1 : undefined,
    });
  }
  function visit(value: unknown): void {
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    if (!node(value)) return;
    if (value.type === "JSXAttribute" && ["style", "css", "sx"].includes(word(value.name) ?? ""))
      mark(value, "JSX style definitions are forbidden");
    if (value.type === "JSXSpreadAttribute") mark(value, "spread JSX props cannot establish style isolation");
    if (value.type === "JSXOpeningElement" && word(value.name) === "style")
      mark(value, "JSX style elements are forbidden");
    if (value.type === "JSXOpeningElement" && word(value.name) === "link") {
      const attributes = value.attributes as Node[];
      if (attributes.some((attribute) => word(attribute.name) === "rel" && word(attribute.value) === "stylesheet"))
        mark(value, "JSX stylesheet links are forbidden");
    }
    if (
      ["MemberExpression", "OptionalMemberExpression"].includes(value.type) &&
      ["style", "cssText", "adoptedStyleSheets"].includes(member(value) ?? "")
    )
      mark(value, "runtime style access is forbidden");
    if (value.type === "NewExpression" && member(value.callee) === "CSSStyleSheet")
      mark(value, "runtime stylesheet construction is forbidden");
    if (value.type === "TaggedTemplateExpression" && ["css", "styled", "keyframes"].includes(root(value.tag) ?? ""))
      mark(value, "CSS-in-JS definitions are forbidden");
    if (["ImportDeclaration", "ExportNamedDeclaration", "ExportAllDeclaration"].includes(value.type)) {
      const specifier = word(value.source) ?? "";
      if (
        /\.(?:css|less|scss|sass|styl)(?:[?#]|$)/i.test(specifier) ||
        /^(?:styled-components|@emotion\/|@vanilla-extract\/)/.test(specifier)
      )
        mark(value, "source must not import style definitions or CSS-in-JS");
    }
    if (["CallExpression", "OptionalCallExpression"].includes(value.type)) {
      const name = member(value.callee);
      const args = value.arguments as unknown[];
      if (["css", "styled", "keyframes", "stylex"].includes(root(value.callee) ?? ""))
        mark(value, "CSS-in-JS calls are forbidden");
      if (["insertRule", "addRule", "replaceSync", "setProperty"].includes(name ?? ""))
        mark(value, "runtime style mutation is forbidden");
      if (
        ["setAttribute", "setAttributeNS"].includes(name ?? "") &&
        args.some((item) => ["style", "stylesheet"].includes(word(item) ?? ""))
      )
        mark(value, "runtime style attributes are forbidden");
      const attribute = args[name === "setAttributeNS" ? 1 : 0];
      if (
        ["setAttribute", "setAttributeNS"].includes(name ?? "") &&
        (!node(attribute) || attribute.type !== "StringLiteral")
      )
        mark(value, "dynamic attribute names cannot establish style isolation");
      if (
        ["createElement", "createElementNS"].includes(name ?? "") &&
        args.some((item) => ["style", "link"].includes(word(item) ?? ""))
      )
        mark(value, "runtime style element creation is forbidden");
      const element = args[name === "createElementNS" ? 1 : 0];
      if (
        ["createElement", "createElementNS"].includes(name ?? "") &&
        (!node(element) || element.type !== "StringLiteral")
      )
        mark(value, "dynamic element names cannot establish style isolation");
      if (
        name === "insertAdjacentHTML" ||
        (["write", "writeln"].includes(name ?? "") && root(value.callee) === "document")
      ) {
        for (const argument of args) checkHtml(argument, value);
      }
      if (name === "require" || name === "import") {
        if (/\.(?:css|less|scss|sass|styl)(?:[?#]|$)/i.test(word(args[0]) ?? ""))
          mark(value, "dynamic style imports are forbidden");
      }
    }
    if (value.type === "ImportExpression" && /\.(?:css|less|scss|sass|styl)(?:[?#]|$)/i.test(word(value.source) ?? ""))
      mark(value, "dynamic style imports are forbidden");
    if (["ObjectProperty", "ObjectMethod"].includes(value.type) && word(value.key) === "style")
      mark(value, "style properties in source are forbidden");
    if (value.type === "ObjectProperty" && word(value.key) === "__html") checkHtml(value.value, value);
    if (value.type === "AssignmentExpression" && ["innerHTML", "outerHTML"].includes(member(value.left) ?? ""))
      checkHtml(value.right, value);
    for (const [key, child] of Object.entries(value)) {
      if (!["loc", "comments", "leadingComments", "trailingComments", "innerComments", "tokens"].includes(key))
        visit(child);
    }
  }
  function checkHtml(input: unknown, location: Node): void {
    if (!node(input)) {
      mark(location, "dynamic HTML cannot establish style isolation");
      return;
    }
    let text = input.type === "StringLiteral" ? (input.value as string) : undefined;
    if (input.type === "TemplateLiteral" && !(input.expressions as unknown[]).length)
      text = (input.quasis as Node[]).map((quasi) => (quasi.value as { raw: string }).raw).join("");
    if (text === undefined) {
      mark(location, "dynamic HTML cannot establish style isolation");
      return;
    }
    if (text.includes("<"))
      for (const finding of html(path, text, (source) => syntax(`${path}.js`, source))) mark(location, finding.message);
  }
  visit(parsed);
  return findings;
}
