import type { Metadata } from "next";
import { TerminalDemo } from "@/components/labs/terminal-demo";
import { LabSwitcher } from "@/components/labs/lab-switcher";

export const metadata: Metadata = {
  title: "Terminal | The Lab · Film",
  description:
    "Developer tool style study: an amber CRT prompt that actually parses what you type, with history, completion and a deploy that takes as long as it says.",
};

export default function TerminalPage() {
  return (
    <>
      <TerminalDemo />
      <LabSwitcher />
    </>
  );
}
