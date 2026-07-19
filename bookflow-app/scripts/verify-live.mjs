import { chromium } from "playwright";
const URL = process.argv[2];
const browser = await chromium.launch({ channel: "chrome", headless: true });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();
page.on("pageerror", (e) => console.log("PAGE ERROR:", e.message));
const bad = [];
page.on("response", (r) => { if (r.status() >= 400) bad.push(`${r.status()} ${r.url()}`); });
await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 60000 });
const interstitial = page.getByRole("link", { name: "Open the page" });
if (await interstitial.count()) {
  await interstitial.click();
} else {
  const btn = page.getByRole("button", { name: "Open the page" });
  if (await btn.count()) await btn.click();
}
await page.waitForLoadState("networkidle");
await page.waitForTimeout(1500);
await page.screenshot({ path: "scripts/shots/live-01-onboarding.png" });
await page.getByRole("button", { name: "Continue" }).click();
await page.getByRole("button", { name: /Let's go/ }).click();
await page.waitForTimeout(2500);
await page.screenshot({ path: "scripts/shots/live-02-home.png" });
console.log("url now:", page.url());
console.log("bad responses:", bad.length ? bad.slice(0, 5) : "none");
await browser.close();
console.log("LIVE VERIFY OK");
