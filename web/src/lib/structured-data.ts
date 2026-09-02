// ─────────────────────────────────────────────────────────────
//  Schema.org JSON-LD. Search engines and AI crawlers read this
//  to know who built the site and what each case study is,
//  instead of inferring it from prose.
//  แก้ประวัติ/ลิงก์โซเชียลที่นี่ที่เดียว
// ─────────────────────────────────────────────────────────────

import { dictionary, type CaseStudySlug } from "@/lib/dictionary";
import { projects } from "@/lib/projects";
import { CONTACT_EMAIL, PROFILES, SITE_URL } from "@/lib/site";

const PERSON_ID = `${SITE_URL}/#person`;
const SITE_ID = `${SITE_URL}/#website`;

/**
 * `@id` lets every other node point back here with a one-line reference
 * rather than repeating the whole person on each page.
 */
const person = {
  "@type": "Person",
  "@id": PERSON_ID,
  name: "Nuttapon Yimnoi",
  alternateName: "Film",
  url: SITE_URL,
  email: `mailto:${CONTACT_EMAIL}`,
  jobTitle: "Software Engineer",
  description:
    "Builds trading systems, AI agents, dashboards and the automation around them, solo and end to end.",
  knowsAbout: [
    "Algorithmic trading",
    "AI agents",
    "Full-stack web development",
    "Next.js",
    "Python",
    "Automation",
  ],
  sameAs: PROFILES.map((p) => p.href),
};

const website = {
  "@type": "WebSite",
  "@id": SITE_ID,
  url: SITE_URL,
  name: "Film — Trading systems, AI agents and the tools around them",
  description:
    "Portfolio of Nuttapon Yimnoi (Film): five systems in production, all designed and built solo.",
  inLanguage: ["en", "th"],
  author: { "@id": PERSON_ID },
  publisher: { "@id": PERSON_ID },
};

/** Person and site travel together — every page carries both. */
export const siteGraph = {
  "@context": "https://schema.org",
  "@graph": [person, website],
};

/**
 * A case study describes a thing that was built, so it is the built thing
 * (`SoftwareApplication` where it runs as software) rather than an Article
 * about it.
 */
export function caseStudyGraph(slug: CaseStudySlug) {
  const study = dictionary.en.caseStudies[slug];
  const project = projects.find((p) => p.id === slug);
  const url = `${SITE_URL}/work/${slug}`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CreativeWork",
        "@id": `${url}#work`,
        name: study.title,
        headline: study.subtitle,
        description: project?.description ?? study.subtitle,
        url,
        genre: project?.category,
        keywords: project?.tags?.join(", "),
        author: { "@id": PERSON_ID },
        creator: { "@id": PERSON_ID },
        isPartOf: { "@id": SITE_ID },
        ...(project?.image ? { image: `${SITE_URL}${project.image}` } : {}),
      },
    ],
  };
}

/**
 * Serialises a graph for `dangerouslySetInnerHTML`. The `<` escape stops a
 * literal `</script>` inside any copy field from closing the tag early —
 * the data is ours today, but the fields it reads are edited by hand.
 */
export function jsonLdHtml(graph: object): string {
  return JSON.stringify(graph).replace(/</g, "\u003c");
}
