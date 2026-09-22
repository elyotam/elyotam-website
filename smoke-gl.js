/* ---------------------------------------------------------------------------
   VOLUMETRIC SMOKE, AFTER THE FILM

   The first attempt was three sheets of noise slid past each other. That is
   haze: it has no inside. This is the real thing, on the GPU.

   What makes it read as smoke rather than as a moving texture:

   - DOMAIN WARPING. The noise is not sampled straight; it is sampled at a
     position that is itself displaced by noise, twice. That is what produces
     billows that curl into themselves instead of blobs that fade in and out.
   - IT RISES AND IT AGES. The sample point drifts upward while its third
     dimension advances with time, so a plume is not a still shape being moved -
     it churns as it climbs, the way smoke does.
   - LIGHT. The warp field is reused as a cheap normal: where the smoke turns
     towards the light it takes the rim colour, where it turns away it keeps the
     core. A single flat colour is a cloud sticker; two, placed by the shape's
     own geometry, is volume.
   - IT COMES FROM SOMEWHERE. Density is biased to the bottom of the screen and
     thins as it climbs, so the smoke has a source off the bottom edge rather
     than filling the frame evenly.

   And the rule from the first version stands: the middle of the screen is
   punched out, because text read through smoke is a contrast problem wearing a
   costume. The smoke gathers at the edges and the reading column stays clean.

   It starts where the film ends, stops drawing when it cannot be seen, draws a
   single still frame for reduced motion, and if WebGL is unavailable it loads
   the canvas version instead rather than leaving a hole in the page.
--------------------------------------------------------------------------- */
(() => {
  const cfg = Object.assign(
    {
      core: [120, 110, 100],
      rim: [238, 153, 34],
      alpha: 0.85,
      speed: 1,
      scale: 1,
      hole: 1,
      detail: 1,
    },
    window.SMOKE || {}
  );

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
    opacity: "0",
    transition: "opacity .5s linear",
  });

  const gl =
    canvas.getContext("webgl", {
      alpha: true,
      antialias: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: true,
    }) ||
    canvas.getContext("experimental-webgl", { alpha: true, preserveDrawingBuffer: true });

  if (!gl) {
    const fallback = document.createElement("script");
    fallback.src = "./smoke.js";
    document.body.appendChild(fallback);
    return;
  }
  document.body.appendChild(canvas);

  const VERT = `
    attribute vec2 p;
    void main() { gl_Position = vec4(p, 0.0, 1.0); }
  `;

  const FRAG = `
    precision highp float;
    uniform vec2  uRes;
    uniform float uTime;
    uniform float uScroll;
    uniform vec3  uCore;
    uniform vec3  uRim;
    uniform float uAlpha;
    uniform float uScale;
    uniform float uHole;

    float hash(vec3 p) {
      p = fract(p * 0.3183099 + vec3(0.71, 0.113, 0.419));
      p *= 17.0;
      return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
    }

    float noise(vec3 x) {
      vec3 i = floor(x);
      vec3 f = fract(x);
      f = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
            mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
        mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
            mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y),
        f.z);
    }

    float fbm(vec3 p) {
      float a = 0.5;
      float s = 0.0;
      for (int i = 0; i < 5; i++) {
        s += a * noise(p);
        p = p * 2.03 + vec3(1.7, 9.2, 4.1);
        a *= 0.5;
      }
      return s;
    }

    void main() {
      vec2 uv = gl_FragCoord.xy / uRes;
      /* aspect-corrected, so the billows are not stretched on a wide window */
      vec2 st = vec2(uv.x * (uRes.x / uRes.y), uv.y) * (2.2 / uScale);

      /* the plume rises while its third dimension advances: it churns as it
         climbs instead of sliding past as a fixed shape */
      /* a little wind, so the column leans instead of rising like a chimney */
      vec3 p = vec3(st, uTime * 0.05)
             - vec3(-uTime * 0.012, uTime * 0.07 + uScroll * 0.0004, 0.0);

      vec3 q = vec3(fbm(p),
                    fbm(p + vec3(5.2, 1.3, 2.8)),
                    fbm(p + vec3(1.7, 9.2, 3.4)));
      vec3 r = vec3(fbm(p + 2.4 * q + vec3(1.7, 9.2, 0.0)),
                    fbm(p + 2.4 * q + vec3(8.3, 2.8, 5.1)),
                    fbm(p + 2.4 * q + vec3(3.1, 6.7, 1.9)));
      float d = fbm(p + 3.2 * r);

      /* a source off the bottom edge: thick low, thinning as it climbs, but
         still reaching well up the frame - a band along the bottom edge reads
         as a burning strip, not as a room with smoke in it */
      float rise = mix(1.32, 0.52, smoothstep(-0.15, 1.05, uv.y));
      d = smoothstep(0.40, 0.92, d * rise);

      /* the warp field doubles as a normal: where the billow turns towards the
         light it takes the rim colour, where it turns away it stays in the core */
      float lit = clamp(r.y * 0.85 + q.x * 0.5 - 0.15, 0.0, 1.0);
      lit = smoothstep(0.15, 0.9, lit);
      vec3 col = mix(uCore / 255.0, uRim / 255.0, lit);
      /* the brightest curls carry a little more light still */
      col += (uRim / 255.0) * pow(lit, 3.0) * 0.35;

      /* nothing is ever read through smoke: the reading column is cut out */
      vec2 c = (uv - 0.5) * vec2(uRes.x / uRes.y, 1.0);
      float hole = smoothstep(0.17, 0.70, length(c) / max(0.35, uHole));

      float a = d * uAlpha * hole;
      gl_FragColor = vec4(col * a, a);
    }
  `;

  const compile = (type, src) => {
    const sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(sh) || "shader");
    }
    return sh;
  };

  let prog;
  try {
    prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error("link");
  } catch (err) {
    canvas.remove();
    const fallback = document.createElement("script");
    fallback.src = "./smoke.js";
    document.body.appendChild(fallback);
    return;
  }
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "p");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const U = (n) => gl.getUniformLocation(prog, n);
  const uRes = U("uRes");
  const uTime = U("uTime");
  const uScroll = U("uScroll");
  gl.uniform3f(U("uCore"), cfg.core[0], cfg.core[1], cfg.core[2]);
  gl.uniform3f(U("uRim"), cfg.rim[0], cfg.rim[1], cfg.rim[2]);
  gl.uniform1f(U("uAlpha"), cfg.alpha);
  gl.uniform1f(U("uScale"), cfg.scale);
  gl.uniform1f(U("uHole"), cfg.hole);

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

  /* the noise is smooth, so it can be drawn well under native resolution and
     scaled up by the compositor for a quarter of the fragments */
  const SHRINK = 0.55;
  const size = () => {
    const w = Math.max(2, Math.round(window.innerWidth * SHRINK));
    const h = Math.max(2, Math.round(window.innerHeight * SHRINK));
    canvas.width = w;
    canvas.height = h;
    gl.viewport(0, 0, w, h);
    gl.uniform2f(uRes, w, h);
  };

  const hero = document.querySelector("#hero");
  const start = () => {
    if (!hero) return 0;
    return hero.getBoundingClientRect().top + window.scrollY + hero.offsetHeight;
  };

  let level = 0;
  const gauge = () => {
    const from = start() - window.innerHeight;
    level = Math.max(0, Math.min(1, (window.scrollY - from) / window.innerHeight));
    canvas.style.opacity = String(level);
  };

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const draw = (t) => {
    gl.uniform1f(uTime, t);
    gl.uniform1f(uScroll, window.scrollY);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  let raf = 0;
  const frame = (ms) => {
    raf = 0;
    if (level > 0 && !document.hidden) {
      draw((ms / 1000) * cfg.speed);
      raf = requestAnimationFrame(frame);
    }
  };
  const wake = () => {
    if (!raf && level > 0 && !document.hidden && !reduced) raf = requestAnimationFrame(frame);
  };

  size();
  gauge();
  if (reduced) draw(6);
  else wake();

  window.addEventListener(
    "scroll",
    () => {
      gauge();
      if (reduced) draw(6);
      else wake();
    },
    { passive: true }
  );
  window.addEventListener("resize", () => {
    size();
    gauge();
    if (reduced) draw(6);
    else wake();
  });
  document.addEventListener("visibilitychange", wake);
})();
