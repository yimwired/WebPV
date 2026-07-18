import type { MetadataRoute } from "next";
import { labs } from "@/lib/labs";

const BASE = "https://webpv.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE, priority: 1 },
    { url: `${BASE}/work/aurum`, priority: 0.9 },
    { url: `${BASE}/labs`, priority: 0.8 },
    ...labs.map((lab) => ({ url: `${BASE}/labs/${lab.slug}`, priority: 0.6 })),
  ];
}
