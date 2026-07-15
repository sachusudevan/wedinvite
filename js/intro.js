// ==========================================================================
// Intro Gate — minimal photographic loader + seal entrance
// Preloads key assets, animates a progress ring, then on click performs a
// circular wipe transition (from the seal's screen position) into the hero.
// ==========================================================================
WED.onReady(() => {
  const gate = document.getElementById("introGate");
  const seal = document.getElementById("introSeal");
  const sealLabel = document.getElementById("introSealLabel");
  const ringProgress = document.getElementById("ringProgress");
  const wipe = document.getElementById("introWipe");
  if (!gate || !seal) return;

  const CIRCUMFERENCE = 2 * Math.PI * 56;

  const criticalImages = [
    "assets/images/optimized/lg/IMG_3465.webp",
    "assets/images/optimized/md/IMG_9534.webp",
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
    ringProgress.style.strokeDashoffset = `${CIRCUMFERENCE * (1 - progress / 100)}`;
  };

  const minTimer = new Promise((resolve) => setTimeout(resolve, 1100));
  const tick = setInterval(() => {
    if (!done) setProgress(Math.min(92, progress + (92 - progress) * 0.08 + 0.6));
  }, 60);

  Promise.all([fontsReady, imagesReady, minTimer]).then(() => {
    done = true;
    clearInterval(tick);
    setProgress(100);
    sealLabel.textContent = "Enter";
    seal.disabled = false;
    seal.classList.add("is-ready");
  });

  seal.addEventListener("click", () => {
    if (seal.disabled) return;
    seal.disabled = true;
    document.dispatchEvent(new CustomEvent("intro:enter"));

    const rect = seal.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    gate.classList.add("is-leaving");

    if (typeof gsap === "undefined" || WED.flags.reducedMotion) {
      gate.style.display = "none";
      document.dispatchEvent(new CustomEvent("intro:complete"));
      return;
    }

    const maxDim = Math.hypot(Math.max(cx, window.innerWidth - cx), Math.max(cy, window.innerHeight - cy));
    const proxy = { r: 0 };

    gsap
      .timeline()
      .to(".intro-content", { opacity: 0, y: -14, duration: 0.4, ease: "power2.in" }, 0)
      .to(
        proxy,
        {
          r: maxDim + 40,
          duration: 0.95,
          ease: "power3.inOut",
          onUpdate: () => {
            wipe.style.clipPath = `circle(${proxy.r}px at ${cx}px ${cy}px)`;
          },
        },
        0.1
      )
      .call(() => document.dispatchEvent(new CustomEvent("intro:complete")), [], 0.75)
      .call(() => {
        gate.style.display = "none";
      });
  });
});
