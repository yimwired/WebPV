import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root so Next doesn't pick up a stray lockfile in the home dir.
  turbopack: {
    root: __dirname,
  },

  // Static export: every route here is already ○ Static or ● SSG, there are no
  // route handlers and no middleware, so nothing needs a server at request time.
  // Cloudflare Pages then serves the site as plain files, free and without the
  // non-commercial restriction Vercel's Hobby plan carries.
  output: "export",

  images: {
    // Required by `output: "export"` — there is no server to resize on request.
    // Safe here because the sources in public/projects are pre-sized WebP at
    // roughly the width they render at; see that folder's README.
    unoptimized: true,
  },
};

export default nextConfig;
