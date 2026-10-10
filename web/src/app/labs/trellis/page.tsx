import { Anuphan, Instrument_Serif, Taviraj } from "next/font/google";
import { TrellisDemo } from "@/components/labs/trellis/trellis-demo";
import { LabSwitcher } from "@/components/labs/lab-switcher";
import { pageMetadata } from "@/lib/seo";

// The text is set in a high-contrast serif, the register of the reel this lab
// comes from. Instrument Serif has no Thai, so Taviraj answers for every Thai
// cluster in the same stack. The Latin face gets no metric fallback: a fallback
// face sitting between the two would be asked for Thai first, and on some
// systems it would answer.
const latin = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-trellis-latin",
  adjustFontFallback: false,
  display: "swap",
});

const thai = Taviraj({
  subsets: ["thai", "latin"],
  weight: ["400"],
  variable: "--font-trellis-thai",
  display: "swap",
});

const ui = Anuphan({
  subsets: ["thai", "latin"],
  weight: ["400"],
  variable: "--font-trellis-ui",
  display: "swap",
});

export const metadata = pageMetadata({
  title: "Trellis | The Lab · Film",
  description:
    "Type a word and a garden grows out of its letters. Vines coil around the strokes, in front of one and behind the next, roses settle on their tops, and backspace withers them. Thai works too, tone marks kept clear. Ten palettes, a Poster mode, PNG and SVG export, and a link that regrows the same garden.",
  path: "/labs/trellis",
});

export default function TrellisPage() {
  return (
    <div className={`${latin.variable} ${thai.variable} ${ui.variable}`}>
      <TrellisDemo />
      <LabSwitcher />
    </div>
  );
}
