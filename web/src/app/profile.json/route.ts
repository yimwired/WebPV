// ─────────────────────────────────────────────────────────────
//  profile.json — the facts the GitHub profile (yimwired/yimwired)
//  repeats about this site. Its daily Action reads this file and
//  rewrites the matching parts of that README, so the project list
//  and the lab count there follow this site instead of going stale.
// ─────────────────────────────────────────────────────────────

import { labs } from "@/lib/labs";
import { projects } from "@/lib/projects";
import { SITE_URL } from "@/lib/site";

// A route handler, so `output: "export"` needs it pinned as static.
export const dynamic = "force-static";

export function GET() {
  return Response.json({
    site: SITE_URL,
    labs: labs.length,
    projects: projects.map((project) => ({
      name: project.name,
      tagline: project.tagline,
      url: `${SITE_URL}${project.href}`,
    })),
  });
}
