"use client";

/**
 * Write rich-text HTML to the clipboard with a plain-text fallback.
 * Tries the modern ClipboardItem API first, falls back to execCommand for Safari.
 */
export async function copyHtml(html: string, plain?: string): Promise<void> {
  const fallback = plain ?? stripTags(html);

  if (typeof window === "undefined") throw new Error("server-side");

  if (navigator.clipboard && typeof window.ClipboardItem !== "undefined") {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([fallback], { type: "text/plain" }),
        }),
      ]);
      return;
    } catch {
      // fall through
    }
  }

  await copySafari(html, fallback);
}

export async function copyImage(blob: Blob): Promise<void> {
  if (!navigator.clipboard || typeof window.ClipboardItem === "undefined") {
    throw new Error("Image clipboard not supported in this browser");
  }
  await navigator.clipboard.write([
    new ClipboardItem({ [blob.type]: blob }),
  ]);
}

export async function copyText(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {}
  }
  await copySafari(text, text);
}

function copySafari(html: string, plain: string): Promise<void> {
  return new Promise((resolve, reject) => {
    let input = document.getElementById("__copy_helper") as HTMLInputElement | null;
    if (!input) {
      input = document.createElement("input");
      input.id = "__copy_helper";
      Object.assign(input.style, {
        position: "absolute",
        left: "-1000px",
        zIndex: "-1000",
      } as CSSStyleDeclaration);
      document.body.appendChild(input);
    }
    input.value = " ";
    input.focus();
    input.select();
    const handler = (e: ClipboardEvent) => {
      e.preventDefault();
      e.clipboardData?.setData("text/html", html);
      e.clipboardData?.setData("text/plain", plain);
      document.removeEventListener("copy", handler);
    };
    document.addEventListener("copy", handler);
    try {
      const ok = document.execCommand("copy");
      ok ? resolve() : reject(new Error("execCommand returned false"));
    } catch (err) {
      reject(err);
    }
  });
}

function stripTags(html: string): string {
  if (typeof DOMParser === "undefined") return html;
  try {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return doc.body.textContent ?? "";
  } catch {
    return html.replace(/<[^>]+>/g, "");
  }
}
