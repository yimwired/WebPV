// ─────────────────────────────────────────────────────────────
//  llms.txt — a plain-text index of the site for language models
//  that would otherwise have to read every page to learn what is
//  here. Generated from the same data as the sitemap, so adding a
//  project to lib/projects.ts updates this too.
//  Spec: https://llmstxt.org
// ─────────────────────────────────────────────────────────────

import { caseStudySlugs, dictionary } from "@/lib/dictionary";
import { labs } from "@/lib/labs";
import { projects } from "@/lib/projects";
import { CONTACT_EMAIL, PROFILES, SITE_URL } from "@/lib/site";

// A route handler under the hood, so `output: "export"` needs it pinned
// as static or the build refuses to prerender it.
export const dynamic = "force-static";

function line(label: string, path: string, note: string) {
  return `- [${label}](${SITE_URL}${path}): ${note}`;
}

export function GET() {
  const caseStudies = caseStudySlugs.map((slug) => {
    const study = dictionary.en.caseStudies[slug];
    const project = projects.find((p) => p.id === slug);
    return line(
      study.title,
      `/work/${slug}`,
      project?.description ?? study.subtitle,
    );
  });

  const body = `# Film — Nuttapon Yimnoi

> Software engineer. Builds trading systems, AI agents, dashboards and the automation around them, solo and end to end. Five systems in production. Available for freelance work; prices for websites are published, everything else is quoted per project.

Contact: ${CONTACT_EMAIL}
${PROFILES.map((p) => `${p.label}: ${p.href}`).join("\n")}
Languages: English and Thai, every page in both.

## Pages

${line("Home", "/", "Overview, the five projects, background and contact.")}
${line("Services", "/services", "What Film takes on: websites and landing pages, automation and bots, dashboards and internal tools, and AI wired into real workflows.")}
${line("Pricing", "/pricing", "Fixed prices for three website packages plus a quoted tier. Automation, dashboards and AI are quoted per project.")}

## Case studies

${caseStudies.join("\n")}

## The Lab

Style studies — each one commits to a visual direction the main site would never use.

${line("The Lab", "/labs", `${labs.length} interface style demos.`)}

## Notes

- The site is a static export. Every page is complete HTML at build time; nothing needs JavaScript to read.
- Case study copy is the authoritative description of each project. The Lab is design exploration, not client work.
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
