// Exercise the contact form without sending anything real: the Formspree
// endpoint is intercepted so the success and the failure path can both be
// seen, and an incomplete form is sent first to check the form's own messages
// (the browser's validation bubble is switched off with noValidate).
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

// Headless reports prefers-reduced-transparency: reduce, which would show the
// messages and the toast in their solid fallback. Look at the glass instead.
const cdp = await ctx.newCDPSession(page);
await cdp.send("Emulation.setEmulatedMedia", {
  features: [{ name: "prefers-reduced-transparency", value: "no-preference" }],
});

let failed = 0;
const check = (label, ok, detail = "") => {
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${label}${detail ? ` (${detail})` : ""}`);
};

const fields = "#contact input[name=name], #contact input[name=email], #contact textarea[name=message]";
const submitButton = () => page.getByRole("button", { name: /send message/i });

// ── An incomplete form: nothing is sent, every problem is said where it is ──
{
  let posted = 0;
  await page.route("https://formspree.io/**", (route) => {
    posted++;
    return route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
  });
  await page.goto(`${BASE}/#contact`, { waitUntil: "load", timeout: 60000 });
  await page.waitForTimeout(1200);

  await submitButton().click();
  await page.waitForTimeout(500);

  const state = await page.$$eval(fields, (els) =>
    els.map((el) => {
      const describedBy = el.getAttribute("aria-describedby");
      const message = describedBy ? document.getElementById(describedBy)?.textContent?.trim() : "";
      return { name: el.getAttribute("name"), invalid: el.getAttribute("aria-invalid"), message };
    }),
  );
  const focused = await page.evaluate(() => document.activeElement?.getAttribute("name"));
  check("empty form sends nothing", posted === 0, `${posted} requests`);
  check("all three fields marked invalid", state.every((f) => f.invalid === "true"), state.map((f) => `${f.name}=${f.invalid}`).join(" "));
  check("each field describes its own problem", state.every((f) => f.message), state.map((f) => `${f.name}: "${f.message}"`).join(" | "));
  check("focus moves to the first problem", focused === "name", `focus on ${focused}`);
  check("no browser bubble: the form is noValidate", await page.$eval("#contact form", (f) => f.noValidate));
  await page.locator("#contact").screenshot({ path: `${OUT}/incomplete.png` });

  await page.locator("#contact input[name=name]").fill("Somchai T.");
  await page.locator("#contact input[name=email]").fill("somchai@example");
  await page.waitForTimeout(300);
  const after = await page.$$eval(fields, (els) =>
    Object.fromEntries(
      els.map((el) => {
        const id = el.getAttribute("aria-describedby");
        return [el.getAttribute("name"), id ? document.getElementById(id)?.textContent?.trim() : null];
      }),
    ),
  );
  check("a fixed field drops its message while typing", after.name === null, `name: ${after.name}`);
  check("a malformed email says so", Boolean(after.email) && after.email !== state[1].message, `email: "${after.email}"`);
  await page.unroute("https://formspree.io/**");
}

// ── Sent, for real as far as the page knows ──
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
  await submitButton().click();
  await page.waitForTimeout(1200);

  const note = (await page.locator("form p[aria-live]").innerText()).trim();
  const toast = page.getByRole("button", { name: /dismiss/i });
  const toastShown = await toast.isVisible();
  await page.screenshot({ path: `${OUT}/${label}.png` });
  console.log(`${label} (HTTP ${status}) → "${note}"`);
  check(`${label}: a glass toast says the same thing`, toastShown);
  if (toastShown) {
    await toast.click();
    await page.waitForTimeout(500);
    check(`${label}: the toast can be dismissed`, !(await toast.isVisible()));
  }
  await page.unroute("https://formspree.io/**");
};

await submit("success", 200);
await submit("failure", 500);

// copy-email button
await page.getByRole("button", { name: /copy email/i }).click();
await page.waitForTimeout(400);
const clip = await page.evaluate(() => navigator.clipboard.readText());
console.log(`clipboard → "${clip}"`);

// Thai pass, form labels and messages included
await page.getByRole("switch").first().click();
await page.waitForTimeout(700);
await submitButton().or(page.getByRole("button", { name: /ส่งข้อความ/ })).first().click();
await page.waitForTimeout(500);
await page.locator("#contact").screenshot({ path: `${OUT}/thai.png` });

await ctx.close();
await browser.close();
console.log(failed ? `done, ${failed} failed` : "done, all checks passed");
process.exitCode = failed ? 1 : 0;
