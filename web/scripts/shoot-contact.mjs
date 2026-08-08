// Exercise the contact form without sending anything real: the Formspree
// endpoint is intercepted so both the success and the failure path can be seen.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.SHOOT_URL || "http://localhost:3000";
const OUT = "web/screenshots/contact";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  locale: "en-US",
  permissions: ["clipboard-read", "clipboard-write"],
});
const page = await ctx.newPage();
page.on("pageerror", (e) => console.log(`[pageerror] ${e.message}`));

const submit = async (label, status) => {
  await page.route("https://formspree.io/**", (route) =>
    route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify(status === 200 ? { ok: true } : { error: "nope" }),
    })
  );

  await page.goto(`${BASE}/#contact`, { waitUntil: "load", timeout: 60000 });
  await page.waitForTimeout(1200);
  await page.getByLabel("Name").fill("Somchai T.");
  await page.getByLabel("Email").fill("somchai@example.com");
  await page.getByLabel("Message").fill("Need a landing page for my shop.");
  await page.getByRole("button", { name: /send message/i }).click();
  await page.waitForTimeout(1200);

  const note = (await page.locator("form p[aria-live]").innerText()).trim();
  await page.locator("#contact").screenshot({ path: `${OUT}/${label}.png` });
  console.log(`${label} (HTTP ${status}) → "${note}"`);
  await page.unroute("https://formspree.io/**");
};

await submit("success", 200);
await submit("failure", 500);

// copy-email button
await page.getByRole("button", { name: /copy email/i }).click();
await page.waitForTimeout(400);
const clip = await page.evaluate(() => navigator.clipboard.readText());
console.log(`clipboard → "${clip}"`);

// Thai pass, form labels included
await page.getByRole("switch").first().click();
await page.waitForTimeout(700);
await page.locator("#contact").screenshot({ path: `${OUT}/thai.png` });

await ctx.close();
await browser.close();
console.log("done");
