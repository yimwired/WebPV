"use client";

import { MeepleFooter, TopBar } from "./chrome";
import { FinderSection } from "./finder-section";
import { Hero } from "./hero";
import { PIXEL_CSS } from "./pixel";
import { RatesSection } from "./rates-section";
import { VisitSection } from "./visit-section";
import { COLOR } from "./theme";

/**
 * Meeple: pixel art, for ตาถัดไป, an invented board game cafe.
 *
 * The style study and the product argument are the same thing here. Pixel art
 * is a constraint before it is a look: a fixed grid, a small palette, no
 * gradients and no antialiasing, which is exactly the discipline that keeps a
 * loud page readable. Every colour on it is measured, every sprite is drawn at
 * a whole-number scale, and the only animation curve in the file is `steps`.
 *
 * The page has one piece of state worth having, and it lives in the finder.
 */
export function MeepleDemo() {
  return (
    <div style={{ background: COLOR.paper }}>
      <style>{PIXEL_CSS}</style>
      <TopBar />
      <main>
        <Hero />
        <FinderSection />
        <RatesSection />
        <VisitSection />
      </main>
      <MeepleFooter />
    </div>
  );
}
