import { TerminalDemo } from "@/components/labs/terminal-demo";
import { pageMetadata } from "@/lib/seo";
import { LabSwitcher } from "@/components/labs/lab-switcher";

export const metadata = pageMetadata({
  title: "Terminal | The Lab · Film",
  description:
    "Developer tool style study: an amber CRT prompt that actually parses what you type, with history, completion and a deploy that takes as long as it says.",
  path: "/labs/terminal",
});

export default function TerminalPage() {
  return (
    <>
      <TerminalDemo />
      <LabSwitcher />
    </>
  );
}
