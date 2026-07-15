// ==========================================================================
// Hero: split-text name reveal, parallax background, subtle pointer tilt
// ==========================================================================
WED.onReady(() => {
  const hasGsap = typeof gsap !== "undefined";
  const hero = document.getElementById("hero");
  if (!hero) return;

  let splitInstances = [];
  if (hasGsap && typeof SplitText !== "undefined" && !WED.flags.reducedMotion) {
    document.querySelectorAll(".split-line[data-split]").forEach((line) => {
      const split = new SplitText(line, { type: "chars" });
      splitInstances.push(split);
      gsap.set(split.chars, { yPercent: 130, opacity: 0, display: "inline-block" });
    });
  }

  function playHeroReveal() {
    if (!hasGsap) return;
    const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
    tl.to(".hero-eyebrow", { opacity: 1, y: 0, duration: 0.7 }, 0);

    if (splitInstances.length) {
      splitInstances.forEach((split, i) => {
        tl.to(split.chars, { yPercent: 0, opacity: 1, duration: 0.7, stagger: 0.022 }, 0.15 + i * 0.05);
      });
    } else {
      tl.to(".hero-title", { opacity: 1, y: 0, duration: 0.7 }, 0.15);
    }

    tl.to(".hero-amp", { opacity: 1, scale: 1, duration: 0.7, ease: "back.out(2)" }, 0.5)
      .to(".hero-flourish", { opacity: 1, duration: 0.7 }, 0.6)
      .to(".hero-std-date", { opacity: 1, y: 0, duration: 0.7 }, 0.7)
      .to(".hero-std-weekday", { opacity: 1, y: 0, duration: 0.7 }, 0.8)
      .to(".hero-std-note", { opacity: 1, y: 0, duration: 0.7 }, 0.9)
      .to(".scroll-cue", { opacity: 0.75, duration: 0.7 }, 1.1);
  }

  gsap.set(".hero-eyebrow, .hero-std-date, .hero-std-weekday, .hero-std-note", { opacity: 0, y: 16 });
  gsap.set(".hero-amp", { opacity: 0, scale: 0.6 });
  gsap.set(".hero-flourish, .scroll-cue", { opacity: 0 });

  document.addEventListener("intro:complete", playHeroReveal);

  // ---- Parallax on hero background --------------------------------------------------
  if (hasGsap && typeof ScrollTrigger !== "undefined" && !WED.flags.reducedMotion) {
    gsap.to("#heroBg img", {
      yPercent: 10,
      scale: 1.02,
      ease: "none",
      scrollTrigger: {
        trigger: hero,
        start: "top top",
        end: "bottom top",
        scrub: true,
      },
    });
  }

  // ---- Pointer parallax tilt (fine pointer only) --------------------------------------------------
  if (hasGsap && !WED.flags.coarsePointer && !WED.flags.reducedMotion) {
    const content = document.querySelector(".hero-content");
    const moveX = gsap.quickTo(content, "x", { duration: 0.6, ease: "power3" });
    const moveY = gsap.quickTo(content, "y", { duration: 0.6, ease: "power3" });
    hero.addEventListener("mousemove", (e) => {
      const rect = hero.getBoundingClientRect();
      const relX = (e.clientX - rect.left) / rect.width - 0.5;
      const relY = (e.clientY - rect.top) / rect.height - 0.5;
      moveX(relX * 18);
      moveY(relY * 12);
    });
    hero.addEventListener("mouseleave", () => {
      moveX(0);
      moveY(0);
    });
  }
});
