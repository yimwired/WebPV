import type { Metadata } from "next";
import { StallDemo } from "@/components/labs/stall-demo";
import { LabSwitcher } from "@/components/labs/lab-switcher";

export const metadata: Metadata = {
  title: "Stall | The Lab · Film",
  description:
    "Marketplace style study: accounts, listings, search and filters, with the seller messaged directly and no money held by the site.",
};

export default function StallPage() {
  return (
    <>
      <StallDemo />
      <LabSwitcher />
    </>
  );
}
