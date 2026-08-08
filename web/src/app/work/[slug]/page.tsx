import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CaseStudy } from "@/components/site/case-study";
import {
  caseStudySlugs,
  dictionary,
  isCaseStudySlug,
} from "@/lib/dictionary";
import { projects } from "@/lib/projects";

/** every case study is known at build time; anything else is a 404 */
export const dynamicParams = false;

export function generateStaticParams() {
  return caseStudySlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (!isCaseStudySlug(slug)) return {};

  // metadata is crawled, so it always uses the English copy
  const cs = dictionary.en.caseStudies[slug];
  const project = projects.find((p) => p.id === slug);

  return {
    title: `${cs.title} case study | Film`,
    description: project?.description ?? cs.subtitle,
  };
}

export default async function CaseStudyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!isCaseStudySlug(slug)) notFound();

  return <CaseStudy slug={slug} />;
}
