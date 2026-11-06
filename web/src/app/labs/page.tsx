import { pageMetadata } from "@/lib/seo";
import { LabsGallery } from "@/components/labs/labs-gallery";

export const metadata = pageMetadata({
  title: "The Lab | Yim",
  description:
    "Working example sites you can click through: restaurants, tours, shops, events and more. Pick a direction and I build your site in it.",
  path: "/labs",
});

export default function LabsPage() {
  return <LabsGallery />;
}
