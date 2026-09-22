import { VisionDemo } from "@/components/labs/vision-demo";
import { pageMetadata } from "@/lib/seo";
import { LabSwitcher } from "@/components/labs/lab-switcher";

export const metadata = pageMetadata({
  title: "Vision | The Lab · Film",
  description:
    "Cinematic spatial style study: pure black, scroll-driven statements, floating glass windows.",
  path: "/labs/vision",
});

export default function VisionPage() {
  return (
    <>
      <VisionDemo />
      <LabSwitcher />
    </>
  );
}
