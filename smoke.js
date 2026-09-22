/* ---------------------------------------------------------------------------
   SMOKE, AFTER THE FILM

   Three sheets of drifting noise in front of the page, starting where the
   footage ends. Three things make it read as smoke rather than as a filter:

   - it is one tileable noise texture, generated once at four octaves, drawn at
     three different scales and speeds. Parallax between the sheets is what the
     eye reads as depth; a single sheet reads as a moving stain.
   - it drifts on its own AND with the scroll, so it belongs to the page instead
     of floating over it.
   - the middle of the screen is punched out of every frame. Smoke over a column
     of text is a contrast problem wearing a costume - this way it gathers at the
     edges and the reading column stays exactly as legible as it was.

   It starts at zero as the film ends and comes up over one screen. It stops
   drawing when it is invisible, when the tab is hidden, and it draws a single
   still frame for anyone who asked for reduced motion.
--------------------------------------------------------------------------- */
(() => {
  const cfg = Object.assign(
    {
      colour: [217, 201, 168],
      second: null,
      alpha: 0.22,
      blend: "screen",
      blur: 26,
      speed: 1,
      rise: -1,
      scale: 1,
    },
    window.SMOKE || {}
  );

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canvas = document.createElement("canvas");
  canvas.className = "smoke-layer";
  canvas.setAttribute("aria-hidden", "true");
  Object.assign(canvas.style, {
    position: "fixed",
    inset: "0",
    width: "100%",
    height: "100%",
    zIndex: "60",
    pointerEvents: "none",
    mixBlendMode: cfg.blend,
    filter: `blur(${cfg.blur}px)`,
    opacity: "0",
    transition: "opacity .4s linear",
  });
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  /* ---- one tileable noise texture, four octaves ---- */
  const N = 256;
  const lattice = (size) => {
    const g = new Float32Array(size * size);
    for (let i = 0; i < g.length; i++) g[i] = Math.random();
    return g;
  };
  const sample = (g, size, x, y) => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const tx = x - xi;
    const ty = y - yi;
    const sx = tx * tx * (3 - 2 * tx);
    const sy = ty * ty * (3 - 2 * ty);
    const i = (a, b) => g[((b % size) + size) % size * size + (((a % size) + size) % size)];
    const a = i(xi, yi) + (i(xi + 1, yi) - i(xi, yi)) * sx;
    const b = i(xi, yi + 1) + (i(xi + 1, yi + 1) - i(xi, yi + 1)) * sx;
    return a + (b - a) * sy;
  };

  const sprite = (rgb) => {
    const c = document.createElement("canvas");
    c.width = c.height = N;
    const k = c.getContext("2d");
    const img = k.createImageData(N, N);
    const octaves = [
      [lattice(4), 4, 0.5],
      [lattice(8), 8, 0.27],
      [lattice(16), 16, 0.15],
      [lattice(32), 32, 0.08],
    ];
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        let v = 0;
        for (const [g, size, amp] of octaves) {
          v += sample(g, size, (x / N) * size, (y / N) * size) * amp;
        }
        /* pushed away from the middle: smoke is thick in places and absent in
           others, and a flat average of noise is fog, not smoke */
        v = Math.max(0, Math.min(1, (v - 0.38) * 2.1));
        const i = (y * N + x) * 4;
        img.data[i] = rgb[0];
        img.data[i + 1] = rgb[1];
        img.data[i + 2] = rgb[2];
        img.data[i + 3] = v * 255;
      }
    }
    k.putImageData(img, 0, 0);
    return c;
  };

  const sheets = [sprite(cfg.colour), sprite(cfg.second || cfg.colour), sprite(cfg.colour)];
  const LAYERS = [
    { sheet: 0, scale: 5.5, speed: 0.011, drift: 0.05, alpha: 1 },
    { sheet: 1, scale: 3.2, speed: 0.019, drift: 0.11, alpha: 0.8 },
    { sheet: 2, scale: 1.9, speed: 0.032, drift: 0.2, alpha: 0.55 },
  ];

  let w = 0;
  let h = 0;
  let dpr = 1;
  const size = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    w = canvas.width = Math.round(window.innerWidth * dpr);
    h = canvas.height = Math.round(window.innerHeight * dpr);
  };

  /* where the film stops being the page */
  const hero = document.querySelector("#hero");
  const start = () => {
    if (!hero) return 0;
    const r = hero.getBoundingClientRect();
    return r.top + window.scrollY + hero.offsetHeight;
  };

  let level = 0;
  const gauge = () => {
    const from = start() - window.innerHeight;
    const t = (window.scrollY - from) / window.innerHeight;
    level = Math.max(0, Math.min(1, t));
    canvas.style.opacity = String(level);
  };

  const draw = (time) => {
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = "source-over";
    for (const L of LAYERS) {
      const s = L.scale * cfg.scale;
      const tw = w * s;
      const th = h * s;
      const x = -((time * L.speed * cfg.speed * 60) % tw);
      const y =
        -((time * L.speed * cfg.speed * 24 * cfg.rise + window.scrollY * L.drift * dpr) % th);
      ctx.globalAlpha = cfg.alpha * L.alpha;
      for (let ox = x; ox < w; ox += tw) {
        for (let oy = y - th; oy < h; oy += th) {
          ctx.drawImage(sheets[L.sheet], ox, oy, tw, th);
        }
      }
    }
    /* the reading column is punched back out, so nothing is ever read through
       smoke; it gathers at the edges instead */
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "destination-out";
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.52);
    g.addColorStop(0, "rgba(0,0,0,1)");
    g.addColorStop(0.42, "rgba(0,0,0,0.82)");
    g.addColorStop(0.78, "rgba(0,0,0,0.12)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  };

  let raf = 0;
  const frame = (t) => {
    raf = 0;
    if (level > 0 && !document.hidden) {
      draw(t / 1000);
      raf = requestAnimationFrame(frame);
    }
  };
  const wake = () => {
    if (!raf && level > 0 && !document.hidden && !reduced) raf = requestAnimationFrame(frame);
  };

  size();
  gauge();
  if (reduced) {
    draw(0);
  } else {
    wake();
  }
  window.addEventListener(
    "scroll",
    () => {
      gauge();
      if (reduced) draw(0);
      else wake();
    },
    { passive: true }
  );
  window.addEventListener("resize", () => {
    size();
    gauge();
    if (reduced) draw(0);
    else wake();
  });
  document.addEventListener("visibilitychange", wake);
})();
