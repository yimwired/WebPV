import type { Metadata } from "next";
import { Navbar } from "@/components/site/navbar";
import { Services } from "@/components/site/services";
import { Footer } from "@/components/site/footer";

export const metadata: Metadata = {
  title: "Services | Film",
  description:
    "Websites and landing pages, automation and bots, dashboards and internal tools, and AI wired into real workflows. Built and shipped end to end by Film.",
};

export default function ServicesPage() {
  return (
    <>
      <Navbar />
      <main>
        <Services />
        <Footer />
      </main>
    </>
  );
}
