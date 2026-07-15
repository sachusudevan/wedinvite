// ==========================================================================
// Blessings wall — guest messages saved to localStorage
// ==========================================================================
WED.onReady(() => {
  const form = document.getElementById("blessingForm");
  const wall = document.getElementById("blessingWall");
  const toast = document.getElementById("blessingToast");
  if (!form || !wall) return;

  const STORAGE_KEY = "wed_blessings";

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function renderCard({ name, message }, animate) {
    const card = document.createElement("div");
    card.className = "blessing-card";
    card.innerHTML = `<span class="blessing-quote-mark">&ldquo;</span><p>${escapeHtml(message)}</p><p class="blessing-from">&mdash; ${escapeHtml(name)}</p>`;
    wall.prepend(card);
    if (animate && typeof gsap !== "undefined") {
      gsap.fromTo(card, { opacity: 0, y: -16, scale: 0.96 }, { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: "power3.out" });
    }
  }

  function loadSaved() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      saved.forEach((entry) => renderCard(entry, false));
    } catch (err) {
      /* ignore corrupt storage */
    }
  }
  loadSaved();

  function showToast() {
    if (!toast) return;
    toast.classList.add("is-visible");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toast.classList.remove("is-visible"), 2600);
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = form.name.value.trim();
    const message = form.message.value.trim();
    if (!name || !message) return;

    const entry = { name, message };
    renderCard(entry, true);

    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      saved.unshift(entry);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved.slice(0, 50)));
    } catch (err) {
      /* storage unavailable — card still renders for this session */
    }

    const rect = wall.getBoundingClientRect();
    WED.confetti.burst({ x: rect.left + rect.width / 2, y: rect.top + 40, count: 40 });

    showToast();
    form.reset();
  });
});
