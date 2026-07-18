import type { Metadata } from "next";
import { AurumCaseStudy } from "@/components/site/aurum-case-study";

export const metadata: Metadata = {
  title: "AURUM — Case study | Film",
  description:
    "How AURUM was built: an automated XAU/USD trading terminal with 12 strategy engines, session-aware scanning, real-time risk and a kill switch — running live on MetaTrader 5.",
};

export default function AurumPage() {
  return <AurumCaseStudy />;
}
