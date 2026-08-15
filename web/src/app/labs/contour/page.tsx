import type { Metadata } from "next";
import { Grand_Hotel } from "next/font/google";
import { ContourDemo } from "@/components/labs/contour-demo";
import { LabSwitcher } from "@/components/labs/lab-switcher";

/**
 * A free script face standing in for the brand's own lettering. The demo
 * never ships a licensed font, and the wordmark is painted from this at
 * runtime rather than copied from any artwork.
 */
const script = Grand_Hotel({ subsets: ["latin"], weight: "400" });

export const metadata: Metadata = {
  title: "Contour | The Lab · Film",
  description:
    "Beverage packaging study: one drink in three pack sizes, lathed in WebGL from published dimensions, with the labels painted in the browser. An unofficial concept.",
};

export default function ContourPage() {
  return (
    <>
      <ContourDemo
        scriptClass={script.className}
        scriptFamily={script.style.fontFamily}
      />
      <LabSwitcher />
    </>
  );
}
