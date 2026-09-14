"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { LAYERS, type Track } from "./data";
import { GlassSurface, toneFor, useSupportsSvgBackdrop, type LayerState } from "./glass-surface";
import { ONCE, reveal, revealTransition, stagger } from "./motion";
import { monoStyle, PAGE, sansStyle } from "./theme";

interface LayersSectionProps {
  track: Track;
  layers: LayerState;
  onToggle: (id: keyof LayerState) => void;
  onSetAll: (on: boolean) => void;
}

const allOn = (layers: LayerState) => Object.values(layers).every(Boolean);
const allOff = (layers: LayerState) => Object.values(layers).every((v) => !v);

/**
 * The part that makes this a lab rather than a mockup.
 *
 * Each of the four layers can be switched off against a live panel, so the
 * claim "this is not just backdrop-blur" is something a visitor checks instead
 * of something the page asserts. With all four off, what is left on screen is
 * exactly the frosted panel the rest of the web ships.
 */
export function LayersSection({ track, layers, onToggle, onSetAll }: LayersSectionProps) {
  const supportsSvg = useSupportsSvgBackdrop();
  const tone = toneFor(track.bandLuma, layers);

  return (
    <section
      id="layers"
      className="scroll-mt-16 px-5 py-24 sm:px-8 lg:px-12"
      style={{ background: PAGE.bg }}
    >
      <div className="mx-auto max-w-6xl">
        <motion.div
          variants={stagger(0.08)}
          initial="hidden"
          whileInView="shown"
          viewport={ONCE}
          className="max-w-2xl"
          style={sansStyle}
        >
          <motion.p
            variants={reveal}
            transition={revealTransition}
            className="text-xs font-semibold uppercase tracking-[0.2em]"
            style={{ color: PAGE.accent }}
          >
            สี่ชั้นที่ประกอบกันเป็นแก้ว
          </motion.p>
          <motion.h2
            variants={reveal}
            transition={revealTransition}
            className="mt-3 text-[clamp(1.9rem,5vw,3rem)] font-semibold leading-tight"
            style={{ color: PAGE.text }}
          >
            ปิดทีละชั้น แล้วดูว่าหายอะไรไป
          </motion.h2>
          <motion.p
            variants={reveal}
            transition={revealTransition}
            className="mt-4 text-base leading-relaxed"
            style={{ color: PAGE.muted }}
          >
            ปิดครบสี่ชั้นเมื่อไหร่ สิ่งที่เหลือคือ backdrop-blur กับสีทึบ ซึ่งเป็นแผ่นฝ้าที่เว็บทั่วไปใช้กัน
            ความต่างอยู่ตรงนี้ ไม่ใช่ตรงคำโฆษณา
          </motion.p>
        </motion.div>

        <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_0.95fr] lg:items-start">
          <div>
            <div className="flex flex-wrap gap-2" style={sansStyle}>
              <button
                type="button"
                onClick={() => onSetAll(true)}
                disabled={allOn(layers)}
                className="h-10 rounded-full border px-4 text-sm font-medium transition-opacity disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{ borderColor: PAGE.line, color: PAGE.text, outlineColor: PAGE.accent }}
              >
                เปิดทุกชั้น
              </button>
              <button
                type="button"
                onClick={() => onSetAll(false)}
                disabled={allOff(layers)}
                className="h-10 rounded-full border px-4 text-sm font-medium transition-opacity disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{ borderColor: PAGE.line, color: PAGE.text, outlineColor: PAGE.accent }}
              >
                ปิดทุกชั้น
              </button>
            </div>

            <ul className="mt-5 space-y-3">
              {LAYERS.map((layer) => {
                const on = layers[layer.id];
                const unavailable = !supportsSvg && (layer.id === "refraction" || layer.id === "chromatic");

                return (
                  <li
                    key={layer.id}
                    className="rounded-2xl border p-4"
                    style={{ borderColor: PAGE.line, ...sansStyle }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h3 className="text-base font-semibold" style={{ color: PAGE.text }}>
                          {layer.name}
                        </h3>
                        <p className="mt-1 text-sm leading-relaxed" style={{ color: PAGE.muted }}>
                          {on ? layer.claim : layer.without}
                        </p>
                        {unavailable && (
                          <p className="mt-2 text-xs leading-relaxed" style={{ color: PAGE.accent }}>
                            เบราว์เซอร์นี้รัน SVG filter เป็น backdrop ไม่ได้ ชั้นนี้เลยไม่มีผล
                            หน้านี้ใช้ทางสำรองอยู่
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        role="switch"
                        aria-checked={on}
                        aria-label={layer.name}
                        onClick={() => onToggle(layer.id)}
                        className="relative h-7 w-12 shrink-0 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
                        style={{
                          background: on ? PAGE.accent : "rgba(255,255,255,0.16)",
                          outlineColor: PAGE.accent,
                        }}
                      >
                        <span
                          className="absolute top-1 h-5 w-5 rounded-full transition-[left]"
                          style={{ left: on ? 26 : 4, background: on ? "#08090c" : "#f4f5f7" }}
                        />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* A live sheet over the same photograph, so the toggles have
              something to act on without scrolling back to the hero. */}
          <div className="relative overflow-hidden rounded-[1.75rem]">
            <Image
              src={track.image}
              alt=""
              width={900}
              height={700}
              className="h-[380px] w-full object-cover sm:h-[460px]"
            />
            <div className="absolute inset-0 grid place-items-center p-6">
              <GlassSurface
                luma={track.bandLuma}
                layers={layers}
                radius={24}
                className="w-full max-w-sm p-6"
              >
                <p
                  className="text-xs font-semibold uppercase tracking-[0.18em]"
                  style={{ ...sansStyle, color: tone.muted }}
                >
                  ตัวอย่างสด
                </p>
                <p
                  className="mt-2 text-xl font-semibold leading-snug"
                  style={{ ...sansStyle, color: tone.text }}
                >
                  ตัวหนังสือนี้ต้องอ่านออกทุกเพลง
                </p>
                <p
                  className="mt-3 text-sm leading-relaxed"
                  style={{ ...sansStyle, color: tone.muted }}
                >
                  {track.note}
                </p>
                <p className="mt-4 text-xs" style={{ ...monoStyle, color: tone.muted }}>
                  luma {track.bandLuma} · โหมด {layers.adaptive ? "อัตโนมัติ" : "ล็อกไว้ที่สว่าง"}
                </p>
              </GlassSurface>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
