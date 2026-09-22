import { MinimalDemo } from "@/components/labs/minimal-demo";
import { pageMetadata } from "@/lib/seo";
import { LabSwitcher } from "@/components/labs/lab-switcher";

export const metadata = pageMetadata({
  title: "Grid | The Lab · Film",
  description:
    "Swiss minimal style study: white space, strict grid, one red accent.",
  path: "/labs/minimal",
});

export default function MinimalPage() {
  return (
    <>
      <MinimalDemo />
      <LabSwitcher />
    </>
  );
}
