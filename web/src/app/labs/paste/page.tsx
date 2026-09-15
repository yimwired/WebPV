import type { Metadata } from "next";
import { Charm, Maitree } from "next/font/google";
import { PasteDemo } from "@/components/labs/paste/paste-demo";
import { LabSwitcher } from "@/components/labs/lab-switcher";

// Charm is a Thai hand that is still legible at a heading size, which is the
// hard part: the more convincing handwriting faces stop being readable as soon
// as a sentence gets long. So Charm carries names, times and captions, and the
// body face carries anything a guest has to actually read.
const hand = Charm({
  subsets: ["thai", "latin"],
  weight: ["400", "700"],
  variable: "--font-paste-hand",
  display: "swap",
});

// Maitree, not Sarabun. Sarabun is a workplace face: correct, even, and
// completely flat beside handwriting. A soft Thai serif sits with the hand
// instead of arguing with it.
const body = Maitree({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500"],
  variable: "--font-paste-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Paste | The Lab · Film",
  description:
    "Scrapbook style study: a wedding invitation made of taped-down instant photos and ruled paper, doing the one thing a paper invitation cannot. Type your name and it tells you your table.",
};

export default function PastePage() {
  return (
    <div className={`${hand.variable} ${body.variable}`}>
      <PasteDemo />
      <LabSwitcher />
    </div>
  );
}
