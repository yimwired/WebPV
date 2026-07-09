"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, useScroll, useSpring } from "framer-motion";
import { cn } from "@/lib/utils";

const links = [
  { href: "#work", label: "Work" },
  { href: "#about", label: "About" },
  { href: "/labs", label: "Labs" },
  { href: "#contact", label: "Contact" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
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
          {links.map((l) => {
            const cls =
              "rounded-full px-3.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground";
            return l.href.startsWith("#") ? (
              <a key={l.href} href={l.href} className={cls}>
                {l.label}
              </a>
            ) : (
              <Link key={l.href} href={l.href} className={cls}>
                {l.label}
              </Link>
            );
          })}
        </nav>

        <a
          href="#contact"
          className="rounded-full bg-foreground px-4 py-1.5 text-sm font-medium text-background transition-transform hover:scale-[1.03] active:scale-95"
        >
          Get in touch
        </a>
      </div>

      {/* scroll progress */}
      <motion.div
        style={{ scaleX: progress }}
        className="h-px origin-left bg-gradient-to-r from-indigo-400 via-cyan-300 to-violet-400"
      />
    </motion.header>
  );
}
