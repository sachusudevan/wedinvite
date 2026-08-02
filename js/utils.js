// ==========================================================================
// Shared utilities + global flags
// ==========================================================================
window.WED = window.WED || {};

WED.flags = {
  reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  coarsePointer: window.matchMedia("(hover: none), (pointer: coarse)").matches,
};

WED.clamp = (v, min, max) => Math.min(Math.max(v, min), max);
WED.lerp = (a, b, t) => a + (b - a) * t;
WED.pad2 = (n) => String(Math.max(0, Math.trunc(n))).padStart(2, "0");

WED.debounce = (fn, wait = 150) => {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
};

WED.onReady = (fn) => {
  if (document.readyState !== "loading") fn();
  else document.addEventListener("DOMContentLoaded", fn);
};

// ---- Floating petal fields (decorative, ambient) --------------------------------------------------
WED.spawnPetals = (container, count = 7) => {
  if (!container || WED.flags.reducedMotion) return;
  const field = document.createElement("div");
  field.className = "petal-field";
  field.setAttribute("aria-hidden", "true");
  for (let i = 0; i < count; i++) {
    const petal = document.createElement("span");
    petal.className = i % 3 === 0 ? "petal petal--gold" : "petal";
    petal.style.setProperty("--x", `${4 + Math.random() * 92}%`);
    petal.style.setProperty("--s", `${9 + Math.random() * 10}px`);
    petal.style.setProperty("--dur", `${10 + Math.random() * 9}s`);
    petal.style.setProperty("--delay", `${Math.random() * 10}s`);
    petal.style.setProperty("--drift", `${Math.random() > 0.5 ? "" : "-"}${20 + Math.random() * 60}px`);
    petal.style.setProperty("--rot", `${Math.random() * 360}deg`);
    field.appendChild(petal);
  }
  container.appendChild(field);
};
