import type { Viewport } from "next";
import { StaticLabFrame } from "@/components/labs/static-lab-frame";
import { pageMetadata } from "@/lib/seo";
import { LabSwitcher } from "@/components/labs/lab-switcher";

export const metadata = pageMetadata({
  title: "Songtor | The Lab · Yim",
  description:
    "Scroll story study: a made-up freight company, one container followed from the yard to the sea through a 3D scene that moves with the scroll.",
  path: "/labs/songtor",
});

export const viewport: Viewport = { colorScheme: "dark" };

export default function SongtorPage() {
  return (
    <>
      <StaticLabFrame
        file="songtor/"
        title="Songtor: a freight company told as a scroll story"
        backdrop="#0b111c"
      />
      <LabSwitcher />
    </>
  );
}
