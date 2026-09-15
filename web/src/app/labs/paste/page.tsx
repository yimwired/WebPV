import type { Metadata } from "next";
import { Charm, Sarabun } from "next/font/google";
import { PasteDemo } from "@/components/labs/paste/paste-demo";
import { LabSwitcher } from "@/components/labs/lab-switcher";

// Charm is a Thai hand that is still legible at a heading size, which is the
// hard part: the more convincing handwriting faces stop being readable as soon
// as a sentence gets long. So Charm carries names, times and captions, and
// Sarabun carries anything a guest has to actually read.
const hand = Charm({
  subsets: ["thai", "latin"],
  weight: ["400", "700"],
  variable: "--font-paste-hand",
  display: "swap",
});

const sans = Sarabun({
  subsets: ["thai", "latin"],
  weight: ["400", "600"],
  variable: "--font-paste-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Paste | The Lab · Film",
  description:
    "Scrapbook style study: a wedding invitation made of taped-down instant photos and ruled paper, doing the one thing a paper invitation cannot. Type your name and it tells you your table.",
};

export default function PastePage() {
  return (
    <div className={`${hand.variable} ${sans.variable}`}>
      <PasteDemo />
      <LabSwitcher />
    </div>
  );
}
