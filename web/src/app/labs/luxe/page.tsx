import { Playfair_Display } from "next/font/google";
import { LuxeDemo } from "@/components/labs/luxe-demo";
import { pageMetadata } from "@/lib/seo";
import { LabSwitcher } from "@/components/labs/lab-switcher";

const playfair = Playfair_Display({
  subsets: ["latin"],
  style: ["normal", "italic"],
});

export const metadata = pageMetadata({
  title: "Maison | The Lab · Film",
  description:
    "Luxury editorial style study: ivory paper, serif headlines, hairline gold rules.",
  path: "/labs/luxe",
});

export default function LuxePage() {
  return (
    <>
      <LuxeDemo serifClass={playfair.className} />
      <LabSwitcher />
    </>
  );
}
