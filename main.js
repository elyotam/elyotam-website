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
/* Scenes that get more scroll than the rest. The five with a service line on
   them nearly stop in the middle, so the picture holds while the words are read;
   the blast gets a gentler slowdown because there is nothing to read on it. */
const SLOW = [
  { from: 112, to: 152, rate: 5 },    // the drop
  { from: 300, to: 345, rate: 5 },    // the name and what it does
  { from: 438, to: 478, rate: 5 },    // the tanks
  { from: 578, to: 618, rate: 5 },    // the scope
  { from: 648, to: 706, rate: 1.4 },  // the blast, no text on it
  { from: 742, to: 782, rate: 5 },    // the squad
  { from: 1016, to: 1060, rate: 7 },  // above the clouds
];
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
/* the jets roll to a stop in front of the hangar, canopies lifting */
const CLOSING_AT = at(1144);
/* labels come through i18n.js, which sets window.t before this module runs */
const t = window.t ?? ((key, hebrew) => hebrew);
const RAIL_STOPS = [
  { until: at(238), label: t("rail.zero", "שעת אפס") },
  { until: at(710), label: "ELYOTAM" },
  { until: Infinity, label: t("rail.done", "הושלם") },
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
function buildHeroTimeline(scene) {
  const hero = q("#hero");
  if (!hero) return;

  const offer = q("#hero-offer");
  const zoneName = q("#zone-name");
  const zoneClosing = q("#zone-closing");
  const brand = q("#brand-reveal");
  const brandSub = q(".brand-sub");
  const rail = q("#hero-rail");
  const railFill = q("#rail-fill");
  const railNode = q("#rail-node");
  const railText = q("#rail-label");

  gsap.set(brandSub, { opacity: 0, y: 16 });
  gsap.set(zoneClosing, { opacity: 0, y: 30 });
  if (rail) gsap.to(rail, { opacity: 1, duration: 0.8, delay: 0.2 });

  /* The film used to cost seven screens of scrolling before the page began.
     It now runs as a sizzle: two and a half screens, three beats, and the
     offer is readable before any of it moves. */
  const length = Math.round(window.innerHeight * (narrow ? 2.9 : 3.4));
  const prog = { v: 0 };
  let last = -1;

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
        if (rail) rail.style.opacity = p > 0.985 || p < 0.03 ? "0" : "1";
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
        scene.render(frameAt(prog.v) / (FRAMES - 1));
      },
    },
    0
  );

  // I · the offer hands the screen over to the film as the first paratrooper drops
  tl.to(offer, { opacity: 0, y: -40, duration: 0.05, ease: "power2.in" }, at(40));

  // II · the name, as the helicopters come out of the smoke
  /* written quickly and then held, the same as the service lines: the window
     is for reading what this place does, not for watching letters arrive */
  tl.to(zoneName, { opacity: 1, duration: 0.012 }, at(244))
    .fromTo(
      brand,
      { clipPath: "inset(0 100% 0 0)" },
      { clipPath: "inset(0 0% 0 0)", duration: 0.026, ease: "power3.inOut" },
      at(250)
    )
    .to(brandSub, { opacity: 1, y: 0, duration: 0.014, ease: "power2.out" }, at(276))
    .to(zoneName, { opacity: 0, duration: 0.014 }, at(378));

  // III · the five services, each on its own scene
  capTween(tl, "#cap-drop", 90, 180);      // the supply drop, in freefall
  capTween(tl, "#cap-web", 416, 500);      // the tanks holding the street
  capTween(tl, "#cap-landing", 556, 644);  // the climb and the scope, clear before the blast
  capTween(tl, "#cap-ai", 718, 806);       // the squad under the drones
  capTween(tl, "#cap-apps", 1014, 1064);   // above the clouds at sunrise

  // IV · the line that hands over to the page
  tl.to(zoneClosing, { opacity: 1, y: 0, duration: 0.05, ease: "power2.out" }, CLOSING_AT);
}


/* Each service card rides the scene that earns it: the kicker arrives, the line
   rises out from behind its own edge, the rule draws under it, the note follows,
   and the whole block clears before the camera leaves the scene. Scrubbed, so
   scrolling back plays it in reverse. */
