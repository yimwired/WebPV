"use client";

import { useMemo, useState } from "react";
import Image from "next/image";

import { COMMISSION_MID, INCLUDED, ROOMS } from "./rooms";
import {
  addDays,
  availability,
  baht,
  commissionLabel,
  formatThaiDate,
  isHighSeason,
  roomsOpenOn,
  nightsBetween,
  THAI_MONTHS,
  today,
} from "./stay";

/** How far ahead the calendar runs. A small house does not take bookings further. */
const HORIZON = 45;

const WEEKDAYS = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

export function LoomDemo() {
  // Resolved once per mount rather than per render: every night in the
  // calendar is an offset from this, and a date that moved mid-session would
  // renumber the whole grid underneath the guest.
  const [start] = useState(() => today());

  const [checkInOffset, setCheckInOffset] = useState(7);
  const [nights, setNights] = useState(2);

  const checkIn = useMemo(
    () => addDays(start, checkInOffset),
    [start, checkInOffset],
  );
  const checkOut = useMemo(() => addDays(checkIn, nights), [checkIn, nights]);
  const stay = useMemo(
    () => availability(ROOMS, checkIn, nights, start),
    [checkIn, nights, start],
  );

  const totalSaved = stay.free.reduce(
    (most, quote) => Math.max(most, quote.saved),
    0,
  );

  // The grid starts on the Sunday of the week today falls in, so the columns
  // line up with the weekday headings rather than starting mid-week.
  const gridStart = addDays(start, -start.getDay());
  const cells = Array.from(
    { length: Math.ceil((HORIZON + start.getDay()) / 7) * 7 },
    (_, i) => addDays(gridStart, i),
  );

  return (
    <main className="min-h-dvh bg-[#f4ece0] pb-28 text-[#332a22]">
      <section className="relative isolate">
        <div className="absolute inset-0 -z-10">
          <Image
            src="/lab-demos/loom/common-room.webp"
            alt="ห้องนั่งเล่นรวมของบ้าน ผนังไม้ แสงบ่าย"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-[#2c211a]/55" />
        </div>

        <div className="mx-auto max-w-4xl px-5 py-24 text-center sm:py-32">
          {/* the arch: the one shape this style is built on */}
          <div
            aria-hidden
            className="mx-auto mb-7 h-16 w-11 border-2 border-[#e8d9c3]/70"
            style={{ borderRadius: "999px 999px 0 0", borderBottom: "none" }}
          />
          <h1 className="text-[clamp(2.2rem,7vw,3.6rem)] leading-[1.35] font-medium text-[#f7efe3]">
            บ้านทอฝ้าย
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-[15px] leading-relaxed text-[#eadfcd]">
            สามห้องนอน ห่างตัวเมืองหนึ่งชั่วโมง เจ้าของอยู่ที่บ้านทุกวัน
            จองตรงกับเราได้ที่หน้านี้ ไม่ต้องผ่านใคร
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-5xl space-y-12 px-5 py-12 sm:py-16">
        <section>
          <header className="mb-5">
            <h2 className="text-2xl font-medium">เลือกคืนที่อยากมา</h2>
            <p className="mt-1.5 text-[14px] text-[#6b5b4a]">
              ตัวเลขใต้วันที่คือจำนวนห้องที่ยังว่างคืนนั้น กดเลือกวันเข้าพัก
              แล้วเลื่อนจำนวนคืนด้านล่าง
            </p>
          </header>

          <div className="grid gap-7 md:grid-cols-[minmax(0,1fr)_280px]">
            <div className="rounded-2xl border border-[#d8c6ae] bg-[#fbf6ee] p-4">
              <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-[#8a7862]">
                {WEEKDAYS.map((day) => (
                  <span key={day}>{day}</span>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {cells.map((date) => {
                  const offset = nightsBetween(start, date);
                  const past = offset < 0;
                  const beyond = offset >= HORIZON;
                  const openRooms =
                    past || beyond ? 0 : roomsOpenOn(ROOMS, date, start);
                  const open = openRooms > 0;
                  const last = openRooms === 1;
                  const chosen =
                    offset >= checkInOffset && offset < checkInOffset + nights;
                  const firstOfMonth = date.getDate() === 1;

                  if (past || beyond) {
                    return (
                      <span
                        key={offset}
                        aria-hidden
                        className="aspect-square"
                      />
                    );
                  }

                  return (
                    <button
                      key={offset}
                      type="button"
                      disabled={!open}
                      onClick={() => setCheckInOffset(offset)}
                      aria-pressed={chosen}
                      aria-label={`${date.getDate()} ${THAI_MONTHS[date.getMonth()]} ${
                        open ? `ว่าง ${openRooms} ห้อง` : "เต็มทั้งบ้าน"
                      }`}
                      className={`relative aspect-square rounded-lg text-[13px] transition-colors ${
                        chosen
                          ? "bg-[#a8492a] font-medium text-[#fbf6ee]"
                          : !open
                            ? "cursor-not-allowed bg-[#f4ece0] text-[#c3b5a2] line-through"
                            : last
                              ? "bg-[#f0dcc2] text-[#4a3d31] ring-1 ring-[#c98b4b] ring-inset hover:bg-[#e8cfab]"
                              : "bg-[#e3d2ba] text-[#4a3d31] hover:bg-[#d8c2a3]"
                      }`}
                    >
                      {date.getDate()}
                      {/* the month label sits inside its own cell: hung above
                          it, it landed on the square in the row before, which
                          belongs to the month it is announcing the end of */}
                      {firstOfMonth && (
                        <span
                          className={`absolute inset-x-0 top-0.5 text-[9px] leading-none ${
                            chosen ? "text-[#f0d9c8]" : "text-[#a8492a]"
                          }`}
                        >
                          {THAI_MONTHS[date.getMonth()]}
                        </span>
                      )}
                      {open && (
                        <span
                          aria-hidden
                          className={`absolute inset-x-0 bottom-0.5 text-[9px] ${
                            chosen
                              ? "text-[#f0d9c8]"
                              : last
                                ? "text-[#a8492a]"
                                : "text-[#8a7862]"
                          }`}
                        >
                          {openRooms} ห้อง
                        </span>
                      )}
                      {isHighSeason(date) && !chosen && open && (
                        <span
                          aria-hidden
                          className="absolute top-1 right-1 h-1 w-1 rounded-full bg-[#a8492a]/60"
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[#8a7862]">
                <span className="flex items-center gap-1.5">
                  <span
                    aria-hidden
                    className="h-1.5 w-1.5 rounded-full bg-[#a8492a]/60"
                  />
                  จุดมุมขวา = ไฮซีซั่น ราคาสูงกว่า
                </span>
                <span className="flex items-center gap-1.5">
                  <span
                    aria-hidden
                    className="h-2.5 w-2.5 rounded-sm bg-[#f0dcc2] ring-1 ring-[#c98b4b] ring-inset"
                  />
                  เหลือห้องเดียว
                </span>
                <span>ขีดฆ่า = เต็มทั้งบ้าน</span>
              </p>
            </div>

            <div className="space-y-4">
              <label className="block rounded-2xl border border-[#d8c6ae] bg-[#fbf6ee] p-4">
                <span className="mb-2 block text-[14px] font-medium">
                  กี่คืน
                  <span className="ml-2 font-normal text-[#6b5b4a]">
                    {nights} คืน
                  </span>
                </span>
                <input
                  type="range"
                  min={1}
                  max={7}
                  value={nights}
                  onChange={(event) => setNights(Number(event.target.value))}
                  className="w-full accent-[#a8492a]"
                  aria-label="จำนวนคืนที่เข้าพัก"
                />
              </label>

              <div className="rounded-2xl border border-[#d8c6ae] bg-[#fbf6ee] p-4 text-[14px]">
                <p className="text-[#6b5b4a]">เข้าพัก</p>
                <p className="text-lg font-medium">
                  {formatThaiDate(checkIn)} ถึง {formatThaiDate(checkOut)}
                </p>
                <p className="mt-2 text-[13px] text-[#6b5b4a]">
                  ว่าง {stay.free.length} ห้อง จากทั้งหมด {ROOMS.length} ห้อง
                </p>
              </div>

              {totalSaved > 0 && (
                <p className="rounded-2xl bg-[#2f5d3f] p-4 text-[14px] leading-relaxed text-[#eaf3ec]">
                  จองตรงกับบ้าน ประหยัดได้ถึง{" "}
                  <span className="text-lg font-medium">
                    {baht(totalSaved)} บาท
                  </span>{" "}
                  สำหรับ {nights} คืนนี้ เทียบกับราคาเดียวกันบนแอปจอง
                </p>
              )}
            </div>
          </div>
        </section>

        {stay.free.length > 0 && (
          <section>
            <h2 className="mb-5 text-2xl font-medium">ห้องที่ว่างคืนนั้น</h2>
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {stay.free.map(({ room, direct, agent, saved, highNights }) => (
                <li
                  key={room.id}
                  className="overflow-hidden rounded-2xl border border-[#d8c6ae] bg-[#fbf6ee]"
                >
                  <div className="relative aspect-[4/3]">
                    <Image
                      src={room.photo}
                      alt={room.name}
                      fill
                      sizes="(min-width: 1024px) 340px, (min-width: 640px) 45vw, 90vw"
                      className="object-cover"
                    />
                  </div>

                  <div className="p-4">
                    <h3 className="text-lg font-medium">{room.name}</h3>
                    <p className="mt-1 text-[13px] leading-relaxed text-[#6b5b4a]">
                      {room.character}
                    </p>
                    <p className="mt-2 text-[12px] text-[#8a7862]">
                      นอน {room.sleeps} คน · {room.area} ตร.ม. · {room.bed}
                    </p>

                    <dl className="mt-4 space-y-1 border-t border-[#e3d5c0] pt-3 text-[14px]">
                      <div className="flex items-baseline justify-between">
                        <dt className="text-[#6b5b4a]">จองตรง {nights} คืน</dt>
                        <dd className="text-lg font-medium">
                          {baht(direct)} บาท
                        </dd>
                      </div>
                      <div className="flex items-baseline justify-between text-[13px] text-[#8a7862]">
                        <dt>ราคาเดียวกันบนแอปจอง</dt>
                        <dd className="line-through">{baht(agent)} บาท</dd>
                      </div>
                    </dl>

                    <p className="mt-3 rounded-lg bg-[#e8f0e9] px-3 py-2 text-[13px] font-medium text-[#2f5d3f]">
                      ประหยัด {baht(saved)} บาท
                    </p>

                    {highNights > 0 && (
                      <p className="mt-2 text-[12px] text-[#8a7862]">
                        {highNights === nights
                          ? "ทุกคืนอยู่ในช่วงไฮซีซั่น"
                          : `${highNights} คืนอยู่ในช่วงไฮซีซั่น`}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {stay.taken.length > 0 && (
          <section>
            <h2 className="mb-4 text-xl font-medium">
              ห้องที่ไม่ว่าง {stay.taken.length} ห้อง
            </h2>
            <ul className="space-y-2">
              {stay.taken.map(({ room, firstClash }) => (
                <li
                  key={room.id}
                  className="flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-xl border border-[#e0d0b8] bg-[#f8f1e6] px-4 py-3 text-[14px]"
                >
                  <span className="font-medium">{room.name}</span>
                  <span className="text-[#8a7862]">
                    มีคนจองคืนวันที่ {formatThaiDate(firstClash)} ไว้แล้ว
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {stay.free.length === 0 && (
          <p className="rounded-2xl border border-[#d8c6ae] bg-[#fbf6ee] p-5 text-[15px] leading-relaxed">
            คืนที่เลือกไว้เต็มทั้งสามห้อง ลองลดจำนวนคืนลง
            หรือเลื่อนวันเข้าพักไปอีกสองสามวัน
            ปฏิทินด้านบนบอกไว้แล้วว่าคืนไหนยังว่าง
          </p>
        )}

        <section className="rounded-2xl border border-[#d8c6ae] bg-[#fbf6ee] p-6">
          <h2 className="text-xl font-medium">รวมอยู่ในราคาแล้ว ไม่คิดเพิ่ม</h2>
          <ul className="mt-4 grid gap-2 text-[14px] sm:grid-cols-2">
            {INCLUDED.map((item) => (
              <li key={item} className="flex gap-2">
                <span aria-hidden className="text-[#a8492a]">
                  ·
                </span>
                {item}
              </li>
            ))}
          </ul>

          <p className="mt-5 border-t border-[#e3d5c0] pt-4 text-[13px] leading-relaxed text-[#6b5b4a]">
            ราคาบนแอปจองสูงกว่าเพราะต้องบวกค่าคอมมิชชั่น {commissionLabel}{" "}
            ที่แอปเก็บจากเจ้าของ เราจึงตั้งราคาตรงไว้เท่าที่บ้านต้องได้จริง
            ส่วนต่างที่เห็นคือเงินที่เคยเข้ากระเป๋าแอป ตอนนี้อยู่ในกระเป๋าคุณ
            ที่หน้านี้คิดที่ {Math.round(COMMISSION_MID * 100)}%
            ซึ่งเป็นกลางของช่วง
          </p>
        </section>

        <p className="text-center text-[12px] text-[#8a7862]">
          ที่พักสมมติสำหรับศึกษางานออกแบบ ห้อง ราคา และคิวจองไม่มีอยู่จริง
        </p>
      </div>
    </main>
  );
}
