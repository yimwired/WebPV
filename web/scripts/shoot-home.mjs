// Checks the home page's Lab stage, the pinned showcase between the hero and
// the work grid. It is driven by scroll position, so most of what can go wrong
// with it only shows while the page is moving:
//
//   - the stage pins under the navbar for the whole of its track, and lets go
//     at the end instead of sliding over the next section
//   - scrolling down the track walks the rail from the first lab to the last,
//     with exactly one tab selected and the picture, name and link agreeing
//   - a click on the rail, the arrow keys, Home and End all land on the lab
//     asked for, and the scroll handler does not drag it back afterwards
//   - the panel is one link: pressing the picture opens the demo it shows
//   - the stage fits a short laptop screen with its text still on screen
//   - phones and tablets get the swipe rail instead, with no sideways scroll
//   - Thai visitors read who each lab is for in Thai
//
// Run from the repo root against a served build:
//   SHOOT_URL=http://127.0.0.1:8788 node web/scripts/shoot-home.mjs

import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.SHOOT_URL ?? "http://127.0.0.1:8788";
const OUT = "web/screenshots/home";
mkdirSync(OUT, { recursive: true });

const failures = [];
function check(ok, message) {
  console.log(`${ok ? "  ok  " : "  FAIL"} ${message}`);
  if (!ok) failures.push(message);
}

const browser = await chromium.launch();

// Everything the stage shows about itself, read off the DOM in one go.
async function readStage(page) {
  return page.evaluate(() => {
    const tabs = [...document.querySelectorAll('#lab [role="tab"]')];
    const selected = tabs.filter((tab) => tab.getAttribute("aria-selected") === "true");
    const panel = document.querySelector('#lab [role="tabpanel"]');
    const sticky = panel?.closest(".sticky");
    const shown = [...(panel?.querySelectorAll("img") ?? [])].filter(
      (img) => getComputedStyle(img).opacity === "1",
    );
    const link = [...(panel?.querySelectorAll("a") ?? [])].find(
      (a) => a.getAttribute("aria-hidden") !== "true",
    );
    const panelBox = panel?.getBoundingClientRect();
    return {
      tabCount: tabs.length,
      selectedCount: selected.length,
      index: tabs.indexOf(selected[0]),
      name: panel?.querySelector("h3")?.textContent ?? null,
      tabName: selected[0]?.textContent?.replace(/^\d+/, "") ?? null,
      shownImages: shown.map((img) => img.getAttribute("src")),
      href: link?.getAttribute("href") ?? null,
      stickyTop: sticky ? Math.round(sticky.getBoundingClientRect().top) : null,
      panelBottom: panelBox ? Math.round(panelBox.bottom) : null,
      focusedIndex: tabs.indexOf(document.activeElement),
    };
  });
}

async function scrollToTrack(page, fraction) {
  await page.evaluate((f) => {
    const sticky = document.querySelector('#lab [role="tabpanel"]')?.closest(".sticky");
    const track = sticky?.parentElement;
    if (!track) return;
    const start = track.getBoundingClientRect().top + window.scrollY - 80;
    const range = track.offsetHeight - window.innerHeight + 80;
    window.scrollTo({ top: start + f * range, behavior: "instant" });
  }, fraction);
  await page.waitForTimeout(450);
}

