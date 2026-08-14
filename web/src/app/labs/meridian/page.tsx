import type { Metadata } from "next";
import { StaticLabFrame } from "@/components/labs/static-lab-frame";
import { LabSwitcher } from "@/components/labs/lab-switcher";

export const metadata: Metadata = {
  title: "Meridian | The Lab · Film",
  description:
    "Hardware launch study: machined aluminium in pure CSS, a scroll-pinned walkthrough and a configurator that recolours every deck on the page.",
};

export default function MeridianPage() {
  return (
    <>
      <StaticLabFrame
        file="meridian.html"
        title="Meridian One: machined control deck product page"
        backdrop="#08080a"
      />
      <LabSwitcher />
    </>
  );
}
