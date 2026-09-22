import { Itim, Sarabun } from "next/font/google";
import { DraftDemo } from "@/components/labs/draft/draft-demo";
import { pageMetadata } from "@/lib/seo";
import { LabSwitcher } from "@/components/labs/lab-switcher";

// Sarabun sets the drawing, because it is the face Thai documents are set in
// and this page is pretending to be a document. Itim is the hand: it only ever
// carries what someone would have written on the sheet in pencil, which is the
// revision mark, the measurements and the note in the margin.
const body = Sarabun({
  subsets: ["thai", "latin"],
  weight: ["400", "600"],
  variable: "--font-draft-body",
  display: "swap",
});

const hand = Itim({
  subsets: ["thai", "latin"],
  weight: ["400"],
  variable: "--font-draft-hand",
  display: "swap",
});

export const metadata = pageMetadata({
  title: "Draft | The Lab · Film",
  description:
    "Conceptual sketch study: an interior studio that publishes the working drawing instead of the render. Set your room's real dimensions and the plan redraws to scale, measures the walkway left between the furniture, and writes in the margin which piece does not fit and by how many centimetres. A fictional studio.",
  path: "/labs/draft",
});

export default function DraftPage() {
  return (
    <div className={`${body.variable} ${hand.variable}`}>
      <DraftDemo />
      <LabSwitcher />
    </div>
  );
}
