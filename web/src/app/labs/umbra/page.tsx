import { IBM_Plex_Sans_Thai, Kanit } from "next/font/google";
import { UmbraDemo } from "@/components/labs/umbra/umbra-demo";
import { pageMetadata } from "@/lib/seo";
import { LabSwitcher } from "@/components/labs/lab-switcher";

// Kanit at its lightest weight for anything set large: a geometric Thai face
// with almost no stroke contrast reads as a gallery caption rather than a
// brochure, which is the register a page about pictures wants. Plex carries
// the figures, because the reading beside the scene is a measurement.
const head = Kanit({
  subsets: ["thai", "latin"],
  weight: ["200", "300"],
  variable: "--font-umbra-head",
  display: "swap",
});

const body = IBM_Plex_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["400", "600"],
  variable: "--font-umbra-body",
  display: "swap",
});

export const metadata = pageMetadata({
  title: "Umbra | The Lab · Film",
  description:
    "Surrealism study: a composite studio whose scene is lit by real trigonometry. Move the sun and every shadow is redrawn from the angle. One object is cut from another photograph and kept its own light, and the page measures how far out it is. A fictional studio.",
  path: "/labs/umbra",
});

export default function UmbraPage() {
  return (
    <div className={`${head.variable} ${body.variable}`}>
      <UmbraDemo />
      <LabSwitcher />
    </div>
  );
}
