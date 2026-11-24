# MP Productions Teaching: source project

The site is delivered as **one self-contained HTML file** (works offline, easy to hand out), but it is
written as many small files. `build.py` glues them together. Nothing else is needed: Python 3 only
(Node is optional, for the syntax check and the tests).

```
python3 build.py            # -> dist/MP_PRODUCTIONS_TEACHING_6.html (+ manifest, service worker, icons)
python3 build.py --check    # same, but first syntax-checks every JS file with node
```

The build of the untouched project is byte-for-byte identical to the single file it was split from.

## Layout

```
src/index.html        page shell: head, body, and four {{ }} placeholders
src/meta.json         site metadata read at start-up
src/styles/*.css      the stylesheet, in order (00-base.css first)
src/js/NN-group/*.js  the main script, in order. Folder number, then file number, decide the order.
src/labs/<lab>/       the six study labs (mips, hci, dojo, logic, tec, halcyon). Each lab is a normal
                      HTML page: index.html plus parts/ for its big inline <style>/<script> blocks.
src/labs/halcyon/games/<game>/   the six Halcyon Arcade games, same structure
assets/               PWA files: manifest, service worker, icons
tests/                headless-browser tests (Playwright). Run: SITE=dist/<file>.html node tests/t55.js
dist/                 build output (git-ignored)
```

## How the glue works

- Every file in `src/js` is pasted into one `<script>`, in sorted order, so **all files share one
  global scope**, exactly as before. Files are numbered (`00-`, `01-`, ...): load order matters,
  because later files use things declared by earlier ones.
- `{{include dir/}}` pastes a folder, `{{include file}}` pastes one file, `{{json dir/}}` pastes a folder
  of lab pages as JSON (the hub opens labs from that object).
- Folders with a `_wrap.json` (`open`/`close` strings) are pasted *between* those strings. The two big
  closures, the dating sim (`19-dating-sim`) and the 2nd fandom pack (`20-fandom-themes-2`), live like this:
  their files are pieces of one `(function(){ ... })();`, so they share local variables.
  Open `_wrap.json` to see the opening and closing lines. Do not move code in or out of these folders
  without checking `python3 build.py --check`.
- Anything starting with `_` is never pasted.

## Where things are

| You want to change...                      | Look in                                      |
|--------------------------------------------|----------------------------------------------|
| Study points, levels, unlocking            | `src/js/02-study/`                           |
| Crates, items, the shop                    | `src/js/04-catalog/`, `src/js/05-shop/`      |
| Home, arcade hub, notebook, navigation     | `src/js/06-screens/`                         |
| Halcyon pack, autosave and backups         | `src/js/13-halcyon/`                         |
| Fandom themes (collections, mechanics)     | `src/js/15-fandom-vault/`, `17-study-themes/`, `18-fandom-themes/`, `20-fandom-themes-2/` |
| Dating sim (art, dialogue, social, scenes) | `src/js/19-dating-sim/`                      |
| A study lab                                | `src/labs/<lab>/parts/`                      |

## Adding things

- **A new fandom theme**: add an entry to the `FD` list (see `18-fandom-themes/` for the fields), and a
  mini-game module like `20-fandom-themes-2/10-night-city.js` (needs the helpers in `00-helpers.js`).
- **A new JS file**: pick the right folder, give it the next number, run `python3 build.py --check`.
- **A new CSS file**: drop it in `src/styles/` with the next number.

## Tests

`tests/` holds the headless-browser checks used while developing (companions, jealousy, secrets,
cutscenes, dock themes, autosave...). They need Node and Playwright, and open the built file:
`SITE=dist/MP_PRODUCTIONS_TEACHING_6.html node tests/t55.js`. They print what they checked and any console errors.

## Rarity tiers for themes

| Tier | Meaning | Examples |
|------|---------|----------|
| Mythic    | flagship: a whole game-sized system with its own story | Dating Sim, Casino Royale, Valley Farm (with Village Life), Souls-like Bonfire, City Builder Skyline, plus the original scene themes Aurora Observatory, Clockwork Atelier, Paper Lantern River, Prism Hall, Tidepool Library, Sky Isles, Snow Globe, Observatory Train, Memory Garden, Sand Hourglass, and promoted Pixel Quest and Tamagotchi |
| Legendary | its own mini-game dock and visual layer, or an event / season / secret reward | Vice City, Night City, Heist Crew, Safe Room, Battle Pass themes |
| Epic      | rich look and effects, no mini-game | Winter Wonderland, Neon Arcade, Abyss, Sakura Zen, Blood Moon |

Give a fandom theme `rar:'mythic'` (or `'epic'`) in its `FD` entry to change its tier; the default is Legendary.

Mythic themes added later live in `src/js/22-mythic/` (shared helpers in `00-kit.js`: story scenes, banners, view wiring).
Focus / Class Mode lock screen follows the theme: palette for common to epic, a timer style for legendary, a full scene for Mythic (src/js/22-mythic/150-focus-views.js).
