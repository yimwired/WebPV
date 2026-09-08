// Build a quote PDF from the prices already on the site.
//
//   node scripts/make-quote.mjs --init quotes/somchai.json   # เขียนไฟล์เปล่าให้กรอก
//   node scripts/make-quote.mjs quotes/somchai.json          # ได้ PDF ข้างไฟล์นั้น
//
// CLIENT-PLAYBOOK.md §1.4 says a quote goes out as a PDF and never as a chat
// message, and that the "not included" list matters more than the "included"
// one. Typing it by hand each time means the numbers drift from /pricing and
// the exclusions get forgotten - which is the exact thing disputes come from.
//
// Everything but the client's own details is read out of src/lib: the price,
// the intro discount, what the tier includes, how many revision rounds and how
// long it takes. Change a price on the site and the next quote follows.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const WEB = fileURLToPath(new URL("..", import.meta.url));
const SRC = join(WEB, "src");

const args = process.argv.slice(2);
const init = args.includes("--init");
const target = args.find((a) => !a.startsWith("--"));

if (!target) {
  console.error("usage: node scripts/make-quote.mjs [--init] <file.json>");
  process.exit(1);
}

const jsonPath = resolve(process.cwd(), target);

// ── the blank to fill in ─────────────────────────────────────────────────

if (init) {
  const today = new Date().toISOString().slice(0, 10);
  const blank = {
    number: "QT-2026-001",
    date: today,
    client: "ชื่อลูกค้า หรือชื่อร้าน",
    tier: "business",
    intro: true,
    pages: null,
    extras: [],
    excludes: [
      "ค่าโดเมนรายปี ประมาณ 500 บาท จ่ายตามจริงในชื่อลูกค้า",
      "ถ่ายภาพ",
      "ฟอนต์ลิขสิทธิ์",
      "เขียนข้อความยาว",
    ],
    from: "Nuttapon Yimnoi (Film)",
    payTo: "พร้อมเพย์ 0xx-xxx-xxxx",
    validDays: 14,
  };

  await mkdir(dirname(jsonPath), { recursive: true });
  await writeFile(jsonPath, JSON.stringify(blank, null, 2) + "\n", "utf8");
  console.log(`
  เขียนไฟล์เปล่าไว้ที่ ${target}

  กรอกแล้วรัน:  node scripts/make-quote.mjs ${target}

  from: ชื่อที่จะขึ้นบนใบเสนอราคา ใส่ชื่อไทยตามบัตรได้ถ้าลูกค้าเป็นนิติบุคคล
  tier ใส่ได้: quick · starter · business · standard · signature
  intro: true = ใช้ราคาเปิดตัว (เหลือกี่รายดูใน DEALS.md)
  extras: งานนอกแพ็กที่ตกลงเพิ่ม เช่น [{ "label": "เพิ่มหน้าโปรโมชัน", "price": 2500 }]
`);
  process.exit(0);
}

const quote = JSON.parse(await readFile(jsonPath, "utf8"));

// ── read the site's own numbers ──────────────────────────────────────────

const pricingSource = await readFile(join(SRC, "lib", "pricing.ts"), "utf8");

const tierMatch = pricingSource.match(
  new RegExp(`\\{[^}]*id: "${quote.tier}"[^}]*\\}`, "s"),
);
if (!tierMatch) {
  console.error(`ไม่พบ tier "${quote.tier}" ใน pricing.ts`);
  process.exit(1);
}

