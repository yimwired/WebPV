import { LongtailDemo } from "@/components/labs/longtail-demo";
import { pageMetadata } from "@/lib/seo";
import { LabSwitcher } from "@/components/labs/lab-switcher";

export const metadata = pageMetadata({
  title: "Longtail | The Lab · Film",
  description:
    "Day tour operator style study: pick a tour, set the party, and the booking panel quotes the total and the deposit live.",
  path: "/labs/longtail",
});

export default function LongtailPage() {
  return (
    <>
      <LongtailDemo />
      <LabSwitcher />
    </>
  );
}
