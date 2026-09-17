/**
 * The rule the shop uses, written down.
 *
 * A second-hand piece has no size, only measurements, and the thing that
 * decides whether it fits is not the chest number on its own: it is the gap
 * between that number and the buyer's own, which the trade calls ease. Four
 * inches of ease is a normal fit, ten is oversized, and under two the garment
 * will not close. That single subtraction is what every "อกกี่นิ้วคะ" thread
 * is really trying to work out, one message at a time.
 *
 * Kept apart from the components because it is the thing the page is selling,
 * and because it has to explain itself. Every piece that does not fit says by
 * how many inches and in which direction, and when nothing fits at all the page
 * names the piece that came closest rather than showing an empty rail.
 */

import type { Piece } from "./data";

/** How the buyer wants it to sit. The numbers are inches of ease. */
export type Cut = "พอดีตัว" | "ใส่สบาย" | "โอเวอร์ไซส์";

interface Band {
  min: number;
  max: number;
}

/**
 * Ease, in inches, for each way of wearing something.
 *
 * These overlap on purpose. A piece with six inches of ease is a loose fitted
 * shirt and a snug relaxed one at the same time, which is true of real clothes
 * and is why a shop will happily sell it to either buyer.
 */
const EASE: Record<Cut, Band> = {
  พอดีตัว: { min: 2, max: 6 },
  ใส่สบาย: { min: 5, max: 10 },
  โอเวอร์ไซส์: { min: 9, max: 22 },
};

/**
 * Body length covered, in inches, by height. Used only to say whether a piece
 * will sit short or long on this buyer, never to reject one: hem length is
 * taste, and plenty of the stock here is bought deliberately cropped.
 */
function expectedLength(heightCm: number, isPants: boolean) {
  if (isPants) return { short: heightCm * 0.24, long: heightCm * 0.28 };
  return { short: heightCm * 0.14, long: heightCm * 0.17 };
}

export type Reason = "tight" | "loose";

export interface Verdict {
  piece: Piece;
  fits: boolean;
  /** inches of room between the buyer and the garment, can be negative */
  ease: number;
  /** why it was left on the rail, when it was */
  reason?: Reason;
  /** how it will sit, said in one line, when it fits */
  note?: string;
}

/** Inches, one decimal, without a trailing `.0`. */
export const inches = (value: number) =>
  (Math.round(value * 10) / 10).toString().replace(/\.0$/, "");

export interface Query {
  /** the buyer's own chest, in inches, measured around */
  chest: number;
  /** centimetres, for hem length only */
  height: number;
  cut: Cut;
}

function judge(piece: Piece, query: Query): Verdict {
  // The shop posts chest measured flat, which is half the way round.
  const round = piece.chest * 2;
  const ease = round - query.chest;
  const band = EASE[query.cut];

  if (ease < band.min) {
    return { piece, fits: false, ease, reason: "tight" };
  }
  if (ease > band.max) {
    return { piece, fits: false, ease, reason: "loose" };
  }

  const isPants = piece.shape === "pants";
  const { short, long } = expectedLength(query.height, isPants);
  const note = isPants
    ? piece.length < short
      ? "ขาสั้นกว่ามาตรฐานของส่วนสูงนี้ จะลอยข้อเท้า"
      : piece.length > long
        ? "ขายาวกว่าส่วนสูงนี้ ต้องพับปลายหรือตัด"
        : "ความยาวขาพอดีกับส่วนสูงนี้"
    : piece.length < short
      ? "ตัวสั้นกว่าปกติสำหรับส่วนสูงนี้ ใส่แล้วจะครอป"
      : piece.length > long
        ? "ตัวยาวกว่าปกติ จะคลุมสะโพก"
        : "ความยาวตัวพอดีกับส่วนสูงนี้";

  return { piece, fits: true, ease, note };
}

export interface Outcome {
  fits: Verdict[];
  misses: Verdict[];
  /**
   * When nothing fits: the piece that missed by least, and the sentence that
   * says which answer to change. An empty rail with no explanation is the
   * failure mode of every size filter, and this is the way out of it.
   */
  nearest?: { verdict: Verdict; advice: string };
}

export function search(pieces: Piece[], query: Query): Outcome {
  const verdicts = pieces.map((piece) => judge(piece, query));
  const fits = verdicts.filter((v) => v.fits);
  const misses = verdicts.filter((v) => !v.fits);

  if (fits.length > 0) {
    // Closest to the middle of the band first: that is the piece the shop would
    // hold up, not the one that merely scraped in.
    const band = EASE[query.cut];
    const middle = (band.min + band.max) / 2;
    fits.sort((a, b) => Math.abs(a.ease - middle) - Math.abs(b.ease - middle));
    return { fits, misses };
  }

  const band = EASE[query.cut];
  const distance = (v: Verdict) =>
    v.reason === "tight" ? band.min - v.ease : v.ease - band.max;

  const nearest = [...misses].sort((a, b) => distance(a) - distance(b))[0];
  if (!nearest) return { fits, misses };

  const off = inches(distance(nearest));
  const advice =
    nearest.reason === "tight"
      ? `ทุกตัวบนราวแคบกว่าที่ขอ ตัวที่ใกล้ที่สุดขาดอีก ${off} นิ้ว ลองเปลี่ยนเป็นทรงที่หลวมขึ้น`
      : `ทุกตัวหลวมกว่าที่ขอ ตัวที่ใกล้ที่สุดเกินมา ${off} นิ้ว ลองเปลี่ยนเป็นทรงที่หลวมขึ้น จะได้ตัวพวกนี้ทั้งราว`;

  return { fits, misses, nearest: { verdict: nearest, advice } };
}

/** The line shown under a piece the rail left behind. */
export function missLine(verdict: Verdict, cut: Cut) {
  const band = EASE[cut];
  if (verdict.reason === "tight") {
    return `แคบไป ${inches(band.min - verdict.ease)} นิ้ว`;
  }
  return `หลวมไป ${inches(verdict.ease - band.max)} นิ้ว`;
}
