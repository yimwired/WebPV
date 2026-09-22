import { PlayroomDemo } from "@/components/labs/playroom-demo";
import { pageMetadata } from "@/lib/seo";
import { LabSwitcher } from "@/components/labs/lab-switcher";

export const metadata = pageMetadata({
  title: "Playroom | The Lab · Film",
  description:
    "Pick-and-mix style study: a jar of sweets running a real physics solver, where the pile is the shopping cart.",
  path: "/labs/playroom",
});

export default function PlayroomPage() {
  return (
    <>
      <PlayroomDemo />
      <LabSwitcher />
    </>
  );
}
