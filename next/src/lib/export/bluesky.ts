"use client";

import { copyImage, copyText } from "./clipboard";
import { iframeToBlob } from "./image";
import { truncateForPost } from "./mastodon";

/** Bluesky enforces a 300-grapheme post limit. */
export const BLUESKY_TEXT_LIMIT = 300;

export type BlueskyShare = {
  blob: Blob;
  text: string;
  filename: string;
};

/**
 * Build a Bluesky-friendly share bundle: a PNG screenshot plus a 300-char
 * caption. Bluesky's compose box accepts paste of the image directly, but
 * we keep image + text on separate clipboard calls to dodge browser quirks
 * around mixed mime clipboard writes.
 */
export async function buildBlueskyShare(
  iframe: HTMLIFrameElement,
  caption: string,
): Promise<BlueskyShare> {
  const blob = await iframeToBlob(iframe);
  const text = truncateForPost(caption, BLUESKY_TEXT_LIMIT);
  return { blob, text, filename: `bluesky-${Date.now()}.png` };
}

export async function copyBlueskyImage(share: BlueskyShare): Promise<void> {
  await copyImage(share.blob);
}

export async function copyBlueskyText(share: BlueskyShare): Promise<void> {
  await copyText(share.text);
}
