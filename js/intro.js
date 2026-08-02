// ==========================================================================
// Intro Gate — animated invitation envelope: preload, wax-seal tap, flap
// open, card reveal, camera zoom into the hero. Fires the same
// `intro:enter` (at tap) / `intro:complete` (transition finished) events the
// rest of the site (hero, player, smooth-scroll, reveals) already listens for.
// ==========================================================================
WED.onReady(() => {
  const gate = document.getElementById("introGate");
  const seal = document.getElementById("introSeal");
  const sealLabel = document.getElementById("introSealLabel");
  const ringProgress = document.getElementById("ringProgress");
  const stage = document.getElementById("introStage");
  const envelope = document.getElementById("envelope");
  const flap = document.getElementById("envelopeFlap");
  const card = document.getElementById("envelopeCard");
  const flash = document.getElementById("introFlash");
  const tapHint = document.getElementById("introTapHint");
  if (!gate || !seal) return;

  const hasGsap = typeof gsap !== "undefined";
  const CIRCUMFERENCE = 2 * Math.PI * 56;

  if (hasGsap && !WED.flags.reducedMotion) {
    gsap.set(card, { xPercent: -50, yPercent: 14, scale: 0.9, opacity: 0.94 });
  }

  // ---- Cursor parallax on the backdrop layers (fine pointer only) --------------------------------------------------
  if (hasGsap && !WED.flags.coarsePointer && !WED.flags.reducedMotion) {
    const parallaxTargets = [
      { el: document.querySelector(".intro-stains"), amp: 5 },
      { el: document.querySelector(".intro-flakes"), amp: 9 },
    ];
    document.querySelectorAll(".intro-corner-decor").forEach((el) => parallaxTargets.push({ el, amp: 13 }));

    const movers = parallaxTargets
      .filter((t) => t.el)
      .map((t) => ({
        moveX: gsap.quickTo(t.el, "x", { duration: 0.9, ease: "power3" }),
        moveY: gsap.quickTo(t.el, "y", { duration: 0.9, ease: "power3" }),
        amp: t.amp,
      }));

    gate.addEventListener("mousemove", (e) => {
      const relX = e.clientX / window.innerWidth - 0.5;
      const relY = e.clientY / window.innerHeight - 0.5;
      movers.forEach(({ moveX, moveY, amp }) => {
        moveX(relX * amp);
        moveY(relY * amp);
      });
    });
  }

  const criticalImages = [
    "assets/images/optimized/lg/gallery-feature.webp",
    "assets/images/optimized/md/hero-embrace.webp",
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

  let progress = 0;
  let done = false;
  const setProgress = (p) => {
    progress = WED.clamp(p, 0, 100);
    if (ringProgress) ringProgress.style.strokeDashoffset = `${CIRCUMFERENCE * (1 - progress / 100)}`;
  };

  const minTimer = new Promise((resolve) => setTimeout(resolve, 1200));
  const tick = setInterval(() => {
    if (!done) setProgress(Math.min(92, progress + (92 - progress) * 0.08 + 0.6));
  }, 60);

  Promise.all([fontsReady, imagesReady, minTimer]).then(() => {
    done = true;
    clearInterval(tick);
    setProgress(100);
    if (sealLabel) sealLabel.textContent = "Tap To Open";
    seal.disabled = false;
    seal.classList.add("is-ready");
    if (stage) stage.classList.add("is-ready");
  });

  seal.addEventListener("click", () => {
    if (seal.disabled) return;
    seal.disabled = true;
    document.dispatchEvent(new CustomEvent("intro:enter"));

    gate.classList.add("is-leaving");

    if (!hasGsap || WED.flags.reducedMotion) {
      gate.style.display = "none";
      document.dispatchEvent(new CustomEvent("intro:complete"));
      return;
    }

    const finish = () => {
      document.dispatchEvent(new CustomEvent("intro:complete"));
      gate.style.display = "none";
    };

    gsap
      .timeline({ onComplete: finish })
      // Seal cracks open
      .to(seal, { scale: 1.15, duration: 0.18, ease: "power2.out" }, 0)
      .to(seal, { scale: 0, rotate: 14, opacity: 0, duration: 0.3, ease: "power2.in" }, 0.18)
      .to(tapHint, { opacity: 0, y: 8, duration: 0.3, ease: "power2.in" }, 0)
      // Flap swings open
      .to(flap, { rotateX: -170, duration: 0.75, ease: "power3.inOut" }, 0.15)
      // Card slides up out of the envelope
      .to(card, { yPercent: -40, scale: 1, opacity: 1, duration: 0.85, ease: "back.out(1.5)" }, 0.5)
      .fromTo(
        card.querySelectorAll(".card-kicker, .card-script, .card-flourish, .card-date"),
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.08, ease: "power2.out" },
        0.75
      )
      // Camera zoom + bridging flash + crossfade into the hero
      .to(flash, { opacity: 1, duration: 0.35, ease: "power2.out" }, 1.15)
      .to(stage, { scale: 1.4, duration: 0.9, ease: "power2.inOut" }, 1.1)
      .to(gate, { opacity: 0, duration: 0.6, ease: "power2.inOut" }, 1.35)
      .to(flash, { opacity: 0, duration: 0.5, ease: "power2.in" }, 1.55);
  });
});
