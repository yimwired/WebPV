import type { Metadata } from "next";
import { Navbar } from "@/components/site/navbar";
import { Pricing } from "@/components/site/pricing";
import { Footer } from "@/components/site/footer";

export const metadata: Metadata = {
  title: "Pricing | Film",
  description:
    "Fixed prices for websites and landing pages, from a one page Starter to a Signature build with custom motion. Automation, dashboards and AI are quoted per project.",
};

export default function PricingPage() {
  return (
    <>
      <Navbar />
      <main>
        <Pricing />
        <Footer />
      </main>
    </>
  );
}
