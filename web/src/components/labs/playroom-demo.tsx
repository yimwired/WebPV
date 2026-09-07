"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Minus, Plus, RotateCcw } from "lucide-react";

import {
  addBody,
  bodyAt,
  createWorld,
  removeLast,
  resize,
  settleInstantly,
  step,
  wake,
  type Body,
  type World,
} from "./playroom-physics";

const ease = [0.21, 0.47, 0.32, 0.98] as const;

// ─────────────────────────────────────────────────────────────
//  Playroom: a pick-and-mix sweet shop.
//
//  The jar is the product listing. Every sweet in it is a real body in a
//  solver, so the pile answers back when you shove it — but the shop works
//  entirely without that: the buttons are the interface, the jar is what the
//  buttons look like. That order matters. A physics toy that hides the price
//  behind a drag gesture is a demo; this is meant to be a shop.
// ─────────────────────────────────────────────────────────────

interface Flavour {
  id: string;
  name: string;
  note: string;
  colour: string;
  /** A second, darker tone for the stripe, so a spinning sweet reads as
   *  spinning rather than as a flat disc. */
  stripe: string;
}

const FLAVOURS: Flavour[] = [
  { id: "mango", name: "Mango sticky rice", note: "Coconut centre", colour: "#f6b73c", stripe: "#e08c1b" },
  { id: "lychee", name: "Lychee rose", note: "Soft, floral", colour: "#ff85a8", stripe: "#e05c85" },
  { id: "cha-yen", name: "Thai tea", note: "Milky, strong", colour: "#e08a4c", stripe: "#b8622c" },
  { id: "pandan", name: "Pandan", note: "Grassy and sweet", colour: "#57b782", stripe: "#358b5d" },
  { id: "makham", name: "Salted tamarind", note: "Sour, salty", colour: "#a3765c", stripe: "#7b533c" },
  { id: "anchan", name: "Butterfly pea", note: "Lemon finish", colour: "#7b8ad6", stripe: "#5866b0" },
];

/** Grams per sweet. Everything the bag says is derived from this one number. */
const GRAMS_EACH = 8;

/** What a standard paper bag holds before the second one is opened. */
const BAG_GRAMS = 250;

const PRICE_EACH = 6;

/** Buy this many and every sweet in the order drops to BULK_PRICE. */
const BULK_FROM = 20;
const BULK_PRICE = 5;

/** Ceiling on the pile: two full bags, which is already more than anyone
 *  orders, and about as deep as the jar can stack before the pile reaches the
 *  lip. The solver is O(n²), so this is also the number that keeps it cheap. */
const MAX_PIECES = 40;

/** Big enough to read as a sweet rather than as a dot, sized so seven fit
 *  across the jar and the pile builds in visible rows. */
const SWEET_RADIUS = 23;

interface Order {
  pieces: number;
  grams: number;
  bags: number;
  unitPrice: number;
  total: number;
  /** What the same order would have cost without the bulk price. */
  saved: number;
  /** How full the bag currently being filled is, 0..1. */
  lastBagFill: number;
}

function priceOrder(counts: number[]): Order {
  const pieces = counts.reduce((sum, n) => sum + n, 0);
  const unitPrice = pieces >= BULK_FROM ? BULK_PRICE : PRICE_EACH;
  const grams = pieces * GRAMS_EACH;
  const bags = Math.max(1, Math.ceil(grams / BAG_GRAMS));

  // What is in the bag being filled right now, rather than the remainder: at
  // exactly one full bag the remainder is zero, and a bar that empties itself
  // the moment the bag fills is the wrong story.
  const inLastBag = grams - (bags - 1) * BAG_GRAMS;

  return {
    pieces,
    grams,
    bags,
    unitPrice,
    total: pieces * unitPrice,
    saved: pieces * (PRICE_EACH - unitPrice),
    lastBagFill: inLastBag / BAG_GRAMS,
  };
}

// ── the jar ──────────────────────────────────────────────────────────────

/**
 * Draws one sweet: a filled disc, a stripe that turns with it, and a highlight
 * fixed to the top left because the whole page is lit from there.
 *
 * The highlight deliberately does not rotate with the body. Light does not
 * travel with an object, and a rolling specular is the tell that a "3D" ball
 * is a sprite.
 */
