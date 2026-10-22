// Read inside a scroll-linked transform, at the moment the value is computed.
//
// Toggling a component's `style` on useReducedMotion() does not work for
// these: the server renders with motion on (it cannot know the visitor's
// setting), hydration keeps the server's inline transform, and a style the
// client then drops is never removed from the element. A transform that
// returns the resting value itself has the same shape on both sides.
const query =
  typeof window === "undefined"
    ? null
    : window.matchMedia("(prefers-reduced-motion: reduce)");

export function prefersReducedMotion(): boolean {
  return query?.matches ?? false;
}
