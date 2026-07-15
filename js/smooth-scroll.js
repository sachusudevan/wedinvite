// ==========================================================================
// Lenis smooth scroll wired to GSAP ScrollTrigger + top progress bar
// ==========================================================================
WED.onReady(() => {
  const hasGsap = typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined";
  if (hasGsap) gsap.registerPlugin(ScrollTrigger, typeof SplitText !== "undefined" ? SplitText : undefined);

  let lenis = null;

  function startLenis() {
    if (WED.flags.reducedMotion || typeof Lenis === "undefined") return;
    lenis = new Lenis({
      duration: 1.1,
      easing: (t) => 1 - Math.pow(1 - t, 3),
      smoothWheel: true,
    });

    lenis.on("scroll", () => {
      if (hasGsap) ScrollTrigger.update();
      updateProgressBar();
    });

    if (hasGsap) {
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      requestAnimationFrame(function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
      });
    }

    WED.lenis = lenis;
  }

  const progressBar = document.getElementById("progressBar");
  function updateProgressBar() {
    if (!progressBar) return;
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = height > 0 ? scrollTop / height : 0;
    progressBar.style.transform = `scaleX(${ratio})`;
  }
  window.addEventListener("scroll", updateProgressBar, { passive: true });

  // Anchor links -> smooth scroll via Lenis (falls back to native)
  document.addEventListener("click", (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    const id = link.getAttribute("href");
    if (id.length < 2) return;
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    if (WED.lenis) {
      WED.lenis.scrollTo(target, { offset: 0, duration: 1.3 });
    } else {
      target.scrollIntoView({ behavior: WED.flags.reducedMotion ? "auto" : "smooth" });
    }
  });

  document.addEventListener("intro:complete", () => {
    document.body.classList.remove("js-loading");
    startLenis();
    if (hasGsap) requestAnimationFrame(() => ScrollTrigger.refresh());
  });

  window.addEventListener("load", () => {
    if (hasGsap) ScrollTrigger.refresh();
  });
});
