/**
 * A palette change that leaves the garden where it is: a still copy of the
 * garden, painted in the new palette, opens over it as a circle from the
 * swatch that was pressed.
 *
 * This is a view transition done by hand. The browser's own took a snapshot
 * of the page, and Chrome on an Android tablet took it with most of the garden
 * missing: every swaying plant is a layer of its own, and the ones it had not
 * painted yet came out blank. Here nothing is captured. The copy is ordinary
 * DOM, and with every animation in it stopped it is one still layer, so there
 * is nothing for a slow GPU to drop.
 */

/** What the garden's animations move: the wind, the shake, the drawing, the growth. */
const MOVED = ["transform", "rotate", "opacity", "stroke-dashoffset"] as const;

export interface Still {
  /** the garden as it was painted, every animation stopped where it stood */
  copy: Element;
  /**
   * Puts every animation in the live garden back where it stood when the copy
   * was taken. The garden keeps swaying while a wipe opens over it and the
   * copy does not; put back, it stands exactly as the copy does, so the copy
   * can be taken away with nothing to see. Fading it off instead showed both
   * poses at once, which on a phone read as a flicker.
   *
   * Each animation goes back to its own recorded time, not back by how long
   * the wipe took: one that had already finished stays finished, where
   * winding it back by the same amount closed every rose and opened it again.
   */
  restore: () => void;
}

/**
 * A copy of part of the garden as it is painted this instant, with every
 * animation stopped where it stands. Its colours still come from the palette
 * variables, so whatever it is placed inside decides them.
 */
export function stillCopy(live: Element): Still {
  const copy = live.cloneNode(true) as Element;
  const liveNodes = [live, ...live.querySelectorAll("*")];
  const copyNodes = [copy, ...copy.querySelectorAll("*")];
  const indexOf = new Map(liveNodes.map((node, i) => [node, i]));
  // One query for the whole subtree: asking each element in turn took half a
  // second on a long word, and a press has to answer at once.
  const animations = live.getAnimations({ subtree: true });
  const times = animations.map((animation) => animation.currentTime);
  const moving = new Set<Element>();
  for (const animation of animations) {
    const node = (animation.effect as KeyframeEffect | null)?.target;
    if (node) moving.add(node);
  }
  for (const node of moving) {
    const i = indexOf.get(node);
    if (i === undefined) continue;
    const computed = getComputedStyle(node);
    const target = copyNodes[i] as HTMLElement | SVGElement;
    for (const property of MOVED) target.style.setProperty(property, computed.getPropertyValue(property));
  }
  // The copy is a picture: nothing in it can take focus or be found by id.
  for (const field of copy.querySelectorAll("input, textarea, button")) field.remove();
  for (const node of [copy, ...copy.querySelectorAll("[id]")]) node.removeAttribute("id");

  const restore = () => {
    animations.forEach((animation, i) => {
      const time = times[i];
      if (animation.playState !== "idle" && typeof time === "number") animation.currentTime = time;
    });
  };
  return { copy, restore };
}

export interface WipeOrigin {
  /** px, inside the element the wipe covers */
  x: number;
  y: number;
  /** px, far enough to clear the furthest corner */
  radius: number;
}

/** Where a wipe opens from: the centre of the swatch, measured inside the box it will cover. */
export function wipeOrigin(swatch: DOMRect, box: DOMRect): WipeOrigin {
  const x = swatch.left + swatch.width / 2 - box.left;
  const y = swatch.top + swatch.height / 2 - box.top;
  return { x, y, radius: Math.ceil(Math.hypot(Math.max(x, box.width - x), Math.max(y, box.height - y))) };
}
