import type { Metadata } from "next";
import { MinimalDemo } from "@/components/labs/minimal-demo";
import { LabSwitcher } from "@/components/labs/lab-switcher";

export const metadata: Metadata = {
  title: "Grid — The Lab · Film",
  description: "Swiss minimal style study: white space, strict grid, one red accent.",
};

export default function MinimalPage() {
  return (
    <>
      <MinimalDemo />
      <LabSwitcher />
    </>
  );
}
