"use client";

import { motion } from "framer-motion";
import { useLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * EN ⇄ TH toggle styled like a physical light switch:
 * a pill track with the knob sliding left (EN) or right (TH).
 *
 * The label the knob is not on is the foreground at 75%, not muted grey: in
 * the navbar it sits on glass, and muted grey drops to about 3:1 there when
 * a dark picture slides under the bar. 75% ink holds 4.8:1 on that worst plate.
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
      className="border-line-strong hover:border-foreground/40 relative grid h-9 w-[78px] grid-cols-2 items-center rounded-full border text-[11px] font-semibold tracking-wide transition-colors"
    >
      <motion.span
        aria-hidden
        initial={false}
        animate={{ x: isThai ? 38 : 3 }}
        transition={{ type: "spring", stiffness: 500, damping: 32 }}
        className="bg-foreground absolute h-7 w-[35px] rounded-full"
      />
      <span
        className={cn(
          "relative z-10 text-center transition-colors duration-200",
          isThai ? "text-foreground/75" : "text-background"
        )}
      >
        EN
      </span>
      <span
        className={cn(
          "relative z-10 text-center transition-colors duration-200",
          isThai ? "text-background" : "text-foreground/75"
        )}
      >
        TH
      </span>
    </button>
  );
}
