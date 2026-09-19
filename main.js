/* ============================================================
   VELA ARMON, site runtime
   Lenis for the scroll feel, GSAP/ScrollTrigger for the timeline,
   and the canvas descent pinned across the top of the page.
   ============================================================ */

import { createFrameSequence } from "./hero-frames.js?v=5";

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
/* The 1175-frame sequence is eight clips joined on their shared frame: five of
   158 frames, the two F-35 clips of 121, and the landing of 150. Every beat
   below is written as the frame it lands on, not by eye, and at(frame) turns
   it into a timeline position. The film reaches its last frame at FILM_END of
   the scroll and holds there for the rest, under the closing line.
   Frames: cargo bay 0-55, freefall 83-182, into the cloud 193-220, helicopters
   248-358, the dive to the street 386, tanks 413-496, the climb 523-579, the
   scope 606-645, through it and down at 656, the squad 716-803, the F-35s roar
   in over the squad at 817, the bay opens and the bombs drop 845-905, the dive
   after them to the impact at 960, black smoke 968-990, the climb out of it
   992-1012, above the clouds at sunrise 1013-1060, down through the clouds to
   the desert 1067-1100, touchdown 1125-1140, the jets roll to a stop in front
   of the hangar 1144-1174. Each card lands on its subject and clears before
   the camera leaves it. */
const FRAMES = 1175;
const FILM_END = 0.94;
/* Scenes that get more scroll than the rest: inside a slow zone each frame takes
   `rate` times the scroll of a normal frame. The sunrise climb above the clouds
   carries "עליונות אווירית", so it plays at half speed and the card can be read. */
const SLOW = [{ from: 1008, to: 1068, rate: 2.2 }];
const weight = (frame) =>
  SLOW.reduce((w, z) => w + (z.rate - 1) * Math.min(Math.max(frame - z.from, 0), z.to - z.from), frame);
const TOTAL = weight(FRAMES - 1);
const at = (frame) => (weight(frame) / TOTAL) * FILM_END;
/* the inverse: a timeline position back to the frame it shows */
const frameAt = (pos) => {
  let w = (Math.min(pos, FILM_END) / FILM_END) * TOTAL;
  let frame = 0;
  for (const z of SLOW) {
    if (w <= z.from - frame) return frame + w;
    w -= z.from - frame;
    frame = z.from;
    const span = (z.to - z.from) * z.rate;
    if (w <= span) return frame + w / z.rate;
    w -= span;
    frame = z.to;
  }
  return Math.min(frame + w, FRAMES - 1);
};
const CHAPTERS = [
  { sel: "#chapter-drop", in: at(88), out: at(189) },
  /* the lead tank kicks up its dust around 440-496 */
  { sel: "#chapter-web", in: at(412), out: at(511) },
  /* opens as the room comes into view and clears as the camera leaves
     through the hole in the wall, before the blast */
  { sel: "#chapter-landing", in: at(555), out: at(648) },
  /* over the squad, clear before the jets come in over the wall */
  { sel: "#chapter-ai", in: at(712), out: at(803) },
  /* "air superiority" as the two F-35s climb out of the smoke above the clouds at sunrise */
  { sel: "#chapter-apps", in: at(1010), out: at(1066) },
];
/* "לקוח" on its own, over the explosion: acquired as the charge goes off at
   656, locked on the blast's peak, held through the dust, gone by 695 */
const TARGET = { in: at(656), out: at(695) };
/* the jets roll to a stop in front of the hangar, canopies lifting */
const CLOSING_AT = at(1144);
/* labels come through i18n.js, which sets window.t before this module runs */
const t = window.t ?? ((key, hebrew) => hebrew);
const RAIL_STOPS = [
  { until: at(83), label: t("rail.zero", "שעת אפס") },
  { until: at(220), label: t("rail.drop", "חנויות דרופשיפינג") },
  { until: at(374), label: "ELYOTAM" },
  { until: at(539), label: t("rail.web", "אתרי תדמית") },
  { until: at(676), label: t("rail.landing", "דפי נחיתה") },
  { until: at(818), label: t("rail.ai", "אוטומציות AI") },
  { until: at(1070), label: t("rail.apps", "פיתוח אפליקציות") },
  { until: Infinity, label: t("rail.done", "המשימה הושלמה") },
];
const railLabel = (p) => (RAIL_STOPS.find((s) => p < s.until) ?? RAIL_STOPS.at(-1)).label;

