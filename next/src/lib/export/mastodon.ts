"use client";

import { copyImage, copyText } from "./clipboard";
import { iframeToBlob } from "./image";

/** Default Mastodon instance post limit. Some instances raise this, but 500
 *  is the canonical default — use as a safe ceiling. */
export const MASTODON_TEXT_LIMIT = 500;

export type MastodonShare = {
  /** Image to attach to the post. */
  blob: Blob;
  /** Caption trimmed to the platform limit. */
  text: string;
  /** Suggested filename if the caller wants to save the blob. */
  filename: string;
};

/**
 * Build a Mastodon-friendly share bundle: a PNG screenshot of the preview
 * plus a short caption. Most browsers refuse to put image + text on the
 * clipboard together — call `copyMastodonImage` to copy the image and
 * `copyMastodonText` to copy the caption.
 */
export async function buildMastodonShare(
  iframe: HTMLIFrameElement,
  caption: string,
): Promise<MastodonShare> {
  const blob = await iframeToBlob(iframe);
  const text = truncateForPost(caption, MASTODON_TEXT_LIMIT);
  return { blob, text, filename: `mastodon-${Date.now()}.png` };
}

export async function copyMastodonImage(share: MastodonShare): Promise<void> {
  await copyImage(share.blob);
}

export async function copyMastodonText(share: MastodonShare): Promise<void> {
  await copyText(share.text);
}

/**
 * Trim to a hard character ceiling without slicing a multi-byte glyph.
 *
 * Note: Mastodon and Bluesky both count *graphemes*, not code points, when
 * enforcing their limits. A ZWJ-joined emoji like 👨‍👩‍👧 is 1 grapheme but
 * 5 code points — counting by `Array.from` will count it as 5. This is
 * conservative (we'll never overshoot the platform's limit), but a caption
 * with many compound emoji may be truncated more aggressively than needed.
 */
export function truncateForPost(text: string, limit: number): string {
  const collapsed = text.replace(/\s+/g, " ").trim();
  if (collapsed.length <= limit) return collapsed;
  // Use Array.from to count by code point, not UTF-16 unit, so we don't
  // split a surrogate pair in half.
  const points = Array.from(collapsed);
  if (points.length <= limit) return collapsed;
  const ellipsis = "…";
  return points.slice(0, limit - ellipsis.length).join("") + ellipsis;
}
