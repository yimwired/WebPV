import type { Metadata } from "next";
import { DimensionDemo } from "@/components/labs/dimension-demo";
import { LabSwitcher } from "@/components/labs/lab-switcher";

export const metadata: Metadata = {
  title: "Dimension — The Lab · Film",
  description: "Real-time 3D style study: WebGL chrome, iridescent lighting, drag-to-orbit hero.",
};

export default function DimensionPage() {
  return (
    <>
      <DimensionDemo />
      <LabSwitcher />
    </>
  );
}
