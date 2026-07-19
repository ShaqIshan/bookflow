// Walks through every screen of the built app with system Chrome and
// saves screenshots to scripts/shots/ for visual verification.
// Usage: npx http-server out -p 4173 & node scripts/verify-screens.mjs
import { chromium } from "playwright";
import { mkdirSync } from "fs";

const BASE = "http://localhost:4173";
const OUT = "scripts/shots";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: "chrome", headless: true });

async function shot(page, name, fullPage = true) {
  await page.waitForTimeout(600); // let fonts/icons settle
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage });
  console.log("shot:", name);
}

// ── Mobile walkthrough ─────────────────────────────────────
const mobile = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
});
const page = await mobile.newPage();
page.on("pageerror", (e) => console.log("PAGE ERROR:", e.message));
page.on("console", (m) => {
  if (m.type() === "error") console.log("CONSOLE ERROR:", m.text());
});

await page.goto(BASE + "/", { waitUntil: "networkidle" });
await shot(page, "01-onboarding-step1");

await page.getByRole("button", { name: "Continue" }).click();
await page.getByPlaceholder(/Snap Moments/).fill("Danish Photobooth Co");
await page.getByPlaceholder("e.g. Danish").fill("Danish");
await shot(page, "02-onboarding-step2");

await page.getByRole("button", { name: /Let's go/ }).click();
await page.waitForURL("**/home/**");
await page.waitForLoadState("networkidle");
await shot(page, "03-home");

// Add flow: paste → parse → review → save
await page.goto(BASE + "/add/", { waitUntil: "networkidle" });
await shot(page, "04-add-paste");
await page.getByRole("button", { name: "Try an example" }).click();
await shot(page, "05-add-paste-filled", false);
await page.getByRole("button", { name: "Turn it into a booking" }).click();
await shot(page, "06-add-review");
await page.getByRole("button", { name: "Confirm & Save" }).click();
await shot(page, "07-add-saved");

await page.goto(BASE + "/bookings/", { waitUntil: "networkidle" });
await shot(page, "08-bookings");

// Open a booking detail
await page.getByText("Aisha & Faiz Wedding").first().click();
await shot(page, "09-booking-detail", false);
await page.keyboard.press("Escape");

await page.goto(BASE + "/calendar/", { waitUntil: "networkidle" });
await shot(page, "10-calendar");

await page.goto(BASE + "/money/", { waitUntil: "networkidle" });
await shot(page, "11-money");

await mobile.close();

// ── Desktop spot-check ─────────────────────────────────────
const desktop = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const dpage = await desktop.newPage();
await dpage.goto(BASE + "/", { waitUntil: "networkidle" });
// complete onboarding quickly (fresh context = fresh localStorage)
await dpage.getByRole("button", { name: "Continue" }).click();
await dpage.getByRole("button", { name: /Let's go/ }).click();
await dpage.waitForURL("**/home/**");
await dpage.waitForLoadState("networkidle");
await shot(dpage, "12-desktop-home", false);
await dpage.goto(BASE + "/calendar/", { waitUntil: "networkidle" });
await shot(dpage, "13-desktop-calendar", false);
await desktop.close();

await browser.close();
console.log("done");
