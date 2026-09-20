import type { Metadata } from "next";
import { Maitree, Playfair_Display, Trirong } from "next/font/google";
import { SteepDemo } from "@/components/labs/steep/steep-demo";
import { LabSwitcher } from "@/components/labs/lab-switcher";

// Three faces, because a page with no pictures on it has nothing else to work
// with. Playfair carries the shop's own name and the figures, where the thick
// to thin of a Didone is the whole Victorian signal. Trirong is the Thai
// display face: a serif with real feet, which is the closest Thai gets to the
// same register. Maitree sets everything that has to be read rather than
// looked at.
const display = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-steep-display",
  display: "swap",
});

const head = Trirong({
  subsets: ["thai", "latin"],
  weight: ["400", "600"],
  variable: "--font-steep-head",
  display: "swap",
});

const body = Maitree({
  subsets: ["thai", "latin"],
  weight: ["400", "600"],
  variable: "--font-steep-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Steep | The Lab · Film",
  description:
    "Victorian apothecary study: a tea room that blends to order and prints the working label. Pick a leaf and what goes in with it, and the page sets the water, the minutes, the grams and the caffeine, then names every material the pot is too cool or too quick for and what to brew separately instead. A fictional shop.",
};

export default function SteepPage() {
  return (
    <div className={`${display.variable} ${head.variable} ${body.variable}`}>
      <SteepDemo />
      <LabSwitcher />
    </div>
  );
}
