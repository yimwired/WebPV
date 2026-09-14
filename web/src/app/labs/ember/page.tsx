import type { Metadata } from "next";
import { Anton, Kanit } from "next/font/google";
import { EmberDemo } from "@/components/labs/ember/ember-demo";
import { LabSwitcher } from "@/components/labs/lab-switcher";

// Two faces, and the split between them is not a style choice: Anton has no
// Thai glyphs at all, so it carries the Latin wordmarks and nothing else.
// Kanit covers both scripts and does every heading, every price and the copy.
const display = Anton({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-ember-display",
  display: "swap",
});

const thai = Kanit({
  subsets: ["thai", "latin"],
  weight: ["400", "600", "800"],
  variable: "--font-ember-thai",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ember | The Lab · Film",
  description:
    "Thai charcoal grill buffet style study: a loud chain brand page with floating product cards, a scroll-parallax hero and a dialog that grows out of the card you pressed.",
};

export default function EmberPage() {
  return (
    <div className={`${display.variable} ${thai.variable}`}>
      <EmberDemo />
      <LabSwitcher />
    </div>
  );
}
