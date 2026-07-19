import { chromium } from "playwright";
const URL = process.argv[2];
const browser = await chromium.launch({ channel: "chrome", headless: true });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();
await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 60000 });
const open = page.locator("text=Open the page").first();
try { await open.click({ timeout: 5000 }); } catch {}
await page.waitForLoadState("networkidle");
await page.getByRole("button", { name: "Continue" }).click({ timeout: 20000 });
await page.getByRole("button", { name: /Let's go/ }).click();
await page.waitForTimeout(2000);
for (const tab of ["Bookings", "Calendar", "Money", "Home"]) {
  await page.getByRole("link", { name: tab }).first().click();
  await page.waitForTimeout(1800);
  const heading = await page.locator("h2").first().textContent().catch(() => "NONE");
  console.log(`${tab} tab -> url ...${page.url().split("/preview")[1]} heading "${heading}"`);
}
await page.getByRole("link", { name: "Add booking" }).click();
await page.waitForTimeout(1500);
console.log("FAB -> heading:", await page.locator("h2").first().textContent());
await page.screenshot({ path: "scripts/shots/live-03-add.png" });
await browser.close();
console.log("NAV VERIFY OK");
