"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n";
import { GlassLens, useSupportsLens } from "./glass";
import { LanguageSwitch } from "./language-switch";
import { ThemeToggle } from "./theme-toggle";

/** Height in px, from the top of the viewport, of the pill's middle. */
const NAV_LINE = 44;

type Ground = "light" | "dark";

/**
 * Whether the navbar is passing over one of the sections that stay dark in
 * either theme (they carry `data-nav-tone="dark"`). The observer's root is cut
 * down to a one pixel band at the pill's height, so it reports exactly the
 * sections crossing that line, with no scroll listener involved.
 */
function useGroundUnderNav(): Ground {
  const [ground, setGround] = useState<Ground>("light");

  useEffect(() => {
    const zones = document.querySelectorAll("[data-nav-tone='dark']");
    if (zones.length === 0) return;

    const crossing = new Set<Element>();
    let observer: IntersectionObserver | undefined;
    let frame = 0;

    // The band is given in pixels from the bottom too, so it has to be
    // rebuilt when the viewport changes height.
    const watch = () => {
      observer?.disconnect();
      crossing.clear();
      const below = Math.max(0, window.innerHeight - NAV_LINE - 1);
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) crossing.add(entry.target);
            else crossing.delete(entry.target);
          }
          setGround(crossing.size > 0 ? "dark" : "light");
        },
        { rootMargin: `-${NAV_LINE}px 0px -${below}px 0px` },
      );
      zones.forEach((zone) => observer?.observe(zone));
    };

    const onResize = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(watch);
    };

    watch();
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return ground;
}

export function Navbar() {
  const { t } = useLocale();
  const pathname = usePathname();
  const onHome = pathname === "/";
  const ground = useGroundUnderNav();
  const lens = useSupportsLens();
  const bar = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  // section anchors only exist on the home page, so they need it as a prefix
  // everywhere else
  const section = (hash: string) => (onHome ? hash : `/${hash}`);

  // "Contact" is not in the list: the button beside it goes to the same
  // place, and one destination should have one label.
  const links = [
    { href: section("#work"), label: t.nav.work },
    { href: "/services", label: t.nav.services },
    { href: "/pricing", label: t.nav.pricing },
    { href: section("#about"), label: t.nav.about },
    { href: "/labs", label: t.nav.labs },
  ];

  // while the sheet is open: Escape closes it and the page behind stays put
  useEffect(() => {
    if (!menuOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  const renderLink = (
    link: { href: string; label: string },
    className: string,
  ) => {
    const props = { className, onClick: () => setMenuOpen(false) };
    return link.href.startsWith("#") ? (
      <a key={link.href} href={link.href} {...props}>
        {link.label}
      </a>
    ) : (
      <Link key={link.href} href={link.href} {...props}>
        {link.label}
      </Link>
    );
  };

  return (
    // The header spans the window but only the pill and what opens from it are
    // solid: the band above the pill and the sides beside it are empty, and
    // would otherwise swallow every click and hover on the page passing under
    // them. Each solid piece takes pointer events back.
    <header
      className={cn(
        "pointer-events-none fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-4 sm:pt-4",
        // Scopes the dark tokens to the bar while it crosses a dark section.
        // That is the glass's adaptive layer: the same tokens retint it from
        // ivory to deep blue, so its text never loses the ground under it.
        ground === "dark" && "dark",
      )}
    >
      {/* Five links and a button stand between the tab key and the page, on
          every page. Visible only once focused; `not-sr-only` resets padding
          to 0, so the visible sizing has to come back on the focus variant. */}
      <a
        href="#main"
        className="bg-background border-line-control text-foreground pointer-events-auto sr-only rounded-full border text-sm focus:not-sr-only focus:absolute focus:top-4 focus:left-5 focus:z-50 focus:inline-flex focus:h-11 focus:items-center focus:px-5"
      >
        {t.nav.skipToContent}
      </a>

      {/* The tint and the text swap in the same frame, with no fade. Fading
          either one passes through a moment where ink and ground are nearly
          the same colour: a 500ms fade on the ground alone left white text on
          a still-white pill every time the bar crossed into a dark section.
          Everything on the glass is in the foreground colour, never muted
          grey: see the note on `.glass` in globals.css for the arithmetic. */}
      <div
        ref={bar}
        data-lens={lens ? "" : undefined}
        className="glass text-foreground pointer-events-auto mx-auto flex h-14 max-w-[1040px] items-center justify-between gap-3 rounded-full ps-5 pe-1.5 sm:h-16 sm:pe-2"
      >
        {/* The wordmark is three characters, so its text box misses the 24px
            target floor. Padding gives it a real target and the matching
            negative margin keeps it optically on the pill's inner edge. */}
        <a
          href={onHome ? "#top" : "/"}
          className="-mx-2 -my-3 rounded-full px-2 py-3 text-[17px] font-semibold tracking-tight"
        >
          Yim
        </a>

        <nav className="hidden items-center gap-0.5 lg:flex">
          {links.map((link) =>
            renderLink(
              link,
              "text-foreground hover:bg-foreground/[0.07] rounded-full px-3.5 py-2 text-[15px] transition-colors",
            ),
          )}
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <LanguageSwitch />
          <ThemeToggle />
          <a
            href={section("#contact")}
            className="bg-foreground text-background hidden h-11 items-center rounded-full px-5 text-[15px] font-medium transition-opacity hover:opacity-90 sm:h-12 lg:inline-flex"
          >
            {t.nav.cta}
          </a>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? t.nav.closeMenu : t.nav.openMenu}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            className="bg-foreground text-background grid h-11 w-11 place-items-center rounded-full transition-opacity hover:opacity-90 lg:hidden"
          >
            {menuOpen ? (
              <X aria-hidden className="h-5 w-5" />
            ) : (
              <Menu aria-hidden className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      <GlassLens measure={bar} />

      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
              className="bg-background/80 pointer-events-auto fixed inset-0 -z-10 lg:hidden"
            />
            {/* Glass too, but dense and without the lens: the lens map is cut
                to the bar's proportions, and this sheet sits over whole
                paragraphs of page text rather than a band of pictures. */}
            <motion.nav
              key="sheet"
              id="mobile-nav"
              initial={{ opacity: 0, y: -12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="glass glass-dense text-foreground pointer-events-auto mx-auto mt-2 flex max-w-[1040px] origin-top flex-col gap-1 rounded-[28px] p-3 lg:hidden"
            >
              {links.map((link) =>
                renderLink(
                  link,
                  "text-foreground hover:bg-foreground/[0.07] rounded-2xl px-4 py-3 text-lg transition-colors",
                ),
              )}
              <a
                href={section("#contact")}
                onClick={() => setMenuOpen(false)}
                className="bg-foreground text-background mt-2 flex h-12 items-center justify-center rounded-full text-base font-medium"
              >
                {t.nav.cta}
              </a>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
