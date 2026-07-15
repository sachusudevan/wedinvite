// ==========================================================================
// Gallery: filter tabs + lightbox (cinematic grid layout)
// ==========================================================================
WED.onReady(() => {
  const filterBar = document.getElementById("galleryFilters");
  const heroSection = document.getElementById("galleryHero");
  const grid = document.getElementById("galleryGrid");

  // Collect all items: hero fig + grid items
  const allItems = Array.from(document.querySelectorAll(".gallery-item"));

  // ---- Filtering --------------------------------------------------
  if (filterBar) {
    filterBar.addEventListener("click", (e) => {
      const btn = e.target.closest(".gallery-filter-btn");
      if (!btn) return;

      filterBar.querySelectorAll(".gallery-filter-btn").forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      const filter = btn.getAttribute("data-filter");

      allItems.forEach((item) => {
        const match = filter === "all" || item.getAttribute("data-category") === filter;
        if (typeof gsap !== "undefined") {
          if (match) {
            item.classList.remove("is-hidden");
            gsap.fromTo(item, { opacity: 0, scale: 0.96 }, { opacity: 1, scale: 1, duration: 0.45, ease: "power2.out" });
          } else {
            gsap.to(item, {
              opacity: 0,
              scale: 0.96,
              duration: 0.25,
              ease: "power2.in",
              onComplete: () => item.classList.add("is-hidden"),
            });
          }
        } else {
          item.classList.toggle("is-hidden", !match);
        }
      });
    });
  }

  // ---- Lightbox --------------------------------------------------
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightboxImg");
  const lightboxCaption = document.getElementById("lightboxCaption");
  const closeBtn = document.getElementById("lightboxClose");
  const prevBtn = document.getElementById("lightboxPrev");
  const nextBtn = document.getElementById("lightboxNext");
  let currentIndex = 0;

  function visibleItems() {
    return allItems.filter((i) => !i.classList.contains("is-hidden"));
  }

  function largeSrc(item) {
    const img = item.querySelector("img");
    return img.src.replace("/md/", "/lg/").replace("/sm/", "/lg/");
  }

  function openLightbox(index) {
    const visible = visibleItems();
    if (!visible.length) return;
    currentIndex = ((index % visible.length) + visible.length) % visible.length;
    const item = visible[currentIndex];
    lightboxImg.src = largeSrc(item);
    lightboxImg.alt = item.getAttribute("data-caption") || "";
    lightboxCaption.textContent = item.getAttribute("data-caption") || "";
    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.classList.add("nav-locked");
  }

  function closeLightbox() {
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.classList.remove("nav-locked");
  }

  // Attach click to all gallery items
  allItems.forEach((item, i) => {
    item.setAttribute("data-cursor", "View");
    item.addEventListener("click", (e) => {
      // For hero, also allow zoom button click
      if (e.target.closest(".gallery-zoom-btn") || !e.target.closest(".gallery-zoom-btn")) {
        const visible = visibleItems();
        const visibleIndex = visible.indexOf(item);
        if (visibleIndex !== -1) openLightbox(visibleIndex);
      }
    });
  });

  closeBtn && closeBtn.addEventListener("click", closeLightbox);
  prevBtn && prevBtn.addEventListener("click", () => openLightbox(currentIndex - 1));
  nextBtn && nextBtn.addEventListener("click", () => openLightbox(currentIndex + 1));

  lightbox &&
    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) closeLightbox();
    });

  document.addEventListener("keydown", (e) => {
    if (!lightbox || !lightbox.classList.contains("is-open")) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowRight") openLightbox(currentIndex + 1);
    if (e.key === "ArrowLeft") openLightbox(currentIndex - 1);
  });
});