function capTween(tl, sel, from, to) {
  const cap = q(sel);
  if (!cap) return;
  const kicker = q(".cap-kicker", cap);
  const word = q(".cap-word", cap);
  const rule = q(".cap-rule", cap);
  const note = q(".cap-note", cap);
  const a = at(from);
  const b = at(to);

  gsap.set(cap, { opacity: 0 });
  gsap.set(kicker, { opacity: 0, y: 10 });
  gsap.set(word, { yPercent: 115 });
  gsap.set(rule, { scaleX: 0 });
  gsap.set(note, { opacity: 0, y: 12 });

  /* built quickly and held: the window is for reading, not for animating */
  tl.to(cap, { opacity: 1, duration: 0.003 }, a)
    .to(kicker, { opacity: 1, y: 0, duration: 0.007, ease: "power2.out" }, a)
    .to(word, { yPercent: 0, duration: 0.011, ease: "power3.out" }, a + 0.002)
    .to(rule, { scaleX: 1, duration: 0.012, ease: "power3.out" }, a + 0.006)
    .to(note, { opacity: 1, y: 0, duration: 0.009, ease: "power2.out" }, a + 0.008)
    .to(cap, { opacity: 0, duration: 0.008, ease: "power2.in" }, b - 0.008);
}

/* ============================================================
   THE OPERATIONS MAP (04 · תיק מבצעים)
   A paper field map in the site's own colours. Every project is an objective
   that pings on the sheet; the scroll flies the camera from one to the next,
   the grease-pencil route draws itself behind it, and the objective's card
   opens beside the map. The index jumps straight to any objective.
   ============================================================ */
/* ============================================================
   THE OPERATIONS MAP
   One screen, and the visitor steers it. Pick an objective — on the paper, in
   the index, or with the arrows — and the camera flies there and opens the
   file. Until someone takes over it walks the route by itself, so the section
   is alive the moment it comes into view.
   ============================================================ */
function initOpsMap(isReduced) {
  const stage = q("#ops-map-stage");
  const map = q("#ops-map", stage || document);
  if (!stage || !map) return;
  const sheet = q("#ops-sheet", stage);
  const pins = qa(".ops-pin", stage);
  const cards = qa(".op-card", stage);
  const tabs = qa(".ops-tab", stage);
  const routes = qa(".ops-route", stage);
  const dots = q("#ops-dots", stage);
  const count = q("#ops-count", stage);
  const status = q("#ops-status", stage);
  const n = cards.length;

  const art = q("#map-art", stage);
  if (art) art.innerHTML = graticule();

  if (isReduced) {
    stage.classList.add("is-static");
    return;
  }

  const P = pins.map((pin) => [parseFloat(pin.style.left), parseFloat(pin.style.top)]);
  const S = () => (narrow ? 0.95 : 1.25);
  /* where the objective sits in the frame: on a wide screen the file opens over
     the inline start, so the objective is held clear of it on the other side */
  const FX = narrow ? 0.5 : 0.66;
  const FY = narrow ? 0.34 : 0.5;
  const hold = (v, s, view, span) => Math.min(0, Math.max(view - span * s, v));
  const cam = (p) => {
    const s = S();
    return {
      x: hold(stage.clientWidth * FX - p[0] * s, s, stage.clientWidth, 2400),
      y: hold(stage.clientHeight * FY - p[1] * s, s, stage.clientHeight, 1600),
      scale: s,
    };
  };

  if (dots && !dots.children.length)
    dots.innerHTML = new Array(n).fill("<i></i>").join("");
  const beads = dots ? Array.from(dots.children) : [];

  // the route is drawn once, up to the objective in view
  routes.forEach((r) => {
    const len = r.getTotalLength();
    r.dataset.len = len;
    gsap.set(r, { strokeDasharray: len, strokeDashoffset: len });
  });

  let cur = -1;
  let auto = true;
  const go = (i, first) => {
    i = (i + n) % n;
    if (i === cur) return;
    cur = i;
    const [px, py] = P[i];
    if (count) count.textContent = t("map.count", "יעד %N / 02").replace("%N", String(i + 1).padStart(2, "0"));
    if (status) status.textContent = t("map.secured", "סטטוס: הושלם");
    pins.forEach((pin, k) => pin.classList.toggle("is-on", k === i));
    tabs.forEach((tab, k) => {
      tab.classList.toggle("is-active", k === i);
      tab.classList.toggle("is-done", k !== i);
    });
    beads.forEach((b, k) => b.classList.toggle("is-on", k === i));
    routes.forEach((r, k) => {
      const len = +r.dataset.len;
      gsap.to(r, { strokeDashoffset: k < i ? 0 : len, duration: 0.7, ease: "power2.inOut" });
    });
    gsap.to(map, { ...cam(P[i]), duration: first ? 0 : 1.15, ease: "power2.inOut", overwrite: true });
    cards.forEach((c, k) => {
      if (k === i) gsap.fromTo(c, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: "power3.out", delay: first ? 0 : 0.35 });
      else gsap.to(c, { autoAlpha: 0, duration: 0.25, overwrite: true });
    });
  };

  const stop = () => {
    auto = false;
    clearInterval(timer);
  };
  const pick = (i) => {
    stop();
    go(i);
  };
  pins.forEach((pin, i) => pin.addEventListener("click", () => pick(i)));
  tabs.forEach((tab, i) => tab.addEventListener("click", () => pick(i)));
  const prev = q(".ops-prev", stage);
  const next = q(".ops-next", stage);
  if (prev) prev.addEventListener("click", () => pick(cur - 1));
  if (next) next.addEventListener("click", () => pick(cur + 1));
  stage.addEventListener("pointerdown", (e) => {
    if (e.target.closest(".op-cta, .op-shot")) stop();
  });

  let timer = 0;
  const tiles = q("#ops-tiles", stage);
  const cols = narrow ? 4 : 8;
  const rows = narrow ? 7 : 5;
  if (tiles && !tiles.children.length) {
    tiles.style.setProperty("--cols", cols);
    tiles.style.setProperty("--rows", rows);
    tiles.innerHTML = new Array(cols * rows).fill("<i></i>").join("");
  }
  /* the frame arrives on the whole world; go(0) then flies it down to the
     objectives, so the globe is seen once and the region after that */
  const world = () => {
    const s = Math.max(stage.clientWidth / 2400, stage.clientHeight / 1600);
    return { x: (stage.clientWidth - 2400 * s) / 2, y: (stage.clientHeight - 1600 * s) / 2, scale: s };
  };
  gsap.set(map, world());
  gsap.set(sheet, { scale: 1.04, transformOrigin: "50% 50%" });
  gsap.set(cards, { autoAlpha: 0 });

  /* the sheet lands the way a satellite frame does, the first time the section
     is reached, and the walk starts as the last square fills in */
  ScrollTrigger.create({
    trigger: stage,
    start: "top 70%",
    once: true,
    onEnter: () => {
      gsap.to(sheet, { scale: 1, duration: 1.4, ease: "power2.out" });
      gsap.to(tiles ? tiles.children : {}, {
        autoAlpha: 0,
        scale: 0.84,
        duration: 0.42,
        ease: "power2.out",
        stagger: { amount: 0.85, grid: [rows, cols], from: "center" },
        onComplete: () => {
          go(0);
          timer = setInterval(() => auto && go(cur + 1), 3000);
        },
      });
    },
  });
}

