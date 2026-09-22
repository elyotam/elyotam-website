/* ---------------------------------------------------------------------------
   SMOKE, AFTER THE FILM

   Domain-warped noise on the GPU, lit from two colours so it has an inside.
   The parts that decide how it BEHAVES are uniforms rather than constants,
   because that is what actually separates one kind of smoke from another:

     where it comes from   a source below the frame, a layer lying on the
                           ground, or wind pushing it in from the sides
     how big it is         one slow billow across the screen, or fine dust
     how fast it ages      the rate the third dimension of the noise advances,
                           which is what makes a plume churn rather than slide
     whether it answers    smoke can surge when the page is scrolled and settle
                           when it stops, which reads as air being disturbed

   The site runs it as fine dust: small, fast, thin, and barely warped, so it
   reads as air that has been disturbed rather than as a fire somewhere.

   The rule that does not change: the middle of the screen is punched out of
   every frame. Text read through smoke is a contrast problem wearing a costume,
   so it gathers at the edges and the reading column measures zero.

   If WebGL is missing the canvas version is loaded instead, rather than leaving
   a hole where the effect was.
--------------------------------------------------------------------------- */
(() => {
  const cfg = Object.assign(
    {
      core: [29, 53, 35],
      rim: [41, 214, 84],
      alpha: 0.7,
      scale: 1.1,
      speed: 0.7,
      hole: 1,
      mask: 0, // 0 rising, 1 lying on the ground, 2 in from the sides
      stretch: 1, // wider than tall, for a layer rather than a column
      age: 1, // how fast it churns
      warp: 1, // how much it curls into itself
      drift: [0.012, 0.07], // its own wind
      surge: 0, // how much it answers the scroll
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
    }) || null;
  if (!gl) {
    const fallback = document.createElement("script");
    fallback.src = "./smoke.js";
    document.body.appendChild(fallback);
    return;
  }
  document.body.appendChild(canvas);

  const VERT = `attribute vec2 p; void main() { gl_Position = vec4(p, 0.0, 1.0); }`;

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
    uniform float uMask;
    uniform float uStretch;
    uniform float uAge;
    uniform float uWarp;
    uniform vec2  uDrift;
    uniform float uSurge;

    float hash(vec3 p) {
      p = fract(p * 0.3183099 + vec3(0.71, 0.113, 0.419));
      p *= 17.0;
      return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
    }
    float noise(vec3 x) {
      vec3 i = floor(x); vec3 f = fract(x);
      f = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
            mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
        mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
            mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
    }
    float fbm(vec3 p) {
      float a = 0.5; float s = 0.0;
      for (int i = 0; i < 5; i++) {
        s += a * noise(p);
        p = p * 2.03 + vec3(1.7, 9.2, 4.1);
        a *= 0.5;
      }
      return s;
    }

    void main() {
      vec2 uv = gl_FragCoord.xy / uRes;
      vec2 st = vec2(uv.x * (uRes.x / uRes.y) / uStretch, uv.y) * (2.2 / uScale);

      float surge = 1.0 + uSurge;
      vec3 p = vec3(st, uTime * 0.05 * uAge * surge)
             - vec3(-uTime * uDrift.x, uTime * uDrift.y * surge + uScroll * 0.0004, 0.0);

      vec3 q = vec3(fbm(p), fbm(p + vec3(5.2, 1.3, 2.8)), fbm(p + vec3(1.7, 9.2, 3.4)));
      vec3 r = vec3(fbm(p + 2.4 * uWarp * q + vec3(1.7, 9.2, 0.0)),
                    fbm(p + 2.4 * uWarp * q + vec3(8.3, 2.8, 5.1)),
                    fbm(p + 2.4 * uWarp * q + vec3(3.1, 6.7, 1.9)));
      float d = fbm(p + 3.2 * uWarp * r);

      /* where the smoke comes from */
      float bias;
      if (uMask < 0.5) {
        bias = mix(1.32, 0.52, smoothstep(-0.15, 1.05, uv.y));       // rising
      } else if (uMask < 1.5) {
        bias = mix(1.5, 0.0, smoothstep(0.0, 0.42, uv.y));           // lying low
      } else {
        bias = mix(0.35, 1.45, smoothstep(0.1, 0.52, abs(uv.x - 0.5))); // from the sides
      }
      d = smoothstep(0.40, 0.92, d * bias);

      float lit = clamp(r.y * 0.85 + q.x * 0.5 - 0.15, 0.0, 1.0);
      lit = smoothstep(0.15, 0.9, lit);
      vec3 col = mix(uCore / 255.0, uRim / 255.0, lit);
      col += (uRim / 255.0) * pow(lit, 3.0) * 0.35;

      vec2 c = (uv - 0.5) * vec2(uRes.x / uRes.y, 1.0);
      float hole = smoothstep(0.17, 0.70, length(c) / max(0.35, uHole));

      float a = d * uAlpha * hole * (1.0 + uSurge * 0.5);
      gl_FragColor = vec4(col * a, a);
    }`;

  const compile = (t, src) => {
    const sh = gl.createShader(t);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh));
    return sh;
  };
  let prog;
  try {
    prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error("link");
  } catch (e) {
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
  const uSurge = U("uSurge");
  gl.uniform3f(U("uCore"), ...cfg.core);
  gl.uniform3f(U("uRim"), ...cfg.rim);
  gl.uniform1f(U("uAlpha"), cfg.alpha);
  gl.uniform1f(U("uScale"), cfg.scale);
  gl.uniform1f(U("uHole"), cfg.hole);
  gl.uniform1f(U("uMask"), cfg.mask);
  gl.uniform1f(U("uStretch"), cfg.stretch);
  gl.uniform1f(U("uAge"), cfg.age);
  gl.uniform1f(U("uWarp"), cfg.warp);
  gl.uniform2f(U("uDrift"), cfg.drift[0], cfg.drift[1]);

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

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
  let level = 0;
  let surge = 0;
  let lastY = window.scrollY;
  const gauge = () => {
    if (!hero) return;
    const end = hero.getBoundingClientRect().top + window.scrollY + hero.offsetHeight;
    level = Math.max(0, Math.min(1, (window.scrollY - (end - window.innerHeight)) / window.innerHeight));
    canvas.style.opacity = String(level);
    if (cfg.surge) {
      /* how fast the page is moving, not how far: smoke answers being disturbed */
      surge = Math.min(1.6, surge + Math.abs(window.scrollY - lastY) / 140);
    }
    lastY = window.scrollY;
  };

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const draw = (t) => {
    gl.uniform1f(uTime, t);
    gl.uniform1f(uScroll, window.scrollY);
    gl.uniform1f(uSurge, surge * cfg.surge);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  let raf = 0;
  const frame = (ms) => {
    raf = 0;
    if (level > 0 && !document.hidden) {
      surge *= 0.94; // it settles when the page stops
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

  window.addEventListener("scroll", () => {
    gauge();
    if (reduced) draw(6);
    else wake();
  }, { passive: true });
  window.addEventListener("resize", () => {
    size();
    gauge();
    if (reduced) draw(6);
  });
  document.addEventListener("visibilitychange", wake);
})();
