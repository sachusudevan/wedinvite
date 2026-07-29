// ==========================================================================
// Main — final micro-interactions: magnetic icon buttons
// ==========================================================================
WED.onReady(() => {
  const canMagnetic = typeof gsap !== "undefined" && !WED.flags.coarsePointer && !WED.flags.reducedMotion;
  if (!canMagnetic) return;

  function addMagnetic(el, strength = 0.3) {
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

  document.querySelectorAll(".memories-arrow, .nav-toggle, .back-to-top").forEach((el) => addMagnetic(el, 0.25));
});
