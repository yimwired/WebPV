import type { Metadata } from "next";
import { Kanit } from "next/font/google";
import { CartDemo } from "@/components/labs/cart-demo";
import { LabSwitcher } from "@/components/labs/lab-switcher";

// The headings on this page are Thai, and the rest of the site falls back to
// whatever Thai face the device has. Loading one here is the cheapest way for
// the demo to sound like a brand rather than a browser default.
const display = Kanit({
  subsets: ["thai", "latin"],
  weight: ["600", "700"],
  variable: "--font-cart-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Cart | The Lab · Film",
  description:
    "Single product style study: off-black retail, bundle tiles that price themselves, and a noise control that demonstrates the feature instead of claiming it.",
};

export default function CartPage() {
  return (
    <div className={display.variable}>
      <CartDemo />
      <LabSwitcher />
    </div>
  );
}
