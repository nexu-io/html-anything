import { parse, type CallExpression, type Identifier, type Literal, type MemberExpression, type Node, type TemplateLiteral } from "acorn";
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

function childElements(parent: Element): Element[] {
  const direct = Array.from(parent.children);
  if (direct.length || parent.localName !== "template") return direct;
  const content = (parent as HTMLTemplateElement).content;
  return content ? Array.from(content.children) : direct;
}

/** Every descendant including markup held in inert templates; REST traversal visits those too. */
function allDescendants(root: Document | Element): Element[] {
  const rootElement: Element | null = root.nodeType === 9 ? (root as Document).documentElement : (root as Element);
  const elements: Element[] = [];
  const walk = (parent: Element) => {
    for (const child of childElements(parent)) {
      elements.push(child);
      walk(child);
    }
  };
  if (rootElement) walk(rootElement);
  return elements;
}

/** REST resolves selectors outside templates first, then inside the earliest template. */
function selectorMatches(root: Document | Element, selector: string): Element[] {
  const scope: ParentNode = root.nodeType === 1 && (root as Element).localName === "template"
    ? (root as HTMLTemplateElement).content ?? root
    : root;
  let direct: Element[];
  try {
    direct = Array.from(scope.querySelectorAll(selector));
  } catch {
    return [];
  }
  if (direct.length > 0) return direct;
  for (const template of Array.from(scope.querySelectorAll("template"))) {
    const inner = selectorMatches(template, selector);
    if (inner.length > 0) return inner;
  }
  return [];
}

function findTarget(document: Document, target: PatchTarget): Element | undefined {
  const elements = descendants(document);
  const matches = target.hfId ? elements.filter((el) => el.getAttribute("data-hf-id") === target.hfId) : [];
  // SDK scope resolution and REST document order can select different nodes.
  if (target.hfId?.includes("/") || matches.length > 1) throw new Error(SCRIPT_DEPENDENCY_DELETE_MESSAGE);
  if (matches[0]) return matches[0];
  const id = target.id && elements.find((el) => el.id === target.id);
  if (id) return id;
  return target.selector ? selectorMatches(document, target.selector)[target.selectorIndex ?? 0] : undefined;
}

function staticString(node: Node | undefined): string | null {
  if (!node) return null;
  if (node.type === "Literal") {
    const value = (node as Literal).value;
    return typeof value === "string" ? value : null;
  }
  if (node.type === "TemplateLiteral") {
    const template = node as TemplateLiteral;
    return template.expressions.length === 0 ? template.quasis[0]?.value.cooked ?? null : null;
  }
  return null;
}

/** Resolve the nodes a script receives a lookup from, so scoped selectors keep their own reference point. */
function lookupScopes(node: Node, document: Document): (Document | Element)[] | null {
  if (node.type === "Identifier" && (node as Identifier).name === "document") return [document];
  if (node.type !== "CallExpression") return null;
  const call = node as CallExpression;
  const callee = call.callee;
  if (callee.type !== "MemberExpression") return null;
  const member = callee as MemberExpression;
  const method = propertyName(member);
  const value = staticString(call.arguments[0]);
  if (!method || value === null) return null;
  const parents = lookupScopes(member.object, document);
  if (!parents) return null;
  const scopes: (Document | Element)[] = [];
  try {
    for (const parent of parents) {
      if (method === "querySelector") {
        const found = parent.querySelector(value);
        if (found) scopes.push(found);
      } else if (method === "querySelectorAll") {
        scopes.push(...Array.from(parent.querySelectorAll(value)));
      } else if (method === "getElementsByClassName") {
        scopes.push(...Array.from(parent.getElementsByClassName(value)));
      } else if (method === "getElementsByTagName") {
        scopes.push(...Array.from(parent.getElementsByTagName(value)));
      } else if (method === "getElementById" && parent.nodeType === 9) {
        const found = (parent as Document).getElementById(value);
        if (found) scopes.push(found);
      } else {
        return null;
      }
    }
  } catch {
    return null;
  }
  return scopes;
}

