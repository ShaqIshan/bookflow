# BookFlow — Setup & Sharing Guide

Everything you need, from "just look at it" to "run it on my machine" to
"publish an update". Written so you never have to guess.

---

## 0. START HERE — morning checklist ☀️

**See it right now (works today):**
https://raw.githack.com/ShaqIshan/bookflow/preview/index.html
→ first visit shows a small githack safety notice — tap **"Open the page"**
once and the app loads. (This is your personal preview; don't send this one
to testers.)

**Unlock the real tester link (~2 minutes, one-time):**
GitHub is currently blocking automated builds on your **ShaqIshan** account —
this is standard for accounts that haven't finished verification, and only you
can clear it:

1. Log in at https://github.com — if any banner asks you to **verify your
   email**, do it (Settings → Emails → resend verification if needed).
2. Open https://github.com/ShaqIshan/bookflow/actions → click the failed
   **"pages build and deployment"** run → **Re-run all jobs**.
   *(Or instead: open a terminal in this BookFlow folder and run `npm run deploy`.)*
3. ~2 minutes later this is live and permanent — **the link you share with
   testers:** https://shaqishan.github.io/bookflow/

Everything else (site content, branches, build robot) is already in place —
that one verification is genuinely the only thing I couldn't do for you.

---

## 1. The live app (no setup at all)

**Tester link (after the checklist above):** https://shaqishan.github.io/bookflow/

- Open it on any phone or laptop — it works in the browser immediately.
- To publish an update at any time: run `npm run deploy` from this folder
  (it rebuilds and pushes the site). Once GitHub finishes verifying your
  account, pushes to `main` also auto-deploy via the included workflow.

### Install it like a real app (what to tell testers)

- **Android (Chrome):** open the link → tap the ⋮ menu → **Add to Home screen**
  → it installs with the BookFlow icon and opens full-screen.
- **iPhone (Safari):** open the link → tap the Share square → **Add to Home
  Screen**.
- Their bookings are saved **on their own device** — private, works offline
  after the first visit, nothing to sign up for.

---

## 2. Run it on your computer

### One-time: install Node.js

If you don't have it: https://nodejs.org → download **LTS** → install with all
defaults. (You already have it — this is for anyone else on the team.)

### Easiest way — double-click

| File (in this folder) | What it does |
| --- | --- |
| **START-APP.bat** | Installs dependencies if needed, starts the app, opens http://localhost:3000 |
| **BUILD-WEBSITE.bat** | Builds the publishable website into `bookflow-app/out` and opens that folder |

### Terminal way

Open a terminal **in this BookFlow folder** (or in `bookflow-app` — both work now):

```powershell
npm run setup   # first time only — installs dependencies
npm run dev     # start the app at http://localhost:3000
npm run build   # build the deployable website into bookflow-app/out
npm test        # run the WhatsApp-parser tests
```

> **Why `npm run build` failed for you before:** it was run in a folder that
> had no `package.json` (the app lives in `bookflow-app/`). The commands above
> now work from this folder too — they forward into `bookflow-app` for you.

---

## 2.5 Want to understand / edit the code?

Read **[LEARN-THE-CODE.md](LEARN-THE-CODE.md)** — a from-zero guide to every
language, framework, and file in this project, written for someone who has
never touched JavaScript, with diagrams and hands-on exercises.

## 3. Where everything lives

```
BookFlow/
├── bookflow-app/          ← the actual Next.js app (all the code)
│   ├── src/app/           ← the six screens (home, add, bookings, calendar, money, onboarding)
│   ├── src/components/    ← shared UI pieces
│   ├── src/lib/           ← WhatsApp parser, store, money/date logic
│   └── out/               ← the built website (after npm run build)
├── *.html + DESIGN.md     ← your original design mockups (the source of truth)
├── START-APP.bat          ← double-click to run locally
├── BUILD-WEBSITE.bat      ← double-click to build for publishing
└── .github/workflows/     ← the auto-deploy robot (runs on GitHub, not your PC)
```

## 4. GitHub — repo & branches

Repo: **https://github.com/ShaqIshan/bookflow**

| Branch | Purpose |
| --- | --- |
| `main` | What's live. Pushing here auto-deploys the site. |
| `prototype` | The prototype line of work. |
| `feature` | Day-to-day changes (branched off `prototype`). |

Typical flow when you change something:

```powershell
git checkout feature        # work here
git add -A ; git commit -m "what I changed"
git push
# when happy:
git checkout prototype ; git merge feature ; git push
git checkout main      ; git merge prototype ; git push   # ← this goes live
```

## 5. Netlify (optional — nicer URL / custom domain)

The GitHub Pages link above is already live, so this is optional. When you
want `bookflow.netlify.app` or your own domain (needs you logged in to
Netlify, ~3 clicks):

1. https://app.netlify.com → **Add new site → Import an existing project**
2. Pick GitHub → the **bookflow** repo
3. Set **Base directory** to `bookflow-app` → Deploy. Done — the included
   `netlify.toml` handles build settings, and future pushes auto-deploy there too.

No-account-linking alternative: double-click **BUILD-WEBSITE.bat**, then drag
the `out` folder onto https://app.netlify.com/drop.

> Netlify note: don't set `NEXT_PUBLIC_BASE_PATH` there — that variable is only
> for GitHub Pages (which serves the site under `/bookflow`).

## 6. Sharing with testers (the validation play)

Send them the live link with something like:

> *"Trying an app that turns WhatsApp booking messages into a proper booking
> list — paste a customer message and see. Takes 30 seconds, no sign-up.
> Tell me honestly if you'd use it."*

Good questions to ask after:
1. Did the WhatsApp paste get the details right on a *real* message from your chats?
2. What did you look for and not find?
3. Would you pay RM__/month for this? (soft pricing signal — Phase 1 of the validation plan)

Their data stays on their phone. The **sample bookings** they see on first run
can be removed via the avatar (top-left) → *Remove sample data*.

## 7. Troubleshooting

| Problem | Fix |
| --- | --- |
| `npm` is not recognised | Install Node.js LTS from https://nodejs.org, then reopen the terminal |
| `Missing script: build` | You're in the wrong folder — run from `BookFlow` or `bookflow-app` |
| PowerShell blocks npm ("running scripts is disabled") | Run once: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` |
| Port 3000 already in use | Close the other window, or `npm run dev -- -p 3001` |
| Something's weirdly broken | Delete `bookflow-app/node_modules`, then `npm run setup` again |
| Site didn't update after a push | GitHub → repo → **Actions** tab — the deploy run shows progress/errors |
