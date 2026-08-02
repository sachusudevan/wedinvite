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

  document.querySelectorAll(
    ".memories-arrow, .nav-toggle, .back-to-top, .hero-cta-row .btn, .btn-solid, .footer-node, .gallery-zoom-btn, .player-disc-btn, .event-glass-card .btn"
  ).forEach((el) => addMagnetic(el, 0.25));
});

// ---- Ambient petal fields --------------------------------------------------
WED.onReady(() => {
  document.addEventListener("intro:complete", () => {
    document.querySelectorAll("[data-petals]").forEach((el) => WED.spawnPetals(el, 7));
  });
});

// ---- Gallery skeleton shimmer: reveal each photo once it's actually loaded --------------------------------------------------
WED.onReady(() => {
  document.querySelectorAll(".gallery-hero-fig img, .gallery-grid-item img").forEach((img) => {
    const tile = img.closest(".gallery-hero-fig, .gallery-grid-item");
    if (!tile) return;
    const reveal = () => tile.classList.add("is-loaded");
    if (img.complete && img.naturalWidth) reveal();
    else img.addEventListener("load", reveal, { once: true });
    img.addEventListener("error", reveal, { once: true });
  });
});

// ---- Footer: share the invite (Web Share API, clipboard fallback) --------------------------------------------------
WED.onReady(() => {
  const shareBtn = document.getElementById("footerShare");
  if (!shareBtn) return;

  shareBtn.addEventListener("click", async () => {
    const shareData = {
      title: document.title,
      text: "You're invited to Arya & Sachu's wedding — Saturday, 12 September 2026.",
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareData.url);
        const original = shareBtn.getAttribute("aria-label");
        shareBtn.setAttribute("aria-label", "Link copied!");
        shareBtn.classList.add("is-copied");
        setTimeout(() => {
          shareBtn.setAttribute("aria-label", original);
          shareBtn.classList.remove("is-copied");
        }, 1600);
      }
    } catch (err) {
      // User cancelled the share sheet — nothing to do.
    }
  });
});
