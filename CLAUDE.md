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

## Design guardrails

`DESLOPIFY.md` at the repo root is a checklist against generic "AI-looking" design and copy (gradient clichés, 3-card grids, hedging copy, missing favicon/OG tags/404, etc.). Read it before generating or restyling any page, and run its checklist before shipping visual/copy changes. A matching skill (`deslopify`) is also configured under `.claude/skills/`.

## Deployment

Pushing to `master` is the deployment mechanism — GitHub Pages serves directly from this repo (custom domain via `CNAME`). There is no CI/build pipeline; what's committed is what ships.
