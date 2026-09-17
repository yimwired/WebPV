import type { Metadata } from "next";
import { Trirong } from "next/font/google";
import { LoomDemo } from "@/components/labs/loom/loom-demo";
import { LabSwitcher } from "@/components/labs/lab-switcher";

// Trirong is the one Thai serif on Google Fonts with a Latin cut that belongs
// to it rather than being borrowed, which matters on a page where prices in
// Arabic numerals sit inside Thai sentences on every line. A bohemian page
// wants warmth and a written hand, and a sans would flatten it into a listing.
const trirong = Trirong({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-loom",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Loom | The Lab · Film",
  description:
    "Bohemian style study for a three-room guesthouse: pick your nights and the panel prices them direct and through a booking agent side by side, so the commission the owner pays is finally a number the guest can see.",
};

export default function LoomPage() {
  return (
    <div className={trirong.className}>
      <LoomDemo />
      <LabSwitcher />
    </div>
  );
}
