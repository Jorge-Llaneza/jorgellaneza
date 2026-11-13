# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

A collection of static sites served from GitHub Pages, pointed at by the personal domain `jorgellaneza.es` (see `CNAME`). There is no build step, no bundler, no package.json, and no test suite — every site is plain hand-written HTML/CSS/vanilla JS loaded directly by the browser. To "run" any site, just open its `index.html` in a browser (or serve the repo root with any static file server).

Each top-level directory is an independent site, self-contained (own `index.html`, `styles.css`, `script.js`, assets):

- `mpproductions/` — marketing/landing page for MP Productions (music production outfit). Single-page site with nav toggle, portfolio grid, a contact form that sends via Web3Forms, and a newsletter signup in the "Coming Soon" section that posts to Buttondown (the Buttondown username lives in the form's `action` URL in `index.html`; while it is still `YOUR_BUTTONDOWN_USERNAME`, `script.js` blocks the submit and shows a not-set-up note).
- `sistemamayor/` — a Spanish-language memory-training quiz app for the "sistema mayor" mnemonic technique (number → word associations). `data.js` defines the `SISTEMA_MAYOR` map (string number key → associated Spanish word); `script.js` holds all the quiz logic (state machine across intro/quiz/result screens, shuffled queue with wrong answers re-inserted a few slots ahead, per-question countdown timer, pause/resume, mistake review at the end).
- `aleman/` — a Spanish-language hub page (`aleman/index.html`, no saved state) listing the three German games; the root index links only to it. `aleman/sustantivos/`, `aleman/verbos/` and `aleman/worts/` are Spanish-language German vocabulary games sharing one design (levels along a route, combos, Blitz/Überleben modes, ES→DE / DE→ES / mixed). Words live in each site's `data.js`; `worts` was forked from `verbos` and re-themed (Alpine red/green, route Basel → Wien).
- `cpm/` — Spanish-language study app for the theory part of CPM (Comunicación Persona-Máquina, Uniovi): topic summaries, multiple-choice questions with Leitner spaced repetition and +4/−1 scoring, Fitts/Hick/GOMS problem generators, timed mock exams. One self-contained `index.html` (questions in `Q`, flashcards in `F`); its main script is `type="text/plain"` and injected after `KV.ready`, like `teaching`. Saves under the KV key `cpm-objetivo8-v1`.
- `avldance/` — Spanish-language Three.js animation: three dancers in a cellar club act out an AVL right rotation (10 ← 20 ← 30 → 10 ← 20 → 30) with their pointing arms as edges, to a perreo beat synthesized with Web Audio (starts on "Dale play"; the animation clock follows the audio clock once playing). One self-contained `index.html`; only Three.js r128 comes from cdnjs. No saved state.
- `index.html` (repo root) and `404.html` — redirect/fallback pages for the domain root.
- `worts/index.html` — only a redirect to `/aleman/worts/` for old bookmarks and installs.

## Working on a site

- Treat each site directory as isolated — don't introduce cross-directory dependencies or shared build tooling.
- `sistemamayor`: word/number pairs live only in `data.js` (`SISTEMA_MAYOR`); quiz behavior (timing, scoring, shuffling, pause) lives only in `script.js`. When changing a single word mapping, edit `data.js` directly rather than touching `script.js`.
- Answer matching in `sistemamayor/script.js` (`normalize()`) strips case, accents, and non-alphanumeric characters before comparing — keep that in mind when adding words with unusual punctuation.
- No linter or formatter is configured; match the existing style in the file you're editing.
- Every site must link back to the root `/`, reachable from every screen, including mid-drill on a phone (many drills have no other way out). Most use a fixed `.home-link` pill ("← jorgellaneza.es") styled with the site's own tokens, plus extra top padding so it doesn't cover content. `teaching` puts an arrow in its top bar instead; the three `aleman/*` games put one in their top bar pointing to the `/aleman/` hub, which has the `/` link, and `mpproductions` uses a nav item plus a footer link.

## Saved data (IndexedDB)

Apps that persist state (`aleman/*`, `dni`, `dniletter`, `notes`, `teaching`, `cpm`) don't use `localStorage`. They use `kv.js`, a localStorage-shaped wrapper (`KV.getItem/setItem/removeItem`) over one shared IndexedDB database (`jorgellaneza`, store `kv`, string values). Reads come from an in-memory copy, so app code must start after `KV.ready` (the scripts are wrapped in `KV.ready.then(...)`; `teaching` keeps its main script as `type="text/plain"` and injects it once ready; its lab iframes use `parent.KV`). On load, `kv.js` moves any leftover `localStorage` keys into IndexedDB.

`kv.js` is copied verbatim into each site directory and the repo root — this is the one deliberate exception to "no shared code", and the copies must stay identical. The root `index.html` uses it for the "Download data" / "Load data" backup buttons (JSON file `{site, version, exported, data}`; loading replaces the whole database). New apps that save state should use `kv.js` with a key that doesn't collide with existing ones.

`kv.js` can also sync to Firestore (free Firebase Spark plan), but only for the `aleman/*` games and `notes`: only the keys in the `SYNCED` set near the top of `kv.js` (`substantive-v1`, `verben-v1`, `woerter-v1`, `notes-trainer.v1`) are ever sent or accepted, and sync only runs on pages under `/aleman/` and `/notes/` plus the root page (sign-in and backups). Everywhere else (`cpm`, `dni`, `dniletter`, `teaching`) `kv.js` behaves as if sync were off and never touches the network. To sync another app, add its key to `SYNCED` and its directory to the pathname test in `SYNC`. It turns on once the `FIREBASE` config at the top of `kv.js` is filled in (until then it never touches the network) and the user signs in with Google from the root page's "Your progress" section. The Firebase SDK is only loaded for the sign-in popup; after that `kv.js` talks to the Firestore and token REST endpoints with the stored refresh token. Each key is a document `users/{uid}/kv/{key}` with `{k, v, t, s}` (v `null` = removed, `t` = client ms timestamp, `s` = server time). Newest `t` wins per key; the Firestore rules, kept in the comment above `FIREBASE`, refuse writes older than the stored one. Sync bookkeeping (session, per-key stamps, last pull) lives in a second IndexedDB database, `jorgellaneza-sync`, so backups don't include it. `KV.ready` waits up to 5 s for the first pull; a later pull that changes a key the page has read or written reloads the page. Each page syncs on load, at most every 10 s while things change, when it becomes visible again, and pushes on hide.

`kv.js` also calls `navigator.storage.persist()` on startup (`KV.persisted`); the root page shows the result. To make that likely to be granted, the root and every app that saves state is installable: each has its own `manifest.webmanifest` (scope = its own directory) plus `icon-192.png` / `icon-512.png` rendered from its `favicon.svg` (teaching's from its red "MP" touch icon). There is no service worker, so installed apps don't work offline.

## Design guardrails

`DESLOPIFY.md` at the repo root is a checklist against generic "AI-looking" design and copy (gradient clichés, 3-card grids, hedging copy, missing favicon/OG tags/404, etc.). Read it before generating or restyling any page, and run its checklist before shipping visual/copy changes. A matching skill (`deslopify`) is also configured under `.claude/skills/`.

## Deployment

Pushing to `master` is the deployment mechanism — GitHub Pages serves directly from this repo (custom domain via `CNAME`). There is no CI/build pipeline; what's committed is what ships.
