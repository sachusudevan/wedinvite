// ==========================================================================
// Intro Gate — preloads key assets, animates the seal ring, handles entrance
// ==========================================================================
WED.onReady(() => {
  const gate = document.getElementById("introGate");
  const ringProgress = document.getElementById("introRingProgress");
  const enterBtn = document.getElementById("introEnter");
  const enterLabel = document.getElementById("enterLabel");
  const enterProgress = document.getElementById("enterProgress");
  const wipe = document.getElementById("introWipe");
  const fireflyCanvas = document.getElementById("introFireflies");
  if (!gate) return;

  const CIRCUMFERENCE = 2 * Math.PI * 90;
  ringProgress.style.strokeDasharray = `${CIRCUMFERENCE}`;
  ringProgress.style.strokeDashoffset = `${CIRCUMFERENCE}`;

  const criticalImages = [
    "assets/images/optimized/md/IMG_3465.webp",
    "assets/images/optimized/md/IMG_9534.webp",
  ];

  let progress = 0;
  const setProgress = (p) => {
    progress = WED.clamp(p, 0, 100);
    ringProgress.style.strokeDashoffset = `${CIRCUMFERENCE * (1 - progress / 100)}`;
    enterProgress.textContent = `${Math.round(progress)}%`;
  };

  const fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  const imagesReady = Promise.all(
    criticalImages.map(
      (src) =>
        new Promise((resolve) => {
          const img = new Image();
          img.onload = img.onerror = resolve;
          img.src = src;
        })
    )
  );

  let done = false;
  const minTimer = new Promise((resolve) => setTimeout(resolve, 1400));

  // Smoothly animate toward 90% while assets load, jump to 100% when ready.
  let tick = setInterval(() => {
    if (!done) setProgress(Math.min(90, progress + (90 - progress) * 0.06 + 0.4));
  }, 60);

  Promise.all([fontsReady, imagesReady, minTimer]).then(() => {
    done = true;
    clearInterval(tick);
    setProgress(100);
    enterLabel.textContent = "Enter";
    enterBtn.disabled = false;
    enterBtn.classList.add("is-ready");
  });

  // ---- Fireflies backdrop --------------------------------------------------
  if (fireflyCanvas && !WED.flags.reducedMotion) {
    const ctx = fireflyCanvas.getContext("2d");
    let w, h, flies;
    const resize = () => {
      w = fireflyCanvas.width = fireflyCanvas.offsetWidth;
      h = fireflyCanvas.height = fireflyCanvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", WED.debounce(resize, 200));
    flies = Array.from({ length: 26 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: 0.6 + Math.random() * 1.6,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      phase: Math.random() * Math.PI * 2,
    }));
    let raf;
    const draw = (t) => {
      ctx.clearRect(0, 0, w, h);
      flies.forEach((f) => {
        f.x += f.vx;
        f.y += f.vy;
        if (f.x < 0 || f.x > w) f.vx *= -1;
        if (f.y < 0 || f.y > h) f.vy *= -1;
        const glow = 0.3 + 0.7 * Math.abs(Math.sin(t / 1000 + f.phase));
        ctx.beginPath();
        ctx.fillStyle = `rgba(232, 212, 163, ${glow * 0.8})`;
        ctx.arc(f.x, f.y, f.r * 2, 0, Math.PI * 2);
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    gate.addEventListener("transitionend", () => {}, { once: true });
    WED._stopFireflies = () => cancelAnimationFrame(raf);
  }

  enterBtn.addEventListener("click", () => {
    if (enterBtn.disabled) return;
    document.dispatchEvent(new CustomEvent("intro:enter"));

    const rect = enterBtn.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    gate.classList.add("is-leaving");

    const maxDim = Math.hypot(Math.max(cx, window.innerWidth - cx), Math.max(cy, window.innerHeight - cy));

    if (typeof gsap !== "undefined" && !WED.flags.reducedMotion) {
      const proxy = { r: 0 };
      gsap.timeline()
        .to(".intro-content", { opacity: 0, y: -20, duration: 0.45, ease: "power2.in" }, 0)
        .to(
          proxy,
          {
            r: maxDim + 40,
            duration: 1.05,
            ease: "power3.inOut",
            onUpdate: () => {
              wipe.style.clipPath = `circle(${proxy.r}px at ${cx}px ${cy}px)`;
            },
          },
          0.1
        )
        .call(() => {
          gate.style.display = "none";
          if (WED._stopFireflies) WED._stopFireflies();
          document.dispatchEvent(new CustomEvent("intro:complete"));
        });
    } else {
      gate.style.display = "none";
      document.dispatchEvent(new CustomEvent("intro:complete"));
    }
  });
});
