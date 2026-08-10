# Flight Tribe — Hero Video + Atmosphere Redesign

**Date:** 2026-07-07
**Scope:** `flight-tribe-site/`
**Status:** Design — awaiting review

## Goal

Three coordinated changes to the Flight Tribe site, executed in parallel:

- **A. Video hero** — replace the current static glamour→evidence hero with a
  cinematic looping background video: a chrome Flight Tribe dice tumbling
  through a cold black-and-white void where the **ruby pips are the only
  colour**. Catchphrase **"ROLL WITH THE TRIBE"** animates over it.
- **B. Mobile/tablet scroll-scrub parity** — the pinned scroll-scrubs currently
  run desktop-only and degrade to static below 900px. Make the real scrubs run
  identically on phone and tablet.
- **C. Atmosphere** — replace the flat near-black site background with a deep
  **ruby-ember gradient bloom**, and give the footer a **giant ghosted
  Earth/globe** motif from the brand's own logo.

The through-line: the brand's design law is *"the site is cold silver/near-black;
the product gem is the only saturated colour on any given screen"* (`tokens.css`).
Every change below obeys it — ruby is the single accent, everything else stays
silver/void.

---

## A. Video hero — "Roll With The Tribe"

### Concept
A short, seamless, muted, autoplaying loop as the full-bleed hero background:
- **Environment:** desaturated, cinematic void — cold concrete / brushed-steel,
  raking hard key-light, slow drifting dust, slow-motion. Pure silver-grey → black.
- **Subject:** the real Flight Tribe sterling dice (engraved eye-sigil,
  `FLIGHT · TRIBE · 2026 · USA`) tumbling in, rolling, settling. The **ruby pips
  glow as the single point of colour**, throwing a faint red glint as they roll.
