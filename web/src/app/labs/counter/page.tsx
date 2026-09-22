import { CounterDemo } from "@/components/labs/counter-demo";
import { pageMetadata } from "@/lib/seo";
import { LabSwitcher } from "@/components/labs/lab-switcher";

export const metadata = pageMetadata({
  title: "Counter | The Lab · Film",
  description:
    "Restaurant style study: today's menu, prices, and an open-or-closed badge that reads the visitor's clock.",
  path: "/labs/counter",
});

export default function CounterPage() {
  return (
    <>
      <CounterDemo />
      <LabSwitcher />
    </>
  );
}