function drawSweet(ctx: CanvasRenderingContext2D, body: Body, flavour: Flavour) {
  const { x, y, r, angle } = body;

  ctx.save();
  ctx.translate(x, y);

  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = flavour.colour;
  ctx.fill();

  // the stripe, clipped to the disc so it wraps instead of hanging off the edge
  ctx.save();
  ctx.clip();
  ctx.rotate(angle);
  ctx.fillStyle = flavour.stripe;
  ctx.fillRect(-r, -r * 0.22, r * 2, r * 0.44);
  ctx.restore();

  ctx.beginPath();
  ctx.arc(-r * 0.32, -r * 0.34, r * 0.3, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.fill();

  // a rim on the shaded side, which is what stops a flat circle reading as a hole
  ctx.beginPath();
  ctx.arc(0, 0, r - 0.75, Math.PI * 0.15, Math.PI * 0.85);
  ctx.strokeStyle = "rgba(0,0,0,0.13)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.restore();
}

interface JarProps {
  counts: number[];
  /** False under prefers-reduced-motion: the pile is placed, not dropped. */
  animate: boolean;
}

/**
 * The jar canvas.
 *
 * It owns no counts of its own — it reconciles against the `counts` prop, so
 * the buttons remain the single source of truth and the pile can never
 * disagree with the price.
 */
function Jar({ counts, animate }: JarProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const worldRef = useRef<World | null>(null);
  const rafRef = useRef(0);
  const lastTimeRef = useRef(0);

  // Restarts a loop that stopped itself when the pile settled. Owned by the
  // setup effect and called from the other effect and the pointer handlers,
  // which is the whole reason it is a ref: they are outside its closure.
  const kickRef = useRef(() => {});

  const heldRef = useRef<{ body: Body; x: number; y: number; time: number } | null>(null);

  // Set up the world and the loop once. `counts` is handled by a separate
  // effect below: rebuilding the world on every add would throw the pile away
  // and re-drop it each time a button is pressed.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const world = createWorld(canvas.offsetWidth, canvas.offsetHeight);
    worldRef.current = world;

    let dpr = 1;

    const paint = () => {
      ctx.clearRect(0, 0, world.width, world.height);
      for (const body of world.bodies) {
        drawSweet(ctx, body, FLAVOURS[body.flavour] ?? FLAVOURS[0]);
      }
    };

    const frame = (time: number) => {
      const dt = lastTimeRef.current ? (time - lastTimeRef.current) / 1000 : 1 / 60;
      lastTimeRef.current = time;

      const moving = animate ? step(world, dt) : false;
      paint();

      if (moving) {
        rafRef.current = requestAnimationFrame(frame);
      } else {
        rafRef.current = 0;
      }
    };

    const start = () => {
      if (rafRef.current || document.hidden) return;
      lastTimeRef.current = 0;
      rafRef.current = requestAnimationFrame(frame);
    };

    const stop = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    };

    kickRef.current = () => {
      wake(world);
      start();
    };

    const applySize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      resize(world, canvas.offsetWidth, canvas.offsetHeight);
      if (animate) start();
      else {
        settleInstantly(world);
        paint();
      }
    };

    // ResizeObserver rather than window.resize: the jar is a grid cell, so it
    // changes width when the layout does and not only when the window does.
    const observer = new ResizeObserver(applySize);
    observer.observe(canvas);

    // Nothing is visible while the tab is hidden, and a paused rAF hands back
    // a multi-second delta when it returns.
    const onVisibility = () => {
      if (document.hidden) stop();
      else if (!world.settled) start();
    };
    document.addEventListener("visibilitychange", onVisibility);

    applySize();

    return () => {
      stop();
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      worldRef.current = null;
    };
  }, [animate]);

  // Reconcile the pile against the order. Adds and removals only, so an
  // existing pile keeps its arrangement.
  useEffect(() => {
    const world = worldRef.current;
    const canvas = canvasRef.current;
    if (!world || !canvas) return;

    let changed = false;

    counts.forEach((want, flavour) => {
      let have = 0;
      for (const body of world.bodies) if (body.flavour === flavour) have++;

      for (; have < want; have++) {
        // Each flavour drops down its own lane, so a run of the same button
        // reads as a stream rather than as sweets appearing at random. The
        // scatter is what stops that lane building a single tottering column.
        const lane = (flavour + 0.5) / FLAVOURS.length;
        const spread = Math.min(0.94, Math.max(0.06, lane + (Math.random() - 0.5) * 0.16));
        addBody(world, flavour, SWEET_RADIUS, spread);
        changed = true;
      }
      for (; have > want; have--) {
        removeLast(world, flavour);
        changed = true;
      }
    });

    if (!changed) return;

    if (animate) {
      kickRef.current();
    } else {
      settleInstantly(world);
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, world.width, world.height);
        for (const body of world.bodies) drawSweet(ctx, body, FLAVOURS[body.flavour] ?? FLAVOURS[0]);
      }
    }
  }, [counts, animate]);

  // ── dragging ──
  //
  // Pointer events only, so mouse, pen and touch are one code path. Under
  // reduced motion the jar is inert: a pile that was explicitly placed rather
  // than dropped should not start bouncing because somebody brushed it.

  const pointerPos = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const onPointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!animate) return;
    const world = worldRef.current;
    if (!world) return;

    const { x, y } = pointerPos(event);
    const body = bodyAt(world, x, y);
    if (!body) return;

    body.held = true;
    heldRef.current = { body, x, y, time: performance.now() };
    event.currentTarget.setPointerCapture(event.pointerId);
    kickRef.current();
  };

  const onPointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const held = heldRef.current;
    if (!held) return;

    const { x, y } = pointerPos(event);
    const now = performance.now();
    const dt = Math.max(1, now - held.time) / 1000;

    // The throw is the pointer's own speed. Clamped, because a fast flick
    // across a trackpad can otherwise fire a sweet through a wall between
    // two frames.
    held.body.vx = Math.max(-2600, Math.min(2600, (x - held.x) / dt));
    held.body.vy = Math.max(-2600, Math.min(2600, (y - held.y) / dt));
    held.body.x = x;
    held.body.y = y;

    held.x = x;
    held.y = y;
    held.time = now;
  };

  const releaseHeld = () => {
    const held = heldRef.current;
    if (!held) return;
    held.body.held = false;
    heldRef.current = null;
  };

  return (
    <canvas
      ref={canvasRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={releaseHeld}
      onPointerCancel={releaseHeld}
      onPointerLeave={releaseHeld}
      // pan-y, not none: a finger on the jar still scrolls the page. Taking
      // the whole gesture would trap a phone visitor inside the toy.
      className="h-full w-full cursor-grab touch-pan-y active:cursor-grabbing"
      // The pile is a picture of the order, and the order is written out in
      // text right beside it, so it is labelled rather than described.
      role="img"
      aria-label="The sweets currently in your bag, piled in a jar"
    />
  );
}