function propertyName(member: MemberExpression): string | undefined {
  if (!member.computed && member.property.type === "Identifier") return member.property.name;
  if (member.property.type === "Literal" && typeof member.property.value === "string") return member.property.value;
  if (member.property.type === "TemplateLiteral" && member.property.expressions.length === 0) return member.property.quasis[0]?.value.cooked ?? undefined;
  return undefined;
}

function lookupTouchesRemoval(member: MemberExpression, parent: Node | undefined, removed: Set<Element>, document: Document): boolean {
  const method = propertyName(member);
  if (!method || !LOOKUPS.has(method)) return false;
  // Aliased or dynamic lookups cannot be resolved safely without executing authored code.
  if (parent?.type !== "CallExpression" || (parent as CallExpression).callee !== member) return true;
  const value = staticString((parent as CallExpression).arguments[0]);
  if (value === null) return true;
  // A scoped selector is evaluated against the receiver, not the document root.
  if ((method === "querySelector" || method === "querySelectorAll") && (/^\s*[>+~]|:scope\b/i.test(value))) {
    const scopes = lookupScopes(member.object, document);
    if (!scopes) return true;
    try {
      for (const scope of scopes) {
        for (const match of Array.from(scope.querySelectorAll(value))) if (removed.has(match)) return true;
      }
    } catch {
      return true;
    }
    return false;
  }
  for (const element of removed) {
    if (method === "getElementById" && element.id === value) return true;
    if (method === "getElementsByClassName" && value.trim().split(/\s+/).every((name) => element.classList.contains(name))) return true;
    if (method === "getElementsByTagName" && (value === "*" || element.localName === value.toLowerCase())) return true;
    if ((method === "querySelector" || method === "querySelectorAll") && element.matches(value)) return true;
  }
  return false;
}

function hasDependency(node: Node, removed: Set<Element>, document: Document, parent?: Node): boolean {
  if (node.type === "MemberExpression" && lookupTouchesRemoval(node as MemberExpression, parent, removed, document)) return true;
  for (const child of Object.values(node)) {
    const children = Array.isArray(child) ? child : [child];
    for (const value of children) {
      if (value && typeof value === "object" && typeof value.type === "string" && hasDependency(value, removed, document, node)) return true;
    }
  }
  return false;
}

/** Refuse an unsafe subtree deletion before either mutation backend can write or record history. */
export function assertSafeElementDeletion(source: string, targets: PatchTarget[]): void {
  // shortcut: inspect direct inline DOM lookups; extend for external scripts or indirect DOM access when supported by the editor.
  if (!/<script\b/i.test(source)) return;
  const document = new DOMParser().parseFromString(source, "text/html");
  const elements = descendants(document);
  const scripts = elements.filter((el) => {
    if (el.localName !== "script" || el.hasAttribute("src")) return false;
    const type = el.getAttribute("type")?.trim() ?? "";
    return !type || /^(?:module|(?:text|application)\/(?:x-)?(?:java|ecma)script|text\/(?:javascript1\.[0-5]|jscript|livescript))$/i.test(type);
  });
  if (scripts.length === 0) return;
  // REST resolves each target after prior removals; retain original nodes for script selector matching.
  const pendingDocument = document.cloneNode(true) as Document;
  const originalDescendants = allDescendants(document);
  const originals = new Map(allDescendants(pendingDocument).map((element, index) => [element, originalDescendants[index]]));
  const removed = new Set<Element>();
  for (const target of targets) {
    const pending = findTarget(pendingDocument, target);
    const element = pending && originals.get(pending);
    if (element) {
      removed.add(element);
      for (const child of allDescendants(element)) removed.add(child);
    }
    pending?.remove();
  }
  if (removed.size === 0) return;
  for (const script of scripts) {
    if (removed.has(script)) continue;
    try {
      if (!hasDependency(parse(script.textContent ?? "", { ecmaVersion: "latest", sourceType: script.getAttribute("type")?.trim().toLowerCase() === "module" ? "module" : "script" }), removed, document)) continue;
    } catch {
      // An unparseable executable script cannot be proven independent of the removed subtree.
    }
    throw new Error(SCRIPT_DEPENDENCY_DELETE_MESSAGE);
  }
}
