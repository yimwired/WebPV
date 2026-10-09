/**
 * How the shop turns a drawn design into a stitch count, a price and a time on
 * the machine.
 *
 * A digitiser quotes from the stitch count, so that is what this estimates,
 * per stitch type, from the geometry that is actually on screen:
 *
 *   satin    the letters. A satin column is one stitch across per 0.4 mm of its
 *            length, and a column's centre line is half its outline, so a
 *            letter costs (perimeter / 2) / 0.4 mm. That holds for a stem, a
 *            bowl and a ring alike, which is why one rule covers Thai and Latin.
 *   fill     leaves and roses. Rows 0.4 mm apart of stitches 3.5 mm long, so
 *            one stitch per 1.4 mm² of area.
 *   triple   the vines: a bean stitch, 2.5 mm long, three passes per stitch.
 *   run      the petal lines inside each rose, single pass, 2 mm.
 *
 * Underlay, trims and jump stitches are not counted. The shop says so on the
 * page rather than padding the number with a guess.
 *
 * Densities from common digitising defaults: 0.35-0.45 mm fill spacing, fill
 * stitches of 3-4 mm, running stitches defaulting to 2 mm.
 */

export const STITCH = {
  satinSpacingMm: 0.4,
  fillSpacingMm: 0.4,
  fillLengthMm: 3.5,
  tripleLengthMm: 2.5,
  triplePasses: 3,
  runLengthMm: 2,
} as const;

/** This shop's prices, in baht. Invented, and stated on the page. */
export const PRICE = {
  perThousandStitches: 35,
  perExtraColour: 10,
  minimumEmbroidery: 150,
  bag: 190,
} as const;

/** The shop's single-head machine, sewing at a realistic rather than rated speed. */
export const MACHINE = {
  stitchesPerMinute: 800,
  minutesPerColour: 0.5,
} as const;

/** The embroidery field on the front of the bag. */
export const FIELD_MM = { width: 200, height: 130 } as const;

export interface Material {
  /** satin, em of letter outline */
  letterPerimeter: number;
  /** triple run, em */
  vineLength: number;
  /** fill, em² */
  leafArea: number;
  /** fill, em², roses and buds */
  roseArea: number;
  /** single run, em */
  detailLength: number;
}

export interface Quote {
  letters: number;
  vines: number;
  leaves: number;
  roses: number;
  total: number;
  colours: number;
  embroideryBaht: number;
  totalBaht: number;
  minutes: number;
}

export const satinStitches = (perimeterMm: number) => perimeterMm / 2 / STITCH.satinSpacingMm;
export const fillStitches = (areaMm2: number) => areaMm2 / (STITCH.fillSpacingMm * STITCH.fillLengthMm);
export const tripleStitches = (lengthMm: number) => (lengthMm / STITCH.tripleLengthMm) * STITCH.triplePasses;
export const runStitches = (lengthMm: number) => lengthMm / STITCH.runLengthMm;

/**
 * @param material   summed over the whole design, in em
 * @param emMm       what one em measures on the fabric
 * @param colours    threads the design uses, each a change on the machine
 */
export function quote(material: Material, emMm: number, colours: number): Quote {
  const mm = emMm;
  const mm2 = emMm * emMm;

  // Each line is rounded on its own so the lines on the label add up to the
  // total printed under them.
  const letters = Math.round(satinStitches(material.letterPerimeter * mm));
  const vines = Math.round(tripleStitches(material.vineLength * mm));
  const leaves = Math.round(fillStitches(material.leafArea * mm2));
  const roses = Math.round(fillStitches(material.roseArea * mm2) + runStitches(material.detailLength * mm));
  const total = letters + vines + leaves + roses;

  const sewn = (total / 1000) * PRICE.perThousandStitches + Math.max(0, colours - 1) * PRICE.perExtraColour;
  const embroideryBaht = total === 0 ? 0 : Math.max(PRICE.minimumEmbroidery, Math.round(sewn));

  return {
    letters,
    vines,
    leaves,
    roses,
    total,
    colours,
    embroideryBaht,
    totalBaht: embroideryBaht + PRICE.bag,
    minutes: total === 0 ? 0 : Math.ceil(total / MACHINE.stitchesPerMinute + colours * MACHINE.minutesPerColour),
  };
}
