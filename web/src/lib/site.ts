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

/** Contact address. The footer, the schema and llms.txt all read this one. */
export const CONTACT_EMAIL = "yimwired@gmail.com";

/**
 * The Fastwork listing. Same packages, same prices as /pricing: the
 * platform is there for clients who would rather pay into escrow than
 * transfer to a stranger, and it takes 18% for that.
 * ลิงก์ร้านบน Fastwork ราคาเท่ากับ /pricing เป๊ะ
 */
export const FASTWORK_URL =
  "https://fastwork.co/user/yimwired/web-development-95050179";

/** Profiles that prove the same person owns this site elsewhere. */
export const PROFILES = [
  { label: "GitHub", href: "https://github.com/yimwired" },
];