/** the graticule: meridians and parallels every fifteen degrees, which is what
    a world sheet carries instead of contour rings */
function graticule() {
  const X0 = 70, X1 = 2330, Y0 = 250, Y1 = 1350;
  const LAT_TOP = 83, LAT_BOT = -56;
  const x = (lon) => X0 + ((lon + 180) / 360) * (X1 - X0);
  const y = (lat) => Y0 + ((LAT_TOP - lat) / (LAT_TOP - LAT_BOT)) * (Y1 - Y0);
  let g = "";
  for (let lon = -180; lon <= 180; lon += 15)
    g += `<line class="ops-grid" x1="${x(lon).toFixed(1)}" y1="${Y0}" x2="${x(lon).toFixed(1)}" y2="${Y1}" />`;
  for (let lat = 75; lat >= -45; lat -= 15)
    g += `<line class="ops-grid" x1="${X0}" y1="${y(lat).toFixed(1)}" x2="${X1}" y2="${y(lat).toFixed(1)}" />`;
  // the equator reads a shade stronger, the way it is printed
  g += `<line class="ops-grid is-major" x1="${X0}" y1="${y(0).toFixed(1)}" x2="${X1}" y2="${y(0).toFixed(1)}" />`;
  return g;
}

/* ============================================================
   SKIP
   The film and the dossiers are long scrolls. While one of them holds the
   screen, a button offers the way past it in one tap: a fast ride to the end
   of that scene, never a jump cut.
   ============================================================ */
function initSkip(lenis) {
  const btn = q("#skip-btn");
  if (!btn) return;
  const label = q(".skip-label", btn);
  const scenes = [{ trigger: "#hero", to: "#whoweserve", text: t("skip.film", "דילוג על הסרט") }];
  let current = null;
  let hideTimer = 0;
  const park = () => {
    if (!btn.classList.contains("is-on")) btn.hidden = true;
  };
  const show = (scene) => {
    current = scene;
    clearTimeout(hideTimer);
    if (scene) {
      label.textContent = scene.text;
      btn.hidden = false;
      requestAnimationFrame(() => btn.classList.add("is-on"));
    } else {
      btn.classList.remove("is-on");
      // transitionend does the tidy-up, but it never fires where transitions are
      // off, so a timer parks the button either way
      hideTimer = setTimeout(park, 450);
    }
  };
  btn.addEventListener("transitionend", park);
  scenes.forEach((scene) => {
    // a pinned scene is measured on its pin spacer, which carries the whole scroll length
    let el = q(scene.trigger);
    if (el && el.parentElement && el.parentElement.classList.contains("pin-spacer")) el = el.parentElement;
    if (!el || !q(scene.to)) return;
    ScrollTrigger.create({
      trigger: el,
      start: "top+=40 top",
      end: "bottom bottom-=10",
      refreshPriority: -2,
      onToggle: (self) => {
        if (self.isActive) show(scene);
        else if (current === scene) show(null);
      },
    });
  });
  btn.addEventListener("click", () => {
    if (!current) return;
    const target = q(current.to);
    show(null);
    lenis.scrollTo(target, { duration: 1.6, easing: (x) => 1 - Math.pow(1 - x, 3) });
  });
}