/* ============================================================
   SMOOTH SCROLL
   ============================================================ */
/* While the page loads and while the opening credit is written, the scroll is held.
   Lenis itself is never stopped for that: stopping and restarting it could leave its
   target out of step with the page, so a later wheel moved nothing. Instead Lenis
   ignores input while this flag is up, and the CSS on html.is-loading / html.is-intro
   holds the native scroll. */
let scrollHeld = true;

function initLenis() {
  const lenis = new Lenis({
    duration: 1.15,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    touchMultiplier: 1.6,
    virtualScroll: () => !scrollHeld,
  });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  /* a safety net: if a wheel ever leaves Lenis chasing a target the page is not
     moving toward, resync it to where the page really is so the next wheel works */
  let lastWheel = 0;
  window.addEventListener(
    "wheel",
    () => {
      if (scrollHeld) return;
      const before = window.scrollY;
      const at = (lastWheel = performance.now());
      setTimeout(() => {
        if (at !== lastWheel || scrollHeld) return;
        const target = lenis.targetScroll;
        const outOfRange = !Number.isFinite(target) || target < 0 || target > lenis.limit + 1;
        const going = Math.abs(target - window.scrollY) > 2;
        if (outOfRange || (going && Math.abs(window.scrollY - before) < 1)) lenis.resize();
      }, 350);
    },
    { passive: true }
  );
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
  // a <br> in the copy survives the split as a real line break
  el.querySelectorAll("br").forEach((br) => br.replaceWith("\n"));
  const text = el.textContent ?? "";
  el.textContent = "";
  const out = [];
  /* split on plain spaces only, a non-breaking space stays inside its chunk and
     therefore inside one .letter-word, so `a&nbsp;b` never splits across lines */
  for (const chunk of text.split(/( |\n)/)) {
    if (!chunk) continue;
    if (chunk === "\n") {
      el.appendChild(document.createElement("br"));
      continue;
    }
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
  gsap.set(eyebrowLetters, { opacity: 0 });
  gsap.set(brandSub, { opacity: 0, y: 16 });
  gsap.set(zoneClosing, { opacity: 0, y: 30 });
  if (rail) gsap.to(rail, { opacity: 1, duration: 0.8, delay: 0.2 });

  // one screen of scroll per chapter, plus room for the descent between them
  // scroll length grows with the film, so each scene keeps its pace (1175 frames)
  const length = Math.round(window.innerHeight * (narrow ? 5.5 : 7.2));
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
        // the film runs to its last frame at FILM_END, slower through the slow zones, then holds
        scene.render(frameAt(prog.v) / (FRAMES - 1));
      },
    },
    0
  );

  // I · the eyebrow lifts away as the first paratrooper leaves the ramp
  tl.to(zoneEyebrow, { opacity: 0, y: -26, duration: 0.03, ease: "power2.in" }, at(55));

  // II · the name, as the helicopters come out of the smoke
  tl.to(zoneName, { opacity: 1, duration: 0.02 }, at(244))
    .fromTo(
      brand,
      { clipPath: "inset(0 100% 0 0)" },
      { clipPath: "inset(0 0% 0 0)", duration: 0.05, ease: "power3.inOut" },
      at(253)
    )
    .to(brandSub, { opacity: 1, y: 0, duration: 0.03, ease: "power2.out" }, at(291))
    .to(zoneName, { opacity: 0, duration: 0.025 }, at(346));

  // III-VII · the five services
  CHAPTERS.forEach((c) => chapterTween(tl, c));
  // V½ · "לקוח", locked on in the middle of the blast
  targetLockTween(tl, "#zone-target", TARGET.in, TARGET.out);

  // VII · the line that ties them together
  tl.to(zoneClosing, { opacity: 1, y: 0, duration: 0.05, ease: "power2.out" }, CLOSING_AT);
}

