// /labs/paste: the page exists because a printed invitation cannot answer
// "which table am I on". Check that the name box actually answers it, including
// the case that really happens, which is a name that is not on the list.
//
//   SHOOT_URL=http://localhost:3000 node web/scripts/shoot-paste.mjs
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.SHOOT_URL || "http://127.0.0.1:3000";
const OUT = process.env.AUDIT_OUT || "web/screenshots";
mkdirSync(OUT, { recursive: true });

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass });
  console.log(`${pass ? "ok  " : "FAIL"} ${name}${detail ? ` - ${detail}` : ""}`);
};

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 950 },
  reducedMotion: "no-preference",
});
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => m.type() === "error" && errors.push(m.text().slice(0, 160)));

await page.goto(`${BASE}/labs/paste`, { waitUntil: "load" });
await page.waitForTimeout(900);
await page.locator("#seat").scrollIntoViewIfNeeded();
await page.waitForTimeout(600);

const box = page.getByLabel("ค้นชื่อเพื่อดูโต๊ะที่นั่ง");
const panel = page.locator("#seat");

const type = async (text) => {
  await box.fill(text);
  await page.waitForTimeout(500);
};

// ── the search answers the question ────────────────────────────────────────
{
  check("nothing is claimed before anyone types", (await panel.innerText()).includes("เช่น") || !(await panel.innerText()).includes("โต๊ะ 3"));

  await type("แนน");
  let text = await panel.innerText();
  check(
    "a nickname finds the guest, the table and the side",
    text.includes("โต๊ะ 3") && text.includes("พี่แนน") && text.includes("เจ้าสาว"),
    text.replace(/\s+/g, " ").slice(0, 50)
  );

  await type("นันทิชา");
  text = await panel.innerText();
  check("the same guest is found by full name", text.includes("โต๊ะ 3"), "โต๊ะ 3");

  await type("ก้อ");
  text = await panel.innerText();
  check("a partial name is enough", text.includes("โต๊ะ 7"), "โต๊ะ 7");

  await type("สมชาย");
  text = await panel.innerText();
  check(
    "a family booking shows how many seats are held",
    text.includes("โต๊ะ 1") && text.includes("4 ที่"),
    "โต๊ะ 1 / 4 ที่"
  );
}

// ── the case that actually happens ─────────────────────────────────────────
{
  await type("สมศรี");
  const text = await panel.innerText();
  check(
    "a name that is not on the list gets a real answer, not a shrug",
    text.includes("ยังไม่เจอชื่อนี้") && text.includes("LINE"),
    text.replace(/\s+/g, " ").slice(0, 46)
  );

  await type("ก");
  check(
    "one character does not fire a search",
    !(await panel.innerText()).includes("ยังไม่เจอชื่อนี้"),
    "still showing the suggestions"
  );
}

// ── the suggestion chips run the search ────────────────────────────────────
{
  await box.fill("");
  await page.waitForTimeout(400);
  // only the first four guests are offered as chips
  await panel.getByRole("button", { name: "พลอย กับ เอิร์ธ" }).click();
  await page.waitForTimeout(500);
  check(
    "pressing a suggested name searches it",
    (await panel.innerText()).includes("โต๊ะ 5"),
    "โต๊ะ 5"
  );
}

// ── the photographs are actually taped down at angles ──────────────────────
{
  const tilts = await page.locator("main figure").evaluateAll((els) =>
    els.map((el) => {
      const m = new DOMMatrixReadOnly(getComputedStyle(el).transform);
      return Math.round(Math.atan2(m.b, m.a) * (180 / Math.PI) * 10) / 10;
    })
  );
  check(
    "no photograph is straight, and they do not all lean the same way",
    tilts.length >= 4 &&
      tilts.every((t) => Math.abs(t) > 0.5) &&
      tilts.some((t) => t > 0) &&
      tilts.some((t) => t < 0),
    tilts.join(", ")
  );
}

const real = errors.filter((e) => !/Failed to load resource/.test(e));
check("no console errors", real.length === 0, real.slice(0, 2).join(" | "));

await page.screenshot({ path: `${OUT}/paste-seat.png` });
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(600);
await page.screenshot({ path: `${OUT}/paste-hero.png` });
await ctx.close();

{
  const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
  const small = await phone.newPage();
  await small.goto(`${BASE}/labs/paste`, { waitUntil: "load" });
  await small.waitForTimeout(900);
  const overflow = await small.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  check("no sideways scroll on a phone", overflow <= 0, `${overflow}px`);
  await small.screenshot({ path: `${OUT}/paste-phone.png` });
  await phone.close();
}

await browser.close();

const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
if (failed.length) process.exitCode = 1;
