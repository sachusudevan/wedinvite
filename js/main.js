// ==========================================================================
// Main — final micro-interactions: magnetic buttons, 3D tilt cards
// ==========================================================================
WED.onReady(() => {
  const canTilt = typeof gsap !== "undefined" && !WED.flags.coarsePointer && !WED.flags.reducedMotion;
  if (!canTilt) return;

  function addTilt(el, max = 7) {
    el.addEventListener("mousemove", (e) => {
      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      gsap.to(el, {
        rotateY: px * max,
        rotateX: -py * max,
        transformPerspective: 700,
        duration: 0.5,
        ease: "power2.out",
      });
    });
    el.addEventListener("mouseleave", () => {
      gsap.to(el, { rotateX: 0, rotateY: 0, duration: 0.7, ease: "power3.out" });
    });
  }

  document.querySelectorAll(".event-spotlight").forEach((el) => addTilt(el, 3));
  document.querySelectorAll(".family-member").forEach((el) => addTilt(el, 6));
  document.querySelectorAll(".blessing-card").forEach((el) => addTilt(el, 5));

  function addMagnetic(el, strength = 0.35) {
    el.addEventListener("mousemove", (e) => {
      const rect = el.getBoundingClientRect();
      const relX = e.clientX - (rect.left + rect.width / 2);
      const relY = e.clientY - (rect.top + rect.height / 2);
      gsap.to(el, { x: relX * strength, y: relY * strength, duration: 0.4, ease: "power2.out" });
    });
    el.addEventListener("mouseleave", () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.5, ease: "elastic.out(1, 0.4)" });
    });
  }

  document.querySelectorAll(".btn, .memories-arrow, .nav-toggle, .back-to-top").forEach((el) => addMagnetic(el, 0.25));
});
