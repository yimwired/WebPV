// The two button shapes the home page uses: a full pill, the primary filled
// with ink and the secondary outlined. Dark fill on ivory is the palette's one
// button that is both legible and quiet: mid-tone fills fall in the band where
// neither anchor reaches 4.5:1 as a label. Exported as class strings rather
// than a <Button variant> so a link stays a plain <a> or <Link> with no
// wrapper deciding which one it renders.

const base =
  "inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-[15px] font-medium whitespace-nowrap transition-[background-color,border-color,color,opacity,transform] duration-200 active:scale-[0.98]";

export const pillPrimary = `${base} bg-foreground text-background hover:opacity-90`;

export const pillSecondary = `${base} border border-line-strong bg-background text-foreground hover:border-foreground/40`;
