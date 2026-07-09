import { chromium } from "playwright";
import { readFileSync } from "node:fs";

const svg = readFileSync("web/src/app/icon.svg", "utf8").replace(
  "<svg ",
  '<svg width="512" height="512" '
);

const browser = await chromium.launch();
const page = await (
  await browser.newContext({ viewport: { width: 512, height: 512 } })
).newPage();
await page.setContent(`<body style="margin:0">${svg}</body>`);
await page.screenshot({ path: "avatar-512.png", omitBackground: true });
await browser.close();
console.log("done");
