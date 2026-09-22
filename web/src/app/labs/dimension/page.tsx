import { DimensionDemo } from "@/components/labs/dimension-demo";
import { pageMetadata } from "@/lib/seo";
import { LabSwitcher } from "@/components/labs/lab-switcher";

export const metadata = pageMetadata({
  title: "Dimension | The Lab · Film",
  description:
    "Real-time 3D style study: WebGL chrome, iridescent lighting, drag-to-orbit hero.",
  path: "/labs/dimension",
});

export default function DimensionPage() {
  return (
    <>
      <DimensionDemo />
      <LabSwitcher />
    </>
  );
}
