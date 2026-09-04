import type { Metadata } from "next";
import { CounterDemo } from "@/components/labs/counter-demo";
import { LabSwitcher } from "@/components/labs/lab-switcher";

export const metadata: Metadata = {
  title: "Counter | The Lab · Film",
  description:
    "Restaurant style study: today's menu, prices, and an open-or-closed badge that reads the visitor's clock.",
};

export default function CounterPage() {
  return (
    <>
      <CounterDemo />
      <LabSwitcher />
    </>
  );
}
