// ==========================================================================
// Memories carousel (Swiper) — continuous, draggable highlight strip
// ==========================================================================
WED.onReady(() => {
  const el = document.getElementById("memoriesSwiper");
  if (!el || typeof Swiper === "undefined") return;

  const swiper = new Swiper(el, {
    slidesPerView: "auto",
    spaceBetween: 20,
    loop: true,
    speed: 900,
    grabCursor: true,
    centeredSlides: false,
    autoplay: WED.flags.reducedMotion
      ? false
      : { delay: 2600, disableOnInteraction: false, pauseOnMouseEnter: true },
    navigation: {
      prevEl: "#memPrev",
      nextEl: "#memNext",
    },
  });

  WED.memoriesSwiper = swiper;
});
