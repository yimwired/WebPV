import type { Metadata } from "next";
import { NebulaDemo } from "@/components/labs/nebula-demo";
import { LabSwitcher } from "@/components/labs/lab-switcher";

export const metadata: Metadata = {
  title: "Nebula — The Lab · Film",
  description: "Premium SaaS style study: violet gradients, oversized type, floating chrome.",
};

export default function NebulaPage() {
  return (
    <>
      <NebulaDemo />
      <LabSwitcher />
    </>
  );
}
