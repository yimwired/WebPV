import type { Metadata } from "next";
import { Cormorant_Garamond } from "next/font/google";
import { TrineDemo } from "@/components/labs/trine-demo";
import { LabSwitcher } from "@/components/labs/lab-switcher";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400"],
});

export const metadata: Metadata = {
  title: "Trine | The Lab · Film",
  description:
    "Jewellery product study: a photographed hand with the ring rebuilt in WebGL, turnable by hand, and a metal picker that recolours it live.",
};

export default function TrinePage() {
  return (
    <>
      <TrineDemo serifClass={cormorant.className} />
      <LabSwitcher />
    </>
  );
}
