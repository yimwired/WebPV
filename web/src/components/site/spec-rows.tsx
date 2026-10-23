import type { ReactNode } from "react";

export interface Spec {
  label: string;
  value: ReactNode;
}

/**
 * Figures read along dotted leaders, the way a parts list is: the label, the
 * dots, the value. Leaders only, no rule under each row: with both, every row
 * carried two kinds of line, the faint dots read as scratches, and the last
 * rule sat over the next block's as if a row were missing. The dots stand on
 * the baseline, where a parts list puts them, rather than through the words.
 * Either side wraps when the row runs short, so a long label (a receipt line)
 * or a long value (a timeline) never pushes the row off a phone; the leader
 * keeps at least a few dots between them.
 */
export function SpecRows({ specs, className }: { specs: Spec[]; className?: string }) {
  return (
    <dl className={className}>
      {specs.map((spec) => (
        <div key={spec.label} className="flex items-baseline gap-3 py-2.5">
          <dt className="text-muted-foreground min-w-0 text-[14px]">{spec.label}</dt>
          <span aria-hidden className="border-line-strong min-w-4 flex-1 border-b-2 border-dotted" />
          <dd className="max-w-[60%] text-end text-[15px] font-medium tabular-nums">{spec.value}</dd>
        </div>
      ))}
    </dl>
  );
}
