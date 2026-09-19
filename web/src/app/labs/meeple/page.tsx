import type { Metadata } from "next";
import { K2D, Silkscreen } from "next/font/google";
import { MeepleDemo } from "@/components/labs/meeple/meeple-demo";
import { LabSwitcher } from "@/components/labs/lab-switcher";

// There is no Thai pixel font, on Google Fonts or anywhere that ships webfonts,
// so this page does not pretend there is. Silkscreen carries the Latin and the
// numerals, which is where a pixel font can actually be used; K2D carries the
// Thai, and it was picked because it is the squarest Thai face available - flat
// terminals, no stroke contrast, an almost rectangular บ - so the two scripts
// read as one page rather than as a pixel demo with Thai pasted into it.
const pixel = Silkscreen({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-meeple-pixel",
  display: "swap",
});

const thai = K2D({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-meeple-thai",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Meeple | The Lab · Film",
  description:
    "Pixel art style study for a board game cafe: answer the three questions the staff ask and the shelf splits into what you can actually play tonight and what you cannot, with the reason on every box.",
};

export default function MeeplePage() {
  return (
    <div className={`${pixel.variable} ${thai.variable}`}>
      <MeepleDemo />
      <LabSwitcher />
    </div>
  );
}