const price = tierMatch[0].match(/price: "([^"]+)"/)?.[1];
const introPrice = tierMatch[0].match(/introPrice: "([^"]+)"/)?.[1];
const introActive = /introOffer = \{ active: true/.test(pricingSource);

const useIntro = Boolean(quote.intro && introActive && introPrice);
const basePrice = Number((useIntro ? introPrice : price).replace(/,/g, ""));

// The Thai copy is the second half of dictionary.ts - the file declares `const
// en` and then `const th` - so search from where the Thai object starts rather
// than matching the first hit, which would quote the client in English.
const dictSource = await readFile(join(SRC, "lib", "dictionary.ts"), "utf8");
const thaiStart = dictSource.search(/^const th\b/m);
if (thaiStart < 0) {
  console.error("ไม่พบ `const th` ใน dictionary.ts - โครงไฟล์เปลี่ยนไปแล้ว");
  process.exit(1);
}
const tierBlock = dictSource
  .slice(thaiStart)
  .match(new RegExp(`${quote.tier}: \\{[\\s\\S]*?\\n      \\},`));

if (!tierBlock) {
  console.error(`ไม่พบข้อความไทยของ tier "${quote.tier}" ใน dictionary.ts`);
  process.exit(1);
}

const tierName = tierBlock[0].match(/name: "([^"]+)"/)?.[1] ?? quote.tier;
const timeline = tierBlock[0].match(/timeline: "([^"]+)"/)?.[1] ?? "";

// Only what is inside `points: [ ... ]`. Matching every indented string in the
// block swept up the blurb as well, which put a whole marketing paragraph at
// the top of the client's list of deliverables.
const pointsBlock = tierBlock[0].match(/points: \[([\s\S]*?)\]/)?.[1] ?? "";
const points = [...pointsBlock.matchAll(/"([^"]+)"/g)].map((m) => m[1]);

const extras = quote.extras ?? [];
const total = basePrice + extras.reduce((sum, e) => sum + Number(e.price || 0), 0);

// Signature is 40/30/30; everything else is half now, half on launch. Kept in
// step with the terms in the pricing memory and on /pricing itself.
const terms =
  quote.tier === "signature"
    ? "มัดจำ 40% ก่อนเริ่ม · 30% กลางทาง · 30% วันที่เว็บขึ้นจริง"
    : "มัดจำ 50% ก่อนเริ่ม · 50% วันที่เว็บขึ้นจริง";

const baht = (n) => n.toLocaleString("th-TH");

const issued = new Date(quote.date);
const validUntil = new Date(issued);
validUntil.setDate(validUntil.getDate() + (quote.validDays ?? 14));
const thaiDate = (d) =>
  d.toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" });

// ── the document ─────────────────────────────────────────────────────────

