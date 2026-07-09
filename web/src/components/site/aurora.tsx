"use client";

/**
 * Ambient background: deep base + slow-drifting colour blooms + faint grid.
 * Fixed and non-interactive; sits behind all content.
 */
export function Aurora() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background"
    >
      {/* colour blooms */}
      <div className="animate-aurora absolute -top-40 -left-32 h-[40rem] w-[40rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.22),transparent_60%)] blur-3xl" />
      <div
        className="animate-aurora absolute -top-24 right-[-10rem] h-[38rem] w-[38rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.16),transparent_60%)] blur-3xl"
        style={{ animationDelay: "-6s" }}
      />
      <div
        className="animate-aurora absolute bottom-[-16rem] left-1/3 h-[44rem] w-[44rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.14),transparent_60%)] blur-3xl"
        style={{ animationDelay: "-12s" }}
      />

      {/* faint grid */}
      <div className="bg-grid absolute inset-0 opacity-60 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />

      {/* vignette to keep text legible */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,transparent_40%,var(--background)_95%)]" />
    </div>
  );
}
