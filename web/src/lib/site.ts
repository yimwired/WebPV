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
 * transfer to a stranger.
 *
 * null while there is no shop to send anyone to. Film left fastwork.co
 * on 2026-10-17 and can no longer take orders there, so the old gig link
 * would hand a client to a shop nobody answers. The new profile on
 * fastwork.com goes public around 2026-11-16: put its link here and the
 * escrow line on /pricing comes back on its own.
 * ลิงก์ร้านบน Fastwork ราคาเท่ากับ /pricing เป๊ะ (null = ซ่อนบรรทัดนั้น)
 */
export const FASTWORK_URL: string | null = null;

/** Profiles that prove the same person owns this site elsewhere. */
export const PROFILES = [
  { label: "GitHub", href: "https://github.com/yimwired" },
];
