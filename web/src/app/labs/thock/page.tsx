import { IBM_Plex_Sans_Thai_Looped } from "next/font/google";
import { LabSwitcher } from "@/components/labs/lab-switcher";
import { ThockDemo } from "@/components/labs/thock/thock-demo";
import { pageMetadata } from "@/lib/seo";

// The Thai legends are set in a looped face, the kind printed on keyboards sold
// in Thailand; the Latin ones use the site's own Geist. Loaded at the one
// weight the legend canvas asks for, so it gets this face as drawn rather than
// a synthesised one.
const thai = IBM_Plex_Sans_Thai_Looped({
  subsets: ["thai", "latin"],
  weight: ["500"],
  variable: "--font-thock-thai",
  display: "swap",
});

export const metadata = pageMetadata({
  title: "Thock | The Lab · Film",
  description:
    "A ball of keycaps in raw WebGL2, no three.js and no images. Drag it and it spins on, hover a key and it lifts. Press a key on your own keyboard, in English or Thai, and the same key on the ball presses down and sends a ripple around it. Four colourways, and the click of a real Cherry MX Blue switch.",
  path: "/labs/thock",
});

export default function ThockPage() {
  return (
    <div className={thai.variable}>
      <ThockDemo />
      <LabSwitcher />
    </div>
  );
}
