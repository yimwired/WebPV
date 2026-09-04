import type { Metadata } from "next";
import { LongtailDemo } from "@/components/labs/longtail-demo";
import { LabSwitcher } from "@/components/labs/lab-switcher";

export const metadata: Metadata = {
  title: "Longtail | The Lab · Film",
  description:
    "Day tour operator style study: pick a tour, set the party, and the booking panel quotes the total and the deposit live.",
};

export default function LongtailPage() {
  return (
    <>
      <LongtailDemo />
      <LabSwitcher />
    </>
  );
}
