import type { Metadata } from "next";
import { LabsGallery } from "@/components/labs/labs-gallery";

export const metadata: Metadata = {
  title: "The Lab — Film",
  description:
    "One portfolio, many faces. Design experiments: the same content rebuilt as premium SaaS, sci-fi HUD, luxury editorial and Swiss minimal.",
};

export default function LabsPage() {
  return <LabsGallery />;
}
