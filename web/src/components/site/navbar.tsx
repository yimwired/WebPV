"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useScroll, useSpring } from "framer-motion";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n";
import { LanguageSwitch } from "./language-switch";

export function Navbar() {
  const { t } = useLocale();
  const links = [
    { href: "#work", label: t.nav.work },
    { href: "#about", label: t.nav.about },
    { href: "/labs", label: t.nav.labs },
    { href: "#contact", label: t.nav.contact },
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
    "rounded-full px-3.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground";

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
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] }}
      className="fixed inset-x-0 top-0 z-50"
    >
      <div
        className={cn(
          "mx-auto flex h-16 max-w-6xl items-center justify-between px-5 transition-all duration-300 sm:px-8",
          scrolled &&
            "mt-2 sm:mt-3 sm:max-w-5xl sm:rounded-full sm:border sm:border-white/10 sm:bg-background/60 sm:px-6 sm:backdrop-blur-xl sm:shadow-[0_8px_30px_rgba(0,0,0,0.35)]"
        )}
      >
        <a href="#top" className="group flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-foreground text-background font-semibold">
            F
          </span>
          <span className="text-sm font-medium tracking-tight text-foreground/90 transition-colors group-hover:text-foreground">
            Film
          </span>
        </a>

        <nav className="hidden items-center gap-1 sm:flex">
          {links.map((l) => renderLink(l, linkClass))}
        </nav>

        <div className="flex items-center gap-2.5">
          <LanguageSwitch />
          <a
            href="#contact"
            className="hidden rounded-full bg-foreground px-4 py-1.5 text-sm font-medium text-background transition-transform hover:scale-[1.03] active:scale-95 sm:inline-block"
          >
            {t.nav.cta}
          </a>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? t.nav.closeMenu : t.nav.openMenu}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            className="grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-white/5 text-foreground/80 transition-colors hover:bg-white/10 hover:text-foreground sm:hidden"
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
        className="h-px origin-left bg-gradient-to-r from-indigo-400 via-cyan-300 to-violet-400"
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
              className="fixed inset-0 -z-10 bg-background/70 backdrop-blur-sm sm:hidden"
            />
            <motion.nav
              key="sheet"
              id="mobile-nav"
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: [0.21, 0.47, 0.32, 0.98] }}
              className="mx-4 mt-2 flex flex-col gap-1 rounded-3xl border border-white/10 bg-background/90 p-3 shadow-[0_20px_60px_rgba(0,0,0,0.5)] backdrop-blur-xl sm:hidden"
            >
              {links.map((l) =>
                renderLink(
                  l,
                  "rounded-2xl px-4 py-3 text-base text-foreground/80 transition-colors hover:bg-white/5 hover:text-foreground"
                )
              )}
              <a
                href="#contact"
                onClick={() => setMenuOpen(false)}
                className="mt-1 rounded-2xl bg-foreground px-4 py-3 text-center text-base font-medium text-background transition-transform active:scale-[0.98]"
              >
                {t.nav.cta}
              </a>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
