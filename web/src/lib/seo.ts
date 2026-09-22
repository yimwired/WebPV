// ─────────────────────────────────────────────────────────────
//  One place that builds a page's metadata, so every page carries
//  its own share card and its own canonical URL.
//
//  Without this, Next inherits the root's openGraph block on every
//  route: /pricing pasted into LINE or Facebook previewed as
//  "Film | Trading systems, AI agents..." rather than as the price
//  list, which is the one thing a link to it is meant to say.
//  แก้ share card ของหน้าไหนก็แก้ที่หน้านั้น ผ่าน helper ตัวนี้
// ─────────────────────────────────────────────────────────────

import type { Metadata } from "next";
import { SITE_URL } from "./site";

/**
 * The one share card the site has, drawn by `app/opengraph-image.tsx`. Setting
 * an openGraph block on a page replaces the root's whole block rather than
 * merging into it, so the image the file convention supplies has to be named
 * again here or every page ships a card with no picture on it.
 */
const SHARE_CARD = {
  url: `${SITE_URL}/opengraph-image`,
  width: 1200,
  height: 630,
  alt: "Film: trading systems, AI agents and the tools around them",
};

interface PageSeo {
  title: string;
  description: string;
  /** with a leading slash; "/" for the home page */
  path: string;
  /** what the card says, when it should be shorter than the description */
  shareDescription?: string;
}

export function pageMetadata({
  title,
  description,
  path,
  shareDescription,
}: PageSeo): Metadata {
  const url = path === "/" ? SITE_URL : `${SITE_URL}${path}`;
  const card = shareDescription ?? description;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description: card,
      url,
      type: "website",
      images: [SHARE_CARD],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: card,
      images: [SHARE_CARD.url],
    },
  };
}
