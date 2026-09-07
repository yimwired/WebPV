import type { Metadata } from "next";
import { PlayroomDemo } from "@/components/labs/playroom-demo";
import { LabSwitcher } from "@/components/labs/lab-switcher";

export const metadata: Metadata = {
  title: "Playroom | The Lab · Film",
  description:
    "Pick-and-mix style study: a jar of sweets running a real physics solver, where the pile is the shopping cart.",
};

export default function PlayroomPage() {
  return (
    <>
      <PlayroomDemo />
      <LabSwitcher />
    </>
  );
}
