import type { MetadataRoute } from "next";
import { caseStudySlugs } from "@/lib/dictionary";
import { labs } from "@/lib/labs";
import { SITE_URL } from "@/lib/site";

// Route handlers under the hood, so `output: "export"` needs them pinned
// as static or the build refuses to prerender them.
export const dynamic = "force-static";

const BASE = SITE_URL;

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE, priority: 1 },
    { url: `${BASE}/services`, priority: 0.9 },
    { url: `${BASE}/pricing`, priority: 0.9 },
    ...caseStudySlugs.map((slug) => ({
      url: `${BASE}/work/${slug}`,
      priority: 0.9,
    })),
    { url: `${BASE}/labs`, priority: 0.8 },
    ...labs.map((lab) => ({ url: `${BASE}/labs/${lab.slug}`, priority: 0.6 })),
  ];
}