const HTML = `<!doctype html>
<html lang="th">
<head>
<meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; }
  body {
    font-family: Sarabun, system-ui, sans-serif;
    color: #1a1a1a;
    margin: 0;
    padding: 22mm 20mm;
    font-size: 10.5pt;
    line-height: 1.65;
  }
  h1 { font-size: 19pt; margin: 0 0 2mm; letter-spacing: -0.01em; }
  h2 { font-size: 11pt; margin: 9mm 0 2.5mm; letter-spacing: 0.06em; color: #777; font-weight: 600; }
  .meta { display: flex; justify-content: space-between; gap: 10mm; color: #555; font-size: 9.5pt; }
  .rule { border-top: 1px solid #ddd; margin: 6mm 0; }
  ul { margin: 0; padding-left: 5mm; }
  li { margin-bottom: 1.2mm; }
  .row { display: flex; justify-content: space-between; gap: 8mm; padding: 1.5mm 0; }
  .total {
    display: flex; justify-content: space-between; align-items: baseline;
    border-top: 2px solid #1a1a1a; margin-top: 3mm; padding-top: 3mm;
  }
  .total strong { font-size: 17pt; }
  .muted { color: #666; }
  .note { background: #f6f4f0; border-radius: 2mm; padding: 4mm 5mm; font-size: 9.5pt; }
  .sign { display: flex; gap: 14mm; margin-top: 14mm; }
  .sign div { flex: 1; border-top: 1px solid #bbb; padding-top: 2mm; font-size: 9pt; color: #777; }
</style>
</head>
<body>

<h1>ใบเสนอราคา</h1>
<div class="meta">
  <div>
    เลขที่ ${quote.number}<br>
    วันที่ ${thaiDate(issued)}
  </div>
  <div style="text-align:right">
    ${quote.from ?? "Nuttapon Yimnoi (Film)"}<br>
    yimwired@gmail.com<br>
    webpv.yimwired.workers.dev
  </div>
</div>

<div class="rule"></div>

<div class="row"><span class="muted">ลูกค้า</span><strong>${quote.client}</strong></div>
<div class="row"><span class="muted">แพ็กเกจ</span><span>${tierName}${quote.pages ? ` · ${quote.pages} หน้า` : ""}</span></div>
<div class="row"><span class="muted">ระยะเวลา</span><span>${timeline} นับจากวันที่มัดจำเข้าและได้ไฟล์ครบ</span></div>

<h2>งานที่รับทำ</h2>
<ul>
${points.map((p) => `  <li>${p}</li>`).join("\n")}
${extras.map((e) => `  <li>${e.label}</li>`).join("\n")}
</ul>

<h2>งานที่ไม่รวมในราคานี้</h2>
<ul>
${(quote.excludes ?? []).map((e) => `  <li>${e}</li>`).join("\n")}
</ul>
<p class="muted" style="font-size:9.5pt">
  อะไรที่ไม่ได้เขียนไว้ในสองรายการข้างบน ถือว่าอยู่นอกใบเสนอราคานี้
  ถ้าอยากเพิ่มระหว่างทาง แจ้งราคาก่อนลงมือทุกครั้ง
</p>

<h2>ราคา</h2>
<div class="row"><span>${tierName}${useIntro ? " (ราคาเปิดตัว)" : ""}</span><span>${baht(basePrice)}</span></div>
${extras.map((e) => `<div class="row"><span>${e.label}</span><span>${baht(Number(e.price))}</span></div>`).join("\n")}
${useIntro ? `<div class="row muted"><span>ราคาปกติ</span><span style="text-decoration:line-through">${price}</span></div>` : ""}
<div class="total"><span>รวมทั้งสิ้น</span><strong>${baht(total)} บาท</strong></div>
<p class="muted" style="font-size:9.5pt; margin-top:2mm">
  ราคานี้เป็นราคาสุทธิ ไม่มีภาษีมูลค่าเพิ่ม เพราะผู้เสนอยังไม่ได้จดทะเบียน
  ถ้าเป็นนิติบุคคลและต้องหักภาษี ณ ที่จ่าย 3% หักได้ตามปกติ
</p>

<h2>งวดจ่าย</h2>
<div class="note">
  ${terms}<br>
  โอนเข้า ${quote.payTo}<br>
  เริ่มงานเมื่อมัดจำเข้าและได้ข้อความกับรูปครบ
</div>

<h2>เงื่อนไข</h2>
<ul>
  <li>โดเมนกับโฮสต์จดในชื่อลูกค้า เป็นของลูกค้าทั้งหมด</li>
  <li>แก้ฟรี 30 วันหลังส่งมอบ หลังจากนั้นคิดชั่วโมงละ 1,200 บาท ขั้นต่ำหนึ่งชั่วโมง</li>
  <li>ยกเลิกกลางทาง มัดจำไม่คืน แต่ได้งานที่ทำไปแล้วทั้งหมด</li>
  <li>ใบเสนอราคานี้ยืนราคาถึง ${thaiDate(validUntil)}</li>
</ul>

<div class="sign">
  <div>ลงชื่อผู้เสนอราคา</div>
  <div>ลงชื่อลูกค้า / วันที่</div>
</div>

</body>
</html>
`;

const pdfPath = jsonPath.replace(/\.json$/, ".pdf");
const htmlPath = jsonPath.replace(/\.json$/, ".html");
await writeFile(htmlPath, HTML, "utf8");

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(`file://${htmlPath.replace(/\\/g, "/")}`, { waitUntil: "networkidle" });
await page.pdf({ path: pdfPath, format: "A4", printBackground: true });
await browser.close();

console.log(`
  ${quote.number} · ${quote.client}
  ${tierName}${useIntro ? " ราคาเปิดตัว" : ""} รวม ${baht(total)} บาท

  ${pdfPath}

  ตรวจก่อนส่ง: ช่อง "งานที่ไม่รวม" ครบไหม เขาเคยเอ่ยถึงอะไรที่ยังไม่ได้เขียน
`);
