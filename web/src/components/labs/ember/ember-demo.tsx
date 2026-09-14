"use client";

import { useCallback, useState } from "react";
import { BranchesSection } from "./branches-section";
import { EmberFooter, Ticker, TopBar } from "./chrome";
import { CraftSection } from "./craft-section";
import { HeroSection } from "./hero-section";
import { KitSection } from "./kit-section";
import { PopupModal, type ModalPayload } from "./popup-modal";
import { SetsSection } from "./sets-section";
import { COLOR } from "./theme";

/**
 * Taodang: a charcoal grill buffet chain, invented for this lab.
 *
 * The dialog is the only piece of state on the page, and it lives here rather
 * than in each section so that opening a branch closes an open set without any
 * coordination between the two. `setPayload` is passed down as-is: it is stable
 * for the life of the component, so no section re-renders because a handler was
 * rebuilt.
 */
export function EmberDemo() {
  const [payload, setPayload] = useState<ModalPayload | null>(null);
  const close = useCallback(() => setPayload(null), []);

  return (
    <div id="top" style={{ background: COLOR.cream }}>
      <Ticker />
      <TopBar />

      <main>
        <HeroSection />
        <SetsSection onOpen={setPayload} />
        <CraftSection />
        <BranchesSection onOpen={setPayload} />
        <KitSection />
      </main>

      <EmberFooter />

      <PopupModal payload={payload} onClose={close} />
    </div>
  );
}
