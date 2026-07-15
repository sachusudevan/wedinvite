// ==========================================================================
// Custom cursor
// ==========================================================================
WED.onReady(() => {
  if (WED.flags.coarsePointer) {
    document.body.classList.add("no-fine-cursor");
    return;
  }

  const dot = document.getElementById("cursorDot");
  const ring = document.getElementById("cursorRing");
  const label = document.getElementById("cursorLabel");
  if (!dot || !ring) return;

  const hasGsap = typeof gsap !== "undefined";
  const moveDot = hasGsap ? gsap.quickTo(dot, "x", { duration: 0.12, ease: "power3" }) : null;
  const moveDotY = hasGsap ? gsap.quickTo(dot, "y", { duration: 0.12, ease: "power3" }) : null;
  const moveRing = hasGsap ? gsap.quickTo(ring, "x", { duration: 0.35, ease: "power3" }) : null;
  const moveRingY = hasGsap ? gsap.quickTo(ring, "y", { duration: 0.35, ease: "power3" }) : null;

  window.addEventListener("mousemove", (e) => {
    if (hasGsap) {
      moveDot(e.clientX);
      moveDotY(e.clientY);
      moveRing(e.clientX);
      moveRingY(e.clientY);
    } else {
      dot.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
      ring.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
    }
  });

  document.addEventListener("mouseover", (e) => {
    const target = e.target.closest("[data-cursor]");
    if (target) {
      ring.classList.add("is-active");
      label.textContent = target.getAttribute("data-cursor") || "";
    }
  });
  document.addEventListener("mouseout", (e) => {
    const target = e.target.closest("[data-cursor]");
    if (target) {
      ring.classList.remove("is-active");
      label.textContent = "";
    }
  });

  document.addEventListener("mousedown", () => ring.style.transform += " scale(0.85)");
  document.addEventListener("mouseup", () => {});

  document.addEventListener("mouseleave", () => {
    dot.style.opacity = "0";
    ring.style.opacity = "0";
  });
  document.addEventListener("mouseenter", () => {
    dot.style.opacity = "1";
    ring.style.opacity = "1";
  });
});
