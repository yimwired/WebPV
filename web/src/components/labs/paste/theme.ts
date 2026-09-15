/**
 * Paste's materials.
 *
 * This style is made of things that were physically stuck down, so the palette
 * is a list of papers rather than a list of colours: notebook cream, a kraft
 * band, the white border of an instant photo. One blue ink runs across all
 * three at 9:1 or better, which is what lets the page layer them freely without
 * re-checking every time something moves.
 *
 * **Nothing here is outlined in full-strength ink.** The first pass drew every
 * box, the header and the search field with a 1px line of the body colour, and
 * the page came out looking wired together rather than pasted. Edges are
 * `edge`, which is the same ink at 22%; only the photographs keep a hard
 * boundary, and theirs is white paper, not a rule.
 */

export const COLOR = {
  /** notebook paper. 12.83:1 under the ink */
  paper: "#f7f2e8",
  /**
   * kraft envelope. Lifted from #e3d2b6, which was strong enough to read as a
   * second brand colour rather than as a different paper stacked on the first.
   */
  kraft: "#ece0cb",
  /** the white border of an instant photo. 13.95:1 under the ink */
  card: "#fdfcf8",
  /** ballpoint blue-black */
  ink: "#1c2b3f",
  /** 6.82:1 on paper */
  inkMuted: "#4e5460",
  /** rubber stamp red. 5.34:1 on paper, and paper is 5.34:1 on it */
  stamp: "#b23a26",
  /** every border on the page. The ink, at the weight a pencil leaves */
  edge: "rgba(28, 43, 63, 0.22)",
  /** the ruled line itself, fainter still */
  rule: "rgba(28, 43, 63, 0.13)",
} as const;

/**
 * Washi tape, softened from the first pass.
 *
 * These read as tape rather than as swatches now: real washi is pale and lets
 * the paper through, and the saturated versions were the loudest thing on a
 * page whose whole argument is that it is quiet and handmade.
 */
export const TAPE = ["#f5e6b8", "#eed6e0", "#d8e6de"] as const;

export const FONT = {
  /** Charm, loaded by the route. A Thai hand that is still legible */
  hand: "var(--font-paste-hand), cursive",
  /**
   * Maitree, not Sarabun. Sarabun is a workplace face: correct, even, and
   * completely flat next to handwriting. A soft Thai serif sits with the hand
   * instead of arguing with it, and reads better on paper-coloured ground.
   */
  body: "var(--font-paste-body), Georgia, serif",
} as const;

/**
 * The hand always carries its own leading.
 *
 * Charm puts Thai tone marks high above the letters and hangs descenders well
 * below them, so anything under about 1.3 collides: at `leading-none` a table
 * number lost the top of its ไม้โท and sat inside the name above it. Bundling
 * the line-height with the family is the only way that does not have to be
 * remembered at all fifteen call sites.
 */
export const handStyle = { fontFamily: FONT.hand, lineHeight: 1.35 } as const;
export const bodyStyle = { fontFamily: FONT.body } as const;

/**
 * The baseline the ruled paper is drawn on.
 *
 * Every line of body copy on a ruled block is set to exactly this, and the
 * rules repeat at exactly this, so the text sits *on* the lines. That is the
 * entire difference between ruled paper and a striped background, and it was
 * the thing wrong with the first pass: the rules ran behind the whole page at
 * 28px while the copy ran at whatever its own leading happened to be, so the
 * two drifted apart within three lines.
 */
export const LINE_HEIGHT = 28;

/**
 * Ruled paper for one block, not for the page.
 *
 * The rules used to cover everything, with photographs, tape and cards laid
 * over them, which is a pattern rather than a material. Now only the two
 * surfaces that really are notepaper carry them.
 *
 * `offset` shifts the rules so they land under the baseline rather than
 * through the middle of the text: a 16px face on a 28px line sits about 20px
 * down its line box, so the rule wants to be a couple of pixels below that.
 */
export const ruled = (offset = 22) =>
  ({
    backgroundImage: `repeating-linear-gradient(to bottom, transparent 0, transparent ${LINE_HEIGHT - 1}px, ${COLOR.rule} ${LINE_HEIGHT - 1}px, ${COLOR.rule} ${LINE_HEIGHT}px)`,
    backgroundPosition: `0 ${offset}px`,
  }) as const;

export const Z = { paper: 0, photo: 10, tape: 20, bar: 40 } as const;
