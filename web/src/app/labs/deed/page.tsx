import type { Metadata } from "next";
import { Noto_Sans_Thai, Noto_Serif_Thai } from "next/font/google";
import { DeedDemo } from "@/components/labs/deed/deed-demo";
import { LabSwitcher } from "@/components/labs/lab-switcher";

// A serif for the figures and the headlines, because this is a page about money
// and a property brochure has always been set this way. The sans carries the
// small print, where a serif at 12px stops being readable on a phone.
const head = Noto_Serif_Thai({
  subsets: ["thai", "latin"],
  weight: ["400", "600"],
  variable: "--font-deed-head",
  display: "swap",
});

const body = Noto_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["400", "600"],
  variable: "--font-deed-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Deed | The Lab · Film",
  description:
    "Property study: a condominium site that answers what a listing never does. Give it your income and your deposit and it works the instalment at the floating rate rather than the teaser, says whether a bank's 40 percent rule lets it through and what would fix it, charts where thirty years of instalments actually go, and itemises the cash that has to be in the account on transfer day. A fictional project.",
};

export default function DeedPage() {
  return (
    <div className={`${head.variable} ${body.variable}`}>
      <DeedDemo />
      <LabSwitcher />
    </div>
  );
}
