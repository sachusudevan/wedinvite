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
  const ringHalo = document.getElementById("ringHalo");
  const stage = document.getElementById("introStage");
  const envelope = document.getElementById("envelope");
  const flap = document.getElementById("envelopeFlap");
  const card = document.getElementById("envelopeCard");
  const cardSweep = document.getElementById("cardLightSweep");
  const flash = document.getElementById("introFlash");
  const tapHint = document.getElementById("introTapHint");
  const fxCanvas = document.getElementById("introFx");
  if (!gate || !seal) return;

  const hasGsap = typeof gsap !== "undefined";
  const CIRCUMFERENCE = 2 * Math.PI * 56;

  if (hasGsap && !WED.flags.reducedMotion) {
    gsap.set(card, { xPercent: -50, yPercent: 14, scale: 0.9, opacity: 0.94 });
  }

  // ---- Ambient particle field: embers from the seal, depth-blurred petals, sparkles --------------------------------------------------
  if (fxCanvas && WED.introFx) {
    WED.introFx.init(fxCanvas, seal);
    WED.introFx.setPreloading(true);
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

  // ---- Envelope hover tilt: subtle 3D parallax toward the cursor (fine pointer only) --------------------------------------------------
  let stopTilt = null;
  if (hasGsap && envelope && !WED.flags.coarsePointer && !WED.flags.reducedMotion) {
    const tiltX = gsap.quickTo(envelope, "rotateX", { duration: 0.6, ease: "power3" });
    const tiltY = gsap.quickTo(envelope, "rotateY", { duration: 0.6, ease: "power3" });
    gsap.set(envelope, { transformPerspective: 1400 });

    const onMove = (e) => {
      const rect = envelope.getBoundingClientRect();
      const relX = (e.clientX - (rect.left + rect.width / 2)) / rect.width;
      const relY = (e.clientY - (rect.top + rect.height / 2)) / rect.height;
      tiltX(relY * -7);
      tiltY(relX * 7);
    };
    const onLeave = () => { tiltX(0); tiltY(0); };

    gate.addEventListener("mousemove", onMove);
    gate.addEventListener("mouseleave", onLeave);
    stopTilt = () => {
      gate.removeEventListener("mousemove", onMove);
      gate.removeEventListener("mouseleave", onLeave);
      onLeave();
    };
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
    const offset = `${CIRCUMFERENCE * (1 - progress / 100)}`;
    if (ringProgress) ringProgress.style.strokeDashoffset = offset;
    if (ringHalo) ringHalo.style.strokeDashoffset = offset;
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
    if (WED.introFx) WED.introFx.setPreloading(false);
  });

  const toCanvasPoint = (clientX, clientY) => {
    if (!fxCanvas) return { x: clientX, y: clientY };
    const r = fxCanvas.getBoundingClientRect();
    return { x: clientX - r.left, y: clientY - r.top };
  };

  seal.addEventListener("click", () => {
    if (seal.disabled) return;
    seal.disabled = true;
    document.dispatchEvent(new CustomEvent("intro:enter"));

    if (stopTilt) { stopTilt(); stopTilt = null; }
    gate.classList.add("is-leaving");

    const sealRect = seal.getBoundingClientRect();
    const sealPoint = toCanvasPoint(sealRect.left + sealRect.width / 2, sealRect.top + sealRect.height / 2);
    const cardRectPre = card.getBoundingClientRect();
    const cardPoint = toCanvasPoint(cardRectPre.left + cardRectPre.width / 2, cardRectPre.top + cardRectPre.height / 2);

    if (!hasGsap || WED.flags.reducedMotion) {
      gate.style.display = "none";
      if (WED.introFx) WED.introFx.stop();
      document.dispatchEvent(new CustomEvent("intro:complete"));
      return;
    }

    const finish = () => {
      document.dispatchEvent(new CustomEvent("intro:complete"));
      gate.style.display = "none";
      if (WED.introFx) WED.introFx.stop();
    };

    gsap
      .timeline({ onComplete: finish })
      // Seal cracks open — glowing spark shower right as it shatters
      .to(seal, { scale: 1.15, duration: 0.18, ease: "power2.out" }, 0)
      .to(seal, { scale: 0, rotate: 14, opacity: 0, duration: 0.3, ease: "power2.in" }, 0.18)
      .call(() => { if (WED.introFx) WED.introFx.burst(sealPoint.x, sealPoint.y, { type: "spark", count: 18 }); }, [], 0.16)
      .to(tapHint, { opacity: 0, y: 8, duration: 0.3, ease: "power2.in" }, 0)
      // Flap swings open
      .to(flap, { rotateX: -170, duration: 0.75, ease: "power3.inOut" }, 0.15)
      // Card slides up out of the envelope, light sweep across the typography
      .to(card, { yPercent: -40, scale: 1, opacity: 1, duration: 0.85, ease: "back.out(1.5)" }, 0.5)
      .fromTo(
        card.querySelectorAll(".card-kicker, .card-script, .card-flourish, .card-date"),
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.08, ease: "power2.out" },
        0.75
      )
      .call(() => { if (WED.introFx) WED.introFx.burst(cardPoint.x, cardPoint.y - 40, { type: "petal", count: 22 }); }, [], 0.65)
      .set(cardSweep, { opacity: 1 }, 0.68)
      .to(cardSweep, { backgroundPosition: "-40% 0%", duration: 0.9, ease: "power2.inOut" }, 0.68)
      .to(cardSweep, { opacity: 0, duration: 0.35 }, 1.4)
      // Camera zoom + bridging flash + crossfade into the hero
      .to(flash, { opacity: 1, duration: 0.35, ease: "power2.out" }, 1.15)
      .to(stage, { scale: 1.4, duration: 0.9, ease: "power2.inOut" }, 1.1)
      .to(gate, { opacity: 0, duration: 0.6, ease: "power2.inOut" }, 1.35)
      .to(flash, { opacity: 0, duration: 0.5, ease: "power2.in" }, 1.55);
  });
});
