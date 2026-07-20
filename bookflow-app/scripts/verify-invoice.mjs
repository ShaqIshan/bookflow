import { chromium } from "playwright";
const BASE = "http://localhost:4174";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
page.on("pageerror", (e) => console.log("PAGE ERROR:", e.message));
page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") console.log("CONSOLE:", m.type(), m.text()); });

// onboarding
await page.goto(BASE + "/", { waitUntil: "networkidle" });
await page.getByRole("button", { name: "Continue" }).click();
await page.getByPlaceholder(/Snap Moments/).fill("Danish Photobooth Co");
await page.getByRole("button", { name: /Let's go/ }).click();
await page.waitForURL("**/home/**");

// Add screen footer check (viewport shot, scrolled to bottom)
await page.goto(BASE + "/add/", { waitUntil: "networkidle" });
await page.getByRole("button", { name: "Try an example" }).click();
await page.getByRole("button", { name: "Turn it into a booking" }).click();
await page.waitForTimeout(600);
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await page.waitForTimeout(400);
await page.screenshot({ path: "scripts/shots/v2-add-footer.png" });

// Booking detail: invoice flow
await page.goto(BASE + "/bookings/", { waitUntil: "networkidle" });
await page.getByText("Aisha & Faiz Wedding").first().click();
await page.waitForTimeout(500);
await page.screenshot({ path: "scripts/shots/v2-detail.png" });
await page.getByRole("button", { name: /Invoice PDF/ }).click();
await page.waitForTimeout(600);
await page.screenshot({ path: "scripts/shots/v2-invoice-setup.png" });
await page.getByRole("textbox", { name: "Business phone" }).fill("012-345 6789");
await page.getByRole("textbox", { name: /How clients pay/ }).fill("Maybank 1234 5678 9012 (Danish Photobooth Co) · TnG 012-345 6789");
const dl = page.waitForEvent("download", { timeout: 20000 });
await page.getByRole("button", { name: "Save & create invoice" }).click();
const download = await dl;
console.log("DOWNLOAD:", download.suggestedFilename());
await download.saveAs("scripts/shots/test-invoice.pdf");
await page.waitForTimeout(500);

// Second invoice tap should skip the setup sheet and download directly
const dl2 = page.waitForEvent("download", { timeout: 20000 });
await page.getByRole("button", { name: /Invoice PDF/ }).click();
const download2 = await dl2;
console.log("DOWNLOAD2 (no re-ask):", download2.suggestedFilename());

await browser.close();
console.log("INVOICE VERIFY OK");
