import type { Metadata } from "next";
import { SpaceDemo } from "@/components/labs/space-demo";
import { LabSwitcher } from "@/components/labs/lab-switcher";

export const metadata: Metadata = {
  title: "Deep Space — The Lab · Film",
  description: "Sci-fi HUD style study: live canvas starfield, glowing planet, mission-log typography.",
};

export default function SpacePage() {
  return (
    <>
      <SpaceDemo />
      <LabSwitcher />
    </>
  );
}
