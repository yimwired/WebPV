import type { MetadataRoute } from "next";

// Route handlers under the hood, so `output: "export"` needs them pinned
// as static or the build refuses to prerender them.
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: "https://webpv.vercel.app/sitemap.xml",
  };
}
