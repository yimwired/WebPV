// Working out the blend, kept away from anything that draws it. The same four
// numbers set the label, the two scales and the notes underneath, so the page
// cannot print one temperature and draw another.

import { ADDITIONS, BAG_GRAMS, BASES, POT, type Material } from "./data";

export type Fault = "cold" | "hot" | "short" | "long";

export interface Trouble {
  id: string;
  name: string;
  fault: Fault;
  /** degrees for cold and hot, minutes for short and long */
  by: number;
}

/** The second pot: what the water in the first one is never allowed to reach. */
export interface Aside {
  names: string[];
  water: number;
  minutes: number;
}

/** What goes in near the end instead, because the pot outlasts it. */
export interface Late {
  names: string[];
  /**
   * Minutes into the steep, or null when nothing here has a time fault. A
   * material the pot is only too hot for has no delay to derive: waiting zero
   * minutes is adding it at the start, which is the opposite of the advice.
   */
  afterMinutes: number | null;
  /** the hottest water this group survives */
  water: number;
}

export interface Brew {
  base: Material;
  additions: Material[];
  /** what the pot is poured at, in °C */
  water: number;
  /** how long the pot stands, in minutes */
  minutes: number;
  totalGrams: number;
  /** mg in one cup of the pot */
  caffeinePerCup: number;
  /** what the leaf in one pot costs, in baht */
  potBaht: number;
  /** the same blend weighed out into the shop's 50 g bag */
  bagBaht: number;
  troubles: Trouble[];
  aside: Aside | null;
  late: Late | null;
}

const clamp = (value: number, low: number, high: number) =>
  Math.min(Math.max(value, low), high);

const named = (materials: Material[]) => materials.map((m) => m.name);

export function brew(base: Material, additions: Material[]): Brew {
  const all = [base, ...additions];

  // The water is set for the leaf, not for whatever wants it hottest. Bark and
  // root give less to water that is too cool and nothing is lost for good;
  // tea leaf scalded past its range is bitter and stays bitter.
  const water = clamp(
    Math.max(...all.map((m) => m.water.min)),
    base.water.min,
    base.water.max,
  );
  const minutes = clamp(
    Math.max(...all.map((m) => m.steep.min)),
    base.steep.min,
    base.steep.max,
  );

  const troubles: Trouble[] = [];
  for (const material of all) {
    const { id, name } = material;
    if (material.water.min > water) {
      troubles.push({ id, name, fault: "cold", by: material.water.min - water });
    } else if (material.water.max < water) {
      troubles.push({ id, name, fault: "hot", by: water - material.water.max });
    }
    if (material.steep.min > minutes) {
      troubles.push({ id, name, fault: "short", by: material.steep.min - minutes });
    } else if (material.steep.max < minutes) {
      troubles.push({ id, name, fault: "long", by: minutes - material.steep.max });
    }
  }

  const faulted = (faults: Fault[]) =>
    additions.filter((material) =>
      troubles.some((t) => t.id === material.id && faults.includes(t.fault)),
    );

  // Anything the pot is too cool or too quick for goes in its own pot first and
  // is poured in afterwards, which is how spiced tea has always been made.
  const under = faulted(["cold", "short"]);
  const aside: Aside | null = under.length
    ? {
        names: named(under),
        water: Math.max(...under.map((m) => m.water.min)),
        minutes: Math.max(...under.map((m) => m.steep.min)),
      }
    : null;

  // Anything the pot outlasts goes in near the end, timed off whichever of them
  // gives out first.
  const over = faulted(["hot", "long"]);
  const outlasted = faulted(["long"]);
  const late: Late | null = over.length
    ? {
        names: named(over),
        afterMinutes: outlasted.length
          ? Math.max(
              0,
              minutes - Math.min(...outlasted.map((m) => m.steep.max)),
            )
          : null,
        water: Math.min(...over.map((m) => m.water.max)),
      }
    : null;

  const totalGrams = all.reduce((sum, m) => sum + m.grams, 0);

  // Dry-leaf caffeine, divided over the pot. Near enough all of it comes out
  // inside the times printed here, so the figure is not discounted further.
  const caffeinePerCup = Math.round(
    all.reduce((sum, m) => sum + m.caffeine * m.grams, 0) / POT.cups,
  );

  // Priced off the same grams the label prints, so a blend that leans on
  // cardamom costs what cardamom costs.
  const potBaht = all.reduce((sum, m) => sum + m.grams * m.baht, 0);
  const bagBaht = Math.round((potBaht / totalGrams) * BAG_GRAMS / 5) * 5;

  return {
    base,
    additions,
    water,
    minutes,
    totalGrams: Math.round(totalGrams * 10) / 10,
    caffeinePerCup,
    troubles,
    aside,
    late,
    potBaht: Math.round(potBaht),
    bagBaht,
  };
}

export const baseById = (id: string) =>
  BASES.find((material) => material.id === id) ?? BASES[0];

export const additionsByIds = (ids: string[]) =>
  ADDITIONS.filter((material) => ids.includes(material.id));
