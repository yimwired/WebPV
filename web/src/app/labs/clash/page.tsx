import type { Metadata } from "next";
import { Bai_Jamjuree, Chakra_Petch } from "next/font/google";
import { ClashDemo } from "@/components/labs/clash/clash-demo";
import { LabSwitcher } from "@/components/labs/lab-switcher";

// Both cover Thai and Latin, which a poster in this register needs: the
// wordmark, the running order and the body copy all switch scripts mid-line.
// Chakra Petch is the angular one and carries the display type; Bai Jamjuree
// reads at 12px, which is where the schedule lives.
const display = Chakra_Petch({
  subsets: ["thai", "latin"],
  weight: ["600", "700"],
  variable: "--font-clash-display",
  display: "swap",
});

const body = Bai_Jamjuree({
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-clash-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Clash | The Lab · Film",
  description:
    "Maximalist festival study: three stages, twenty-four sets, and a running order that answers the only question a lineup poster never does. Pick the sets you want and the page names every clash, how many minutes it costs, and whether you can walk it in time. A fictional festival.",
};

export default function ClashPage() {
  return (
    <div className={`${display.variable} ${body.variable}`}>
      <ClashDemo />
      <LabSwitcher />
    </div>
  );
}
