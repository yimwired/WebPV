import { SpaceDemo } from "@/components/labs/space-demo";
import { pageMetadata } from "@/lib/seo";
import { LabSwitcher } from "@/components/labs/lab-switcher";

export const metadata = pageMetadata({
  title: "Deep Space | The Lab · Film",
  description:
    "Sci-fi HUD style study: live canvas starfield, glowing planet, mission-log typography.",
  path: "/labs/space",
});

export default function SpacePage() {
  return (
    <>
      <SpaceDemo />
      <LabSwitcher />
    </>
  );
}