// ── the page ─────────────────────────────────────────────────────────────

export function PlayroomDemo() {
  const reduced = useReducedMotion();
  const [counts, setCounts] = useState<number[]>(() => [5, 3, 3, 2, 1, 2]);

  const order = useMemo(() => priceOrder(counts), [counts]);
  const full = order.pieces >= MAX_PIECES;

  const change = useCallback((flavour: number, delta: number) => {
    setCounts((current) => {
      const total = current.reduce((sum, n) => sum + n, 0);
      if (delta > 0 && total >= MAX_PIECES) return current;

      const next = [...current];
      next[flavour] = Math.max(0, next[flavour] + delta);
      return next;
    });
  }, []);

  return (
    <main className="min-h-dvh bg-[#fff6ec] text-[#2b1216] selection:bg-[#ff85a8]/40">
      {/* ── hero ── */}
      <section className="mx-auto max-w-6xl px-5 pt-10 pb-6 sm:px-8 sm:pt-14">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease }}
        >
          <p className="text-[11px] font-semibold tracking-[0.34em] text-[#a8452f] uppercase">
            Playroom · pick and mix
          </p>
          <h1 className="mt-4 max-w-2xl text-4xl leading-[1.05] font-extrabold tracking-tight text-balance sm:text-5xl">
            Build the bag,
            <br />
            watch it fill up.
          </h1>
          <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-[#6b4a44]">
            Six flavours, {PRICE_EACH} baht each, {BULK_PRICE} once you pass{" "}
            {BULK_FROM}. Every sweet you add is dropped into the jar for real -
            grab one and throw it.
          </p>
        </motion.div>
      </section>

      {/* ── the shop: jar on the left, order on the right ── */}
      <section className="mx-auto grid max-w-6xl items-start gap-6 px-5 pb-14 sm:px-8 lg:grid-cols-[1.05fr_1fr] lg:gap-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease }}
          className="relative overflow-hidden rounded-[26px] border border-[#e8d3bd] bg-white shadow-[0_18px_40px_-28px_rgba(80,30,20,0.5)]"
        >
          {/* the jar's own shading, painted under the canvas so the solver
              never has to know about it */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_0%,#ffffff_0%,#fdf1e3_58%,#f6e2cd_100%)]" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#e9d2b8]/70 to-transparent" />

          {/* The jar is narrower than the panel and carries its own walls, so
              the sweets bounce off something the eye can see. Full width, the
              pile spread into a single layer at the bottom of a large empty
              box and read as a bug. */}
          <div className="relative h-[17rem] px-5 pt-5 sm:h-[19rem] sm:px-6 sm:pt-6">
            {/* Glass: two solid side walls, a shallow radius at the base and an
                inner shadow where the sweets meet it. A hairline outline read
                as a white box, and sweets bouncing off nothing read as a bug. */}
            <div className="relative mx-auto h-full max-w-[21rem] rounded-b-[1.3rem] border-x-2 border-b-2 border-[#e2c19a] bg-gradient-to-b from-white/80 to-[#fdf2e4] shadow-[inset_0_-16px_26px_-20px_rgba(90,45,20,0.5)]">
              <Jar counts={counts} animate={!reduced} />
              {/* the reflection down one wall, which is the cheapest thing that
                  says "glass" rather than "panel" */}
              <span
                aria-hidden
                className="pointer-events-none absolute top-4 bottom-6 left-2.5 w-1.5 rounded-full bg-gradient-to-b from-white/90 to-white/10"
              />
            </div>
          </div>

          <div className="relative flex items-center justify-between gap-4 border-t border-[#f0dcc6] px-5 py-3 text-[11px] tracking-[0.18em] text-[#6b4a44] uppercase">
            {/* Swapped in CSS rather than from useReducedMotion. The server
                has no media query, so rendering this from JS makes the first
                client render disagree with the HTML it is hydrating. */}
            <span className="motion-reduce:hidden">Drag a sweet · throw it</span>
            <span className="hidden motion-reduce:inline">Motion reduced · pile placed</span>
            <span>
              {order.pieces} / {MAX_PIECES}
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.16, ease }}
          className="flex flex-col gap-3"
        >
          <ul className="flex flex-col gap-2.5">
            {FLAVOURS.map((flavour, i) => (
              <li
                key={flavour.id}
                className="flex items-center gap-3 rounded-2xl border border-[#eedcc8] bg-white px-3 py-2 sm:gap-4 sm:px-4"
              >
                <span
                  aria-hidden
                  className="h-8 w-8 shrink-0 rounded-full shadow-[inset_-3px_-4px_8px_rgba(0,0,0,0.16),inset_3px_3px_6px_rgba(255,255,255,0.5)]"
                  style={{ background: flavour.colour }}
                />

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{flavour.name}</span>
                  <span className="block truncate text-xs text-[#8a6154]">{flavour.note}</span>
                </span>

                <span className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => change(i, -1)}
                    disabled={counts[i] === 0}
                    aria-label={`One less ${flavour.name}`}
                    className="grid h-11 w-11 place-items-center rounded-full border border-[#e3cdb6] text-[#5c3630] transition-colors hover:bg-[#fdf0e2] disabled:opacity-35 disabled:hover:bg-transparent"
                  >
                    <Minus className="h-4 w-4" />
                  </button>

                  {/* tabular figures, so the row does not jitter as the count
                      crosses from one digit to two */}
                  <output
                    aria-label={`${flavour.name} in bag`}
                    className="w-8 text-center text-base font-bold tabular-nums"
                  >
                    {counts[i]}
                  </output>

                  <button
                    type="button"
                    onClick={() => change(i, 1)}
                    disabled={full}
                    aria-label={`One more ${flavour.name}`}
                    className="grid h-11 w-11 place-items-center rounded-full bg-[#2b1216] text-white transition-transform hover:bg-[#43201f] active:scale-90 disabled:opacity-35"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </span>
              </li>
            ))}
          </ul>

          {/* ── the bag ── */}
          <div className="rounded-2xl border border-[#2b1216]/12 bg-[#2b1216] p-5 text-[#ffeede] sm:p-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[11px] tracking-[0.28em] text-[#e2b7a6] uppercase">Your bag</p>
                <p className="mt-2 text-3xl font-extrabold tabular-nums">
                  ฿{order.total}
                </p>
              </div>
              <p className="text-right text-xs leading-relaxed text-[#e2b7a6]">
                {order.pieces} sweets · {order.grams} g
                <br />
                {order.bags === 1 ? "one bag" : `${order.bags} bags`} · ฿{order.unitPrice} each
              </p>
            </div>

            {/* How full the paper bag is. A progress bar that measures a real
                quantity, rather than the usual one that measures nothing. */}
            <div className="mt-4">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/15">
                <div
                  className="h-full rounded-full bg-[#f6b73c] transition-[width] duration-300"
                  style={{ width: `${order.lastBagFill * 100}%` }}
                />
              </div>
              <p className="mt-2 text-[11px] text-[#c79b8b]">
                {order.pieces === 0
                  ? `A bag holds ${BAG_GRAMS} g - about ${Math.floor(BAG_GRAMS / GRAMS_EACH)} sweets.`
                  : order.pieces < BULK_FROM
                    ? `${BULK_FROM - order.pieces} more and every sweet drops to ฿${BULK_PRICE}.`
                    : `Bulk price applied - ฿${order.saved} off.`}
              </p>
            </div>

            <div className="mt-5 flex items-center gap-2">
              <Link
                href="/#contact"
                className="flex-1 rounded-full bg-[#ff85a8] px-5 py-3 text-center text-sm font-bold text-[#2b1216] transition-colors hover:bg-[#ff9db8]"
              >
                Checkout
              </Link>
              <button
                type="button"
                onClick={() => setCounts(FLAVOURS.map(() => 0))}
                disabled={order.pieces === 0}
                aria-label="Empty the bag"
                className="grid h-12 w-12 place-items-center rounded-full border border-white/25 text-[#ffeede] transition-colors hover:bg-white/10 disabled:opacity-35 disabled:hover:bg-transparent"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>

            {/* Announced rather than shown: sighted visitors read the numbers
                above, and a screen reader gets the same change without having
                to hunt for what moved. */}
            <p aria-live="polite" className="sr-only">
              {order.pieces} sweets in the bag, {order.grams} grams, {order.total} baht.
            </p>
          </div>
        </motion.div>
      </section>

      {/* ── what the template actually is ── */}
      <section className="border-t border-[#f0dcc6] bg-[#fffaf3]">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
          <h2 className="max-w-xl text-2xl font-extrabold tracking-tight text-balance sm:text-3xl">
            Everything here is doing arithmetic, not acting.
          </h2>

          <div className="mt-10 grid gap-x-8 gap-y-9 sm:grid-cols-3">
            {[
              {
                head: "The jar is the cart",
                body: `Each sweet in the pile is one line of the order. Remove one and it leaves; the count, the weight and the price were all derived from the same array.`,
              },
              {
                head: "A solver, not a video",
                body: `Circle collisions, restitution and rolling friction, about two hundred lines of it. The loop sleeps once the pile stops moving, so a jar sitting on screen costs nothing.`,
              },
              {
                head: "Buttons first",
                body: `Dragging is the toy. The shop runs on plus and minus, works on a keyboard, and lays the pile out without motion for anyone who asked for less of it.`,
              },
            ].map((block) => (
              <div key={block.head}>
                <h3 className="text-sm font-bold tracking-tight">{block.head}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-[#6b4a44]">{block.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-14 flex flex-col items-start gap-5 rounded-[26px] border border-[#e8d3bd] bg-white p-7 sm:flex-row sm:items-center sm:justify-between sm:p-9">
            <div>
              <h3 className="text-xl font-extrabold tracking-tight text-balance sm:text-2xl">
                Want your shop to feel like this?
              </h3>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-[#6b4a44]">
                Swap the flavours for your products and the arithmetic still
                holds. Good for anything sold by the piece, the scoop or the
                bag.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2.5">
              <Link
                href="/pricing"
                className="rounded-full bg-[#2b1216] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[#43201f]"
              >
                See prices
              </Link>
              <Link
                href="/#contact"
                className="rounded-full border border-[#dcc3a9] px-6 py-3 text-sm font-bold transition-colors hover:bg-[#fdf0e2]"
              >
                Ask for a quote
              </Link>
            </div>
          </div>

          {/* room for the floating lab switcher to sit over nothing important */}
          <p className="mt-14 pb-16 text-xs text-[#7d6152]">
            A fictional shop, built as a style study. The sweets, the flavours
            and the prices are invented; the physics and the pricing rules are
            real.
          </p>
        </div>
      </section>
    </main>
  );
}
