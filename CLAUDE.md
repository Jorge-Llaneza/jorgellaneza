# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

A collection of static sites served from GitHub Pages, pointed at by the personal domain `jorgellaneza.es` (see `CNAME`). There is no build step, no bundler, no package.json, and no test suite — every site is plain hand-written HTML/CSS/vanilla JS loaded directly by the browser. To "run" any site, just open its `index.html` in a browser (or serve the repo root with any static file server).

Each top-level directory is an independent site, self-contained (own `index.html`, `styles.css`, `script.js`, assets):

- `mpproductions/` — marketing/landing page for MP Productions (music production outfit). Single-page site with nav toggle, portfolio grid, a contact form that sends via Web3Forms, and a newsletter signup in the "Coming Soon" section that posts to Buttondown (the Buttondown username lives in the form's `action` URL in `index.html`; while it is still `YOUR_BUTTONDOWN_USERNAME`, `script.js` blocks the submit and shows a not-set-up note).
- `sistemamayor/` — a Spanish-language memory-training quiz app for the "sistema mayor" mnemonic technique (number → word associations). `data.js` defines the `SISTEMA_MAYOR` map (string number key → associated Spanish word); `script.js` holds all the quiz logic (state machine across intro/quiz/result screens, shuffled queue with wrong answers re-inserted a few slots ahead, per-question countdown timer, pause/resume, mistake review at the end).
- `index.html` (repo root) and `404.html` — redirect/fallback pages for the domain root.

## Working on a site

- Treat each site directory as isolated — don't introduce cross-directory dependencies or shared build tooling.
- `sistemamayor`: word/number pairs live only in `data.js` (`SISTEMA_MAYOR`); quiz behavior (timing, scoring, shuffling, pause) lives only in `script.js`. When changing a single word mapping, edit `data.js` directly rather than touching `script.js`.
- Answer matching in `sistemamayor/script.js` (`normalize()`) strips case, accents, and non-alphanumeric characters before comparing — keep that in mind when adding words with unusual punctuation.
- No linter or formatter is configured; match the existing style in the file you're editing.

## Saved data (IndexedDB)

Apps that persist state (`aleman/*`, `dni`, `dniletter`, `notes`, `teaching`) don't use `localStorage`. They use `kv.js`, a localStorage-shaped wrapper (`KV.getItem/setItem/removeItem`) over one shared IndexedDB database (`jorgellaneza`, store `kv`, string values). Reads come from an in-memory copy, so app code must start after `KV.ready` (the scripts are wrapped in `KV.ready.then(...)`; `teaching` keeps its main script as `type="text/plain"` and injects it once ready; its lab iframes use `parent.KV`). On load, `kv.js` moves any leftover `localStorage` keys into IndexedDB.

`kv.js` is copied verbatim into each site directory and the repo root — this is the one deliberate exception to "no shared code", and the copies must stay identical. The root `index.html` uses it for the "Download data" / "Load data" backup buttons (JSON file `{site, version, exported, data}`; loading replaces the whole database). New apps that save state should use `kv.js` with a key that doesn't collide with existing ones.

`kv.js` also calls `navigator.storage.persist()` on startup (`KV.persisted`); the root page shows the result. To make that likely to be granted, the root and every app that saves state is installable: each has its own `manifest.webmanifest` (scope = its own directory) plus `icon-192.png` / `icon-512.png` rendered from its `favicon.svg` (teaching's from its red "MP" touch icon). There is no service worker, so installed apps don't work offline.

## Design guardrails

`DESLOPIFY.md` at the repo root is a checklist against generic "AI-looking" design and copy (gradient clichés, 3-card grids, hedging copy, missing favicon/OG tags/404, etc.). Read it before generating or restyling any page, and run its checklist before shipping visual/copy changes. A matching skill (`deslopify`) is also configured under `.claude/skills/`.

## Deployment

Pushing to `master` is the deployment mechanism — GitHub Pages serves directly from this repo (custom domain via `CNAME`). There is no CI/build pipeline; what's committed is what ships.
