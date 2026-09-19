/**
 * The arithmetic behind the panel: which rooms are free on the chosen nights,
 * what they cost direct, and what the same nights cost through an agent.
 *
 * Kept apart from the components because it is the thing the page exists to
 * say. A guesthouse site that only lists rooms is a worse version of the
 * listing the guest arrived from; one that prices the same nights both ways is
 * the only version worth paying for.
 *
 * Dates are handled as day offsets from midnight today rather than as Date
 * objects wherever possible: a static export has no server clock, the page is
 * rendered on whatever day it is opened, and offsets are the only form of
 * "three nights from now" that behaves the same in a test as in a browser.
 */

import {
  COMMISSION,
  COMMISSION_MID,
  HIGH_SEASON_MONTHS,
  type Room,
} from "./rooms";

/** Midnight today, in the viewer's own timezone. */
export function today(now = new Date()) {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function addDays(from: Date, days: number) {
  const out = new Date(from);
  out.setDate(out.getDate() + days);
  return out;
}

/** Whole days between two midnights. */
export function nightsBetween(from: Date, to: Date) {
  return Math.round((to.getTime() - from.getTime()) / 86_400_000);
}

export const isHighSeason = (date: Date) =>
  HIGH_SEASON_MONTHS.includes(date.getMonth());

/** The direct rate for one night in one room, which season decides. */
export const rateFor = (room: Room, date: Date) =>
  isHighSeason(date) ? room.high : room.low;

/**
 * What an agent would show for the same night.
 *
 * The owner needs their rate to arrive intact, so the listed price has to carry
 * the commission on top: a 1,450 room at 16.5% is listed at 1,737, not at 1,450
 * with the owner quietly losing 239. Rounded up to the nearest ten, the way
 * every listing in the country is.
 */
export const agentRateFor = (room: Room, date: Date) =>
  Math.ceil(rateFor(room, date) / (1 - COMMISSION_MID) / 10) * 10;

export interface Quote {
  room: Room;
  nights: number;
  /** total, direct, in baht */
  direct: number;
  /** total the same nights would list at through an agent */
  agent: number;
  /** what staying direct keeps in the guest's pocket */
  saved: number;
  /** nights in this stay that fall in high season */
  highNights: number;
}

export interface Availability {
  free: Quote[];
  /** rooms taken, with the night that blocked them */
  taken: { room: Room; firstClash: Date }[];
}

/** Every night of the stay, which is check-in up to but not including check-out. */
function nightsOf(checkIn: Date, nights: number) {
  return Array.from({ length: nights }, (_, i) => addDays(checkIn, i));
}

export function availability(
  rooms: Room[],
  checkIn: Date,
  nights: number,
  from = today(),
): Availability {
  const stay = nightsOf(checkIn, nights);
  const free: Quote[] = [];
  const taken: Availability["taken"] = [];

  for (const room of rooms) {
    const clash = stay.find((night) =>
      room.taken.includes(nightsBetween(from, night)),
    );

    if (clash) {
      taken.push({ room, firstClash: clash });
      continue;
    }

    const direct = stay.reduce((sum, night) => sum + rateFor(room, night), 0);
    const agent = stay.reduce(
      (sum, night) => sum + agentRateFor(room, night),
      0,
    );
    free.push({
      room,
      nights,
      direct,
      agent,
      saved: agent - direct,
      highNights: stay.filter(isHighSeason).length,
    });
  }

  // cheapest first: a guest comparing three rooms is comparing totals
  free.sort((a, b) => a.direct - b.direct);
  return { free, taken };
}

/**
 * How many rooms are free on one night, which is what the calendar shades by.
 * A night with one room left and a night with three are not the same thing to
 * somebody deciding when to come, and free-or-full cannot say so.
 */
export function roomsOpenOn(rooms: Room[], date: Date, from = today()) {
  const offset = nightsBetween(from, date);
  return rooms.filter((room) => !room.taken.includes(offset)).length;
}

export const baht = (value: number) => value.toLocaleString("th-TH");

export const THAI_MONTHS = [
  "ม.ค.",
  "ก.พ.",
  "มี.ค.",
  "เม.ย.",
  "พ.ค.",
  "มิ.ย.",
  "ก.ค.",
  "ส.ค.",
  "ก.ย.",
  "ต.ค.",
  "พ.ย.",
  "ธ.ค.",
];

export const formatThaiDate = (date: Date) =>
  `${date.getDate()} ${THAI_MONTHS[date.getMonth()]}`;

/** The commission band, said the way the page says it. */
export const commissionLabel = `${Math.round(COMMISSION.low * 100)}-${Math.round(COMMISSION.high * 100)}%`;
