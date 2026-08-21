/* ============================================================
   VELA ARMON, site runtime
   Lenis for the scroll feel, GSAP/ScrollTrigger for the timeline,
   and the canvas descent pinned across the top of the page.
   ============================================================ */

import { createFrameSequence } from "./hero-frames.js?v=28";

const { gsap, ScrollTrigger, Lenis } = window;
gsap.registerPlugin(ScrollTrigger);

const q = (s, r = document) => r.querySelector(s);
const qa = (s, r = document) => Array.from(r.querySelectorAll(s));

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const coarse = window.matchMedia("(pointer: coarse)").matches;
const narrow = window.matchMedia("(max-width: 1023px)").matches;
const EASE = "expo.out";

/* ------------------------------------------------------------
   hero choreography constants
   ------------------------------------------------------------ */
/* These follow the baked sequence's chapter spans, not the scroll
   timings of the old drawn hero. Each card sits over its own chapter
   and clears before the handover dissolves it away. */
const CHAPTERS = [
  { sel: "#chapter-residences", in: 0.2, out: 0.3 },
  { sel: "#chapter-horology", in: 0.4, out: 0.52 },
  /* The sequence morphs off the marina and onto an airfield around frame 537
     (~0.67), so the e-commerce card has to clear before then, at its old
     0.62-0.74 it spent most of its life sitting over a runway. */
  { sel: "#chapter-yachts", in: 0.575, out: 0.65 },
  /* "מכאן ממריאים" has to land while the jet is still on the tarmac. The
     takeoff roll runs from ~0.70, the jet is framed on the runway at ~0.78 and
     rotates just past ~0.81, so the card builds over the roll, sits fully
     readable on the grounded jet, and dissolves as the wheels leave. */
  { sel: "#chapter-aviation", in: 0.7, out: 0.82 },
];
const CLOSING_AT = 0.96;
const RAIL_STOPS = [
  { until: 0.14, label: "הרעיון" },
  { until: 0.35, label: "אתרי תדמית ודפי נחיתה" },
  { until: 0.55, label: "אוטומציות AI" },
  { until: 0.70, label: "חנויות איקומרס" },
  { until: Infinity, label: "אפליקציות מובייל ו-Web" },
];
const railLabel = (p) => (RAIL_STOPS.find((s) => p < s.until) ?? RAIL_STOPS.at(-1)).label;

/* ============================================================
   SMOOTH SCROLL
   ============================================================ */
function initLenis() {
  const lenis = new Lenis({
    duration: 1.15,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    touchMultiplier: 1.6,
  });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  return lenis;
}

function initAnchors(lenis) {
  qa('a[href^="#"]').forEach((a) => {
    const id = a.getAttribute("href");
    if (!id || id === "#") return;
    a.addEventListener("click", (e) => {
      const target = q(id);
      if (!target) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { offset: -20, duration: 1.4 });
      else target.scrollIntoView({ behavior: "smooth" });
    });
  });
}

/* ============================================================
   TEXT SPLITTING
   ============================================================ */
/** One span per letter, for per-letter staggers; returns the letters in logical
    order. Letters are grouped into per-word wrappers because the separators used
    to be non-breaking spaces, which left the gaps between two letter spans as the
    only legal break points, so a wrapped line snapped words in half ("לאו/ויר").
    Now words are unbreakable and the spaces between them are the break points. */
function splitLetters(el) {
  if (!el) return [];
  const text = el.textContent ?? "";
  el.textContent = "";
  const out = [];
  /* split on plain spaces only, a non-breaking space stays inside its chunk and
     therefore inside one .letter-word, so `a&nbsp;b` never splits across lines */
  for (const chunk of text.split(/( )/)) {
    if (!chunk) continue;
    if (chunk === " ") {
      el.appendChild(document.createTextNode(" "));
      continue;
    }
    const word = document.createElement("span");
    word.className = "letter-word";
    for (const ch of chunk) {
      const s = document.createElement("span");
      s.textContent = ch;
      word.appendChild(s);
      out.push(s);
    }
    el.appendChild(word);
  }
  return out;
}

