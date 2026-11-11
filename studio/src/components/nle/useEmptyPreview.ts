import { useEffect, useState } from "react";
import { usePlayerStore } from "../../player/store/playerStore";
import { useLivePreviewIframe } from "../../player/store/previewIframeStore";

/** No tracks alone is insufficient: static text and artwork are real content. */
export function isEmptyPreviewDocument(doc: Document | null): boolean {
  const composition = doc?.querySelector("[data-composition-id]");
  if (!composition) return false;
  const hasContent = (nodes: NodeListOf<ChildNode>) => Array.from(nodes).some(node =>
    node.nodeType === 3 ? !!node.textContent?.trim() :
    node.nodeType === 1 && !["SCRIPT", "STYLE", "LINK", "META"].includes((node as Element).tagName),
  );
  if (hasContent(composition.childNodes)) return false;
  return !Array.from(doc!.body.children).some(node =>
    node !== composition && !node.contains(composition) && !["SCRIPT", "STYLE", "LINK", "META"].includes(node.tagName),
  );
}

export function useEmptyPreview(projectId: string, enabled: boolean): boolean {
  const iframe = useLivePreviewIframe();
  const ready = usePlayerStore(s => s.timelineReady && s.timelineProjectId === projectId);
  const trackCount = usePlayerStore(s => s.elements.length);
  const [emptyDocument, setEmptyDocument] = useState(false);
  useEffect(() => {
    setEmptyDocument(false);
    if (!enabled || !ready || trackCount || !iframe) return;
    let observer: MutationObserver | undefined;
    const inspect = () => {
      observer?.disconnect();
      try {
        const doc = iframe.contentDocument;
        setEmptyDocument(isEmptyPreviewDocument(doc));
        if (doc?.body) {
          observer = new MutationObserver(() => setEmptyDocument(isEmptyPreviewDocument(doc)));
          observer.observe(doc.body, { childList: true, subtree: true, characterData: true });
        }
      } catch { setEmptyDocument(false); }
    };
    inspect();
    iframe.addEventListener("load", inspect);
    return () => { observer?.disconnect(); iframe.removeEventListener("load", inspect); };
  }, [iframe, enabled, ready, trackCount]);
  return enabled && ready && trackCount === 0 && emptyDocument;
}
