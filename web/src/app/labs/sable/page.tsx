import type { Metadata } from "next";
import { StaticLabFrame } from "@/components/labs/static-lab-frame";
import { LabSwitcher } from "@/components/labs/lab-switcher";

export const metadata: Metadata = {
  title: "Sable | The Lab · Film",
  description:
    "Product page study: ink on paper, a CSS-drawn e-ink slate, and a text field that drives the panel at the hardware's real 41 ms latency.",
};

export default function SablePage() {
  return (
    <>
      <StaticLabFrame
        file="sable.html"
        title="Sable: e-ink writing slate product page"
        backdrop="#f6f5f2"
      />
      <LabSwitcher />
    </>
  );
}
