# Project Context — BookFlow (Booking & Schedule Manager App)

## Who's involved

- **Shaq** — EPF System Analyst, runs Coys Affluence. Driving this project.
- **Danish** — Shaq's friend, runs a real photo booth & event rental business, uses WhatsApp + Google Sheets today. His real business is the beachhead niche and the source of the original idea.

## The problem

Small service businesses (starting with Danish's photo booth/event rental business) take bookings manually via WhatsApp, then re-type everything into spreadsheets. This breaks down as they grow — lost details, missed deposits, no single source of truth.

## The core idea

**BookFlow** — a booking & schedule manager app where the hero feature is: **paste a raw WhatsApp enquiry → app auto-parses it into a structured booking** (client, date, time, venue, price) that the user just checks and saves. This replaces manual data entry entirely.

## Strategic decisions (confirmed)

- **Not vertical-locked at the product level.** BookFlow is built as a **generic booking engine** (shared spine: client · date/time · service · price · deposit · location · status) that works for any small service business — photo booths, barbers/salons, aircon/home services, tuition, rentals, etc.
- **Phased go-to-market:** launch polished for ONE beachhead vertical — **Photo Booth & Events** (Danish's real business) — then expand to more business-type templates later. Market to one buyer type at a time even though the engine is shared.
- Customization happens via **templates** (business-type presets) + **custom fields** + **Google Sheets import**, not separate apps per industry.
- Visual identity: modern, warm, premium — not generic SaaS blue. Palette: warm paper `#FAF7F2` background, emerald `#0E5C4A` primary accent, amber `#C8871E` for pending/deposit states, coral `#C7503F` for alerts. Space Grotesk (headings) + Inter (body). RM currency, mobile-first.

## Research grounding (web-search validated)

- **RentFlow** (myrentflows.com) — a comparable Malaysia-built booking app, but for car rentals. Proof the model works locally.
- Market pattern: generic scheduling tools (Calendly, Setmore) are cheap but miss vertical-specific workflow needs; vertical tools (Jobber/Housecall Pro for field services, Fresha/Vagaro for beauty — Fresha has 450k+ pros) win deep loyalty by fitting one trade's real workflow.
- Malaysia/SEA context: WhatsApp is the dominant SME channel; local tools bill in RM and integrate Google Sheets (vs. foreign USD-priced tools that ignore Sheets); e-Invoicing becomes mandatory for micro-SMEs in Malaysia from July 2026 (relevant tailwind for an eventual invoicing feature).

## The six-screen app structure

1. **Business type selector / template picker** (or Google Sheets import) — Photo Booth & Events is the default/first template
2. **Home** — light live dashboard: this month's revenue/bookings/still-owed, today's bookings, coming up next
3. **Add Booking** — WhatsApp paste → auto-fill → confirm → save (the star feature; 3 states: paste, parsed preview, saved)
4. **Bookings** — searchable/filterable list, tap to edit, invoice, message
5. **Calendar** — month view with booking dots
6. **Money** — kept light: revenue, net (after costs), still owed, simple cost breakdown, deposit tracker

## Assets produced so far

1. **Stitch AI prompt** (`stitch-booking-app-prompt.md`) — full, detailed prompt for Google Stitch (Gemini thinking model) to generate the six app screens, using Photo Booth & Events sample data, with the design system locked in for consistency across screens.
2. **Friend-facing explainer** (`booking-app-explainer-for-danish.md`) — plain-language MD written in Shaq's voice, explaining the idea, approach, hero feature, and screens to Danish for his input/buy-in.
3. **Validation / demand-testing plan** (`bookflow-validation-plan.md`) — a two-phase "fake door" test:
   - **Phase 1:** free landing page + waitlist signup + soft pricing question (no payment yet), distributed via Danish's network, Facebook groups, IG/TikTok, and later small paid ads.
   - **Phase 2 (only if Phase 1 shows interest):** RM10 refundable "founding member" deposit via ToyyibPay/Billplz, offered only to warm Phase-1 signups (not cold strangers), to get real proof-of-payment demand.
4. **Landing page** (`bookflow-landing-page.html`) — live-ready waitlist page matching the app's visual identity (same palette/type), with the WhatsApp-message-to-booking-card visual as the hero, a waitlist form (wired for Formspree), and a built-in pricing-expectation question.

## Current stage / where we are

- Concept, strategy, and 6-screen structure: **locked and confirmed** (2 rounds of alignment done).
- Stitch AI prompt: **written, not yet run/reviewed** in Stitch.
- Demand-validation phase: **assets built, not yet deployed.** Next actions are: connect Formspree, host the page (e.g. Netlify Drop), and start outreach across channels.
- Phase 2 (real deposit test) is planned but intentionally gated behind Phase 1 results — don't ask cold strangers for money; only warm Phase-1 signups.

## Open threads / things to pick up next

- Deploy the landing page + start outreach (Danish's network, FB groups, IG/TikTok).
- Track signups, signup rate, and price-expectation answers.
- Once there's real signal, decide on Phase 2 (RM10 deposit test) rollout.
- Once/if Stitch mockups are generated, review and iterate design with Shaq.
- Eventually: real app build, decision on tech stack/platform not yet discussed.
