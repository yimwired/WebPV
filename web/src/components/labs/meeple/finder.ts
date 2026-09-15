/**
 * The rule the staff use, written down.
 *
 * Kept apart from the components because it is the thing the page is actually
 * selling, and because a filter that silently returns nothing is the failure
 * mode of every "find a game" widget on the internet. This one has to explain
 * itself: every box that did not make it says which of the three questions it
 * failed, and when nothing survives at all the page names the box that came
 * closest and which answer to change. That is what somebody standing at the
 * shelf would say, and it is the only honest thing to do with an empty result.
 */

import type { Game, Weight } from "./data";

export type Condition = "players" | "time" | "weight";

export interface Miss {
  condition: Condition;
  /** said to the visitor, not logged */
  reason: string;
}

export interface Verdict {
  game: Game;
  fits: boolean;
  misses: Miss[];
}

export interface Query {
  players: number;
  /** minutes, or Infinity for a group that is not in a hurry */
  minutes: number;
  weights: Weight[];
}

const ORDER: Weight[] = ["เบา", "กลาง", "หนัก"];
const rank = (w: Weight) => ORDER.indexOf(w);

function judge(game: Game, query: Query): Verdict {
  const misses: Miss[] = [];

  if (query.players < game.minPlayers || query.players > game.maxPlayers) {
    misses.push({
      condition: "players",
      reason:
        game.minPlayers === game.maxPlayers
          ? `กล่องนี้ ${game.minPlayers} คนเท่านั้น`
          : `กล่องนี้ ${game.minPlayers} ถึง ${game.maxPlayers} คน`,
    });
  }

  if (game.minutes > query.minutes) {
    misses.push({ condition: "time", reason: `ใช้เวลา ${game.minutes} นาที` });
  }

  const allowed = query.weights.map(rank);
  const level = rank(game.weight);
  if (!allowed.includes(level)) {
    misses.push({
      condition: "weight",
      reason:
        level > Math.max(...allowed)
          ? "หนักกว่าที่เลือกไว้"
          : "เบากว่าที่เลือกไว้",
    });
  }

  return { game, fits: misses.length === 0, misses };
}

export interface FinderResult {
  verdicts: Verdict[];
  matches: Game[];
  /** boxes that failed exactly one of the three, worth saying out loud */
  nearMisses: Verdict[];
  /**
   * Only set when nothing matched: which single answer to change, how many
   * boxes it would open up, and the one that came closest.
   */
  advice: {
    condition: Condition;
    label: string;
    count: number;
    closest: Game;
  } | null;
}

const CONDITION_LABEL: Record<Condition, string> = {
  players: "จำนวนคน",
  time: "เวลา",
  weight: "ความหนัก",
};

export function findGames(games: Game[], query: Query): FinderResult {
  const verdicts = games.map((game) => judge(game, query));
  const matches = verdicts.filter((v) => v.fits).map((v) => v.game);
  const nearMisses = verdicts.filter((v) => v.misses.length === 1);

  if (matches.length > 0) {
    return { verdicts, matches, nearMisses, advice: null };
  }

  // Nothing fits. Whichever single answer unlocks the most boxes is the one
  // worth changing, and ties go to the shorter game, since a group that is
  // stuck at the shelf is already out of patience.
  const byCondition = new Map<Condition, Verdict[]>();
  for (const verdict of nearMisses) {
    const condition = verdict.misses[0].condition;
    byCondition.set(condition, [...(byCondition.get(condition) ?? []), verdict]);
  }

  let best: FinderResult["advice"] = null;
  for (const [condition, group] of byCondition) {
    const closest = [...group].sort((a, b) => a.game.minutes - b.game.minutes)[0].game;
    if (!best || group.length > best.count) {
      best = { condition, label: CONDITION_LABEL[condition], count: group.length, closest };
    }
  }

  return { verdicts, matches, nearMisses, advice: best };
}
