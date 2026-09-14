"use client";

import { useCallback, useState } from "react";
import { SlabFooter, TopBar } from "./chrome";
import { CoursesSection } from "./courses-section";
import { CurriculumSection } from "./curriculum-section";
import { FaqSection } from "./faq-section";
import { Hero } from "./hero";
import { ACCENTS, COLOR } from "./theme";

/**
 * Slab: neo-brutalism, for ตัดจบ, an invented school that teaches editing.
 *
 * One piece of state, the chosen course, and it owns the palette. That is the
 * whole argument of the page: a client looking at a style this loud wants to
 * know whether the colour is a system or a one-off, and the fastest way to
 * answer is to let them repaint the site from the top bar.
 */
export function SlabDemo() {
  const [accentId, setAccentId] = useState(ACCENTS[0].id);
  const accent = ACCENTS.find((a) => a.id === accentId) ?? ACCENTS[0];
  const pick = useCallback((id: string) => setAccentId(id), []);

  return (
    <div id="top" style={{ background: COLOR.paper }}>
      <TopBar accent={accent} onPick={pick} />

      <main>
        <Hero accent={accent} />
        <CoursesSection accent={accent} onPick={pick} />
        <CurriculumSection accent={accent} />
        <FaqSection accent={accent} />
      </main>

      <SlabFooter accent={accent} />
    </div>
  );
}