function splitWords(el) {
  if (!el || el.dataset.split === "done") return qa(".split-word > span", el);
  const words = (el.textContent ?? "").split(/\s+/).filter(Boolean);
  el.textContent = "";
  const inner = [];
  words.forEach((w, i) => {
    const mask = document.createElement("span");
    mask.className = "split-word";
    const span = document.createElement("span");
    span.textContent = w;
    mask.appendChild(span);
    el.appendChild(mask);
    if (i < words.length - 1) el.appendChild(document.createTextNode(" "));
    inner.push(span);
  });
  el.dataset.split = "done";
  return inner;
}

/* ============================================================
   HERO TIMELINE
   ============================================================ */
function chapterTween(tl, cfg) {
  const zone = q(cfg.sel);
  if (!zone) return;
  const index = q(".chapter-index", zone);
  const word = q(".chapter-word", zone);
  const rule = q(".chapter-rule", zone);
  const caption = q(".chapter-caption", zone);

  gsap.set(zone, { opacity: 0 });
  gsap.set(index, { opacity: 0, x: -12 });
  gsap.set(word, { yPercent: 110 });
  gsap.set(rule, { scaleX: 0, transformOrigin: "left center" });
  gsap.set(caption, { opacity: 0, y: 14 });

  tl.to(zone, { opacity: 1, duration: 0.015 }, cfg.in)
    .to(index, { opacity: 1, x: 0, duration: 0.03, ease: "power2.out" }, cfg.in + 0.004)
    .to(word, { yPercent: 0, duration: 0.05, ease: "power3.out" }, cfg.in + 0.01)
    .to(rule, { scaleX: 1, duration: 0.06, ease: "power3.out" }, cfg.in + 0.02)
    .to(caption, { opacity: 1, y: 0, duration: 0.04, ease: "power2.out" }, cfg.in + 0.03)
    .to(zone, { opacity: 0, duration: 0.03, ease: "power2.in" }, cfg.out - 0.018);
}

function buildHeroTimeline(scene, eyebrowLetters) {
  const hero = q("#hero");
  if (!hero) return;

  const zoneEyebrow = q("#zone-eyebrow");
  const zoneName = q("#zone-name");
  const zoneClosing = q("#zone-closing");
  const brand = q("#brand-reveal");
  const brandSub = q(".brand-sub");
  const rail = q("#hero-rail");
  const railFill = q("#rail-fill");
  const railNode = q("#rail-node");
  const railText = q("#rail-label");
  const hint = q("#scroll-hint");
  const cue = q(".mobile-scroll-cue");

  // the eyebrow greets the visitor on load, so it is already up at scroll 0
  gsap.set(zoneEyebrow, { opacity: 1 });
  gsap.set(eyebrowLetters, { yPercent: 120, opacity: 0 });
  gsap.set(brandSub, { opacity: 0, y: 16 });
  gsap.set(zoneClosing, { opacity: 0, y: 30 });
  if (rail) gsap.to(rail, { opacity: 1, duration: 0.8, delay: 0.2 });

  // one screen of scroll per chapter, plus room for the descent between them
  const length = Math.round(window.innerHeight * (narrow ? 4.6 : 6));
  const prog = { v: 0 };
  let last = -1;
  let hintHidden = false;

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: hero,
      start: "top top",
      end: `+=${length}`,
      pin: true,
      pinSpacing: true,
      scrub: 0.5,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        const p = self.progress;
        if (railFill) railFill.style.height = `${p * 100}%`;
        if (railNode) railNode.style.top = `${p * 100}%`;
        if (railText) {
          railText.style.top = `${p * 100}%`;
          const label = railLabel(p);
          if (railText.textContent !== label) railText.textContent = label;
        }
        if (rail) rail.style.opacity = p > 0.985 ? "0" : "1";
        const hide = p > 0.02;
        if (hide !== hintHidden) {
          hintHidden = hide;
          if (hint) gsap.to(hint, { opacity: hide ? 0 : 1, duration: 0.5 });
          if (cue) gsap.to(cue, { opacity: hide ? 0 : 0.85, duration: 0.5 });
        }
      },
    },
  });

  // the descent itself, every other beat is positioned against this
  tl.to(
    prog,
    {
      v: 1,
      duration: 1,
      ease: "none",
      onUpdate: () => {
        if (Math.abs(prog.v - last) < 0.0004) return;
        last = prog.v;
        scene.render(prog.v);
      },
    },
    0
  );

  // I · the eyebrow lifts away as we drop out of the clouds
  tl.to(zoneEyebrow, { opacity: 0, y: -26, duration: 0.03, ease: "power2.in" }, 0.086);

  // II · the name, as the tower establishes
  tl.to(zoneName, { opacity: 1, duration: 0.02 }, 0.1)
    .fromTo(
      brand,
      { clipPath: "inset(0 100% 0 0)" },
      { clipPath: "inset(0 0% 0 0)", duration: 0.07, ease: "power3.inOut" },
      0.12
    )
    .to(brandSub, { opacity: 1, y: 0, duration: 0.035, ease: "power2.out" }, 0.175)
    .to(zoneName, { opacity: 0, duration: 0.035 }, 0.235);

  // III-VI · the four worlds
  CHAPTERS.forEach((c) => chapterTween(tl, c));

  // VII · the line that ties them together
  tl.to(zoneClosing, { opacity: 1, y: 0, duration: 0.05, ease: "power2.out" }, CLOSING_AT);
}

