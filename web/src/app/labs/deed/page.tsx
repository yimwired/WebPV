import { Noto_Sans_Thai, Noto_Serif_Thai } from "next/font/google";
import { DeedDemo } from "@/components/labs/deed/deed-demo";
import { pageMetadata } from "@/lib/seo";
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

export const metadata = pageMetadata({
  title: "Deed | The Lab · Film",
  description:
    "Property study: a condominium site that answers what a listing never does. Give it your income and your deposit and it works the real instalment, says whether a bank would lend and what would fix it, and itemises the cash needed on transfer day. A fictional project.",
  path: "/labs/deed",
});

export default function DeedPage() {
  return (
    <div className={`${head.variable} ${body.variable}`}>
      <DeedDemo />
      <LabSwitcher />
    </div>
  );
}
