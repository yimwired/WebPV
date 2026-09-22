import { HingeDemo } from "@/components/labs/hinge-demo";
import { pageMetadata } from "@/lib/seo";
import { LabSwitcher } from "@/components/labs/lab-switcher";

export const metadata = pageMetadata({
  title: "Hinge | The Lab · Film",
  description:
    "A mockup studio for a folding phone, modelled to the published dimensions. Drop in a design, set the fold, turn it and export a shot. Everything is decoded and rendered in the browser, so the artwork never leaves the machine. An unofficial study.",
  path: "/labs/hinge",
});

export default function HingePage() {
  return (
    <>
      <HingeDemo />
      <LabSwitcher />
    </>
  );
}