/** reduced-motion / no-JS-motion fallback: hold the final frame */
function staticHero(scene) {
  document.documentElement.classList.add("is-static");
  scene.render(1);
  gsap.set("#zone-name", { opacity: 1 });
  gsap.set("#brand-reveal", { clipPath: "inset(0 0% 0 0)" });
  gsap.set(".brand-sub", { opacity: 1, y: 0 });
  gsap.set("#zone-eyebrow", { opacity: 0 });
  // no pinned descent here, so the scroll chrome has nothing to report
  gsap.set(["#scroll-hint", ".mobile-scroll-cue"], { display: "none" });
}

/* ============================================================
   SECTION REVEALS
   ============================================================ */
function initReveals(isReduced) {
  if (isReduced) {
    gsap.set("[data-reveal]", { opacity: 1, y: 0 });
    qa('[data-reveal="words"]').forEach((el) => gsap.set(splitWords(el), { yPercent: 0 }));
    gsap.set(".reveal-line > span", { yPercent: 0 });
    gsap.set("[data-hairline]", { scaleX: 1 });
    return;
  }

  qa('[data-reveal="fade"]').forEach((el) => {
    gsap.fromTo(
      el,
      { opacity: 0, y: 26 },
      {
        opacity: 1,
        y: 0,
        duration: 1.2,
        ease: EASE,
        scrollTrigger: { trigger: el, start: "top 88%", once: true },
      }
    );
  });

  qa('[data-reveal="words"]').forEach((el) => {
    const words = splitWords(el);
    gsap.set(words, { yPercent: 112 });
    gsap.to(words, {
      yPercent: 0,
      duration: 1.25,
      stagger: 0.07,
      ease: EASE,
      scrollTrigger: { trigger: el, start: "top 86%", once: true },
    });
  });

  qa('[data-reveal="lines"]').forEach((el) => {
    const lines = qa(".reveal-line > span", el);
    gsap.set(lines, { yPercent: 112 });
    gsap.to(lines, {
      yPercent: 0,
      duration: 1.2,
      stagger: 0.09,
      ease: EASE,
      scrollTrigger: { trigger: el, start: "top 88%", once: true },
    });
  });

  // cards rise together, staggered across their grid
  qa(".house-grid").forEach((grid) => {
    const cards = qa('[data-reveal="rise"]', grid);
    if (!cards.length) return;
    gsap.fromTo(
      cards,
      { opacity: 0, y: 46 },
      {
        opacity: 1,
        y: 0,
        duration: 1.15,
        stagger: 0.1,
        ease: EASE,
        scrollTrigger: { trigger: grid, start: "top 84%", once: true },
      }
    );
  });

  qa("[data-hairline]").forEach((el) => {
    gsap.fromTo(
      el,
      { scaleX: 0 },
      {
        scaleX: 1,
        duration: 1.3,
        ease: EASE,
        scrollTrigger: { trigger: el, start: "top 92%", once: true },
      }
    );
  });

  qa(".glow").forEach((el) => {
    const section = el.closest("section");
    if (!section) return;
    gsap.to(el, {
      yPercent: -18,
      ease: "none",
      scrollTrigger: { trigger: section, start: "top bottom", end: "bottom top", scrub: true },
    });
  });
}

