/* ---------------------------------------------------------------------------
   THE TUBE, WHERE IT BELONGS

   The first version treated the whole site as something seen through a device.
   That is a great first impression and a bad website: the speckle, the
   honeycomb and the eyepiece sit in front of every word on the page, and a
   visitor who has decided to read is fighting the effect.

   So this one puts the device where the device makes sense and takes it away
   where it does not:

   - THE TUBE IS INSIDE THE FILM. Its layer is mounted between the footage and
     the captions, inside the hero, rather than over the whole document. The
     captions are painted on top of it, not through it, which is the single
     biggest thing that makes them readable again.
   - THE PHOSPHOR IS MIXED, NOT IMPOSED. The gradient map is blended with the
     original footage at `strength`, so the picture is unmistakably green but
     keeps the contrast and the detail the frames actually have. At full
     strength a night drop is a green silhouette; at 0.7 it is still a night
     drop.
   - THE HALATION IS LEASHED. Bloom is what eats captions: a lamp behind a word
     grows until it swallows it. It is much smaller here, and it is applied
     before the captions are drawn rather than over them.
   - THE PAGE AFTER THE FILM IS CLEAN. The device fades out as the footage ends.
     Whatever is left is set deliberately per look, and can be nothing at all.

   The pool of dark a caption sits on is set in the stylesheet rather than from
   here, because it belongs to the caption, not to the device.
--------------------------------------------------------------------------- */
(() => {
  const cfg = Object.assign(
    {
      ramp: null,
      strength: 0.72, // how much of the footage becomes phosphor
      bloom: 1.2,
      grainFilm: 0.055,
      hexFilm: 0.03,
      hexSize: 7,
      vigFilm: 0.42,
      grainPage: 0,
      hexPage: 0,
      vigPage: 0,
      gain: 0.022,
      media: ".op-shot img, .shot img",
    },
    window.NVG || {}
  );

  if (!cfg.ramp) return;

  const hero = document.querySelector("#hero");
  const filmCanvas = document.querySelector("#hero-canvas");
  const overlays = document.querySelector(".hero-overlays");
  const emission = cfg.ramp[cfg.ramp.length - 1];
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- the phosphor, mixed with the picture rather than replacing it ----

     The halation is built as a separate stage on purpose. Measured under a weak
     GPU - software rendering, which is the closest thing to a phone available
     here - the film ran at 34fps with the full filter and 60 with the blur
     taken out, while everything else in the effect cost nothing at all. A
     full-screen gaussian blur recomputed on every repaint is simply not
     affordable on a phone, and the frame sequence repaints on every scroll
     event, so it was being recomputed constantly.

     The gradient map is what makes it read as a tube. The bloom is a garnish.
     So the bloom is dropped where it cannot be afforded and the tube stays. */
  const table = (i) => cfg.ramp.map((c) => (c[i] / 255).toFixed(4)).join(" ");
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("aria-hidden", "true");
  svg.style.cssText = "position:absolute;width:0;height:0;overflow:hidden";

  const buildFilter = (withBloom) => {
    const bloom = withBloom
      ? `
      <feComponentTransfer in="mixed" result="hot">
        <feFuncR type="linear" slope="1.5" intercept="-0.74"/>
        <feFuncG type="linear" slope="1.5" intercept="-0.74"/>
        <feFuncB type="linear" slope="1.5" intercept="-0.74"/>
      </feComponentTransfer>
      <feGaussianBlur in="hot" stdDeviation="${cfg.bloom}" result="halo"/>
      <feComposite in="halo" in2="mixed" operator="arithmetic"
                   k1="0" k2="0.45" k3="1" k4="0"/>`
      : "";
    svg.innerHTML = `
    <filter id="tube" color-interpolation-filters="sRGB"
            x="-2%" y="-2%" width="104%" height="104%">
      <feColorMatrix type="matrix" result="mono"
        values="0.2126 0.7152 0.0722 0 0
                0.2126 0.7152 0.0722 0 0
                0.2126 0.7152 0.0722 0 0
                0      0      0      1 0"/>
      <!-- A curve before the ramp. Without it the tube's gain sits too high and
           a bright, dusty frame comes out milky rather than deep - which is what
           it looked like on a phone, where the film is a tight crop of exactly
           those frames. The same curve is baked into the mobile frames, so both
           end up with the same picture. -->
      <feComponentTransfer in="mono" result="curved">
        <feFuncR type="gamma" amplitude="1" exponent="1.25" offset="-0.024"/>
        <feFuncG type="gamma" amplitude="1" exponent="1.25" offset="-0.024"/>
        <feFuncB type="gamma" amplitude="1" exponent="1.25" offset="-0.024"/>
      </feComponentTransfer>
      <feComponentTransfer in="curved" result="phos">
        <feFuncR type="table" tableValues="${table(0)}"/>
        <feFuncG type="table" tableValues="${table(1)}"/>
        <feFuncB type="table" tableValues="${table(2)}"/>
      </feComponentTransfer>
      <!-- the mix: at strength 1 this is the tube, at 0.7 the frame's own
           contrast is still carrying most of the picture -->
      <feComposite in="phos" in2="SourceGraphic" operator="arithmetic"
                   k1="0" k2="${cfg.strength}" k3="${(1 - cfg.strength).toFixed(3)}" k4="0"
                   result="mixed"/>${bloom}
    </filter>`;
  };

  /* A phone gets no filter on the canvas at all: its frames are pre-baked with
     the phosphor map and the halation already in them, so the picture arrives
     green and the device costs nothing per frame. The honeycomb and the speckle
     were left out of the bake on purpose - they are noise, and noise does not
     compress, so baking them cost +96% and +118% of the film's weight against
     +16% for the two smooth parts. They are drawn here instead, as tiled
     layers that the compositor moves rather than anything that repaints. */
  const baked = window.matchMedia("(max-width: 768px)").matches;
  const small = baked || window.matchMedia("(pointer: coarse)").matches;
  let bloomOn = !small && cfg.bloom > 0;
  if (!baked) {
    buildFilter(bloomOn);
    document.body.appendChild(svg);
  }

  const style = document.createElement("style");
  style.textContent = baked ? "" : `#hero-canvas, ${cfg.media} { filter: url(#tube); }`;
  document.head.appendChild(style);

  /* ---- the grain layer, mounted under the captions ---- */
  const make = (z, fixed) => {
    const c = document.createElement("canvas");
    c.setAttribute("aria-hidden", "true");
    Object.assign(c.style, {
      position: fixed ? "fixed" : "absolute",
      inset: "0",
      width: "100%",
      height: "100%",
      zIndex: String(z),
      pointerEvents: "none",
      mixBlendMode: "screen",
    });
    return c;
  };

  if (!hero || !overlays) return;

  /* ---- on a phone: tiled layers, moved, never redrawn ---- */
  const tile = (draw, w, h) => {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    draw(c.getContext("2d"));
    return c.toDataURL("image/png");
  };

  if (baked) {
    /* One layer, not three, and no blend mode on it.
       Measured on a weak GPU with a throttled CPU: three full-screen
       screen-blended layers cost 34fps against 50 with none, and a blend mode
       on a full-screen layer is the expensive part of that. So the honeycomb
       and the speckle are drawn into a single tile that already carries its own
       colour, laid on at low opacity with ordinary compositing - over a picture
       this dark the difference from a screen blend is not visible - and moved
       by transform, which the compositor does without repainting anything. */
    const TW = cfg.hexSize * 10;        // a whole number of honeycomb tiles
    const TH = cfg.hexSize * 3 * 6;
    const tileUrl = tile((k) => {
      const img = k.createImageData(TW, TH);
      for (let i = 0; i < img.data.length; i += 4) {
        const v = Math.random();
        const a2 = v > 0.86 ? ((v - 0.86) / 0.14) * 255 : 0;
        img.data[i] = emission[0];
        img.data[i + 1] = emission[1];
        img.data[i + 2] = emission[2];
        /* the strength lives in the tile now: there is no layer opacity left
           to scale it down, which is what made the first attempt look like a
           wire screen laid over the film */
        img.data[i + 3] = a2 * cfg.grainFilm;
      }
      k.putImageData(img, 0, 0);

      k.strokeStyle = `rgba(${emission[0]},${emission[1]},${emission[2]},${cfg.hexFilm * 0.55})`;
      k.lineWidth = 1;
      const s2 = cfg.hexSize;
      const w = Math.round(s2 * Math.sqrt(3));
      const hexAt = (cx, cy) => {
        k.beginPath();
        for (let i = 0; i < 6; i++) {
          const ang = (Math.PI / 180) * (60 * i - 30);
          const x = cx + s2 * Math.cos(ang);
          const y = cy + s2 * Math.sin(ang);
          i ? k.lineTo(x, y) : k.moveTo(x, y);
        }
        k.closePath();
        k.stroke();
      };
      for (let y = 0; y < TH + s2 * 3; y += s2 * 3) {
        for (let x = 0; x < TW + w; x += w) {
          hexAt(x + w / 2, y + s2);
          hexAt(x, y + s2 * 2.5);
        }
      }
    }, TW, TH);

    const sheet = document.createElement("style");
    sheet.textContent = `
      @keyframes nvg-drift { to { transform: translate3d(-${TW}px, -${TH}px, 0); } }
      .nvg-tile {
        position: absolute; inset: -${TH}px -${TW}px; z-index: 1;
        pointer-events: none; will-change: transform;
        background: url(${tileUrl}) repeat;
        animation: nvg-drift .5s steps(4) infinite;
      }
      @media (prefers-reduced-motion: reduce) { .nvg-tile { animation: none; } }`;
    document.head.appendChild(sheet);
    const d = document.createElement("div");
    d.className = "nvg-tile";
    d.setAttribute("aria-hidden", "true");
    hero.insertBefore(d, overlays);
  }

  const filmLayer = baked ? null : make(1, false);
  if (filmLayer) {
    filmLayer.className = "nvg-layer nvg-film";
    hero.insertBefore(filmLayer, overlays);
  }

  /* what is left of the device once the film is behind you */
  const pageOn = !baked && (cfg.grainPage > 0 || cfg.hexPage > 0);
  const pageLayer = pageOn ? make(58, true) : null;
  if (pageLayer) {
    pageLayer.className = "nvg-layer nvg-page";
    document.body.appendChild(pageLayer);
  }

  /* the eyepiece darkening, also only over the film */
  const shade = document.createElement("div");
  shade.setAttribute("aria-hidden", "true");
  Object.assign(shade.style, {
    position: "absolute",
    inset: "0",
    zIndex: "1",
    pointerEvents: "none",
    background:
      `radial-gradient(120% 100% at 50% 40%, rgba(0,0,0,0) 40%, rgba(0,0,0,${cfg.vigFilm}) 100%)`,
  });
  hero.insertBefore(shade, overlays);

  /* the honeycomb, drawn once */
  const comb = document.createElement("canvas");
  const combCtx = comb.getContext("2d");
  const buildComb = (ctx, s) => {
    const w = Math.round(s * Math.sqrt(3));
    const h = Math.round(s * 3);
    comb.width = w;
    comb.height = h;
    combCtx.clearRect(0, 0, w, h);
    combCtx.strokeStyle = `rgb(${emission[0]},${emission[1]},${emission[2]})`;
    combCtx.lineWidth = 1;
    const hexAt = (cx, cy) => {
      combCtx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 180) * (60 * i - 30);
        const x = cx + s * Math.cos(a);
        const y = cy + s * Math.sin(a);
        i ? combCtx.lineTo(x, y) : combCtx.moveTo(x, y);
      }
      combCtx.closePath();
      combCtx.stroke();
    };
    hexAt(w / 2, s);
    hexAt(0, s * 2.5);
    hexAt(w, s * 2.5);
    return ctx.createPattern(comb, "repeat");
  };

  const SPECK = 180;
  const speck = document.createElement("canvas");
  speck.width = speck.height = SPECK;
  const speckCtx = speck.getContext("2d");
  const reseed = () => {
    const img = speckCtx.createImageData(SPECK, SPECK);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.random();
      const a = v > 0.88 ? (v - 0.88) / 0.12 : 0;
      img.data[i] = emission[0];
      img.data[i + 1] = emission[1];
      img.data[i + 2] = emission[2];
      img.data[i + 3] = a * 255;
    }
    speckCtx.putImageData(img, 0, 0);
  };
  reseed();

  const layers = [];
  const register = (canvas, grain, hexAmount) => {
    if (!canvas) return;
    layers.push({ canvas, ctx: canvas.getContext("2d"), grain, hexAmount, pattern: null });
  };
  register(filmLayer, cfg.grainFilm, cfg.hexFilm);
  register(pageLayer, cfg.grainPage, cfg.hexPage);

  const size = () => {
    for (const L of layers) {
      const r = L.canvas.getBoundingClientRect();
      L.canvas.width = Math.max(2, Math.round(r.width || window.innerWidth));
      L.canvas.height = Math.max(2, Math.round(r.height || window.innerHeight));
      L.pattern = buildComb(L.ctx, cfg.hexSize);
    }
  };

  /* how much of the page is still the film */
  let filmLevel = 1;
  const gauge = () => {
    if (!hero) return;
    const end = hero.getBoundingClientRect().top + window.scrollY + hero.offsetHeight;
    const t = (window.scrollY - (end - window.innerHeight * 1.4)) / (window.innerHeight * 1.4);
    filmLevel = Math.max(0, Math.min(1, 1 - t));
    if (pageLayer) pageLayer.style.opacity = String(1 - filmLevel);
    shade.style.opacity = String(filmLevel);
  };

  let frames = 0;
  const draw = (t) => {
    const gain = 1 + Math.sin(t * 1.7) * cfg.gain + Math.sin(t * 0.37) * cfg.gain * 0.6;
    if (frames % 3 === 0) reseed();
    frames++;
    for (const L of layers) {
      const { ctx, canvas } = L;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      if (L.hexAmount > 0 && L.pattern) {
        ctx.globalAlpha = L.hexAmount * gain;
        ctx.fillStyle = L.pattern;
        ctx.fillRect(0, 0, w, h);
      }
      if (L.grain > 0) {
        ctx.globalAlpha = L.grain * gain;
        const ox = -Math.floor(Math.random() * SPECK);
        const oy = -Math.floor(Math.random() * SPECK);
        for (let x = ox; x < w; x += SPECK) {
          for (let y = oy; y < h; y += SPECK) ctx.drawImage(speck, x, y);
        }
      }
      ctx.globalAlpha = 1;
    }
  };

  let raf = 0;
  const frame = (ms) => {
    raf = 0;
    if (!document.hidden) {
      draw(ms / 1000);
      raf = requestAnimationFrame(frame);
    }
  };

  size();
  gauge();
  if (layers.length && !reduced) raf = requestAnimationFrame(frame);
  else if (layers.length) draw(0);

  /* A weak GPU in a laptop is not caught by a media query, so the machine is
     measured while it runs, and the effect steps down a rung at a time until it
     can be afforded. Measured on a software renderer at 1440x900, which is the
     closest thing to a slow GPU available here:

       full filter           21 fps
       without the halation  21 fps   (at this size the map itself is the cost)
       a plain css chain     32 fps
       no filter at all      51 fps

     On a phone-sized viewport the map costs nothing, which is why the media
     query only takes the bloom: the picture stays a real gradient map there.
     A chain of fixed-function css filters cannot reproduce a phosphor curve
     exactly, but it is close enough that the difference is hard to see, and it
     is the last rung before the tube would have to go entirely. */
  const CHAIN =
    "grayscale(1) sepia(1) hue-rotate(62deg) saturate(3.4) contrast(1.18) brightness(0.92)";
  if (!reduced && !baked) {
    /* Only frames where the page actually moved are counted, and only their own
       time is added up. The first version of this measured from load and
       downgraded a perfectly fast phone, because what it had really measured
       was the frame sequence fetching and decoding its first frames - nothing
       to do with the filter. Idle gaps are skipped for the same reason: a long
       pause between two scrolls is not a slow frame. */
    let moved = 0;
    let spent = 0;
    let last = performance.now();
    let lastY = window.scrollY;
    let stage = 0;
    const watch = () => {
      const now = performance.now();
      const dt = now - last;
      last = now;
      if (window.scrollY !== lastY && dt < 100) {
        moved++;
        spent += dt;
      }
      lastY = window.scrollY;

      /* Judge sooner the worse it looks: 45 scrolled frames is a reliable
         sample at a healthy rate, but a machine running at 10fps would take
         nine seconds to produce that many - and it is precisely the machine
         that needs the downgrade first. */
      const rough = spent > 0 ? moved / (spent / 1000) : 60;
      if (moved >= 45 || (moved >= 18 && rough < 25)) {
        const fps = moved / (spent / 1000);
        moved = 0;
        spent = 0;
        if (fps < 45 && stage === 0 && bloomOn) {
          stage = 1;
          bloomOn = false;
          buildFilter(false);
        } else if (fps < 42 && stage <= 1) {
          stage = 2;
          style.textContent = `#hero-canvas, ${cfg.media} { filter: ${CHAIN}; }`;
        }
      }
      if (stage < 2) requestAnimationFrame(watch);
    };
    requestAnimationFrame(watch);
  }

  window.addEventListener("scroll", gauge, { passive: true });
  window.addEventListener("resize", () => {
    size();
    gauge();
    if (reduced) draw(0);
  });
  document.addEventListener("visibilitychange", () => {
    if (!raf && !document.hidden && !reduced) raf = requestAnimationFrame(frame);
  });
})();
