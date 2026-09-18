import type { Metadata } from "next";
import { GazeDemo } from "@/components/labs/gaze-demo";
import { LabSwitcher } from "@/components/labs/lab-switcher";

export const metadata: Metadata = {
  title: "Gaze | The Lab · Film",
  description:
    "Cursor-tracking style study: a wireframe subject scrubbed by pointer position, with the frame index it would seek to printed underneath.",
};

export default function GazePage() {
  return (
    <>
      <GazeDemo />
      <LabSwitcher />
    </>
  );
}