/* ============================================================
   COUNTERS
   ============================================================ */
function initCounters(isReduced) {
  qa("[data-count]").forEach((el) => {
    const target = Number(el.dataset.count ?? "0");
    const suffix = el.dataset.suffix ?? "";
    const prefix = el.dataset.prefix ?? "";
    const write = (v) => {
      el.textContent = `${prefix}${Math.round(v)}${suffix}`;
    };
    if (isReduced) return write(target);
    write(0);
    const state = { v: 0 };
    ScrollTrigger.create({
      trigger: el,
      start: "top 90%",
      once: true,
      onEnter: () =>
        gsap.to(state, { v: target, duration: 2.4, ease: "power3.out", onUpdate: () => write(state.v) }),
    });
  });
}

/* ============================================================
   FINALE
   ============================================================ */
function initFinale(isReduced) {
  const wordmark = q(".finale-wordmark");
  const eyebrow = q(".finale-eyebrow");
  const tagline = qa(".finale-tagline .reveal-line > span");
  const cta = q(".finale-cta");
  const section = q("#finale");
  if (!wordmark || !section) return;

  const letters = splitLetters(wordmark);
  letters.forEach((l) => l.classList.add("fw-letter"));

  if (isReduced) {
    gsap.set([eyebrow, cta], { opacity: 1, y: 0 });
    gsap.set(letters, { opacity: 1, filter: "blur(0px)" });
    gsap.set(tagline, { yPercent: 0 });
    return;
  }

  gsap.set(eyebrow, { opacity: 0, y: 18 });
  gsap.set(letters, { opacity: 0, filter: "blur(16px)" });
  gsap.set(tagline, { yPercent: 115 });
  gsap.set(cta, { opacity: 0, y: 20 });

  gsap
    .timeline({
      scrollTrigger: { trigger: section, start: "top 58%", once: true },
      defaults: { ease: EASE },
    })
    .to(eyebrow, { opacity: 1, y: 0, duration: 1.8 }, 0)
    .to(letters, { opacity: 1, filter: "blur(0px)", duration: 2, stagger: 0.055 }, 0.35)
    .to(
      wordmark,
      { letterSpacing: narrow ? "0.06em" : "0.14em", duration: 3, ease: "power2.out" },
      0.35
    )
    .to(tagline, { yPercent: 0, duration: 1.6, stagger: 0.16 }, 1.5)
    .to(cta, { opacity: 1, y: 0, duration: 1.6 }, 2.2);
}

/* ============================================================
   CURSOR + MAGNETICS
   ============================================================ */
function initCursor() {
  const dot = q("#cursor-dot");
  const ring = q("#cursor-ring");
  if (!dot || !ring) return;
  document.body.classList.add("has-custom-cursor");

  const dx = gsap.quickTo(dot, "x", { duration: 0.12, ease: "power3" });
  const dy = gsap.quickTo(dot, "y", { duration: 0.12, ease: "power3" });
  const rx = gsap.quickTo(ring, "x", { duration: 0.55, ease: "power3" });
  const ry = gsap.quickTo(ring, "y", { duration: 0.55, ease: "power3" });

  window.addEventListener(
    "pointermove",
    (e) => {
      dx(e.clientX);
      dy(e.clientY);
      rx(e.clientX);
      ry(e.clientY);
    },
    { passive: true }
  );

  const hot = "a, button, [data-magnetic], [data-magnetic-soft].house-card";
  document.addEventListener("pointerover", (e) => {
    if (e.target instanceof Element && e.target.closest(hot)) ring.classList.add("is-active");
  });
  document.addEventListener("pointerout", (e) => {
    if (e.target instanceof Element && e.target.closest(hot)) ring.classList.remove("is-active");
  });
}

