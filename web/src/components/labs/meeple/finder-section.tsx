"use client";

import { useId, useMemo, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { PixelPanel, Sprite } from "./pixel";
import { CROSS, COVERS, SHELVED, TICK } from "./sprites";
import { ONCE, reveal, revealTransition, stagger } from "./motion";
import { EXPERIENCE, GAMES, PARTY_SIZES, TIME_BUDGETS, type Weight } from "./data";
import { findGames, type Verdict } from "./finder";
import { ACCENT, COLOR, UNIT, dither, pixelBevel, pixelFrame, thaiStyle } from "./theme";

const WEIGHTS: Weight[] = ["เบา", "กลาง", "หนัก"];

interface Option {
  value: string;
  label: string;
}

interface OptionGroupProps {
  legend: string;
  hint?: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  accent: { value: string; on: string };
}

/**
 * One question. Real radios, visually hidden, with the pixel button as their
 * label: arrow keys move between the answers the way they do in every other
 * form, which a row of `aria-pressed` buttons would have thrown away. The
 * button is the label element, so the hidden input is 1x1 and never shows up as
 * an undersized target.
 */
function OptionGroup({ legend, hint, options, value, onChange, accent }: OptionGroupProps) {
  const name = useId();

  return (
    <fieldset>
      <legend className="text-base font-bold" style={{ color: COLOR.ink }}>
        {legend}
      </legend>

      <div className="mt-3 flex flex-wrap gap-3">
        {options.map((option) => {
          const active = option.value === value;
          return (
            <label key={option.value} className="mpl-opt">
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={active}
                onChange={() => onChange(option.value)}
                className="sr-only"
              />
              <span
                className="mpl-press h-11 min-w-11 px-4 text-base font-bold"
                style={{
                  background: active ? accent.value : COLOR.panel,
                  color: active ? accent.on : COLOR.ink,
                  boxShadow: `${pixelFrame(COLOR.ink)}, ${pixelBevel(active)}`,
                  ...(active ? { transform: `translate(${UNIT / 2}px, ${UNIT / 2}px)` } : null),
                }}
              >
                {option.label}
              </span>
            </label>
          );
        })}
      </div>

      {hint && (
        <p className="mt-3 text-sm" style={{ color: COLOR.inkMuted }}>
          {hint}
        </p>
      )}
    </fieldset>
  );
}

function WeightMeter({ weight, tone }: { weight: Weight; tone: string }) {
  const level = WEIGHTS.indexOf(weight) + 1;
  return (
    <span className="inline-flex items-center gap-1 align-middle" aria-hidden>
      {[0, 1, 2].map((step) => (
        <span
          key={step}
          style={{
            width: UNIT * 2,
            height: UNIT * 2,
            background: step < level ? tone : "transparent",
            boxShadow: `inset 0 0 0 ${UNIT / 2}px ${tone}`,
          }}
        />
      ))}
    </span>
  );
}

function Stat({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm font-medium" style={{ color: COLOR.inkMuted }}>
      {children}
    </span>
  );
}

function GameCard({ verdict }: { verdict: Verdict }) {
  const { game, fits, misses } = verdict;

  return (
    <motion.li variants={reveal} transition={revealTransition} data-game={game.id} data-fits={fits ? "yes" : "no"}>
      <PixelPanel
        background={fits ? COLOR.panel : COLOR.paperDeep}
        className="flex h-full flex-col gap-4 p-5"
        style={thaiStyle}
      >
        <div className="flex items-start gap-4">
          <span className="shrink-0" style={{ boxShadow: pixelFrame(COLOR.ink), lineHeight: 0 }}>
            <Sprite map={COVERS[game.id]} scale={4} palette={fits ? undefined : SHELVED} />
          </span>

          <div className="min-w-0">
            <h3 className="text-xl font-bold leading-tight" style={{ color: COLOR.ink }}>
              {game.name}
            </h3>
            <p className="mt-1 text-sm" style={{ color: COLOR.inkMuted }}>
              {game.genre}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
              <Stat>
                {game.minPlayers === game.maxPlayers
                  ? `${game.minPlayers} คน`
                  : `${game.minPlayers} - ${game.maxPlayers} คน`}
              </Stat>
              <Stat>{game.minutes} นาที</Stat>
              <Stat>
                <WeightMeter weight={game.weight} tone={COLOR.inkMuted} />
                {game.weight}
              </Stat>
            </div>
          </div>
        </div>

        <p className="text-sm leading-relaxed" style={{ color: COLOR.inkMuted }}>
          {game.pitch}
        </p>

        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-2 pt-1">
          {fits ? (
            <span
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-bold"
              style={{ background: ACCENT.jade.value, color: ACCENT.jade.on }}
            >
              <Sprite map={TICK} scale={1} palette={{ "0": ACCENT.jade.on }} />
              เล่นได้ สอน {game.teach} นาที
            </span>
          ) : (
            misses.map((miss) => (
              <span
                key={miss.condition}
                data-miss={miss.condition}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium"
                style={{ background: COLOR.panel, color: COLOR.ink, boxShadow: pixelFrame(COLOR.ink) }}
              >
                <Sprite map={CROSS} scale={1} palette={{ "0": ACCENT.tomato.deep, "3": ACCENT.tomato.deep }} />
                {miss.reason}
              </span>
            ))
          )}
        </div>
      </PixelPanel>
    </motion.li>
  );
}

/**
 * The finder and the shelf, in one component because they are one answer. A
 * results list somewhere else would let the page claim a match without showing
 * what it rejected, and the rejections are the useful half: a group that sees
 * why the box they were holding is out will change the answer that matters
 * instead of walking away.
 */
export function FinderSection() {
  const [players, setPlayers] = useState(4);
  const [timeId, setTimeId] = useState("60");
  const [levelId, setLevelId] = useState("some");

  const budget = TIME_BUDGETS.find((t) => t.id === timeId) ?? TIME_BUDGETS[1];
  const level = EXPERIENCE.find((e) => e.id === levelId) ?? EXPERIENCE[1];

  const result = useMemo(
    () => findGames(GAMES, { players, minutes: budget.minutes, weights: level.weights }),
    [players, budget.minutes, level.weights],
  );

  return (
    <>
      <section
        id="finder"
        className="scroll-mt-24"
        style={{ background: COLOR.paperDeep, ...dither("rgba(36, 31, 49, 0.06)") }}
      >
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20" style={thaiStyle}>
          <motion.div initial="hidden" whileInView="shown" viewport={ONCE} variants={stagger(0.07)}>
            <motion.p
              variants={reveal}
              transition={revealTransition}
              className="text-sm font-bold"
              style={{ color: ACCENT.tomato.deep }}
            >
              ถามสามข้อ เท่าที่พนักงานถาม
            </motion.p>
            <motion.h2
              variants={reveal}
              transition={revealTransition}
              className="mt-3 text-[clamp(1.9rem,5vw,2.75rem)] font-bold leading-tight"
              style={{ color: COLOR.ink }}
            >
              เล่นอะไรดี
            </motion.h2>
            <motion.p
              variants={reveal}
              transition={revealTransition}
              className="mt-4 max-w-xl text-base leading-relaxed"
              style={{ color: COLOR.inkMuted }}
            >
              ตอบแล้วชั้นข้างล่างจะแยกให้ทันที กล่องไหนเล่นไม่ได้ก็ยังอยู่บนชั้น
              แต่จะบอกว่าติดข้อไหน
            </motion.p>

            <motion.div variants={reveal} transition={revealTransition}>
              <PixelPanel className="mt-8 flex flex-col gap-7 p-6 sm:p-8">
                <OptionGroup
                  legend="มากี่คน"
                  options={PARTY_SIZES.map((n) => ({
                    value: String(n),
                    label: n === 8 ? "8+" : String(n),
                  }))}
                  value={String(players)}
                  onChange={(value) => setPlayers(Number(value))}
                  accent={ACCENT.tomato}
                />
                <OptionGroup
                  legend="มีเวลาเท่าไหร่"
                  options={TIME_BUDGETS.map((t) => ({ value: t.id, label: t.label }))}
                  value={timeId}
                  onChange={setTimeId}
                  accent={ACCENT.blue}
                />
                <OptionGroup
                  legend="เคยเล่นบอร์ดเกมมาก่อนไหม"
                  hint={level.note}
                  options={EXPERIENCE.map((e) => ({ value: e.id, label: e.label }))}
                  value={levelId}
                  onChange={setLevelId}
                  accent={ACCENT.jade}
                />
              </PixelPanel>
            </motion.div>
          </motion.div>

          {/* The answer. Two shapes, because "nothing fits" is a real outcome
              here and a count of zero is not an answer anybody can act on. */}
          <div className="mt-8" data-result>
            {result.matches.length > 0 ? (
              <PixelPanel
                background={ACCENT.jade.value}
                className="flex flex-wrap items-center gap-3 px-6 py-5"
                style={thaiStyle}
              >
                <Sprite map={TICK} scale={2} palette={{ "0": ACCENT.jade.on }} />
                <p className="text-lg font-bold" style={{ color: ACCENT.jade.on }}>
                  <span data-match-count>{result.matches.length}</span> กล่องบนชั้นเล่นได้เลย
                </p>
                <p className="text-base" style={{ color: ACCENT.jade.on }}>
                  เริ่มที่ {result.matches[0].name} ก็ได้ สอนจบใน {result.matches[0].teach} นาที
                </p>
              </PixelPanel>
            ) : (
              <PixelPanel background={ACCENT.gold.value} className="px-6 py-5" style={thaiStyle}>
                <p className="text-lg font-bold" style={{ color: ACCENT.gold.on }}>
                  <span data-match-count>0</span> กล่องที่ตรงทั้งสามข้อ
                </p>
                {result.advice && (
                  <p className="mt-2 max-w-2xl text-base leading-relaxed" style={{ color: ACCENT.gold.on }}>
                    ผ่อนเรื่อง{result.advice.label}ข้อเดียว จะมีอีก {result.advice.count} กล่องที่เล่นได้
                    ใกล้ที่สุดคือ {result.advice.closest.name} ใช้เวลา {result.advice.closest.minutes} นาที
                    เล่น {result.advice.closest.minPlayers} ถึง {result.advice.closest.maxPlayers} คน
                  </p>
                )}
                <p className="mt-2 text-base" style={{ color: ACCENT.gold.on }}>
                  หรือเดินมาถามที่เคาน์เตอร์ก็ได้ เรารู้ว่ากล่องไหนเพิ่งว่าง
                </p>
              </PixelPanel>
            )}
          </div>
        </div>
      </section>

      <section id="shelf" className="scroll-mt-24" style={{ background: COLOR.paper }}>
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20" style={thaiStyle}>
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="text-[clamp(1.9rem,5vw,2.75rem)] font-bold" style={{ color: COLOR.ink }}>
              ชั้นเกม
            </h2>
            <p className="text-base" style={{ color: COLOR.inkMuted }}>
              โชว์ {GAMES.length} กล่องจาก 200 กล่องที่ร้านมี
            </p>
          </div>

          <motion.ul
            initial="hidden"
            whileInView="shown"
            viewport={ONCE}
            variants={stagger(0.04)}
            className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3"
          >
            {result.verdicts.map((verdict) => (
              <GameCard key={verdict.game.id} verdict={verdict} />
            ))}
          </motion.ul>
        </div>
      </section>
    </>
  );
}
