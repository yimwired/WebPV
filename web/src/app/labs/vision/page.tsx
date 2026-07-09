import type { Metadata } from "next";
import { VisionDemo } from "@/components/labs/vision-demo";
import { LabSwitcher } from "@/components/labs/lab-switcher";

export const metadata: Metadata = {
  title: "Vision — The Lab · Film",
  description:
    "Cinematic spatial style study: pure black, scroll-driven statements, floating glass windows.",
};

export default function VisionPage() {
  return (
    <>
      <VisionDemo />
      <LabSwitcher />
    </>
  );
}
