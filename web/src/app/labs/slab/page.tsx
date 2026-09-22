import { Kanit } from "next/font/google";
import { SlabDemo } from "@/components/labs/slab/slab-demo";
import { pageMetadata } from "@/lib/seo";
import { LabSwitcher } from "@/components/labs/lab-switcher";

// Neo-brutalism needs weight before it needs anything else, and the copy is
// Thai. Kanit covers both scripts and goes to 800, which is where this page
// lives; 500 carries the body so the headings still read as heavier.
const sans = Kanit({
  subsets: ["thai", "latin"],
  weight: ["500", "700", "800"],
  variable: "--font-slab-sans",
  display: "swap",
});

export const metadata = pageMetadata({
  title: "Slab | The Lab · Film",
  description:
    "Neo-brutalist style study: hard borders, flat offset shadows, controls that land on their own shadow, and a palette the visitor can repaint from the top bar.",
  path: "/labs/slab",
});

export default function SlabPage() {
  return (
    <div className={sans.variable}>
      <SlabDemo />
      <LabSwitcher />
    </div>
  );
}
