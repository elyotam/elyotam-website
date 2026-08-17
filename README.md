# TEST — VELA ARMON reference build

A working recreation of https://www.velaarmon.com/, built here as a study for the
CODE92 cinematic language. Self-contained static site — no build step.

## Run

```bash
cd TEST
python -m http.server 8899
# http://localhost:8899
```

Any static server works. It must be served over HTTP, not opened as `file://` —
`main.js` is an ES module.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Markup — loader, hero, five sections, finale, footer |
| `styles.css` | Palette, type scale, layout, motion tokens |
| `hero-scene.js` | The scroll-driven cinematic hero, rendered to canvas |
| `main.js` | Lenis, GSAP timelines, reveals, cursor, marquees, loader |

Dependencies (GSAP 3.13, ScrollTrigger, Lenis 1.3, Clash Display / Satoshi /
JetBrains Mono) load from CDN, so the first run needs a network connection.

## What matches the original

Palette (`--ink #08080a`, `--chalk #f6f3ec`, `--electric #ead9b8`), the three-family
type system, the section order and copy, the 12-column `who-grid`, the card grids,
the counter-stat row, the two counter-rotating testimonial marquees, the finale
wordmark, and the scroll choreography — pinned hero, five chapters, the chapter-card
in/out beats, the progress rail, magnetic hover, custom cursor.

## What is built rather than copied

The original hero is a pre-rendered WebP frame sequence (`frames/frame_0001.webp` …)
streamed to a canvas as you scroll. Those renders are the studio's own assets, so
this build renders the same five-chapter descent **procedurally** into the same
canvas, driven by the same pinned-scroll progress:

| Chapter | Scene |
| --- | --- |
| I · Sky | cloud deck below, stars above, sun dropping past the lens |
| II · Residences | skyline resolves through haze, a glass tower passes the camera |
| III · Horology | dial rushes in, dissolves to the movement, gears turn on scroll |
| IV · Yachts | dusk marina, specular moonpath, superyacht and reflection |
| V · Aviation | camera climbs off the water, jet crosses and trails away |

Everything expensive is baked into offscreen sprites once, so a scrubbed frame is
transforms plus `drawImage`. Chapters cross-dissolve through shared bokeh and cloud
layers so one world produces the next rather than cutting to it.

`createHeroScene()` exposes `render(p)`, `resize()` and `warm(onProgress)` — `warm`
walks the whole descent before the curtain lifts, which is what the loader's
percentage actually reports.

## Verified

Headless Chrome, no console or page errors:

- 1920/1600/1366/1024/768/390/360 wide — no horizontal overflow, headlines fit
- Portrait viewports hold their composition (subject scale is width-relative)
- `prefers-reduced-motion` → static final frame, all content and counters present

## Before this goes anywhere public

The name, copy and testimonials are the original site's. Swap the branding, wording
and client quotes before this is deployed or shown as anyone's own work.
