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

/**
 * A copy of part of the garden as it is painted this instant, with every
 * animation stopped where it stands. Its colours still come from the palette
 * variables, so whatever it is placed inside decides them.
 */
export function stillCopy(live: Element): Element {
  const copy = live.cloneNode(true) as Element;
  const liveNodes = [live, ...live.querySelectorAll("*")];
  const copyNodes = [copy, ...copy.querySelectorAll("*")];
  const indexOf = new Map(liveNodes.map((node, i) => [node, i]));
  // One query for the whole subtree: asking each element in turn took half a
  // second on a long word, and a press has to answer at once.
  const moving = new Set<Element>();
  for (const animation of live.getAnimations({ subtree: true })) {
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
  return copy;
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
