import { SignalDemo } from "@/components/labs/signal-demo";
import { pageMetadata } from "@/lib/seo";
import { LabSwitcher } from "@/components/labs/lab-switcher";

export const metadata = pageMetadata({
  title: "Signal | The Lab · Film",
  description:
    "Instrumentation style study: a working oscilloscope whose readout is measured off the trace, not printed beside it.",
  path: "/labs/signal",
});

export default function SignalPage() {
  return (
    <>
      <SignalDemo />
      <LabSwitcher />
    </>
  );
}
