import { UnfoldDemo } from "@/components/labs/unfold-demo";
import { pageMetadata } from "@/lib/seo";
import { LabSwitcher } from "@/components/labs/lab-switcher";

export const metadata = pageMetadata({
  title: "Unfold | The Lab · Film",
  description:
    "Hardware launch study: one folding desk light, drawn in CSS and lit in the browser, with scroll driving the hinge and a colour-temperature control that changes the light rather than a picture of it. A fictional product.",
  path: "/labs/unfold",
});

export default function UnfoldPage() {
  return (
    <>
      <UnfoldDemo />
      <LabSwitcher />
    </>
  );
}
