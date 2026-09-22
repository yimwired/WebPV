import { GazeDemo } from "@/components/labs/gaze-demo";
import { pageMetadata } from "@/lib/seo";
import { LabSwitcher } from "@/components/labs/lab-switcher";

export const metadata = pageMetadata({
  title: "Gaze | The Lab · Film",
  description:
    "Cursor-tracking style study: a wireframe subject scrubbed by pointer position, with the frame index it would seek to printed underneath.",
  path: "/labs/gaze",
});

export default function GazePage() {
  return (
    <>
      <GazeDemo />
      <LabSwitcher />
    </>
  );
}
