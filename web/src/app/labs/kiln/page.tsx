import type { Metadata } from "next";
import { Cormorant_Garamond, IBM_Plex_Sans_Thai } from "next/font/google";
import { KilnDemo } from "@/components/labs/kiln/kiln-demo";
import { LabSwitcher } from "@/components/labs/lab-switcher";

// Two faces doing different jobs. The serif carries the headings and the
// numerals, where the page wants the weight of print; Plex Sans Thai carries
// everything that has to be read rather than looked at. Cormorant has no Thai
// glyphs, so the Thai headings fall to Plex through the stack and the pairing
// only shows on the Latin.
const serif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400"],
  variable: "--font-kiln-serif",
  display: "swap",
});

const sans = IBM_Plex_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500"],
  variable: "--font-kiln-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Kiln | The Lab · Film",
  description:
    "Wabi-sabi style study for a one-off ceramics studio: the flaws on each piece are marked on the photograph and explained, because a handmade shop sells the thing a factory would reject.",
};

export default function KilnPage() {
  return (
    <div className={`${serif.variable} ${sans.variable}`}>
      <KilnDemo />
      <LabSwitcher />
    </div>
  );
}
