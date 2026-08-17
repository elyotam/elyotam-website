/* ============================================================
   VELA ARMON — site runtime
   Lenis for the scroll feel, GSAP/ScrollTrigger for the timeline,
   and the canvas descent pinned across the top of the page.
   ============================================================ */

import { createFrameSequence } from "./hero-frames.js";

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
  { sel: "#chapter-yachts", in: 0.62, out: 0.74 },
  { sel: "#chapter-aviation", in: 0.82, out: 0.94 },
];
const CLOSING_AT = 0.96;
const RAIL_STOPS = [
  { until: 0.14, label: "I · החזון והרעיון" },
  { until: 0.32, label: "II · אתרי תדמית & נכסים" },
  { until: 0.56, label: "III · אוטומציות AI 24/7" },
  { until: 0.78, label: "IV · חנויות איקומרס" },
  { until: Infinity, label: "V · פיתוח אפליקציות" },
];
const railLabel = (p) => (RAIL_STOPS.find((s) => p < s.until) ?? RAIL_STOPS.at(-1)).label;

/* ------------------------------------------------------------
   client testimonials
   ------------------------------------------------------------ */
const REVIEWS = [
  {
    quote: "אליותם הפכו חזון עסקי מורכב לאפליקציה עובדת ומניבה בזמן שיא. האסטרטגיה והביצוע הטכנולוגי שלהם שברו את כל הציפיות.",
    name: "אלון מזרחי",
    role: "מייסד & CEO, FinTech Studio",
  },
  {
    quote: "האתר החדש שהם בנו לנו שינה לחלוטין את מותג היוקרה שלנו. יחס ההמרה זינק ב-45% כבר בחודש הראשון.",
    name: "דניאל כהן",
    role: "בעלים, Maison Du Luxe",
  },
  {
    quote: "מנועי אוטומציית ה-AI והסוכנים שפותחו עבורנו חוסכים מעל 120 שעות עבודה ידנית בחודש. מדובר בשינוי דרמטי ברווחיות.",
    name: "מיכל אברהמי",
    role: "סמנכ״לית תפעול, Apex Global",
  },
  {
    quote: "חנות האיקומרס שלנו עובדת כמו מנגנון שוויצרי. חווית הקנייה המהירה והסליקה המיידית הכפילו את סל הקנייה הממוצע.",
    name: "יוסי לוי",
    role: "מנהל מותג, Lumina Fashion",
  },
  {
    quote: "צוות אסטרטגי מהמעלה הראשונה. הם לא רק כותבים קוד, הם מבינים את המודל העסקי שלך ומזניקים אותו קדימה.",
    name: "רוני שפירא",
    role: "סמנכ״לית שיווק, Scale Group",
  },
  {
    quote: "השילוב של עיצוב ברמה הבינלאומית הגבוהה ביותר עם מנועי AI מתקדמים הציב אותנו ביתרון תחרותי מובהק.",
    name: "גילעד פרידמן",
    role: "מייסד, Prime Real Estate",
  },
  {
    quote: "עבדתי עם הרבה סוכנויות ובתי תוכנה, אבל Elyotam זו ליגה אחרת. דיוק הנדסי, עמידה בזמנים ותוצאות מטורפות.",
    name: "עדי ברק",
    role: "מנהלת מוצר, NextGen Tech",
  },
  {
    quote: "הזמינות והתמיכה שלהם 24/7 הן נכס אסטרטגי עבורנו. בכל השקה גלובלית ידענו שיש לנו גב טכנולוגי חזק.",
    name: "תומר שגיא",
    role: "VP Digital, Global Logistics",
  },
  {
    quote: "הם לקחו את החלום הכי גדול שלנו והפכו אותו לנכס דיגיטלי מוביל שמושך משקיעים ולקוחות מכל העולם.",
    name: "נועה קליין",
    role: "מייסדת, CloudVibe",
  },
  {
    quote: "המקצועיות של Elyotam ניכרת בכל שורת קוד ובכל פיקסל. השותף הטכנולוגי הטוב ביותר שתוכלו לבקש לעסק.",
    name: "איתי גולן",
    role: "CTO & יועץ טכנולוגי",
  },
];

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
function splitLetters(el) {
  if (!el) return [];
  const text = el.textContent ?? "";
  el.textContent = "";
  const out = [];
  for (const ch of text) {
    const s = document.createElement("span");
    s.textContent = ch === " " ? " " : ch;
    el.appendChild(s);
    out.push(s);
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

  // the descent itself — every other beat is positioned against this
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

  // III–VI · the four worlds
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
   REVIEW MARQUEES
   ============================================================ */
const initials = (name) =>
  name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

const reviewCard = (r) => `
  <article class="review-card">
    <p class="review-quote"><span class="qmark" aria-hidden="true">&ldquo;</span>${r.quote}</p>
    <div class="review-meta">
      <div class="review-avatar" aria-hidden="true">${initials(r.name)}</div>
      <div>
        <div class="review-name">${r.name}</div>
        <div class="review-role">${r.role}</div>
      </div>
    </div>
  </article>`;

function fillRow(row, items, loop) {
  const html = items.map(reviewCard).join("");
  row.innerHTML = loop ? html + html : html;
}

function marqueeLoop(track, row, dir, duration) {
  const tween =
    dir < 0
      ? gsap.to(track, { xPercent: -50, duration, ease: "none", repeat: -1 })
      : gsap.fromTo(track, { xPercent: -50 }, { xPercent: 0, duration, ease: "none", repeat: -1 });
  row.addEventListener("pointerenter", () => gsap.to(tween, { timeScale: 0.18, duration: 0.6 }));
  row.addEventListener("pointerleave", () => gsap.to(tween, { timeScale: 1, duration: 0.6 }));
  return tween;
}

function makeScrollable(row) {
  if (!row) return;
  row.setAttribute("tabindex", "0");
  row.setAttribute("role", "group");
  row.setAttribute("aria-label", "Client testimonials, scroll to read more");
}

function initMarquees(isReduced) {
  const a = q("#marquee-a");
  const b = q("#marquee-b");
  if (!a || !b) return [];
  const rowA = a.closest(".marquee-row");
  const rowB = b.closest(".marquee-row");

  if (isReduced) {
    fillRow(a, REVIEWS.slice(0, 5), false);
    fillRow(b, REVIEWS.slice(5, 10), false);
    makeScrollable(rowA);
    makeScrollable(rowB);
    return [];
  }

  fillRow(a, REVIEWS.slice(0, 5), true);
  fillRow(b, REVIEWS.slice(5, 10), true);
  if (!rowA || !rowB) return [];
  return [marqueeLoop(a, rowA, -1, 46), marqueeLoop(b, rowB, 1, 52)];
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

  const hot = "a, button, [data-magnetic], [data-magnetic-soft], .review-card, .house-card";
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
    /* font loading API unavailable — carry on */
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
    initMarquees(true);
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

  initMarquees(false);
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
