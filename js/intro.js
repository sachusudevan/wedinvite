// ==========================================================================
// Intro Gate — ripped-paper invitation card + silk ribbon entrance
// Preloads key assets, then waits for a click/tap on the ribbon to untie it,
// let the panels swing open, and cross-fade into the main invitation.
// ==========================================================================
WED.onReady(() => {
  const gate = document.getElementById("introGate");
  const card = document.getElementById("inviteCard");
  const panelLeft = document.getElementById("panelLeft");
  const panelRight = document.getElementById("panelRight");
  const seamShadow = document.getElementById("seamShadow");
  const ribbon = document.getElementById("inviteRibbon");
  const ribbonKnot = document.getElementById("ribbonKnot");
  const ribbonHint = document.getElementById("ribbonHint");
  const fireflyCanvas = document.getElementById("introFireflies");
  if (!gate || !ribbon) return;

  const criticalImages = [
    "assets/images/optimized/md/IMG_9534.webp",
    "assets/images/optimized/md/IMG_3465.webp",
  ];

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
  const minTimer = new Promise((resolve) => setTimeout(resolve, 1200));

  Promise.all([fontsReady, imagesReady, minTimer]).then(() => {
    ribbonHint.textContent = "Click the ribbon";
    ribbon.disabled = false;
    ribbon.classList.add("is-ready");
  });

  // ---- Tiny synthesized "silk untie" swish — best-effort, no audio asset needed --------------------------------------------------
  function playSwish() {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      const ctx = new Ctx();
      const duration = 0.5;
      const bufferSize = ctx.sampleRate * duration;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        const t = i / bufferSize;
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, 2.2);
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(1800, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + duration);
      filter.Q.value = 0.7;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.22, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      noise.connect(filter).connect(gain).connect(ctx.destination);
      noise.start();
      noise.stop(ctx.currentTime + duration);
      noise.onended = () => {
        try {
          if (ctx.state !== "closed") ctx.close();
        } catch (err) {
          /* already closing/closed — safe to ignore */
        }
      };
    } catch (err) {
      /* silent — sound is a nice-to-have, never a blocker */
    }
  }

  // ---- Ambient fireflies backdrop --------------------------------------------------
  if (fireflyCanvas && !WED.flags.reducedMotion) {
    const ctx = fireflyCanvas.getContext("2d");
    let w, h, flies, raf;
    const resize = () => {
      w = fireflyCanvas.width = fireflyCanvas.offsetWidth;
      h = fireflyCanvas.height = fireflyCanvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", WED.debounce(resize, 200));
    flies = Array.from({ length: 24 }, () => ({
      x: Math.random() * (w || window.innerWidth),
      y: Math.random() * (h || window.innerHeight),
      r: 0.6 + Math.random() * 1.6,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      phase: Math.random() * Math.PI * 2,
    }));
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
    WED._stopFireflies = () => cancelAnimationFrame(raf);
  }

  // ---- Untie + open interaction --------------------------------------------------
  ribbon.addEventListener("click", () => {
    if (ribbon.disabled) return;
    ribbon.disabled = true;
    document.dispatchEvent(new CustomEvent("intro:enter"));
    playSwish();

    const rect = ribbonKnot.getBoundingClientRect();
    if (typeof WED !== "undefined" && WED.confetti) {
      WED.confetti.burst({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, count: 60 });
    }

    if (typeof gsap === "undefined" || WED.flags.reducedMotion) {
      gate.style.display = "none";
      document.dispatchEvent(new CustomEvent("intro:complete"));
      return;
    }

    const isMobile = window.innerWidth < 768;
    const loopLeft = ribbon.querySelector(".ribbon-loop--left");
    const loopRight = ribbon.querySelector(".ribbon-loop--right");
    const wrap = ribbon.querySelector(".ribbon-wrap");
    const tailLeft = ribbon.querySelector(".ribbon-tail--left");
    const tailRight = ribbon.querySelector(".ribbon-tail--right");
    const centerDot = ribbon.querySelector(".ribbon-center-dot");

    gate.classList.add("is-leaving");
    card.classList.add("is-untied");

    const tl = gsap.timeline();

    // 1. The knot loosens — loops unfold outward, the wrap band releases.
    tl.to(loopLeft, { rotate: "-=52", x: -16, y: -8, duration: 0.5, ease: "power2.inOut" }, 0)
      .to(loopRight, { rotate: "+=52", x: 16, y: -8, duration: 0.5, ease: "power2.inOut" }, 0)
      .to(wrap, { scaleX: 0.2, opacity: 0, duration: 0.35, ease: "power2.in" }, 0.15)
      .to(centerDot, { scale: 0, opacity: 0, duration: 0.3 }, 0.15)
      .to([tailLeft, tailRight], { y: 22, duration: 0.4, ease: "power2.in" }, 0.2)
      // 2. The whole ribbon slips and falls away.
      .to(ribbon, { y: "+=160", rotate: isMobile ? 0 : 8, opacity: 0, duration: 0.85, ease: "power2.in" }, 0.4)
      // 3. The panels swing open like real card stock, a shadow deepens in the seam.
      .to(
        seamShadow,
        { opacity: 1, duration: 0.5, ease: "power1.out" },
        0.55
      )
      .to(
        panelLeft,
        {
          [isMobile ? "yPercent" : "xPercent"]: -104,
          rotateX: isMobile ? -4 : 0,
          rotateY: isMobile ? 0 : -5,
          duration: 1.3,
          ease: "power3.inOut",
        },
        0.6
      )
      .to(
        panelRight,
        {
          [isMobile ? "yPercent" : "xPercent"]: 104,
          rotateX: isMobile ? 4 : 0,
          rotateY: isMobile ? 0 : 5,
          duration: 1.3,
          ease: "power3.inOut",
        },
        0.6
      )
      .to(seamShadow, { opacity: 0, duration: 0.6 }, 1.5)
      // 4. Cross-fade: let the hero begin revealing itself before the gate fully clears.
      .call(() => document.dispatchEvent(new CustomEvent("intro:complete")), [], 1.75)
      .to(gate, { opacity: 0, scale: 1.04, duration: 0.6, ease: "power2.out" }, 1.75)
      .call(() => {
        gate.style.display = "none";
        if (WED._stopFireflies) WED._stopFireflies();
      });
  });
});
