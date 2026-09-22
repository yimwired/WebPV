import { IBM_Plex_Sans_Thai, Maitree } from "next/font/google";
import { KilnDemo } from "@/components/labs/kiln/kiln-demo";
import { pageMetadata } from "@/lib/seo";
import { LabSwitcher } from "@/components/labs/lab-switcher";

// Maitree, not Cormorant Garamond, which is what this shipped with first.
// Cormorant has no Thai glyphs, so every Thai heading on the page fell through
// to the sans and the serif/sans pairing showed up on nothing but the prices.
// Maitree is a Thai serif with a Latin of its own, so the contrast the page is
// built on is finally visible in the language the page is written in.
const serif = Maitree({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "600"],
  variable: "--font-kiln-serif",
  display: "swap",
});

const sans = IBM_Plex_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500"],
  variable: "--font-kiln-sans",
  display: "swap",
});

export const metadata = pageMetadata({
  title: "Kiln | The Lab · Film",
  description:
    "Wabi-sabi style study for a one-off ceramics studio: the flaws on each piece are marked on the photograph and explained, because a handmade shop sells the thing a factory would reject.",
  path: "/labs/kiln",
});

export default function KilnPage() {
  return (
    <div className={`${serif.variable} ${sans.variable}`}>
      <KilnDemo />
      <LabSwitcher />
    </div>
  );
}
