import { Fragment, type ReactNode } from "react";

/**
 * Thai does not put spaces between words, so a browser needs a Thai
 * dictionary to know where a line may break. Engines without one treat every
 * character as a break opportunity and split words in half, which is very
 * visible at display sizes.
 *
 * This keeps each word whole and allows breaks only where the copy says so:
 * at a real space, or at a zero-width space (U+200B) placed in the string.
 * Use it for large headings; body text is small enough that a bad break is
 * not worth the extra markup.
 */
export function thaiWrap(text: string): ReactNode[] {
  return text
    .split(/(\s+|​)/)
    .filter(Boolean)
    .map((part, i) => {
      if (part === "​") return <wbr key={i} />;
      if (/^\s+$/.test(part)) return <Fragment key={i}> </Fragment>;
      return (
        <span key={i} className="whitespace-nowrap">
          {part}
        </span>
      );
    });
}
