import type { Metadata } from "next";
import { CartDemo } from "@/components/labs/cart-demo";
import { LabSwitcher } from "@/components/labs/lab-switcher";

export const metadata: Metadata = {
  title: "Cart | The Lab · Film",
  description:
    "Single product style study: one page, a bundle picker that does the arithmetic, and a dispatch countdown that reads the visitor's own clock.",
};

export default function CartPage() {
  return (
    <>
      <CartDemo />
      <LabSwitcher />
    </>
  );
}
