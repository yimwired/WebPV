"use client";

import { motion } from "framer-motion";
import { useLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * EN ⇄ TH toggle styled like a physical light switch:
 * a pill track with the knob sliding left (EN) or right (TH).
 */
export function LanguageSwitch() {
  const { locale, setLocale } = useLocale();
  const isThai = locale === "th";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isThai}
      aria-label={isThai ? "Switch language to English" : "เปลี่ยนภาษาเป็นไทย"}
      onClick={() => setLocale(isThai ? "en" : "th")}
      className="relative grid h-8 w-[74px] grid-cols-2 items-center rounded-full border border-white/15 bg-white/5 text-[11px] font-semibold tracking-wide backdrop-blur-md transition-colors hover:border-white/25"
    >
      <motion.span
        aria-hidden
        initial={false}
        animate={{ x: isThai ? 36 : 3 }}
        transition={{ type: "spring", stiffness: 500, damping: 32 }}
        className="absolute h-6 w-[33px] rounded-full bg-foreground shadow-sm"
      />
      <span
        className={cn(
          "relative z-10 text-center transition-colors duration-200",
          isThai ? "text-muted-foreground" : "text-background"
        )}
      >
        EN
      </span>
      <span
        className={cn(
          "relative z-10 text-center transition-colors duration-200",
          isThai ? "text-background" : "text-muted-foreground"
        )}
      >
        TH
      </span>
    </button>
  );
}
