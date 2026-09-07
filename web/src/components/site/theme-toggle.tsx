"use client";

import { Moon, Sun } from "lucide-react";
import { useLocale } from "@/lib/i18n";

/**
 * Dark ⇄ light, with the change wiping out from the button itself.
 *
 * The button holds no React state: which icon shows is decided by the `dark`
 * class on <html> through Tailwind's dark variant, so the server and the client
 * always render the same markup and there is nothing to hydrate.
 *
 * Dark stays the default. Only an explicit choice is remembered, and the inline
 * script in layout.tsx applies it before first paint.
 */
export function ThemeToggle() {
  const { t } = useLocale();

  function toggleTheme(event: React.MouseEvent<HTMLButtonElement>) {
    const root = document.documentElement;

    const apply = () => {
      const isDark = root.classList.toggle("dark");
      try {
        localStorage.setItem("theme", isDark ? "dark" : "light");
      } catch {
        // private mode or storage disabled: the theme still switches for this visit
      }
    };

    const startViewTransition = document.startViewTransition?.bind(document);
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (!startViewTransition || prefersReducedMotion) {
      apply();
      return;
    }

    // 150% of the box always clears the furthest corner, so the old theme is
    // never left showing in a corner of the viewport.
    const { left, top, width, height } =
      event.currentTarget.getBoundingClientRect();
    const originX = left + width / 2;
    const originY = top + height / 2;

    // Two reasons this is scripted rather than a CSS keyframe:
    // custom properties set on <html> never reach the ::view-transition pseudo
    // tree, so var(--theme-x) would silently fall back to the centre of the
    // screen; and the origin is given in **percentages**, not pixels, because
    // the pseudo-element's box is not guaranteed to match the viewport 1:1 —
    // on a display with devicePixelRatio above 1 a pixel origin lands to the
    // right of the button by a margin that grows with screen width.
    const originXPercent = (originX / window.innerWidth) * 100;
    const originYPercent = (originY / window.innerHeight) * 100;

    const transition = startViewTransition(apply);
    void transition.ready.then(() => {
      root.animate(
        {
          clipPath: [
            `circle(0% at ${originXPercent}% ${originYPercent}%)`,
            `circle(150% at ${originXPercent}% ${originYPercent}%)`,
          ],
        },
        {
          duration: 700,
          // Slow off the mark on purpose. The site's usual ease-out curve is
          // almost fully open in the first 40ms, which swallows the CTA 75px
          // away before the eye can find the origin — and the change then reads
          // as starting from that button instead of this one.
          easing: "cubic-bezier(0.65, 0, 0.35, 1)",
          pseudoElement: "::view-transition-new(root)",
        },
      );
    });
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={t.nav.toggleTheme}
      className="border-line-strong text-foreground/80 hover:text-foreground hover:border-foreground/40 grid h-8 w-8 place-items-center rounded-md border transition-[color,border-color,transform] duration-200 active:scale-90"
    >
      <Sun aria-hidden className="hidden h-4 w-4 dark:block" />
      <Moon aria-hidden className="h-4 w-4 dark:hidden" />
    </button>
  );
}
