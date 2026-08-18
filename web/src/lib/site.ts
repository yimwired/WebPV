// ─────────────────────────────────────────────────────────────
//  Where the site lives. One constant so moving hosts or putting
//  a custom domain in front is a one-line change instead of a
//  grep across metadata, sitemap, robots and the share card.
//  ย้ายโดเมนแก้ที่นี่ที่เดียว
// ─────────────────────────────────────────────────────────────

/** No trailing slash: everything below appends its own path. */
export const SITE_URL = "https://webpv.yimwired.workers.dev";

/** What the share card prints. Same host, without the scheme. */
export const SITE_HOST = SITE_URL.replace(/^https?:\/\//, "");
