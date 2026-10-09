import type { Colourway } from "./colourways";
import type { Bounds } from "./plant";
import { FIELD_MM, MACHINE, PRICE, type Quote } from "./stitches";

interface QuotePanelProps {
  estimate: Quote | null;
  box: Bounds;
  emMm: number;
  colourway: Colourway;
}

const count = (n: number) => n.toLocaleString("th-TH");
const baht = (n: number) => `${n.toLocaleString("th-TH")} บาท`;

/**
 * The working label for the design on screen. Every figure on it is computed
 * from the outlines that are drawn, so a longer name or one more rose moves
 * the count, and the lines always add up to the total under them.
 */
export function QuotePanel({ estimate, box, emMm, colourway }: QuotePanelProps) {
  const width = Math.round((box.maxX - box.minX) * emMm);
  const height = Math.round((box.maxY - box.minY) * emMm);
  const c = colourway.colors;
  const threads = [
    { colour: c.ink, label: "ตัวอักษร" },
    { colour: c.vine, label: "เถากับใบ" },
    { colour: c.rose, label: "ดอก" },
    { colour: c.roseLine, label: "เส้นกลีบ" },
  ].slice(0, estimate?.colours ?? 4);

  const rows = estimate
    ? [
        { label: "ตัวอักษร", how: "ปักแบบ satin", stitches: estimate.letters },
        { label: "เถา", how: "ฝีเย็บสามทบ", stitches: estimate.vines },
        { label: "ใบไม้", how: "ปักถม", stitches: estimate.leaves },
        { label: "กุหลาบกับดอกตูม", how: "ปักถมและเดินเส้นกลีบ", stitches: estimate.roses },
      ]
    : [];

  return (
    <section
      aria-labelledby="hoop-quote"
      className="rounded-2xl border p-5 sm:p-7"
      style={{ background: "var(--hoop-panel)", borderColor: "var(--hoop-line)" }}
    >
      <h2 id="hoop-quote" className="text-xl font-semibold sm:text-2xl">
        ลายนี้ปักกี่ฝี
      </h2>
      <p className="mt-1.5 text-[14px] leading-relaxed" style={{ color: "var(--hoop-muted)" }}>
        นับจากลายที่อยู่บนจอตอนนี้ พิมพ์เพิ่มหรือลบแล้วตัวเลขเปลี่ยนตาม
      </p>

      {estimate ? (
        <>
          <dl className="mt-6 text-[15px]">
            {rows.map((row) => (
              <div
                key={row.label}
                className="flex items-baseline justify-between gap-4 border-b py-2.5"
                style={{ borderColor: "var(--hoop-line)" }}
              >
                <dt className="min-w-0">
                  {row.label}
                  <span className="ml-2 text-[13px]" style={{ color: "var(--hoop-muted)" }}>
                    {row.how}
                  </span>
                </dt>
                <dd className="shrink-0 tabular-nums" data-hoop-stitches={row.label}>
                  {count(row.stitches)}
                </dd>
              </div>
            ))}
            <div className="flex items-baseline justify-between gap-4 pt-3.5">
              <dt className="font-semibold">รวม</dt>
              <dd className="text-2xl font-semibold tabular-nums sm:text-3xl" data-hoop-total>
                {count(estimate.total)} <span className="text-base font-normal">ฝี</span>
              </dd>
            </div>
          </dl>

          <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 text-[14px]">
            <div>
              <dt style={{ color: "var(--hoop-muted)" }}>ขนาดลาย</dt>
              <dd className="mt-0.5 tabular-nums" data-hoop-size>
                {width} × {height} มม.
                <span className="block text-[12px]" style={{ color: "var(--hoop-muted)" }}>
                  จากพื้นที่ปัก {FIELD_MM.width} × {FIELD_MM.height} มม.
                </span>
              </dd>
            </div>
            <div>
              <dt style={{ color: "var(--hoop-muted)" }}>ด้าย</dt>
              <dd className="mt-1 flex items-center gap-1.5" data-hoop-colours={estimate.colours}>
                {threads.map((thread) => (
                  <span
                    key={thread.label}
                    title={thread.label}
                    className="h-4 w-4 rounded-full"
                    style={{ background: thread.colour, boxShadow: "inset 0 0 0 1px var(--hoop-line)" }}
                  />
                ))}
                <span className="ml-1 tabular-nums">{estimate.colours} สี</span>
              </dd>
            </div>
            <div>
              <dt style={{ color: "var(--hoop-muted)" }}>เวลาบนจักร</dt>
              <dd className="mt-0.5 tabular-nums" data-hoop-minutes>
                ราว {estimate.minutes} นาที
              </dd>
            </div>
            <div>
              <dt style={{ color: "var(--hoop-muted)" }}>ค่าปัก</dt>
              <dd className="mt-0.5 tabular-nums" data-hoop-embroidery>
                {baht(estimate.embroideryBaht)}
              </dd>
            </div>
          </dl>

          <div
            className="mt-6 flex items-baseline justify-between gap-4 rounded-xl px-4 py-3.5"
            style={{ background: "var(--hoop-fabric)" }}
          >
            <span className="text-[14px]">
              รวมถุงผ้า {baht(PRICE.bag)}
            </span>
            <span className="text-2xl font-semibold tabular-nums" data-hoop-price>
              {baht(estimate.totalBaht)}
            </span>
          </div>

          <p className="mt-4 text-[13px] leading-relaxed" style={{ color: "var(--hoop-muted)" }}>
            นับเฉพาะฝีที่เห็นบนผ้า ไฟล์ปักจริงจะมีฝีรองพื้นเพิ่มเข้ามาอีก ร้านแจ้งยอดสุดท้ายตอนส่งไฟล์ให้ดูก่อนปัก
            จักรเดิน {count(MACHINE.stitchesPerMinute)} ฝีต่อนาที เปลี่ยนด้ายสีละครึ่งนาที
          </p>
        </>
      ) : (
        <p className="mt-6 text-[14px]" style={{ color: "var(--hoop-muted)" }}>
          กำลังวัดตัวอักษร
        </p>
      )}
    </section>
  );
}
