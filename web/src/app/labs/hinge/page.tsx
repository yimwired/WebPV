import type { Metadata } from "next";
import { HingeDemo } from "@/components/labs/hinge-demo";
import { LabSwitcher } from "@/components/labs/lab-switcher";

export const metadata: Metadata = {
  title: "Hinge | The Lab · Film",
  description:
    "A mockup studio for a folding phone, modelled to the published dimensions. Drop in a design, set the fold, turn it and export a shot. Everything is decoded and rendered in the browser, so the artwork never leaves the machine. An unofficial study.",
};

export default function HingePage() {
  return (
    <>
      <HingeDemo />
      <LabSwitcher />
    </>
  );
}
