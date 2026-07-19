# BookFlow

**Bookings without the busywork.** Paste a raw WhatsApp enquiry → BookFlow
auto-parses it into a structured booking (client · date/time · service · price ·
deposit · venue) that you just check and save.

Built for small service businesses — launching with **Photo Booth & Events**,
with the generic booking engine underneath ready for barbers, aircon services,
tuition, rentals and more via business-type templates.

## Stack

- **Next.js 16 + React 19 + TypeScript** — the framework most corporate sites run on
- **Tailwind CSS v4** — design tokens from `DESIGN.md` ("Editorial Utility": warm
  paper, deep emerald, amber, coral; Space Grotesk + Inter)
- **Zustand** with localStorage persistence — every booking stays on the user's
  device; no backend, nothing to secure or pay for while validating
- **Static export + PWA** — builds to a plain `out/` folder; installable to the
  phone home screen (manifest + service worker + offline cache)

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # parser unit tests (vitest)
npm run build      # static site in out/
```

## Deploy (pick one)

1. **Netlify Drop (fastest):** `npm run build`, then drag the `out/` folder onto
   https://app.netlify.com/drop — done.
2. **Netlify from git:** point the site at this repo, set *Base directory* to
   `bookflow-app`. `netlify.toml` handles the rest.
3. **Vercel:** import the repo, set root directory to `bookflow-app`. Static
   output is auto-detected.

## What's inside

| Screen | Route | Notes |
| --- | --- | --- |
| Onboarding | `/` | Business-type picker + workspace name + optional sample data or Google Sheets paste-import |
| Home | `/home` | Month revenue / bookings / still-owed, today + coming up |
| Add booking | `/add` | **The hero:** paste → auto-parse → review (auto-detected fields tagged) → save → WhatsApp confirmation |
| Bookings | `/bookings` | Search, filters (upcoming / pending deposit / past), detail sheet with payments, reminders, invoice copy, edit, delete |
| Calendar | `/calendar` | Month grid with confirmed/pending dots + day agenda |
| Money | `/money` | Revenue, net after costs, deposit chasing with one-tap WhatsApp reminders, 6-month chart, editable cost rates |

The WhatsApp parser (`src/lib/parser.ts`) understands mixed English/Malay
enquiries — `26hb Ogos`, `8 malam`, `deposit rm300`, `next friday`, `+60`
phone formats — and is covered by unit tests (`src/lib/parser.test.ts`).

## Useful scripts

- `node scripts/verify-screens.mjs` — walks every screen in headless Chrome and
  saves screenshots to `scripts/shots/` (needs `npx http-server out -p 4173`)
- `node scripts/generate-icons.mjs` — regenerates PNG app icons from the brand SVG
- `scripts/postexport.mjs` — runs automatically after `next build`; flattens RSC
  prefetch payloads so client-side navigation works on static hosts

## Later (already scoped, not in the prototype)

- Native app-store wrapper via Capacitor (same codebase)
- Real Google Sheets sync, e-invoicing (Malaysia mandate, July 2026 tailwind)
- Multi-device sync — needs an account system + hosted DB (e.g. Supabase)
