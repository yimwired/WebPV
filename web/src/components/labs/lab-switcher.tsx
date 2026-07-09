"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { labs } from "@/lib/labs";
import { cn } from "@/lib/utils";

/**
 * Floating pill shown on every lab demo — switch style or exit back
 * to the gallery. Kept visually neutral so it works on both dark
 * and light demos.
 */
export function LabSwitcher() {
  const pathname = usePathname();

  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.4, duration: 0.5, ease: [0.21, 0.47, 0.32, 0.98] }}
      className="fixed inset-x-0 bottom-5 z-50 flex justify-center px-4"
    >
      <div className="flex max-w-full items-center gap-1 overflow-x-auto rounded-full border border-white/15 bg-neutral-950/80 p-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.45)] backdrop-blur-xl [scrollbar-width:none]">
        {labs.map((lab) => {
          const active = pathname === `/labs/${lab.slug}`;
          return (
            <Link
              key={lab.slug}
              href={`/labs/${lab.slug}`}
              className={cn(
                "relative rounded-full px-3 py-1.5 text-xs font-medium text-neutral-400 transition-colors hover:text-white sm:px-4 sm:text-sm",
                active && "text-white"
              )}
            >
              {active && (
                <motion.span
                  layoutId="lab-pill"
                  className="absolute inset-0 rounded-full bg-white/12"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
              <span className="relative flex items-center gap-1.5">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: lab.accent }}
                />
                {lab.name}
              </span>
            </Link>
          );
        })}

        <span className="mx-1 h-5 w-px bg-white/15" />

        <Link
          href="/labs"
          aria-label="Exit to gallery"
          className="grid h-8 w-8 place-items-center rounded-full text-neutral-400 transition-colors hover:bg-white/10 hover:text-white"
        >
          <X className="h-4 w-4" />
        </Link>
      </div>
    </motion.div>
  );
}
