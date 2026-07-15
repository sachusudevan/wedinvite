// ==========================================================================
// RSVP form — attend toggle, mailto handoff, confetti celebration
// ==========================================================================
WED.onReady(() => {
  const form = document.getElementById("rsvpForm");
  const toggle = document.getElementById("attendToggle");
  const success = document.getElementById("rsvpSuccess");
  const rsvpSection = document.getElementById("rsvp");
  if (!form) return;

  const RSVP_EMAIL = "sachusudeve8690@gmail.com";

  if (toggle) {
    toggle.querySelectorAll(".attend-option").forEach((opt) => {
      opt.addEventListener("click", () => {
        toggle.querySelectorAll(".attend-option").forEach((o) => o.classList.remove("is-selected"));
        opt.classList.add("is-selected");
      });
    });
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = form.name.value.trim();
    const guests = form.guests.value;
    const contact = form.contact.value.trim();
    const message = form.message.value.trim();
    const attending = form.querySelector('input[name="attending"]:checked').value;

    const subject = `RSVP — ${name} (${attending})`;
    const body = [
      `Name: ${name}`,
      `Response: ${attending}`,
      `Guests: ${guests}`,
      `Contact: ${contact}`,
      message ? `Message: ${message}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const mailto = `mailto:${RSVP_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;

    form.hidden = true;
    if (success) success.classList.add("is-visible");

    const rect = rsvpSection.getBoundingClientRect();
    WED.confetti.burst({ x: window.innerWidth / 2, y: rect.top + 160, count: 120 });
  });
});
