import { Chakra_Petch } from "next/font/google";
import { RackDemo } from "@/components/labs/rack/rack-demo";
import { pageMetadata } from "@/lib/seo";
import { LabSwitcher } from "@/components/labs/lab-switcher";

// Chakra Petch carries both scripts here, which is the point: a Y2K page wants
// squared-off terminals and a mechanical feel, and this is the one Thai face on
// Google Fonts with a matching Latin cut, so the numbers in the measurements
// and the Thai around them are the same typeface rather than two pasted
// together. The measurements are the content, so they cannot look borrowed.
const chakra = Chakra_Petch({
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-rack",
  display: "swap",
});

export const metadata = pageMetadata({
  title: "Rack | The Lab · Film",
  description:
    "Y2K style study for a second-hand clothing shop: every piece is the only one of itself and its label means nothing, so the rail asks for your own chest measurement and answers with what fits, what does not, and by how many inches.",
  path: "/labs/rack",
});

export default function RackPage() {
  return (
    <div
      className={chakra.className}
      style={{ fontFamily: "var(--font-rack)" }}
    >
      <RackDemo />
      <LabSwitcher />
    </div>
  );
}