// ── Desktop: the stage ──────────────────────────────────────────────────────
for (const locale of ["en-US", "th-TH"]) {
  const tag = locale.slice(0, 2);
  console.log(`\ndesktop 1440x900, ${tag}`);
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale,
    reducedMotion: "no-preference",
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error" && !m.text().includes("net::ERR_ABORTED")) errors.push(m.text());
  });
  await page.goto(`${BASE}/`, { waitUntil: "load" });
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/${tag}-1440-hero.png` });

  const first = await readStage(page);
  check(first.tabCount >= 2, `rail has a tab per lab (${first.tabCount})`);
  check(first.selectedCount === 1 && first.index === 0, "first lab selected before any scrolling");

  // Walk the track and record what the stage shows at each step.
  const seen = [];
  let pinnedEverywhere = true;
  let agrees = true;
  for (let step = 0; step <= 40; step += 1) {
    await scrollToTrack(page, step / 40);
    const s = await readStage(page);
    if (step > 0 && step < 40 && s.stickyTop !== 80) pinnedEverywhere = false;
    const slug = s.href?.split("/").pop();
    const imageOk = s.shownImages.length === 1 && s.shownImages[0]?.includes(`/labs/cards/${slug}.webp`);
    if (s.selectedCount !== 1 || s.name !== s.tabName || !imageOk) agrees = false;
    if (seen.at(-1) !== s.index) seen.push(s.index);
    if ([2, 20, 39].includes(step)) {
      await page.screenshot({ path: `${OUT}/${tag}-1440-stage-${String(step).padStart(2, "0")}.png` });
    }
  }
  const ascending = seen.every((value, i) => i === 0 || value === seen[i - 1] + 1);
  check(pinnedEverywhere, "stage stays pinned 80px from the top across its whole track");
  check(
    seen[0] === 0 && seen.at(-1) === first.tabCount - 1 && ascending,
    `scrolling walks the rail in order, first to last (${seen.join(",")})`,
  );
  check(agrees, "selected tab, heading, picture and link always name the same lab");

  // Past the end the stage should let go and scroll away with the page.
  await scrollToTrack(page, 1.25);
  const after = await readStage(page);
  check(after.stickyTop !== null && after.stickyTop < 80, `stage scrolls away after its track (top ${after.stickyTop})`);
  await page.screenshot({ path: `${OUT}/${tag}-1440-after.png` });

  // Rail: click, arrows, Home, End. Each one must still hold after the scroll
  // it causes has been handled.
  await scrollToTrack(page, 0.02);
  await page.locator('#lab [role="tab"]').nth(6).click();
  await page.waitForTimeout(450);
  let s = await readStage(page);
  check(s.index === 6, `click on the seventh tab selects it (got ${s.index})`);

  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  await page.waitForTimeout(450);
  s = await readStage(page);
  check(s.index === 8 && s.focusedIndex === 8, `ArrowDown twice moves selection and focus to 9th (got ${s.index}/${s.focusedIndex})`);

  await page.keyboard.press("End");
  await page.waitForTimeout(450);
  s = await readStage(page);
  check(s.index === s.tabCount - 1, `End selects the last lab (got ${s.index})`);

  await page.keyboard.press("Home");
  await page.waitForTimeout(450);
  s = await readStage(page);
  check(s.index === 0 && s.stickyTop === 80, `Home selects the first lab and keeps the stage pinned (got ${s.index}, top ${s.stickyTop})`);

  // The picture is part of the one link, so pressing it opens the demo shown.
  // A click by coordinates, the way a visitor presses it: the link's ::after
  // covers the frame on purpose, so a locator click on the frame would refuse.
  const box = await page.locator('#lab [role="tabpanel"] .aspect-\\[16\\/10\\]').boundingBox();
  const expected = (await readStage(page)).href;
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForURL((url) => url.pathname === expected, { timeout: 8000 }).catch(() => {});
  check(new URL(page.url()).pathname === expected, `pressing the picture opens ${expected} (at ${new URL(page.url()).pathname})`);
  await page.goBack({ waitUntil: "load" });

  // The Thai copy for who a lab suits.
  if (tag === "th") {
    const bestFor = await page.evaluate(
      () => document.querySelector('#lab [role="tabpanel"] p.max-w-xl')?.textContent ?? "",
    );
    check(/[฀-๿]/.test(bestFor), `Thai visitors get the Thai best-for line ("${bestFor.slice(0, 40)}")`);
  }

  check(errors.length === 0, `no console errors${errors.length ? `: ${errors[0]}` : ""}`);
  await context.close();
}

// ── Short laptop screen: everything in the stage has to fit ─────────────────
{
  console.log("\nshort laptop 1366x650");
  const page = await browser.newPage({ viewport: { width: 1366, height: 650 } });
  await page.goto(`${BASE}/`, { waitUntil: "load" });
  await scrollToTrack(page, 0.5);
  const s = await readStage(page);
  check(s.panelBottom !== null && s.panelBottom <= 650, `panel ends on screen (bottom ${s.panelBottom} of 650)`);
  await page.screenshot({ path: `${OUT}/en-1366x650-stage.png` });
  await page.close();
}

// ── Narrower than lg: the rail, not the stage ───────────────────────────────
for (const [width, height] of [[390, 844], [768, 1024]]) {
  console.log(`\n${width}x${height}`);
  const context = await browser.newContext({
    viewport: { width, height },
    locale: "th-TH",
    isMobile: width < 600,
    hasTouch: width < 600,
  });
  const page = await context.newPage();
  await page.goto(`${BASE}/`, { waitUntil: "load" });
  await page.evaluate(() => document.getElementById("lab")?.scrollIntoView({ block: "start" }));
  await page.waitForTimeout(600);
  const state = await page.evaluate(() => ({
    stageShown: Boolean(document.querySelector('#lab [role="tablist"]')?.offsetParent),
    railShown: Boolean(document.querySelector("#lab ul")?.offsetParent),
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    railText: document.querySelector("#lab ul li p:last-child")?.textContent ?? "",
  }));
  check(!state.stageShown && state.railShown, "stage hidden, swipe rail shown");
  check(state.overflow === 0, `no sideways scroll (${state.overflow}px)`);
  check(/[฀-๿]/.test(state.railText), `rail cards say who they suit in Thai ("${state.railText.slice(0, 30)}")`);
  await page.screenshot({ path: `${OUT}/th-${width}-rail.png` });
  await context.close();
}

await browser.close();
console.log(failures.length ? `\n${failures.length} failed` : "\nall passed");
process.exit(failures.length ? 1 : 0);