function initMagnetics() {
  const bind = (el, strength) => {
    const setX = gsap.quickTo(el, "x", { duration: 0.6, ease: "power3" });
    const setY = gsap.quickTo(el, "y", { duration: 0.6, ease: "power3" });
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      setX((e.clientX - (r.left + r.width / 2)) * strength);
      setY((e.clientY - (r.top + r.height / 2)) * strength);
    });
    el.addEventListener("pointerleave", () => {
      setX(0);
      setY(0);
    });
  };
  qa("[data-magnetic]").forEach((el) => bind(el, 0.34));
  qa("[data-magnetic-soft]").forEach((el) => bind(el, 0.1));
}

/* ============================================================
   LOADER
   ============================================================ */
const loader = q("#loader");
const loaderFill = q("#loader-fill");
const loaderPct = q("#loader-pct");

function setProgress(v) {
  const p = Math.max(0, Math.min(1, v));
  if (loaderFill) loaderFill.style.right = `${100 - p * 100}%`;
  if (loaderPct) loaderPct.textContent = `${Math.round(p * 100)}%`;
}

function hideLoader() {
  return new Promise((resolve) => {
    if (!loader) return resolve();
    gsap.to(loader, {
      opacity: 0,
      duration: 0.5,
      ease: "power2.inOut",
      onComplete: () => {
        loader.style.display = "none";
        resolve();
      },
    });
  });
}

async function waitForFonts() {
  try {
    await document.fonts?.ready;
  } catch {
    /* font loading API unavailable, carry on */
  }
  ScrollTrigger.refresh();
}

/* ============================================================
   BOOT
   ============================================================ */
function watchResize(scene) {
  let t;
  window.addEventListener("resize", () => {
    scene.resize();
    clearTimeout(t);
    t = window.setTimeout(() => ScrollTrigger.refresh(), 200);
  });
}

async function loadHero(canvas) {
  const seq = createFrameSequence(canvas);

  return {
    render: (p) => seq.drawAt(p),
    resize: () => seq.resize(),
    warm: (onProgress) => seq.preloadAll(onProgress, 24),
  };
}

async function boot() {
  ScrollTrigger.config({ ignoreMobileResize: true });

  const canvas = q("#hero-canvas");
  if (!canvas) return;
  const scene = await loadHero(canvas);
  watchResize(scene);

  if (reduced) {
    setProgress(1);
    scene.resize();
    staticHero(scene);
    initReveals(true);
    initCounters(true);
    initFinale(true);
    await waitForFonts();
    await hideLoader();
    ScrollTrigger.refresh();
    return;
  }

  const lenis = initLenis();
  document.documentElement.classList.add("is-loading");
  lenis.stop();
  window.scrollTo(0, 0);

  // walk the whole descent once so the first scrub is already warm
  await scene.warm(setProgress);
  scene.resize();
  scene.render(0);
  setProgress(1);

  const eyebrowLetters = splitLetters(q("[data-split-letters]"));
  buildHeroTimeline(scene, eyebrowLetters);

  initReveals(false);
  initCounters(false);
  initFinale(false);
  initAnchors(lenis);
  initMagnetics();
  if (!coarse && !narrow) initCursor();

  await waitForFonts();
  await hideLoader();
  document.documentElement.classList.remove("is-loading");
  lenis.start();
  ScrollTrigger.refresh();

  // the eyebrow writes itself across the clouds as the curtain lifts
  gsap.to(eyebrowLetters, {
    yPercent: 0,
    opacity: 1,
    duration: 1.4,
    stagger: 0.022,
    ease: EASE,
  });

  window.addEventListener("load", () => ScrollTrigger.refresh());
}

boot();
