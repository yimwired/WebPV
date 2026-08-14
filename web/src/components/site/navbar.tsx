"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useScroll, useSpring } from "framer-motion";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n";
import { LanguageSwitch } from "./language-switch";

export function Navbar() {
  const { t } = useLocale();
  const pathname = usePathname();
  const onHome = pathname === "/";

  // section anchors only exist on the home page, so they need it as a prefix
  // everywhere else
  const section = (hash: string) => (onHome ? hash : `/${hash}`);

  const links = [
    { href: section("#work"), label: t.nav.work },
    { href: "/services", label: t.nav.services },
    { href: section("#about"), label: t.nav.about },
    { href: "/labs", label: t.nav.labs },
    { href: section("#contact"), label: t.nav.contact },
  ];
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    mass: 0.3,
  });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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

  const linkClass =
    "rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground";

  const renderLink = (
    l: { href: string; label: string },
    className: string
  ) => {
    const props = {
      className,
      onClick: () => setMenuOpen(false),
    };
    return l.href.startsWith("#") ? (
      <a key={l.href} href={l.href} {...props}>
        {l.label}
      </a>
    ) : (
      <Link key={l.href} href={l.href} {...props}>
        {l.label}
      </Link>
    );
  };

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-colors duration-200",
        // fully opaque once you leave the hero: a translucent bar over a
        // screenshot reads as a rendering glitch, not as depth
        scrolled && "bg-background border-line border-b",
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <a
          href={onHome ? "#top" : "/"}
          className="text-foreground/90 hover:text-foreground text-sm font-medium tracking-tight transition-colors"
        >
          Film
        </a>

        <nav className="hidden items-center gap-1 sm:flex">
          {links.map((l) => renderLink(l, linkClass))}
        </nav>

        <div className="flex items-center gap-2.5">
          <LanguageSwitch />
          <a
            href={section("#contact")}
            className="bg-foreground text-background hidden rounded-md px-4 py-1.5 text-sm font-medium transition-opacity hover:opacity-90 sm:inline-block"
          >
            {t.nav.cta}
          </a>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? t.nav.closeMenu : t.nav.openMenu}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            className="border-line-strong text-foreground/80 hover:text-foreground grid h-9 w-9 place-items-center rounded-md border transition-colors sm:hidden"
          >
            {menuOpen ? (
              <X className="h-4.5 w-4.5" />
            ) : (
              <Menu className="h-4.5 w-4.5" />
            )}
          </button>
        </div>
      </div>

      {/* scroll progress */}
      <motion.div
        style={{ scaleX: progress }}
        className="bg-brand h-px origin-left"
      />

      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
              className="bg-background/95 fixed inset-0 -z-10 sm:hidden"
            />
            <motion.nav
              key="sheet"
              id="mobile-nav"
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: [0.21, 0.47, 0.32, 0.98] }}
              className="bg-surface border-line mx-4 mt-2 flex flex-col gap-1 rounded-lg border p-3 sm:hidden"
            >
              {links.map((l) =>
                renderLink(
                  l,
                  "rounded-md px-4 py-3 text-base text-foreground/80 transition-colors hover:text-foreground",
                ),
              )}
              <a
                href={section("#contact")}
                onClick={() => setMenuOpen(false)}
                className="bg-foreground text-background mt-1 rounded-md px-4 py-3 text-center text-base font-medium"
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
