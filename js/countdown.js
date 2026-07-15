// ==========================================================================
// Countdown timer + ambient particles
// ==========================================================================
WED.onReady(() => {
  const el = document.getElementById("countdown");
  if (!el) return;
  const targetDate = new Date(el.getAttribute("data-wedding-date")).getTime();

  const nodes = {
    days: document.getElementById("cd-days"),
    hours: document.getElementById("cd-hours"),
    minutes: document.getElementById("cd-minutes"),
    seconds: document.getElementById("cd-seconds"),
  };
  const prevValues = { days: null, hours: null, minutes: null, seconds: null };

  function pulse(node) {
    if (typeof gsap === "undefined" || WED.flags.reducedMotion) return;
    gsap.fromTo(node, { y: -6, opacity: 0.4 }, { y: 0, opacity: 1, duration: 0.4, ease: "power2.out" });
  }

  function tick() {
    const now = Date.now();
    let diff = Math.max(0, targetDate - now);

    const days = Math.floor(diff / 86400000);
    diff -= days * 86400000;
    const hours = Math.floor(diff / 3600000);
    diff -= hours * 3600000;
    const minutes = Math.floor(diff / 60000);
    diff -= minutes * 60000;
    const seconds = Math.floor(diff / 1000);

    const values = { days, hours, minutes, seconds };
    Object.keys(values).forEach((key) => {
      if (prevValues[key] !== values[key]) {
        nodes[key].textContent = WED.pad2(values[key]);
        pulse(nodes[key]);
        prevValues[key] = values[key];
      }
    });
  }

  tick();
  setInterval(tick, 1000);

  // ---- Ambient particles --------------------------------------------------
  const canvas = document.getElementById("countdownParticles");
  if (!canvas || WED.flags.reducedMotion) return;
  const ctx = canvas.getContext("2d");
  let w, h, particles;

  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    w = canvas.width = rect.width;
    h = canvas.height = rect.height;
  }
  resize();
  window.addEventListener("resize", WED.debounce(resize, 200));

  particles = Array.from({ length: 40 }, () => ({
    x: Math.random() * 2000,
    y: Math.random() * 800,
    r: 0.6 + Math.random() * 1.8,
    vy: 0.15 + Math.random() * 0.35,
    phase: Math.random() * Math.PI * 2,
  }));

  let visible = false;
  const io = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting), { threshold: 0.05 });
  io.observe(canvas);

  function draw(t) {
    if (visible) {
      ctx.clearRect(0, 0, w, h);
      particles.forEach((p) => {
        p.y -= p.vy;
        if (p.y < -10) p.y = h + 10;
        const x = p.x % w;
        const glow = 0.35 + 0.65 * Math.abs(Math.sin(t / 1400 + p.phase));
        ctx.beginPath();
        ctx.fillStyle = `rgba(232, 212, 163, ${glow * 0.7})`;
        ctx.arc(x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });
    }
    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
});
