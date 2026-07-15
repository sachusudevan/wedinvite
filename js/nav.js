// ==========================================================================
// Nav: condensed bar, overlay menu, back-to-top
// ==========================================================================
WED.onReady(() => {
  const nav = document.getElementById("siteNav");
  const toggle = document.getElementById("navToggle");
  const overlay = document.getElementById("navOverlay");
  const links = overlay ? overlay.querySelectorAll(".nav-link") : [];
  const backToTop = document.getElementById("backToTop");

  function onScroll() {
    const y = window.scrollY || document.documentElement.scrollTop;
    if (nav) nav.classList.toggle("is-condensed", y > 40);
    if (backToTop) backToTop.classList.toggle("is-visible", y > window.innerHeight * 0.8);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  let open = false;
  function setOpen(next) {
    open = next;
    toggle.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    overlay.classList.toggle("is-open", open);
    document.body.classList.toggle("nav-locked", open);

    if (open && typeof gsap !== "undefined") {
      gsap.fromTo(
        links,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.06, ease: "power3.out", delay: 0.15 }
      );
    }
  }

  if (toggle) {
    toggle.addEventListener("click", () => setOpen(!open));
  }
  links.forEach((link) => link.addEventListener("click", () => setOpen(false)));

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && open) setOpen(false);
  });
});
