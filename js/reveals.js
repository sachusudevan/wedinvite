// ==========================================================================
// Scroll-reveal system driven by data-fx attributes
// ==========================================================================
WED.onReady(() => {
  if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") return;

  const reduced = WED.flags.reducedMotion;

  function reveal(selector, fromVars, toVars, opts = {}) {
    const items = gsap.utils.toArray(selector);
    if (!items.length) return;

    if (reduced) {
      gsap.set(items, { clearProps: "all" });
      return;
    }

    items.forEach((el) => {
      gsap.set(el, fromVars);
      ScrollTrigger.create({
        trigger: el,
        start: opts.start || "top 87%",
        once: true,
        onEnter: () => gsap.to(el, { ...toVars, overwrite: true }),
      });
    });
  }

  // Elegant slow glide up for typography and dividers
  reveal(
    '[data-fx="mask-wipe"]',
    { y: 35, opacity: 0 },
    { y: 0, opacity: 1, duration: 1.4, ease: "power2.out" }
  );

  // Subtle, sophisticated expansion for cards and dates
  reveal(
    '[data-fx="unfold"]',
    { opacity: 0, scale: 0.96, y: 20 },
    { opacity: 1, scale: 1, y: 0, duration: 1.5, ease: "power2.out" }
  );

  // Graceful long-distance upward float for large sections
  reveal(
    '[data-fx="page-rise"]',
    { opacity: 0, y: 70 },
    { opacity: 1, y: 0, duration: 1.8, ease: "power3.out" }
  );

  // Clean, slow settling effect for images
  reveal(
    '[data-fx="develop"]',
    { opacity: 0, scale: 1.05, y: 20 },
    { opacity: 1, scale: 1, y: 0, duration: 1.6, ease: "power2.out" }
  );

  // ---- Story timeline: image mask wipe + alternating copy slide --------------------------------------------------
  const storyBlocks = gsap.utils.toArray('[data-fx="story-reveal"]');
  storyBlocks.forEach((block, i) => {
    const mask = block.querySelector(".story-img-mask");
    const img = block.querySelector(".story-img img");
    const copy = block.querySelector(".story-copy");
    const node = block.querySelector(".story-node");
    const fromX = i % 2 === 0 ? -40 : 40;

    if (reduced) {
      gsap.set([mask, img, copy, node], { clearProps: "all" });
      if (mask) gsap.set(mask, { scaleY: 0 });
      return;
    }

    gsap.set(mask, { scaleY: 1, transformOrigin: "top" });
    gsap.set(img, { scale: 1.18 });
    gsap.set(copy, { opacity: 0, x: fromX });
    if (node) gsap.set(node, { scale: 0 });

    ScrollTrigger.create({
      trigger: block,
      start: "top 80%",
      once: true,
      onEnter: () => {
        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
        tl.to(mask, { scaleY: 0, duration: 0.9, ease: "power4.inOut" }, 0)
          .to(img, { scale: 1, duration: 1.3 }, 0)
          .to(copy, { opacity: 1, x: 0, duration: 0.9 }, 0.2)
          .to(node, { scale: 1, duration: 0.5, ease: "back.out(3)" }, 0.3);
      },
    });
  });

  document.addEventListener("intro:complete", () => ScrollTrigger.refresh());
});