- **Overlay:** left-locked oversized `Flight / Tribe` wordmark (kept from current
  hero), an animated **"ROLL WITH THE TRIBE"** line (via existing `SplitText`),
  a `.925 · Made on Earth · MMXXVI` hallmark, and a scroll cue. The dice/stage
  remains the CTA → dice PDP (brand's "no competing Shop Now button" rule); the
  persistent Nav "Shop" link carries the explicit catalogue route.
- **Flow:** hero scrolls normally into the existing `StampReader` ("Read the
  Stamp") section — the narrative is preserved, only the opening medium changes.

### Video generation (Higgsfield MCP)
1. `models_explore(recommend)` for image→video with a product reference image.
2. **Keyframe image** first: the dice mid-tumble on the void ground, ruby-only
   saturation, raking light — generated using the real dice photo
   (`dice-01-cut.png` / `dice-macro.png`) as reference so the engraved product is
   faithful. Iterate 1–2× until it reads as *our* dice, not a generic die.
3. **Video:** ~5s, muted, seamless-as-possible loop, **landscape 16:9 master**,
   dice composed **centred / lower-third** so `object-cover` survives portrait crop.
4. **Portrait safety:** if the 16:9 crop looks bad on phones, produce a **9:16
   reframe** (Higgsfield `reframe`) and swap via `@media (orientation: portrait)`.
5. Extract a **poster frame** (first frame) for instant first paint; store master
   + poster in `public/assets/` (e.g. `hero-dice-roll.mp4`, `hero-dice-roll.jpg`,
   optional `hero-dice-roll-portrait.mp4`).

### Component work
- Rework `HeroReveal.tsx` → a video-background hero (`<video muted playsInline
  loop autoplay preload>` + poster). Keep `data-gem="ruby"`, the wordmark, the
  object-as-CTA link, the hallmark foot, the scroll cue.
- Under `prefers-reduced-motion: reduce`, do **not** autoplay — show the poster
  still with the catchphrase, no motion.
- Only transform/opacity animate on the overlay (T8 rule — no filter/blur tweens).
- `useLayoutEffect` + `gsap.context` + `ctx.revert()` cleanup.

---

## B. Mobile / tablet scroll-scrub parity

### Inventory (live pinned scrubs)
- `StampReader.tsx` (`.stampread`, Home) — horizontal "read the hallmark" scrub.
- `Tribe.tsx` (`.beat-bench`, /tribe) — pinned bench beat scrub.

Both currently gate the real scrub behind `(min-width: 901px)` and fall back to a
static/simple reveal on `(max-width: 900px)`.

### Approach
- Extend the real pinned-scrub `matchMedia` branch to **all widths** (touch +
  tablet), keeping `prefers-reduced-motion` as the only opt-out. Tune scrub
  smoothing/`end` distances so touch momentum feels right; keep
  `invalidateOnRefresh` for re-measure on rotate/resize.
- **`main.tsx` fix:** current code inits Lenis unconditionally with no touch
  fallback. Align with the project convention — Lenis owns smooth scroll on
  desktop; on `pointer: coarse` touch devices use native scroll and ensure
  `ScrollTrigger.update` still fires (native passive listener) so pins/scrubs
  track on touch. Verify horizontal scroll-jack (`StampReader`) feels controlled
  on touch, not janky.
- Keep `history.scrollRestoration = 'manual'` behaviour and ScrollTrigger refresh
  on `document.fonts.ready` + debounced resize.

### Verification
Emulate iPhone (390×844) and iPad (820×1180 portrait, 1024 landscape) via Chrome
DevTools MCP. Confirm: hero video plays/loops, `StampReader` horizontal read
pins+scrubs, Tribe `.beat-bench` pins+scrubs, no horizontal page overflow, no
stuck pins on route change. Also spot-check desktop unchanged.

---

## C. Atmosphere — background + footer

### Global background (ruby-ember bloom)
Replace `body { background-color: var(--c-void) }` with a layered dark treatment:
- Base stays `--c-void` (#0A0A0B) so all existing contrast/AA holds.
- Add a **deep radial/mesh ruby-ember bloom** — very low-intensity
  `color-mix(... var(--gem-ruby) ...)` glow, anchored off-centre, on a
  `position: fixed` layer behind content (`z-index: -1`, `pointer-events: none`).
- Optional barely-perceptible drift (long, ease, reduced-motion-paused). Must stay
  a *cold vault* — dark, not a bright gradient. Keep the existing `.grain` overlay.
- Applied globally so every route benefits; per-section solid backgrounds
  (`.hero-reveal`, `.stampread`, `.beat-bench`) already paint over it where needed.

### Footer (ghosted Earth/globe)
- Place the brand globe (`Media/Logo files` → copy to
  `public/assets/ft-globe.png`, or reuse the existing `Globe` sigil scaled huge)
  as a **large, low-opacity, ghosted motif** behind the footer content, bleeding
  off an edge — paying off *"Made on Earth."*
- Keep it monochrome/silver, low contrast, `aria-hidden`; footer text stays fully
  legible (AA) over it. No layout change to the footer's existing columns/marquee.

---

## Non-goals
- No stack upgrades, no route changes, no product-data changes.
- `DiceLanding` / `VideoScrub` / other dead components stay untouched.
- No new copy beyond the hero catchphrase and existing hallmark language.
- `main.tsx` changes limited to the Lenis/touch wiring needed for B.

## Execution (parallel)
Three independent workstreams after the video asset exists:
- **A** (hero) depends on the generated video; I generate + review the video
  first, then the hero component is built.
- **B** (mobile parity) and **C** (atmosphere) are independent of the video and
  of each other — dispatched in parallel.
- Shared files to coordinate: `globals.css`/`site.css` (C touches background;
  A touches `.hero-reveal`), `main.tsx` (B only). Assign ownership per file to
  avoid collisions.

## Risks / mitigations
- **iOS autoplay:** requires `muted` + `playsInline` (both set). Poster covers
  first paint / autoplay-block.
- **Portrait crop of a 16:9 video:** mitigated by centred composition + optional
  9:16 reframe.
- **Touch scrub jank / horizontal scroll-jack:** tune scrub + test on emulators;
  fall back to shorter `end` distance on touch if needed (still a real scrub,
  not the old static reveal).
- **Video weight vs LCP:** keep the loop short, compressed, `preload` sensibly,
  poster as LCP image.

## Verify
`npm run build` (tsc + vite) green, `npm run dev` visual check at desktop +
emulated phone/tablet.
