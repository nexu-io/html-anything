import { parseFragment } from "parse5";
import type { Finding } from "../types.js";

interface Node {
  tagName?: string;
  attrs?: { name: string; value: string }[];
  childNodes?: Node[];
  content?: Node;
  value?: string;
  sourceCodeLocation?: { startLine: number; startCol: number } | null;
}

export function html(path: string, content: string, script?: (source: string) => Finding[]): Finding[] {
  const findings: Finding[] = [];
  function visit(node: Node): void {
    const style =
      node.tagName === "style" ||
      node.attrs?.some(
        (attribute) =>
          attribute.name === "style" ||
          (node.tagName === "link" &&
            attribute.name === "rel" &&
            attribute.value.toLowerCase().split(/\s+/).includes("stylesheet")),
      );
    if (style)
      findings.push({
        path,
        rule: "file.style",
        message: "HTML must not define inline or external styles",
        line: node.sourceCodeLocation?.startLine,
        column: node.sourceCodeLocation?.startCol,
      });
    if (script && node.tagName === "script") {
      const type = node.attrs?.find((attribute) => attribute.name === "type")?.value;
      if (!type || ["module", "text/javascript", "application/javascript"].includes(type)) {
        findings.push(...script(node.childNodes?.map((child) => child.value ?? "").join("") ?? ""));
      }
    }
    if (script) {
      for (const attribute of node.attrs ?? []) {
        if (attribute.name.startsWith("on")) findings.push(...script(attribute.value));
      }
    }
    node.childNodes?.forEach(visit);
    if (node.content) visit(node.content);
  }
  visit(parseFragment(content, { sourceCodeLocationInfo: true }));
  return findings;
}
