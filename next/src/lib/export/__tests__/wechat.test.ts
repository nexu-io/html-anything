import { describe, it, expect, afterEach } from "vitest";
import { toWechatHtmlFromDocument } from "../wechat";

function parseFragment(html: string): HTMLBodyElement {
  return new DOMParser().parseFromString(`<body>${html}</body>`, "text/html")
    .body as HTMLBodyElement;
}

describe("toWechatHtmlFromDocument", () => {
  afterEach(() => {
    document.head.innerHTML = "";
    document.body.innerHTML = "";
  });

  it("inlines computed styles from the rendered preview DOM", () => {
    document.head.innerHTML = `
      <style>
        .card {
          background: rgb(12, 34, 56);
          border-radius: 18px;
          padding: 24px;
        }
        .title {
          color: rgb(210, 55, 44);
          font-size: 32px;
          font-weight: 800;
          line-height: 1.25;
        }
      </style>
    `;
    document.body.innerHTML = `
      <article class="card">
        <h1 class="title">Styled headline</h1>
      </article>
    `;

    const body = parseFragment(toWechatHtmlFromDocument(document));
    const section = body.querySelector("section");
    const card = body.querySelector("article");
    const title = body.querySelector("h1");

    expect(section?.getAttribute("data-tool")).toBe("html-anything");
    expect(card?.getAttribute("data-tool")).toBe("html-anything");
    expect(card?.getAttribute("style")).toContain("background-color: rgb(12, 34, 56)");
    expect(card?.getAttribute("style")).toContain("border-radius: 18px");
    expect(card?.getAttribute("style")).toContain("padding: 24px");
    expect(title?.getAttribute("style")).toContain("color: rgb(210, 55, 44)");
    expect(title?.getAttribute("style")).toContain("font-size: 32px");
    expect(title?.getAttribute("style")).toContain("font-weight: 800");
  });

  it("drops fragile page-layout styles so WeChat paste stays in article flow", () => {
    document.head.innerHTML = `
      <style>
        .layout {
          position: absolute;
          display: grid;
          grid-template-columns: 320px 1fr;
          width: 1280px;
          height: 720px;
          gap: 48px;
          background: rgb(250, 248, 240);
          padding: 40px;
        }
        .panel {
          display: flex;
          min-height: 360px;
          color: rgb(25, 28, 32);
          border: 2px solid rgb(80, 90, 100);
        }
      </style>
    `;
    document.body.innerHTML = `
      <section class="layout">
        <p class="panel">First paragraph</p>
        <p class="panel">Second paragraph</p>
      </section>
    `;

    const html = toWechatHtmlFromDocument(document);
    const body = parseFragment(html);
    const layoutStyle = body.querySelector(".layout")?.getAttribute("style") ?? "";
    const panelStyle = body.querySelector(".panel")?.getAttribute("style") ?? "";

    expect(layoutStyle).toContain("background-color: rgb(250, 248, 240)");
    expect(layoutStyle).toContain("padding: 40px");
    expect(panelStyle).toContain("color: rgb(25, 28, 32)");
    expect(panelStyle).toContain("border-top: 2px solid rgb(80, 90, 100)");
    expect(`${layoutStyle}; ${panelStyle}`).not.toMatch(
      /(?:^|;\s*)(position|display|grid-template-columns|width|height|min-height|gap|flex-direction|flex-wrap|flex):/,
    );
  });

  it("materializes ::before and ::after content into real DOM nodes", () => {
    document.body.innerHTML = `
      <ul>
        <li class="check">Item one</li>
      </ul>
      <p class="tier">Pro plan</p>
    `;

    const original = window.getComputedStyle.bind(window);
    const stub = ((el: Element, pseudo?: string | null) => {
      const base = original(el);
      if (!pseudo) return base;
      const overrides: Record<string, string> = {};
      if (pseudo === "::before" && (el as HTMLElement).matches?.(".check")) {
        overrides.content = '"✓"';
        overrides.color = "rgb(255, 0, 0)";
      } else if (pseudo === "::before" && (el as HTMLElement).matches?.(".tier")) {
        overrides.content = '"Recommended"';
        overrides.color = "rgb(255, 255, 255)";
      } else if (pseudo === "::after" && (el as HTMLElement).matches?.(".tier")) {
        overrides.content = '"★"';
      }
      return new Proxy(base, {
        get(target, prop) {
          if (prop === "getPropertyValue") {
            return (name: string) => overrides[name] ?? target.getPropertyValue(name);
          }
          const value = (target as unknown as Record<string | symbol, unknown>)[prop];
          return typeof value === "function" ? (value as () => unknown).bind(target) : value;
        },
      });
    }) as typeof window.getComputedStyle;
    window.getComputedStyle = stub;

    try {
      const body = parseFragment(toWechatHtmlFromDocument(document));
      const check = body.querySelector("li.check");
      const tier = body.querySelector("p.tier");

      const checkBefore = check?.firstElementChild;
      expect(checkBefore?.getAttribute("data-pseudo")).toBe("::before");
      expect(checkBefore?.textContent).toBe("✓");
      expect(checkBefore?.getAttribute("style") ?? "").toContain("color: rgb(255, 0, 0)");

      const tierBefore = tier?.firstElementChild;
      expect(tierBefore?.getAttribute("data-pseudo")).toBe("::before");
      expect(tierBefore?.textContent).toBe("Recommended");

      const tierAfter = tier?.lastElementChild;
      expect(tierAfter?.getAttribute("data-pseudo")).toBe("::after");
      expect(tierAfter?.textContent).toBe("★");
    } finally {
      window.getComputedStyle = original as typeof window.getComputedStyle;
    }
  });

  it("clamps oversized spacing and drops negative margins", () => {
    document.head.innerHTML = `
      <style>
        .loose {
          margin-top: -24px;
          margin-bottom: 180px;
          padding: 96px;
          color: rgb(40, 40, 40);
        }
      </style>
    `;
    document.body.innerHTML = `<p class="loose">Too much spacing</p>`;

    const body = parseFragment(toWechatHtmlFromDocument(document));
    const style = body.querySelector("p")?.getAttribute("style") ?? "";

    expect(style).toContain("margin-bottom: 48px");
    expect(style).toContain("padding: 48px");
    expect(style).toContain("color: rgb(40, 40, 40)");
    expect(style).not.toContain("-24px");
    expect(style).not.toContain("180px");
    expect(style).not.toContain("96px");
  });
});
