// ==========================================================================
// Shared utilities + global flags
// ==========================================================================
window.WED = window.WED || {};

WED.flags = {
  reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  coarsePointer: window.matchMedia("(hover: none), (pointer: coarse)").matches,
};

WED.clamp = (v, min, max) => Math.min(Math.max(v, min), max);
WED.lerp = (a, b, t) => a + (b - a) * t;
WED.pad2 = (n) => String(Math.max(0, Math.trunc(n))).padStart(2, "0");

WED.debounce = (fn, wait = 150) => {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
};

WED.onReady = (fn) => {
  if (document.readyState !== "loading") fn();
  else document.addEventListener("DOMContentLoaded", fn);
};

// ---- Lightweight confetti / petal burst (canvas-based) --------------------------------------------------
WED.confetti = (() => {
  const canvas = document.getElementById("confettiCanvas");
  if (!canvas) return { burst() {} };
  const ctx = canvas.getContext("2d");
  let particles = [];
  let raf = null;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener("resize", WED.debounce(resize, 200));

  const colors = ["#c9a35f", "#e8d4a3", "#c99a8d", "#0f3d30", "#fbf6ec"];

  function burst({ x, y, count = 90 } = {}) {
    if (WED.flags.reducedMotion) return;
    const originX = x ?? canvas.width / 2;
    const originY = y ?? canvas.height / 3;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 7;
      particles.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 4,
        size: 4 + Math.random() * 6,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.3,
        color: colors[(Math.random() * colors.length) | 0],
        life: 0,
        maxLife: 70 + Math.random() * 50,
        shape: Math.random() > 0.5 ? "rect" : "circle",
      });
    }
    if (!raf) tick();
  }

  function tick() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((p) => {
      p.life++;
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.12;
      p.vx *= 0.99;
      p.rot += p.vr;
      const alpha = WED.clamp(1 - p.life / p.maxLife, 0, 1);
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      if (p.shape === "rect") {
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });
    particles = particles.filter((p) => p.life < p.maxLife);
    if (particles.length) {
      raf = requestAnimationFrame(tick);
    } else {
      raf = null;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  return { burst };
})();
