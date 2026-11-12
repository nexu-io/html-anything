import { parse, type CallExpression, type MemberExpression, type Node } from "acorn";
import { walkCompositionDescendants } from "@hyperframes/parsers/hf-ids";
import type { PatchTarget } from "./sourcePatcher";

export const SCRIPT_DEPENDENCY_DELETE_MESSAGE =
  "This element is used by a script. Ask your Agent to update the script, or delete the whole composition.";

const LOOKUPS = new Set([
  "getElementById", "querySelector", "querySelectorAll", "getElementsByClassName", "getElementsByTagName",
]);

function descendants(root: Document | Element): Element[] {
  const elements: Element[] = [];
  walkCompositionDescendants(root, (element) => elements.push(element));
  return elements;
}

function findTarget(elements: Element[], target: PatchTarget): Element | undefined {
  const hf = target.hfId && elements.find((el) => el.getAttribute("data-hf-id") === target.hfId);
  if (hf) return hf;
  const id = target.id && elements.find((el) => el.id === target.id);
  if (id) return id;
  return target.selector
    ? elements.filter((el) => el.matches(target.selector!))[target.selectorIndex ?? 0]
    : undefined;
}

function propertyName(member: MemberExpression): string | undefined {
  if (!member.computed && member.property.type === "Identifier") return member.property.name;
  if (member.property.type === "Literal" && typeof member.property.value === "string") return member.property.value;
  return undefined;
}

function lookupTouchesRemoval(member: MemberExpression, parent: Node | undefined, removed: Set<Element>): boolean {
  const method = propertyName(member);
  if (!method || !LOOKUPS.has(method)) return false;
  // Aliased or dynamic lookups cannot be resolved safely without executing authored code.
  if (parent?.type !== "CallExpression" || (parent as CallExpression).callee !== member) return true;
  const [argument] = (parent as CallExpression).arguments;
  const value = argument?.type === "Literal" ? argument.value
    : argument?.type === "TemplateLiteral" && argument.expressions.length === 0 ? argument.quasis[0]?.value.cooked : null;
  if (typeof value !== "string") return true;
  for (const element of removed) {
    if (method === "getElementById" && element.id === value) return true;
    if (method === "getElementsByClassName" && value.trim().split(/\s+/).every((name) => element.classList.contains(name))) return true;
    if (method === "getElementsByTagName" && (value === "*" || element.localName === value.toLowerCase())) return true;
    if ((method === "querySelector" || method === "querySelectorAll") && element.matches(value)) return true;
  }
  return false;
}

function hasDependency(node: Node, removed: Set<Element>, parent?: Node): boolean {
  if (node.type === "MemberExpression" && lookupTouchesRemoval(node as MemberExpression, parent, removed)) return true;
  for (const child of Object.values(node)) {
    const children = Array.isArray(child) ? child : [child];
    for (const value of children) {
      if (value && typeof value === "object" && typeof value.type === "string" && hasDependency(value, removed, node)) return true;
    }
  }
  return false;
}

/** Refuse an unsafe subtree deletion before either mutation backend can write or record history. */
export function assertSafeElementDeletion(source: string, targets: PatchTarget[]): void {
  // shortcut: inspect direct inline DOM lookups; extend for external scripts or indirect DOM access when supported by the editor.
  if (!/<script\b/i.test(source)) return;
  const elements = descendants(new DOMParser().parseFromString(source, "text/html"));
  const removed = new Set<Element>();
  for (const target of targets) {
    const element = findTarget(elements, target);
    if (element) {
      removed.add(element);
      for (const child of descendants(element)) removed.add(child);
    }
  }
  if (removed.size === 0) return;
  for (const script of elements) {
    if (script.localName !== "script" || removed.has(script) || script.hasAttribute("src")) continue;
    const type = script.getAttribute("type")?.trim() ?? "";
    if (type && !/^(?:module|(?:text|application)\/(?:java|ecma)script)$/i.test(type)) continue;
    try {
      if (!hasDependency(parse(script.textContent ?? "", { ecmaVersion: "latest", sourceType: type === "module" ? "module" : "script" }), removed)) continue;
    } catch {
      // An unparseable executable script cannot be proven independent of the removed subtree.
    }
    throw new Error(SCRIPT_DEPENDENCY_DELETE_MESSAGE);
  }
}