/** reduced-motion fallback: hold the last frame, with the name already up */
function staticHero(scene) {
  document.documentElement.classList.add("is-static");
  scene.render(1);
  gsap.set("#zone-name", { opacity: 1 });
  gsap.set("#brand-reveal", { clipPath: "inset(0 0% 0 0)" });
  gsap.set(".brand-sub", { opacity: 1, y: 0 });
  gsap.set("#zone-closing", { opacity: 1, y: 0 });
  gsap.set("#letterbox", { opacity: 0 });
  // no pinned descent here, so the scroll chrome has nothing to report
  gsap.set("#hero-rail", { display: "none" });
  document.querySelector("#topbar")?.classList.add("is-on");
}

/* ============================================================
   THE COMMAND BAR
   Hidden over the opening frame so nothing competes with the offer, then it
   comes down and stays, with the section you are in marked.
   ============================================================ */
function initTopbar() {
  const bar = q("#topbar");
  const hero = q("#hero");
  if (!bar || !hero) return;
  const links = qa(".tb-nav a", bar);

  ScrollTrigger.create({
    trigger: hero,
    start: "top+=140 top",
    onToggle: (self) => bar.classList.toggle("is-on", self.isActive || self.progress >= 1),
    onLeave: () => bar.classList.add("is-on"),
    onEnterBack: () => bar.classList.add("is-on"),
    onLeaveBack: () => bar.classList.remove("is-on"),
  });

  links.forEach((a) => {
    const target = q(a.getAttribute("href"));
    if (!target) return;
    ScrollTrigger.create({
      trigger: target,
      start: "top center",
      end: "bottom center",
      onToggle: (self) => a.classList.toggle("is-here", self.isActive),
    });
  });
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
  const cta = qa(".close-note, .close-cta");
  const section = q("#finale");
  if (!wordmark || !section) return;

  const letters = splitLetters(wordmark);
  letters.forEach((l) => l.classList.add("fw-letter"));

  if (isReduced) {
    gsap.set([eyebrow, ...cta], { opacity: 1, y: 0 });
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
    .to(eyebrow, { opacity: 1, y: 0, duration: 1 }, 0)
    .to(letters, { opacity: 1, filter: "blur(0px)", duration: 1.2, stagger: 0.04 }, 0.2)
    .to(
      wordmark,
      { letterSpacing: narrow ? "0.06em" : "0.14em", duration: 1.8, ease: "power2.out" },
      0.2
    )
    .to(tagline, { yPercent: 0, duration: 1, stagger: 0.12 }, 0.7)
    .to(cta, { opacity: 1, y: 0, duration: 1, stagger: 0.12 }, 1);
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
    initOpsMap(true);
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

  buildHeroTimeline(scene);
  initTopbar();
  initReveals(false);
  initVendorRun(false);
  initOpsMap(false);
  initCounters(false);
  initFinale(false);
  initAnchors(lenis);
  initSkip(lenis);
  initMagnetics();
  if (!coarse && !narrow) initCursor();
  // measure every trigger in page order, pins first, so the ones below a pin see its spacer
  ScrollTrigger.sort();

  await waitForFonts();
  // the page always opens on the offer, whatever scroll the browser remembered
  window.scrollTo(0, 0);
  lenis.resize();
  await hideLoader();
  const html = document.documentElement;
  html.classList.remove("is-loading");
  lenis.resize();
  scrollHeld = false;
  ScrollTrigger.refresh();

  /* like the first shot of a film widening out: the letterbox opens to full frame
     the moment the scroll starts, and closes again at the very top */
  let barsOn = true;
  lenis.on("scroll", ({ scroll }) => {
    const want = scroll < 4;
    if (want === barsOn) return;
    barsOn = want;
    gsap.to("#letterbox i", { scaleY: want ? 1 : 0, duration: want ? 0.9 : 1.3, ease: "expo.inOut", overwrite: true });
  });

  window.addEventListener("load", () => ScrollTrigger.refresh());
}

boot();
