// ==========================================================================
// Scroll-reveal system driven by data-fx attributes
// ==========================================================================
WED.onReady(() => {
  if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") return;

  const reduced = WED.flags.reducedMotion;
  const isHoriz = typeof horizontalTween !== "undefined";

  function getOpts(el, start) {
    return {
      trigger: el,
      start: start,
      once: true,
      containerAnimation: isHoriz ? horizontalTween : null
    };
  }

  // --- 1. Generic Reveals (Data Attributes) ---
  function reveal(selector, fromVars, toVars, startOffset = "top 85%") {
    const items = gsap.utils.toArray(selector);
    if (!items.length) return;

    if (reduced) {
      gsap.set(items, { clearProps: "all" });
      return;
    }

    items.forEach((el) => {
      gsap.set(el, fromVars);
      ScrollTrigger.create({
        ...getOpts(el, startOffset),
        onEnter: () => gsap.to(el, { ...toVars, overwrite: true })
      });
    });
  }

  // Elegant simple fade and glide up
  reveal('[data-fx="mask-wipe"]', { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 1.2, ease: "power2.out", stagger: 0.1 });
  // Subtle fade in
  reveal('[data-fx="unfold"]', { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 1.2, ease: "power2.out" });
  // Gentle section rise
  reveal('[data-fx="page-rise"]', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 1.4, ease: "power2.out" });
  // Simple image reveal
  reveal('[data-fx="develop"]', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 1.4, ease: "power2.out" });


  // --- 2. Clean Section Animations ---
  if (!reduced) {
    
    // A. Events Glass Card (Simple smooth slide in)
    const eventCard = document.querySelector(".event-glass-card");
    if (eventCard) {
      gsap.set(eventCard, { opacity: 0, x: isHoriz ? 40 : 0, y: isHoriz ? 0 : 40 });
      ScrollTrigger.create({
        ...getOpts(eventCard, "top 80%"),
        onEnter: () => {
          gsap.to(eventCard, { opacity: 1, x: 0, y: 0, duration: 1.4, ease: "power3.out" });
        }
      });
    }

    // B. Background Parallax (Subtle)
    gsap.utils.toArray(".events-bg img").forEach(bg => {
      gsap.to(bg, {
        xPercent: isHoriz ? -8 : 0,
        yPercent: isHoriz ? 0 : 8,
        ease: "none",
        scrollTrigger: {
          trigger: bg.closest("section"),
          containerAnimation: isHoriz ? horizontalTween : null,
          start: isHoriz ? "left right" : "top bottom",
          end: isHoriz ? "right left" : "bottom top",
          scrub: true
        }
      });
    });

    // C. Story Timeline Clean Reveal
    const storyBlocks = gsap.utils.toArray(".story-block");
    storyBlocks.forEach((block, i) => {
      const img = block.querySelector(".story-img img");
      const copyItems = block.querySelectorAll(".story-copy > *");
      
      gsap.set(img, { opacity: 0, x: isHoriz ? 20 : 0, y: isHoriz ? 0 : 20 });
      gsap.set(copyItems, { opacity: 0, x: isHoriz ? 20 : 0, y: isHoriz ? 0 : 20 });

      ScrollTrigger.create({
        ...getOpts(block, "top 80%"),
        onEnter: () => {
          const tl = gsap.timeline({ defaults: { ease: "power2.out" } });
          tl.to(img, { opacity: 1, x: 0, y: 0, duration: 1.2 }, 0)
            .to(copyItems, { opacity: 1, x: 0, y: 0, duration: 1, stagger: 0.1 }, 0.2);
        }
      });
    });

    // D. Gallery Clean Stagger
    const galleryItems = gsap.utils.toArray(".gallery-item");
    if (galleryItems.length) {
      gsap.set(galleryItems, { opacity: 0, y: 20 });
      
      const galleryTrigger = document.querySelector(".gallery-grid");
      if (galleryTrigger) {
        ScrollTrigger.create({
          ...getOpts(galleryTrigger, "top 75%"),
          onEnter: () => {
            gsap.to(galleryItems, {
              opacity: 1, y: 0,
              duration: 1.2,
              stagger: 0.1,
              ease: "power2.out",
              overwrite: true
            });
          }
        });
      }
    }
  }

  document.addEventListener("intro:complete", () => ScrollTrigger.refresh());
});
