// ==========================================================================
// Intro FX — lightweight canvas-2D particle engine for the envelope scene.
// Ambient layer: crimson embers rising from the seal, three depth-blurred
// layers of drifting rose petals (parallax on cursor), gold sparkle motes,
// and a few slow light-beams rotating behind the seal while it loads.
// One-shot layer: burst() spawns a spark shower (seal break) or a petal
// burst (card reveal) at a given viewport point.
//
// No WebGL / Three.js: this project ships no bundler and no 3D asset, and
// the payoff of hand-rolled WebGL primitives without real geometry/shading
// would be a worse "photorealistic" result than a well-art-directed 2D
// particle field, for a lot more runtime cost on the phone this opens on.
// ==========================================================================
window.WED = window.WED || {};

WED.introFx = (() => {
  const COLORS = {
    crimson: "229,9,20",
    ruby: "255,30,66",
    rose: "255,59,92",
    gold: "212,175,55",
  };

  let canvas = null;
  let ctx = null;
  let dpr = 1;
  let w = 0;
  let h = 0;
  let raf = null;
  let running = false;
  let paused = false;
  let preloading = true;
  let beamAngle = 0;
  let beamAlpha = 0;
  let sealEl = null;
  let sealPos = { x: 0, y: 0 };
  let pointer = { x: 0, y: 0 }; // smoothed, normalized -0.5..0.5
  let pointerTarget = { x: 0, y: 0 };
  let embers = [];
  let petals = [];
  let sparkles = [];
  let bursts = [];
  let listeners = [];
  const reduced = () => (window.WED && WED.flags && WED.flags.reducedMotion) || false;
  const coarse = () => (window.WED && WED.flags && WED.flags.coarsePointer) || false;

  function rand(min, max) { return min + Math.random() * (max - min); }
  function pick(arr) { return arr[(Math.random() * arr.length) | 0]; }

  function on(target, type, fn, opts) {
    target.addEventListener(type, fn, opts);
    listeners.push(() => target.removeEventListener(type, fn, opts));
  }

  function resize() {
    if (!canvas) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = Math.max(1, Math.round(w * dpr));
    canvas.height = Math.max(1, Math.round(h * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    updateSealPos();
  }

  function updateSealPos() {
    if (!sealEl || !canvas) return;
    const cr = canvas.getBoundingClientRect();
    const sr = sealEl.getBoundingClientRect();
    sealPos.x = sr.left - cr.left + sr.width / 2;
    sealPos.y = sr.top - cr.top + sr.height / 2;
  }

  // ---- Ambient particle factories --------------------------------------------------
  function spawnEmber(fresh) {
    const ox = sealPos.x || w / 2;
    const oy = sealPos.y || h / 2;
    return {
      x: ox + rand(-46, 46),
      y: fresh ? oy + rand(-16, 16) : oy - rand(0, h * 0.55),
      s: rand(1.3, 3),
      vy: rand(-0.42, -0.18),
      vx: rand(-0.09, 0.09),
      life: 1,
      decay: rand(0.0035, 0.0075),
      color: Math.random() > 0.75 ? COLORS.gold : Math.random() > 0.5 ? COLORS.rose : COLORS.crimson,
    };
  }

  function spawnPetal(layer) {
    layer = layer == null ? (Math.random() * 3) | 0 : layer;
    const depth = [0.35, 0.65, 1][layer]; // 0=far,1=mid,2=near — scales size/speed/opacity
    return {
      layer,
      x: rand(0, w),
      y: rand(-h * 0.2, h),
      s: rand(7, 15) * (0.6 + depth * 0.7),
      rot: rand(0, 360),
      vrot: rand(-10, 10),
      vy: rand(6, 14) * depth * 0.06,
      vx: rand(-3, 3) * depth * 0.05,
      sway: rand(0, Math.PI * 2),
      swaySpeed: rand(0.006, 0.016),
      opacity: rand(0.28, 0.6) * (0.5 + depth * 0.5),
      color: Math.random() > 0.5 ? COLORS.rose : COLORS.crimson,
    };
  }

  function spawnSparkle() {
    return {
      x: rand(0, w),
      y: rand(0, h),
      s: rand(1.2, 2.6),
      phase: rand(0, Math.PI * 2),
      speed: rand(0.02, 0.05),
      vy: rand(-0.08, -0.02),
    };
  }

  function seedAmbient() {
    embers = Array.from({ length: coarse() ? 10 : 16 }, () => spawnEmber(false));
    petals = Array.from({ length: coarse() ? 16 : 26 }, () => spawnPetal());
    sparkles = Array.from({ length: coarse() ? 8 : 14 }, () => spawnSparkle());
  }

  // ---- Drawing --------------------------------------------------
  function drawBeams() {
    if (beamAlpha <= 0.002) return;
    const ox = sealPos.x || w / 2;
    const oy = sealPos.y || h / 2;
    const beams = 5;
    ctx.save();
    ctx.translate(ox, oy);
    ctx.rotate(beamAngle);
    ctx.globalCompositeOperation = "screen";
    for (let i = 0; i < beams; i++) {
      const a = (i / beams) * Math.PI * 2;
      const len = Math.max(w, h) * 0.32;
      const grad = ctx.createLinearGradient(0, 0, Math.cos(a) * len, Math.sin(a) * len);
      grad.addColorStop(0, `rgba(${COLORS.rose}, ${0.09 * beamAlpha})`);
      grad.addColorStop(0.4, `rgba(${COLORS.rose}, ${0.03 * beamAlpha})`);
      grad.addColorStop(1, `rgba(${COLORS.rose}, 0)`);
      ctx.save();
      ctx.rotate(a);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(len, -14);
      ctx.lineTo(len, 14);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  function drawEmber(p, radiusMul) {
    const alpha = Math.max(0, p.life) * (radiusMul ? 0.55 : 0.85);
    if (alpha <= 0.01) return;
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    const r = p.s * (radiusMul || 4);
    const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
    grad.addColorStop(0, `rgba(${p.color}, ${alpha})`);
    grad.addColorStop(1, `rgba(${p.color}, 0)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawPetalShape(x, y, s, rot, color, opacity, blur) {
    ctx.save();
    if (blur) ctx.filter = `blur(${blur}px)`;
    ctx.translate(x, y);
    ctx.rotate((rot * Math.PI) / 180);
    ctx.globalAlpha = opacity;
    const grad = ctx.createLinearGradient(-s / 2, -s / 2, s / 2, s / 2);
    grad.addColorStop(0, `rgba(${color}, 0.95)`);
    grad.addColorStop(1, `rgba(${color}, 0.25)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    // Teardrop / petal silhouette
    ctx.moveTo(0, -s / 2);
    ctx.bezierCurveTo(s / 2, -s / 3, s / 2, s / 3, 0, s / 2);
    ctx.bezierCurveTo(-s / 2, s / 3, -s / 2, -s / 3, 0, -s / 2);
    ctx.fill();
    ctx.restore();
  }

  function drawSparkle(p) {
    const tw = 0.5 + 0.5 * Math.sin(p.phase);
    if (tw <= 0.05) return;
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = tw * 0.8;
    ctx.translate(p.x, p.y);
    const r = p.s * 3.2;
    ctx.strokeStyle = `rgba(${COLORS.gold}, ${tw})`;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(-r, 0); ctx.lineTo(r, 0);
    ctx.moveTo(0, -r); ctx.lineTo(0, r);
    ctx.stroke();
    ctx.restore();
  }

  // ---- Frame step --------------------------------------------------
  function step() {
    if (!running || paused) return;
    ctx.clearRect(0, 0, w, h);

    // Smooth pointer toward target (cheap lerp, no gsap dependency here)
    pointer.x += (pointerTarget.x - pointer.x) * 0.06;
    pointer.y += (pointerTarget.y - pointer.y) * 0.06;

    beamAngle += 0.0012;
    beamAlpha += ((preloading ? 1 : 0) - beamAlpha) * 0.09;
    drawBeams();

    // Petals: far -> near for correct depth stacking
    for (let layer = 0; layer < 3; layer++) {
      const blur = layer === 0 ? 3.5 : layer === 1 ? 1.2 : 0;
      const parallax = [6, 14, 26][layer];
      for (const p of petals) {
        if (p.layer !== layer) continue;
        p.sway += p.swaySpeed;
        p.x += p.vx + Math.sin(p.sway) * 0.3;
        p.y += p.vy;
        p.rot += p.vrot * 0.02;
        if (p.y > h + 30) { Object.assign(p, spawnPetal(layer), { y: -30 }); }
        if (p.x < -30) p.x = w + 30;
        if (p.x > w + 30) p.x = -30;
        drawPetalShape(p.x + pointer.x * parallax, p.y + pointer.y * parallax, p.s, p.rot, p.color, p.opacity, blur);
      }
    }

    for (const p of sparkles) {
      p.phase += p.speed;
      p.y += p.vy;
      if (p.y < -10) p.y = h + 10;
      drawSparkle(p);
    }

    for (let i = embers.length - 1; i >= 0; i--) {
      const p = embers[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;
      if (p.life <= 0 || p.y < -20) { embers[i] = spawnEmber(true); continue; }
      drawEmber(p);
    }

    for (let i = bursts.length - 1; i >= 0; i--) {
      const p = bursts[i];
      p.vy += p.gravity || 0;
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= p.drag || 1;
      p.vy *= p.drag || 1;
      p.rot += (p.vrot || 0) * 0.02;
      p.life -= p.decay;
      if (p.life <= 0) { bursts.splice(i, 1); continue; }
      if (p.kind === "petal") {
        drawPetalShape(p.x, p.y, p.s, p.rot, p.color, Math.max(0, p.life) * p.opacity, 0);
      } else {
        drawEmber(p, 1.8);
      }
    }

    raf = requestAnimationFrame(step);
  }

  // ---- Public API --------------------------------------------------
  function init(canvasEl, seal) {
    if (!canvasEl || !canvasEl.getContext) return;
    canvas = canvasEl;
    ctx = canvas.getContext("2d");
    sealEl = seal || null;

    if (reduced()) {
      // Reduced motion: draw one calm static frame, no RAF loop, no listeners.
      resize();
      seedAmbient();
      ctx.clearRect(0, 0, w, h);
      return;
    }

    resize();
    seedAmbient();

    on(window, "resize", WED.debounce(resize, 150));
    on(document, "visibilitychange", () => { paused = document.hidden; if (!paused && running) step(); });

    if (!coarse()) {
      on(window, "mousemove", (e) => {
        pointerTarget.x = (e.clientX / window.innerWidth - 0.5) * 2;
        pointerTarget.y = (e.clientY / window.innerHeight - 0.5) * 2;
      }, { passive: true });
    }

    running = true;
    paused = false;
    step();
  }

  function setPreloading(state) { preloading = !!state; }

  function burst(x, y, opts) {
    if (!canvas || reduced()) return;
    opts = opts || {};
    const type = opts.type === "petal" ? "petal" : "spark";
    const count = opts.count || (type === "petal" ? 16 : 16);
    for (let i = 0; i < count; i++) {
      const angle = rand(0, Math.PI * 2);
      if (type === "spark") {
        const speed = rand(3.5, 8);
        const r0 = rand(2, 8); // small initial radial offset so sparks don't all overlap at frame 0
        bursts.push({
          kind: "spark",
          x: x + Math.cos(angle) * r0,
          y: y + Math.sin(angle) * r0,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          s: rand(1.1, 2.2),
          life: 1,
          decay: rand(0.016, 0.026),
          drag: 0.92,
          gravity: 0.03,
          color: pick([COLORS.rose, COLORS.crimson, COLORS.gold]),
        });
      } else {
        const speed = rand(1.2, 3.4);
        bursts.push({
          kind: "petal",
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1.2,
          rot: rand(0, 360),
          vrot: rand(-6, 6),
          s: rand(8, 16),
          life: 1,
          decay: rand(0.006, 0.011),
          drag: 0.985,
          gravity: 0.045,
          opacity: rand(0.55, 0.9),
          color: Math.random() > 0.5 ? COLORS.rose : COLORS.crimson,
        });
      }
    }
    if (!running && canvas) { running = true; paused = false; step(); }
  }

  function stop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = null;
    listeners.forEach((off) => off());
    listeners = [];
    embers = []; petals = []; sparkles = []; bursts = [];
    if (canvas) {
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      canvas.width = 0;
      canvas.height = 0;
    }
    canvas = null;
    ctx = null;
  }

  return { init, burst, setPreloading, updateSealPos, stop };
})();