/* "לקוח" is confirmed as the charge goes off: a reticle hunts in and snaps on,
   the hit marker X strikes with a flash and a short shake, and a stamp slams
   in underneath. Scrubbed, so scrolling back plays it in reverse. */
function targetLockTween(tl, sel, at, out) {
  const zone = q(sel);
  if (!zone) return;
  const mark = q(".kill-mark", zone);
  const reticle = q(".km-reticle", mark);
  const word = q(".km-word", mark);
  const flash = q(".km-flash", mark);
  const stamp = q(".km-stamp", mark);
  const slashes = qa(".km-hit b", mark);
  const hit = at + 0.01; // the moment of impact, on the blast's peak

  gsap.set(zone, { opacity: 0 });
  gsap.set(reticle, { opacity: 0, scale: 2.8, rotate: -140, transformOrigin: "50% 50%" });
  gsap.set(word, { opacity: 0, scale: 1.7, filter: "blur(14px)" });
  gsap.set(slashes, { opacity: 0, scaleY: 0 });
  gsap.set(stamp, { opacity: 0, scale: 3, rotate: -24, xPercent: -50 });
  gsap.set(flash, { opacity: 0, scale: 0.4 });

  // the reticle hunts in and snaps on
  tl.to(zone, { opacity: 1, duration: 0.003 }, at)
    .to(reticle, { opacity: 1, scale: 1, rotate: 0, duration: 0.01, ease: "power3.in" }, at)
    .to(word, { opacity: 1, scale: 1, filter: "blur(0px)", duration: 0.008, ease: "expo.out" }, at + 0.003)
    // impact: the X strikes, the flash blooms, the reticle kicks
    .to(slashes, { opacity: 1, scaleY: 1, duration: 0.002, ease: "none" }, hit)
    .to(flash, { opacity: 0.9, scale: 1, duration: 0.002, ease: "none" }, hit)
    .to(reticle, { scale: 1.1, duration: 0.002, ease: "none" }, hit)
    .to(reticle, { scale: 1, duration: 0.006, ease: "back.out(4)" }, hit + 0.002)
    .to(flash, { opacity: 0, scale: 1.5, duration: 0.008, ease: "power2.out" }, hit + 0.002)
    .to(slashes, { opacity: 0.35, duration: 0.01, ease: "power1.out" }, hit + 0.004)
    // a short shake
    .to(mark, { x: -12, y: 7, duration: 0.0012, ease: "none" }, hit)
    .to(mark, { x: 10, y: -6, duration: 0.0012, ease: "none" }, hit + 0.0012)
    .to(mark, { x: -5, y: 3, duration: 0.0012, ease: "none" }, hit + 0.0024)
    .to(mark, { x: 0, y: 0, duration: 0.0016, ease: "none" }, hit + 0.0036)
    // the stamp slams in
    .to(stamp, { opacity: 1, scale: 1, rotate: -7, duration: 0.005, ease: "back.out(2.2)" }, hit + 0.004)
    .to(zone, { opacity: 0, duration: 0.01, ease: "power2.in" }, out);
}

/* ============================================================
   OPENING TITLE CREDIT · field typewriter with an impact
   The picture fades up from black as the letterbox closes in, the operation
   name flickers on, then an orange block cursor runs ahead while the stencil
   letters strike on at an uneven, human typing rhythm, each key nudging the
   line. The full stop is the hit: the camera shakes, dust rolls out, an
   orange flash, the bars kick, the rule snaps open. Resolves once the hit has
   settled, which is when the page lets go of the scroll.
   ============================================================ */
