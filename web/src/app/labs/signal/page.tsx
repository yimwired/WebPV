import type { Metadata } from "next";
import { SignalDemo } from "@/components/labs/signal-demo";
import { LabSwitcher } from "@/components/labs/lab-switcher";

export const metadata: Metadata = {
  title: "Signal | The Lab · Film",
  description:
    "Instrumentation style study: a working oscilloscope whose readout is measured off the trace, not printed beside it.",
};

export default function SignalPage() {
  return (
    <>
      <SignalDemo />
      <LabSwitcher />
    </>
  );
}
