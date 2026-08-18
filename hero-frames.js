/* ============================================================
   FRAME SEQUENCE PLAYER
   ------------------------------------------------------------
   Streams the WebP hero sequence (800 desktop / 480 mobile)
   straight onto a canvas, with no external dependencies.

   The frames are 2560x1440, so a decoded one costs ~14MB. Two
   things keep that in bounds: at most `inflight` requests are ever
   open at once (firing the whole look-ahead window on every draw
   exhausted the socket pool and threw ERR_NO_BUFFER_SPACE), and
   the cache is trimmed to `cap` frames nearest the playhead.
   ============================================================ */

export function createFrameSequence(canvas, options = {}) {
  const ctx = canvas.getContext("2d", { alpha: false, desynchronized: true });
  if (!ctx) throw new Error("createFrameSequence: 2D context unavailable");

  const isMobile = window.matchMedia("(max-width: 768px)").matches;
  const config = isMobile
    ? { folder: "frames-mobile", count: 480, ahead: 20, behind: 8, cap: 110, inflight: 4 }
    : { folder: "frames", count: 800, ahead: 26, behind: 10, cap: 80, inflight: 6 };

  /** decoded frames, keyed by index */
  const cache = new Map();
  /** requested-but-unresolved frames: index -> { promise, resolve, started } */
  const pending = new Map();
  let inflight = 0;

  /** the frame we are drawing towards, requests nearest it are served first */
  let playhead = 0;
  let currentFrame = 0;

  const pad4 = (n) => String(n + 1).padStart(4, "0");
  const frameUrl = (index) => `./${config.folder}/frame_${pad4(index)}.webp`;

  /* ---------- loading ---------- */

  function request(index) {
    if (index < 0 || index >= config.count) return Promise.resolve(null);
    const hit = cache.get(index);
    if (hit) return Promise.resolve(hit);
    const queued = pending.get(index);
    if (queued) return queued.promise;

    const entry = { started: false };
    entry.promise = new Promise((resolve) => {
      entry.resolve = resolve;
    });
    pending.set(index, entry);
    pump();
    return entry.promise;
  }

  /** fill the free request slots with whatever is queued closest to the playhead */
  function pump() {
    while (inflight < config.inflight) {
      let next = -1;
      let nearest = Infinity;
      for (const [index, entry] of pending) {
        if (entry.started) continue;
        const distance = Math.abs(index - playhead);
        if (distance < nearest) {
          nearest = distance;
          next = index;
        }
      }
      if (next < 0) return;
      begin(next, pending.get(next));
    }
  }

  function begin(index, entry) {
    entry.started = true;
    inflight += 1;

    const img = new Image();
    img.decoding = "async";
    const settle = (value) => {
      inflight -= 1;
      pending.delete(index);
      if (value) cache.set(index, value);
      entry.resolve(value);
      pump();
    };
    img.onload = () => settle(img);
    img.onerror = () => settle(null);
    img.src = frameUrl(index);
  }

  /** a fast scrub queues frames we have already scrolled past, let them go */
  function trimQueue() {
    const reach = config.ahead * 2;
    for (const [index, entry] of pending) {
      if (entry.started || Math.abs(index - playhead) <= reach) continue;
      pending.delete(index);
      entry.resolve(null);
    }
  }

  /** keep the cache to `cap` frames, dropping the ones furthest from the playhead */
  function evict() {
    if (cache.size <= config.cap) return;
    const furthestFirst = [...cache.keys()].sort(
      (a, b) => Math.abs(b - playhead) - Math.abs(a - playhead)
    );
    for (const index of furthestFirst) {
      if (cache.size <= config.cap) break;
      cache.delete(index);
    }
  }

  function warmWindow(index) {
    playhead = index;
    trimQueue();
    for (let d = 0; d <= config.ahead; d++) request(index + d);
    for (let d = 1; d <= config.behind; d++) request(index - d);
  }

  /* ---------- drawing ---------- */

  function nearestLoaded(index) {
    if (cache.has(index)) return cache.get(index);
    for (let dist = 1; dist < config.count; dist++) {
      if (cache.has(index - dist)) return cache.get(index - dist);
      if (cache.has(index + dist)) return cache.get(index + dist);
    }
    return null;
  }

  function drawImageCover(image) {
    const nw = image.naturalWidth || 1920;
    const nh = image.naturalHeight || 1080;
    const scale = Math.max(canvas.width / nw, canvas.height / nh);
    const width = nw * scale;
    const height = nh * scale;
    ctx.drawImage(image, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);
  }

  function drawFrame(index) {
    const idx = Math.max(0, Math.min(config.count - 1, Math.round(index)));
    warmWindow(idx);
    evict();
    const img = nearestLoaded(idx);
    if (!img) return;
    drawImageCover(img);
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(window.innerWidth * dpr);
    canvas.height = Math.round(window.innerHeight * dpr);
    drawFrame(currentFrame);
  }

  function drawAt(progress) {
    const targetFrame = Math.max(0, Math.min(1, progress)) * (config.count - 1);
    currentFrame += (targetFrame - currentFrame) * 0.35;
    drawFrame(currentFrame);
  }

  async function preloadAll(onProgress, initialCount = 20) {
    const target = Math.min(initialCount, config.count);
    for (let i = 0; i < target; i++) {
      await request(i);
      onProgress?.((i + 1) / target);
    }
    warmWindow(0);
    drawFrame(0);
  }

  resize();
  return { frameCount: config.count, drawAt, resize, preloadAll };
}