function typeEyebrow(letters) {
  const kicker = q("#zone-eyebrow .credit-kicker");
  const rule = q("#zone-eyebrow .credit-rule");
  const credit = q("#zone-eyebrow .credit");
  const line = q("#zone-eyebrow .eyebrow");
  const fx = q("#intro-fx");
  if (!line || !letters.length) return Promise.resolve();

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const camera = [q("#hero-canvas"), q(".hero-overlays")].filter(Boolean);

  /* a small particle system on its own canvas; the loop only runs while there is something to draw */
  const ctx = fx?.getContext("2d");
  let parts = [];
  let running = false;
  const fit = () => {
    if (!fx) return;
    fx.width = fx.clientWidth * devicePixelRatio;
    fx.height = fx.clientHeight * devicePixelRatio;
  };
  fit();
  window.addEventListener("resize", fit);
  const tick = () => {
    const d = devicePixelRatio;
    ctx.clearRect(0, 0, fx.width, fx.height);
    parts = parts.filter((p) => p.life > 0);
    for (const p of parts) {
      p.vx *= p.drag;
      p.vy = p.vy * p.drag + p.g;
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;
      const a = Math.max(0, p.life) * p.alpha;
      ctx.globalCompositeOperation = p.soft ? "source-over" : "lighter";
      if (p.soft) {
        // dust: a soft puff that swells as it thins, never a hard disc
        const rad = p.size * d * (2 - p.life);
        const g = ctx.createRadialGradient(p.x * d, p.y * d, 0, p.x * d, p.y * d, rad);
        g.addColorStop(0, `rgba(${p.color},${a})`);
        g.addColorStop(1, `rgba(${p.color},0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x * d, p.y * d, rad, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = `rgba(${p.color},${a})`;
        ctx.beginPath();
        ctx.arc(p.x * d, p.y * d, p.size * d, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    if (parts.length) requestAnimationFrame(tick);
    else {
      running = false;
      ctx.clearRect(0, 0, fx.width, fx.height);
    }
  };
  const emit = (p) => {
    if (!ctx) return;
    parts.push({ vx: 0, vy: 0, life: 1, decay: 0.02, size: 1, drag: 0.97, g: 0, color: "255,255,255", alpha: 1, ...p });
    if (!running) {
      running = true;
      requestAnimationFrame(tick);
    }
  };
  const centre = (el) => {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height };
  };

  const shakeHit = (power, dur) => {
    const t = gsap.timeline();
    t.set(camera, { scale: 1.03 });
    for (let i = 0; i < 8; i++) {
      t.to(camera, { x: (Math.random() - 0.5) * power, y: (Math.random() - 0.5) * power, duration: dur / 8, ease: "none" });
    }
    t.to(camera, { x: 0, y: 0, scale: 1, duration: dur / 2, ease: "power2.out", clearProps: "transform" });
  };

  const run = async () => {
    gsap.to("#intro-veil", { opacity: 0, duration: 1.8, ease: "power2.inOut" });
    gsap.to("#letterbox i", { scaleY: 1, duration: 1.6, ease: "expo.out" });
    await wait(1100);
    if (kicker) {
      // the operation name comes on like a faulty sign, then holds
      gsap.timeline()
        .to(kicker, { opacity: 1, duration: 0.06, repeat: 5, yoyo: true, ease: "none" })
        .set(kicker, { opacity: 1 });
      await wait(750);
    }

    // the cursor blinks on the empty line for a beat, then runs ahead of the keys
    const cursor = document.createElement("span");
    cursor.className = "type-cursor is-idle";
    cursor.setAttribute("aria-hidden", "true");
    letters[0].before(cursor);
    await wait(700);
    cursor.classList.remove("is-idle");
    const between = (a, b) => a + Math.random() * (b - a);
    for (const letter of letters) {
      const endOfWord = letter === letter.parentElement?.lastElementChild;
      gsap.set(letter, { opacity: 1 });
      letter.after(cursor);
      gsap.fromTo(letter, { y: -4 }, { y: 0, duration: 0.08 });
      gsap.fromTo(line, { x: 1.5 }, { x: 0, duration: 0.06 });
      // at the end of the first sentence the cursor stops and blinks for a beat before the second
      if (endOfWord && letter.parentElement.nextSibling?.nodeName === "BR") {
        cursor.classList.add("is-idle");
        await wait(850);
        cursor.classList.remove("is-idle");
        continue;
      }
      await wait(/\s/.test(letter.textContent) ? between(160, 240) : endOfWord ? between(200, 300) : between(50, 130));
    }
    cursor.classList.add("is-idle");
    gsap.to(cursor, { opacity: 0, duration: 0.3, delay: 1.2, onComplete: () => cursor.remove() });
    await wait(150);

    // the hit
    await wait(100);
    shakeHit(narrow ? 16 : 26, 0.6);
    const r = centre(line);
    for (let k = 0; k < (narrow ? 40 : 70); k++) {
      const a = Math.random() * Math.PI * 2;
      const s = Math.random() * 9 + 1;
      emit({
        x: r.x + (Math.random() - 0.5) * r.w * 0.8, y: r.y + r.h * 0.45, vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.5 - 1.5,
        drag: 0.94, g: 0.02, size: Math.random() * 60 + 30, decay: 0.007 + Math.random() * 0.008, color: "120,108,90", alpha: 0.22, soft: true,
      });
    }
    for (let k = 0; k < (narrow ? 36 : 60); k++) {
      const a = Math.random() * Math.PI * 2;
      const s = Math.random() * 12 + 3;
      emit({
        x: r.x, y: r.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 2, drag: 0.96, g: 0.18,
        size: Math.random() * 1.8 + 0.6, decay: 0.015 + Math.random() * 0.02, color: "255,140,40",
      });
    }
    gsap.fromTo("#intro-flash", { opacity: 0 }, { opacity: 1, duration: 0.07, yoyo: true, repeat: 1 });
    gsap.fromTo("#letterbox i", { scaleY: 1.35 }, { scaleY: 1, duration: 0.5, ease: "power3.out" });
    if (rule) gsap.to(rule, { scaleX: 1, duration: 0.7, delay: 0.25, ease: "expo.out" });
    if (credit) gsap.fromTo(credit, { scale: 1 }, { scale: narrow ? 1.02 : 1.04, duration: 12, ease: "sine.out" });
    await wait(900);
  };
  return run();
}

/* ============================================================
   THE HANGAR REVEAL (04 · תיק מבצעים)
   A second frame scene, 158 frames of its own. The stage pins for a few
   screens; the scroll opens the hangar doors and reveals the F-35, and once
   the jet stands framed in the light the section title rises over it. A
   ticker keeps easing toward the target frame while the stage is on screen,
   so the doors never stop a few frames short of where the scroll left them.
   ============================================================ */
function initHangarReveal(isReduced) {
  const stage = q("#reveal-stage");
  const canvas = q("#reveal-canvas");
  if (!stage || !canvas) return;
  const pin = q(".reveal-pin", stage);
  const head = q(".reveal-head", stage);

  if (isReduced) {
    // no scrub: the doors are simply open (the last frame, set in CSS), the title in place
    stage.classList.add("is-static");
    gsap.set(head, { opacity: 1, y: 0 });
    return;
  }

  const seq = createFrameSequence(canvas, {
    desktop: { folder: "reveal-frames", count: 158, ahead: 26, behind: 8, cap: 160, inflight: 4 },
    mobile: { folder: "reveal-frames-mobile", count: 158, ahead: 22, behind: 8, cap: 160, inflight: 3 },
  });
  window.addEventListener("resize", () => seq.resize());

  /* the doors are fully open around frame 112; the film ends at DOORS of the
     pinned scroll and holds on the revealed jet under the title for the rest */
  const DOORS = 0.8;
  const state = { p: 0 };
  let target = 0;
  let onScreen = false;
  gsap.ticker.add(() => {
    if (onScreen) seq.drawAt(target);
  });

  gsap.set(head, { opacity: 0, y: 40 });
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: stage,
      start: "top top",
      end: () => "+=" + Math.round(window.innerHeight * (narrow ? 2.2 : 2.6)),
      pin,
      scrub: 0.5,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onToggle: (self) => {
        onScreen = self.isActive;
      },
    },
  });
  tl.to(state, { p: 1, duration: DOORS, ease: "none", onUpdate: () => (target = state.p) }, 0)
    .to(head, { opacity: 1, y: 0, duration: 0.12, ease: "power2.out" }, 0.62)
    .to({}, { duration: 1 - DOORS }, DOORS);

  // start loading the first frames a couple of screens before the stage arrives
  ScrollTrigger.create({
    trigger: stage,
    start: "top 300%",
    once: true,
    onEnter: () => seq.preloadAll(null, 30),
  });
  // keep the canvas drawing while it is anywhere near the viewport, pinned or not
  ScrollTrigger.create({
    trigger: stage,
    start: "top bottom",
    end: "bottom top",
    onToggle: (self) => {
      if (self.isActive) onScreen = true;
    },
    onLeave: () => (onScreen = false),
    onLeaveBack: () => (onScreen = false),
  });
}

/** reduced-motion / no-JS-motion fallback: hold the final frame */
function staticHero(scene) {
  document.documentElement.classList.add("is-static");
  scene.render(1);
  gsap.set("#zone-name", { opacity: 1 });
  gsap.set("#brand-reveal", { clipPath: "inset(0 0% 0 0)" });
  gsap.set(".brand-sub", { opacity: 1, y: 0 });
  gsap.set(["#zone-eyebrow", "#letterbox", "#intro-veil"], { opacity: 0 });
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
   VENDOR RUN
   The jet flies the flight line beside the six lead rows, scrubbed by scroll.
   Row centres are measured on every ScrollTrigger refresh, so wrapping and
   font loading never put the jet between two rows.
   ============================================================ */
function initVendorRun(isReduced) {
  const run = q("#vendor-run");
  if (!run) return;
  const rows = qa(".vr-row", run);
  const plane = q(".vr-plane", run);
  const track = q(".vr-track", run);
  const fill = q(".vr-fill", run);
  if (!rows.length) return;

  if (isReduced) {
    run.classList.add("is-static");
    rows.forEach((r) => r.classList.add("is-past"));
    return;
  }

  let centers = [];
  const measure = () => {
    const top = run.getBoundingClientRect().top;
    centers = rows.map((r) => {
      const b = r.getBoundingClientRect();
      return b.top - top + b.height / 2;
    });
    track.style.top = `${centers[0]}px`;
    track.style.height = `${centers[centers.length - 1] - centers[0]}px`;
  };

  let active = -2;
  const setActive = (i) => {
    if (i === active) return;
    active = i;
    rows.forEach((r, k) => {
      r.classList.toggle("is-active", k === i);
      r.classList.toggle("is-past", k < i);
    });
  };

  const state = { p: 0 };
  let last = 0;
  /* each row owns an equal slice of the scroll: the jet holds on the row for
     the first part of its slice, then flies to the next one */
  const HOLD = 0.55;
  const flight = (t) => (t <= HOLD ? 0 : gsap.parseEase("power2.inOut")((t - HOLD) / (1 - HOLD)));
  const render = () => {
    if (!centers.length) measure();
    const n = centers.length;
    const first = centers[0];
    const span = centers[n - 1] - first || 1;
    const seg = Math.min(state.p * n, n - 0.0001);
    const i = Math.floor(seg);
    const y = i < n - 1 ? centers[i] + (centers[i + 1] - centers[i]) * flight(seg - i) : centers[n - 1];
    gsap.set(plane, { y });
    gsap.set(fill, { scaleY: (y - first) / span });
    if (state.p !== last) plane.classList.toggle("is-up", state.p < last);
    last = state.p;
    if (state.p <= 0.001) return setActive(-1);
    setActive(i);
  };

  measure();
  render();
  gsap.to(state, {
    p: 1,
    ease: "none",
    onUpdate: render,
    scrollTrigger: {
      trigger: run,
      start: narrow ? "top 78%" : "top 72%",
      end: narrow ? "bottom 48%" : "bottom 40%",
      scrub: 0.7,
      invalidateOnRefresh: true,
      onRefresh: () => {
        measure();
        render();
      },
    },
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
    initVendorRun(true);
    initHangarReveal(true);
    initCounters(true);
    initFinale(true);
    await waitForFonts();
    await hideLoader();
    ScrollTrigger.refresh();
    return;
  }

  const lenis = initLenis();
  document.documentElement.classList.add("is-loading");
  window.scrollTo(0, 0);

  // walk the whole descent once so the first scrub is already warm
  await scene.warm(setProgress);
  scene.resize();
  scene.render(0);
  setProgress(1);

  const eyebrowLetters = splitLetters(q("[data-split-letters]"));
  buildHeroTimeline(scene, eyebrowLetters);

  initReveals(false);
  initVendorRun(false);
  initHangarReveal(false);
  initCounters(false);
  initFinale(false);
  initAnchors(lenis);
  initMagnetics();
  if (!coarse && !narrow) initCursor();

  await waitForFonts();
  // the page always opens at the top of the film, whatever scroll the browser remembered
  window.scrollTo(0, 0);
  lenis.resize();
  await hideLoader();
  const html = document.documentElement;
  html.classList.remove("is-loading");

  /* The opening credit is a one-time show: the first visit in a tab types it and holds the
     scroll until it lands. After that (a reload, a return from the contact page) the credit is
     simply there, finished, and the page scrolls freely from the first moment. */
  const SEEN_KEY = "introSeen";
  let seen = false;
  try {
    seen = sessionStorage.getItem(SEEN_KEY) === "1";
  } catch (e) {
    /* storage blocked: play the intro */
  }
  const unlock = () => {
    try {
      sessionStorage.setItem(SEEN_KEY, "1");
    } catch (e) {
      /* storage blocked: nothing to remember */
    }
    if (!html.classList.contains("is-intro")) return;
    html.classList.remove("is-intro");
    window.scrollTo(0, 0);
    lenis.resize();
    scrollHeld = false;
    ScrollTrigger.refresh();
  };
  if (seen) {
    gsap.set(eyebrowLetters, { opacity: 1 });
    gsap.set("#zone-eyebrow .credit-kicker", { opacity: 1 });
    gsap.set("#zone-eyebrow .credit-rule", { scaleX: 1 });
    gsap.set("#intro-veil", { opacity: 0 });
    gsap.set("#letterbox i", { scaleY: 1 });
    lenis.resize();
    scrollHeld = false;
    ScrollTrigger.refresh();
  } else {
    // the opening credit holds the page: no scrolling until the whole line is written
    html.classList.add("is-intro");
    ScrollTrigger.refresh();
    typeEyebrow(eyebrowLetters).then(unlock, unlock);
    // a safety net, in case a background tab stalls the timers
    setTimeout(unlock, 20000);
  }

  // like the first shot of a film widening out: the letterbox opens to full frame the moment
  // the scroll starts, and closes again only when the page is back at the very top
  let barsOn = true;
  lenis.on("scroll", ({ scroll }) => {
    if (html.classList.contains("is-intro")) return;
    const want = scroll < 4;
    if (want === barsOn) return;
    barsOn = want;
    gsap.to("#letterbox i", { scaleY: want ? 1 : 0, duration: want ? 0.9 : 1.3, ease: "expo.inOut", overwrite: true });
  });

  window.addEventListener("load", () => ScrollTrigger.refresh());
}

boot();
