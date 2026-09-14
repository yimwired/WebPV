import type { Metadata } from "next";
import { IBM_Plex_Sans_Thai } from "next/font/google";
import { PrismDemo } from "@/components/labs/prism/prism-demo";
import { LabSwitcher } from "@/components/labs/lab-switcher";

// A panel that imitates an operating system wants a face with no opinion, and
// the copy here is Thai, which the app shell's Geist has no glyphs for. Plex
// Sans Thai covers both scripts and stays out of the way.
const sans = IBM_Plex_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600"],
  variable: "--font-prism-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Prism | The Lab · Film",
  description:
    "Glass study: refraction at the rim, a chromatic fringe, a specular edge and a sheet that flips mode to keep its text readable. Switch each layer off and see what it was doing.",
};

export default function PrismPage() {
  return (
    <div className={sans.variable}>
      <PrismDemo />
      <LabSwitcher />
    </div>
  );
}
