# DESLOPIFY.md

A guide to keeping this project from looking "vibe coded" — the generic, interchangeable look that AI coding tools (Claude, Cursor, v0, Lovable, Bolt, etc.) produce by default. Read this before generating new pages/components, and run the checklist at the bottom before shipping anything.

## Why this happens

LLMs generate the **statistical median** of everything they were trained on. Ask for "a landing page" with no further constraints, and you get the average SaaS page from the last five years of the internet: centered hero, purple-to-blue gradient, three equal feature cards, Inter font, ease-in-out fades on scroll. None of this is wrong per se — it's just the most *probable* output, which makes it the most *forgettable* one. Tailwind's default `indigo-500`/`violet-500` became the de facto "AI purple" specifically because it was the default swatch in the training data every AI tool scraped — to the point that Tailwind's own creator has publicly apologized for it becoming a cliché.

The fix isn't "avoid AI tools." It's **constrain them** — give explicit, specific design decisions up front instead of letting the model default to the mean.

---

## The tells: visual

| Tell | What it looks like | Why AI does it |
|---|---|---|
| **The gradient** | Diagonal violet-to-indigo blend (~`#7c3aed` → `#6366f1`) on hero backgrounds, buttons, or glowing blobs | Purple reads "premium," indigo reads "technical" in training data |
| **Glassmorphism everywhere** | `backdrop-blur` + translucent white/dark panels on every card, nav, and modal | Was trendy circa 2021–2023, got baked into component libraries |
| **Glowing mesh blobs** | Soft, out-of-focus colored blobs floating behind hero text | Easiest way to add "visual interest" without real content |
| **Untouched shadcn/ui** | Every button, card, and input looks exactly like the shadcn/ui default theme | It's the most common component library in AI training data and default scaffolds |
| **Uniform everything** | Same `16px` border-radius, same `24px` padding, same shadow on every single element, no exceptions | Models apply one spacing/radius token globally instead of a considered scale |
| **The 3-card grid** | Exactly three equal-width feature cards, each: icon-in-a-circle, bold heading, two lines of body text | The most common "features" section shape in scraped marketing sites |
| **Animate-everything** | Every section fades/slides in on scroll, every button glows or scales on hover, every card lifts | Motion gets used as a stand-in for polish, decoupled from meaning |
| **No real imagery** | Icons and gradients instead of actual product screenshots, photography, or custom illustration | Placeholder-safe, zero research required |
| **Floating trust badges** | "Trusted by 10,000+ teams," "AI-Powered," star ratings with no real reviews behind them | Learned pattern from real SaaS sites, reproduced without the substance behind it |
| **Icon library soup** | Lucide/Heroicons at default size and weight, dropped in circles above every heading | Zero-effort way to "add visual elements" |

## The tells: copy

AI copy is grammatically perfect, on-topic, and **says nothing specific**. If a sentence could be pasted onto a CRM, a yoga app, or a meal-kit service without anyone noticing, a model probably wrote it.

**Verbs to flag:** unlock, elevate, empower, leverage, harness, foster, embark, navigate, seamlessly integrate, streamline

**Adjectives to flag:** robust, seamless, comprehensive, holistic, multifaceted, nuanced, pivotal, cutting-edge, best-in-class, game-changing

**Openers to flag:** "In today's fast-paced world...", "Imagine a world where...", any sentence that exists purely to clear its throat before the actual point

**Other patterns:**
- Headlines that promise transformation but name no concrete feature ("Transform your workflow," "Reimagine productivity")
- Heavy em-dash use — professional writers use them sparingly; AI models lean on them as a crutch
- Hedging language: "may help," "can potentially," "designed to"
- Fabricated specificity: "99% satisfaction," "10,000+ users" with no source
- Bullet lists of generic benefits instead of one concrete, specific claim

**The test:** read the sentence aloud. If you can swap the product name for a competitor's and it still makes sense, rewrite it.

## The tells: technical/structural

These are often a bigger giveaway than the visuals, because they reveal the page was never actually *used*, only generated.

- **Missing favicon** — defaults to a blank/generic globe icon in the browser tab. Immediately reads as unfinished or a scam page.
- **No custom 404 page**
- **Missing Open Graph / meta tags** — link previews in Slack/Twitter/iMessage show nothing useful
- **Missing `alt` text** on images — accessibility is consistently the biggest blind spot in AI-generated sites
- **No loading, empty, or error states** — only the "happy path" was ever generated
- **Over-scaffolding vs. under-functioning** — e.g. a tool generating 90+ files and 60+ dependencies for a page that's four files' worth of content, while the actual contact form doesn't send email. Polish on the surface, nothing underneath.
- **Console errors** nobody checked for
- **Unoptimized images** — multi-MB hero photos with no compression or responsive `srcset`

---

## The fix: a practical process

### 1. Write the constraints down before generating anything
Keep (and update) a short design spec in this repo — colors, type scale, spacing scale, radius values, and explicit "never do this" rules. Vague prompts like "make it look modern" default to the median. Specific prompts like "12-column grid, 8px spacing system, two-color palette, no border-radius above 8px" don't. This file plus `eclipse-ide-color-palette.md` function as that spec for this project — extend them rather than letting a future generation pass invent new defaults.

### 2. Pick typography with a point of view
Ban "just Inter" as the whole typographic identity. Options that read as deliberate rather than default:
- A distinct **display/heading face** (e.g. Anton, Sora, Plus Jakarta Sans, a serif like Lora or Playfair Display for editorial contrast) paired with a neutral, legible **body face**
- At minimum, pick a *specific* neo-grotesque and commit to it on purpose (Geist, DM Sans, Manrope) rather than reaching for whatever the scaffold shipped with
- Vary weight and scale deliberately — not everything should be `font-weight: 600`

