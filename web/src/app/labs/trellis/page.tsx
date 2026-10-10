import { Anuphan, Instrument_Serif, Mali } from "next/font/google";
import { TrellisDemo } from "@/components/labs/trellis/trellis-demo";
import { LabSwitcher } from "@/components/labs/lab-switcher";
import { pageMetadata } from "@/lib/seo";

// Latin is set in a high-contrast serif, the register of the reel this lab
// comes from. Instrument Serif has no Thai, so Mali answers for every Thai
// cluster in the same stack: looped and round-ended, at a weight heavy enough
// to read as soft rather than sharp. The Latin face gets no metric fallback: a
// fallback face sitting between the two would be asked for Thai first, and on
// some systems it would answer.
const latin = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-trellis-latin",
  adjustFontFallback: false,
  display: "swap",
});

// Loaded at one weight only, so the 400 that the page and the glyph canvas ask
// for resolves to this face as it is, never to a synthesised one.
const thai = Mali({
  subsets: ["thai", "latin"],
  weight: ["600"],
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
