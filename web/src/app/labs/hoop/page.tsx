import { Anuphan, Instrument_Serif, Taviraj } from "next/font/google";
import { HoopDemo } from "@/components/labs/hoop/hoop-demo";
import { LabSwitcher } from "@/components/labs/lab-switcher";
import { pageMetadata } from "@/lib/seo";

// The name is set in a high-contrast serif, the register of the reel this lab
// borrows from. Instrument Serif has no Thai, so Taviraj answers for every Thai
// cluster in the same stack. The Latin face gets no metric fallback: a fallback
// face sitting between the two would be asked for Thai first, and on some
// systems it would answer.
const latin = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-hoop-latin",
  adjustFontFallback: false,
  display: "swap",
});

const thai = Taviraj({
  subsets: ["thai", "latin"],
  weight: ["400"],
  variable: "--font-hoop-thai",
  display: "swap",
});

const ui = Anuphan({
  subsets: ["thai", "latin"],
  weight: ["400", "600"],
  variable: "--font-hoop-ui",
  display: "swap",
});

export const metadata = pageMetadata({
  title: "Hoop | The Lab · Film",
  description:
    "Embroidery study: a name-stitching shop where typing a name grows a garden of vines and roses out of its letters, Thai or Latin, and the garden is then counted the way a machine would sew it. Satin for the letters, fill for leaves and roses, a triple run for the vines, priced per thousand stitches. A fictional shop.",
  path: "/labs/hoop",
});

export default function HoopPage() {
  return (
    <div className={`${latin.variable} ${thai.variable} ${ui.variable}`} style={{ fontFamily: "var(--font-hoop-ui), sans-serif" }}>
      <HoopDemo />
      <LabSwitcher />
    </div>
  );
}