### 3. Build a deliberate color system, not just "not purple"
Avoiding `indigo-500` isn't enough on its own if the replacement is still an arbitrary, ungrounded choice. Derive the palette from something real: the brand, the subject matter, a reference image, a constraint (like reusing an existing visual identity). Name the roles (background, surface, text, accent, muted) and keep them consistent — don't let each new section invent its own one-off color.

### 4. Break the grid on purpose
- Don't default every section to a symmetric 3-column grid of equal-weight cards
- Give the most important content more visual weight than supporting content
- Delete cards/sections that exist only to "fill" a layout rather than carry real information
- Vary section rhythm — not every section needs the same vertical padding and internal structure as the one before it

### 5. Replace placeholder visuals
Generic gradients-as-content and stock icon grids are the fastest way to look unfinished. Use real photography, real screenshots, or custom illustration tied to the actual subject — even a single well-chosen image beats three generic icon tiles.

### 6. Restrain motion
Animation should clarify meaning, not simulate polish. Cut any animation you can't justify with "this helps the user understand X." Most "fade in on scroll" effects on every single section fail that test.

### 7. Write copy that only this product could say
Name concrete features, real numbers, specific outcomes. Cut the verb/adjective list above on sight. If you're describing what the thing *does*, not how great it sounds, you're on the right track.

### 8. Finish the technical basics
Favicon, custom 404, OG/meta tags, `alt` text on every image, real loading/empty/error states, a quick accessibility pass (contrast, focus states, semantic HTML). These are cheap to do and their absence is one of the most reliable AI-generated signals.

### 9. Match implementation size to actual complexity
A landing page doesn't need 90 files and a component library if four files will do. Conversely, don't ship a beautiful static shell around a feature that doesn't actually work (e.g., a contact form with no backend — flag that explicitly to whoever's reading the code, don't let it look finished when it isn't).

### 10. Get a second pair of eyes
Show the page to someone and ask: "Could this be any other company's site with the logo swapped?" If yes, it's still slop — go back to steps 2–7.

---

## Quick pre-ship checklist

- [ ] No default purple/indigo gradient used without a deliberate reason
- [ ] Typography isn't "just Inter, just default weights"
- [ ] Color roles are named and consistent, not invented per-section
- [ ] Not every section is a symmetric N-column grid of equal cards
- [ ] No icon-in-a-circle-above-a-heading tiles used as filler
- [ ] Animations each have a reason beyond "looks polished"
- [ ] No placeholder gradient/icon used in place of real content or imagery
- [ ] Copy contains no banned verbs/adjectives list above
- [ ] No sentence could be pasted onto a competitor's site unchanged
- [ ] Favicon present
- [ ] Custom 404 page present
- [ ] OG/meta tags present and accurate
- [ ] All images have meaningful `alt` text
- [ ] Loading/empty/error states exist, not just the happy path
- [ ] Anything that *looks* functional (forms, buttons) either works or is clearly flagged as not wired up yet
- [ ] File/dependency count roughly matches actual page complexity

---

## Sources

- [AI Slop Web Design: Complete Guide to Spotting and Fixing Generic Websites](https://www.925studios.co/blog/ai-slop-web-design-guide)
- [AI Slop Fonts and Gradients: The Tells That Give Away AI Design](https://www.925studios.co/blog/ai-slop-design-tells)
- [AI Design Slop: Why AI-Generated UI Looks Generic — and the Fix](https://smoothui.dev/blog/ai-design-slop)
- [Why AI Websites Look the Same and How to Fix It](https://techarion.com/blog/why-ai-websites-look-the-same-how-to-make-claude-design-better)
- [Why Your AI-Generated UI Looks Like Everyone Else's](https://medium.com/@Rythmuxdesigner/why-your-ai-generated-ui-looks-like-everyone-elses-and-how-to-break-the-pattern-7a3bf6b070be)
- [How do I stop my AI-generated UI from looking generic?](https://echai.ventures/how-founders-use-ai/design-prototyping/how-do-i-stop-my-ai-generated-ui-from-looking-generic)
- [How to Make Your Website Not Look AI-Generated (30-Point Checklist)](https://aitoolpick.org/blog/ai-generated-website-checklist/)
- [10 Signs a Website Was Designed by AI](https://www.newwebsite.ai/blog/10-signs-a-website-was-designed-by-ai)
- [How to tell if a website was AI generated: 9 visible signs](https://uxskill.laithjunaidy.com/how-to-tell-if-a-website-was-ai-generated.html)
- [I analyzed 100 vibe-coded websites and found these common mistakes](https://dev.to/kaplich/i-analyzed-100-vibe-coded-websites-and-found-these-common-mistakes-5275)
- [Lovable vs. Claude Code: Why I Rewrote a React Site to Plain HTML](https://petrvojacek.cz/en/blog/lovable-vs-claude-code/)
- [DESIGN.md: How a Simple Markdown File Solved Vibe Coding's Biggest Design Problem](https://emelia.io/hub/design-md-ai-agents-standard)
- [What Is Design.md and How to Use It (With Examples)](https://www.banani.co/blog/design-md-guide)
- [32 Signs of AI Writing](https://copyadscontent.com/signs-of-ai-writing/)
- [Signs of AI slop in writing: 9 markers that make your content sound like ChatGPT](https://www.paralect.com/blog/signs-of-ai-slop-in-writing)
- [Inter Font Pairing: 12 Best Combinations for UI & Web Design](https://madegooddesigns.com/inter-font-pairing/)
- [Neo-grotesk fatigue 2026](https://fontalternatives.com/blog/neo-grotesk-fatigue-2026/)
