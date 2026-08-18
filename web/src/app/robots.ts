import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Route handlers under the hood, so `output: "export"` needs them pinned
// as static or the build refuses to prerender them.
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
