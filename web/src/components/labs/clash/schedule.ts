// What the page actually answers: given the sets someone picked, where do they
// collide, and can a person on foot get from one to the next.
//
// Kept apart from the view because it is the part worth checking. Every number
// printed on the page comes out of here, so the verify script can compute the
// same figure from the data and compare, rather than reading back a string the
// page made up.

import { type Act, type DayId, walkBetween } from "./data";

export type Entry =
  | { kind: "act"; act: Act }
  /**
   * The two sets overlap. Either you stay to the end of the first and walk in
   * late, or you leave early and catch the second whole - and the two cost the
   * same, because both are the overlap plus the walk. That is the one number
   * worth printing, with the two shapes it can take.
   */
  | {
      kind: "clash";
      from: Act;
      to: Act;
      overlap: number;
      walk: number;
      /** minutes given up, whichever way round you do it */
      cost: number;
      /** when you reach the second set if you stay to the end of the first */
      arrive: number;
      /** the latest you can leave and still catch the second whole */
      leaveBy: number;
    }
  /** no overlap, but not enough time to walk it either */
  | { kind: "tight"; from: Act; to: Act; gap: number; walk: number; late: number }
  /** enough time to walk, not enough to do anything else */
  | { kind: "walk"; from: Act; to: Act; gap: number; walk: number }
  | { kind: "gap"; from: Act; to: Act; gap: number };

export interface DayPlan {
  day: DayId;
  entries: Entry[];
  /** minutes of music picked, before anything is given up to a clash */
  booked: number;
  clashes: number;
}

/** Below this a gap is a walk with a queue in it, not free time. */
const FREE_TIME = 30;

function link(from: Act, to: Act): Entry {
  const walk = walkBetween(from.stage, to.stage);

  if (to.start < from.end) {
    const overlap = from.end - to.start;
    return {
      kind: "clash",
      from,
      to,
      overlap,
      walk,
      cost: overlap + walk,
      arrive: from.end + walk,
      leaveBy: to.start - walk,
    };
  }

  const gap = to.start - from.end;
  if (gap < walk) return { kind: "tight", from, to, gap, walk, late: walk - gap };
  if (gap < FREE_TIME) return { kind: "walk", from, to, gap, walk };
  return { kind: "gap", from, to, gap };
}

/**
 * One plan per day that has anything picked, in the order the days run. Sets
 * that start at the same minute are ordered by stage so the output is stable:
 * the page prints the pair as a clash either way round, and a list that
 * reshuffles itself on every render is unreadable.
 */
export function planFor(picked: Act[], days: DayId[]): DayPlan[] {
  return days
    .map((day) => {
      const acts = picked
        .filter((a) => a.day === day)
        .sort((a, b) => a.start - b.start || a.stage.localeCompare(b.stage));

      const entries: Entry[] = [];
      let clashes = 0;

      acts.forEach((a, i) => {
        entries.push({ kind: "act", act: a });
        const next = acts[i + 1];
        if (!next) return;
        const between = link(a, next);
        if (between.kind === "clash") clashes += 1;
        entries.push(between);
      });

      return {
        day,
        entries,
        booked: acts.reduce((total, a) => total + (a.end - a.start), 0),
        clashes,
      };
    })
    .filter((plan) => plan.entries.length > 0);
}
