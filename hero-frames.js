/* ============================================================
   FRAME SEQUENCE PLAYER (velaarmon-animation-package Engine)
   ------------------------------------------------------------
   Preloads and streams WebP image sequence (800 desktop / 480 mobile)
   directly onto HTML5 canvas with zero external dependencies.
   ============================================================ */

export function createFrameSequence(canvas, options = {}) {
  const ctx = canvas.getContext("2d", { alpha: false, desynchronized: true });
  if (!ctx) throw new Error("createFrameSequence: 2D context unavailable");

  const isMobile = window.matchMedia("(max-width: 768px)").matches;
  const config = isMobile
    ? { folder: "frames-mobile", count: 480, ahead: 24, behind: 10 }
    : { folder: "frames", count: 800, ahead: 40, behind: 16 };

  const cache = new Map();
  const loading = new Map();
  let currentFrame = 0;
  let targetFrame = 0;

  const pad4 = (n) => String(n + 1).padStart(4, "0");
  const frameUrl = (index) => `./${config.folder}/frame_${pad4(index)}.webp`;

  function loadFrame(index) {
    if (index < 0 || index >= config.count) return Promise.resolve(null);
    if (cache.has(index)) return Promise.resolve(cache.get(index));
    if (loading.has(index)) return loading.get(index);

    const promise = new Promise((resolve) => {
      const img = new Image();
      img.decoding = "async";
      img.onload = () => {
        cache.set(index, img);
        loading.delete(index);
        resolve(img);
      };
      img.onerror = () => {
        loading.delete(index);
        resolve(null);
      };
      img.src = frameUrl(index);
    });

    loading.set(index, promise);
    return promise;
  }

  function warmWindow(index) {
    for (let d = 0; d <= config.ahead; d++) loadFrame(index + d);
    for (let d = 1; d <= config.behind; d++) loadFrame(index - d);
  }

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
    targetFrame = Math.max(0, Math.min(1, progress)) * (config.count - 1);
    currentFrame += (targetFrame - currentFrame) * 0.35;
    drawFrame(currentFrame);
  }

  async function preloadAll(onProgress, initialCount = 20) {
    const target = Math.min(initialCount, config.count);
    for (let i = 0; i < target; i++) {
      await loadFrame(i);
      onProgress?.((i + 1) / target);
    }
    warmWindow(0);
    drawFrame(0);
  }

  resize();
  return { frameCount: config.count, drawAt, resize, preloadAll };
}
