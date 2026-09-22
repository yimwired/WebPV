import { pageMetadata } from "@/lib/seo";
import { LabsGallery } from "@/components/labs/labs-gallery";

export const metadata = pageMetadata({
  title: "The Lab | Film",
  description:
    "One portfolio, many faces. Design experiments: the same content rebuilt as premium SaaS, sci-fi HUD, luxury editorial and Swiss minimal.",
  path: "/labs",
});

export default function LabsPage() {
  return <LabsGallery />;
}
