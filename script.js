/* =========================================================
   LUXURY WEDDING INVITATION — INTERACTIONS
========================================================= */
(() => {
  'use strict';

  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* ---------------------------------------------------
     ENVELOPE INTRO
  --------------------------------------------------- */
  const initEnvelope = () => {
    const intro = $('#envelopeIntro');
    const envelope = $('#envelope');
    const openBtn = $('#openInviteBtn');
    const particles = $('#envelopeParticles');
    const bokeh = $('#envelopeBokeh');
    if (!intro || !envelope || !openBtn) return;

    document.body.classList.add('no-scroll');

    const glyphs = { leaf: ['🍃', '🌿'], petal: ['🌸', '❀', '✿'], sparkle: ['✦', '✧', '·'] };
    const spawnParticle = (opts = {}) => {
      const p = document.createElement('span');
      const kinds = Object.keys(glyphs);
      const kind = opts.kind || kinds[Math.floor(Math.random() * kinds.length)];
      const set = glyphs[kind];
      p.textContent = set[Math.floor(Math.random() * set.length)];
      p.className = kind === 'sparkle' ? 'sparkle' : '';
      p.style.left = `${opts.left ?? Math.random() * 100}%`;
      p.style.bottom = `${opts.bottom ?? -5}%`;
      p.style.fontSize = `${0.75 + Math.random() * 1}rem`;
      p.style.setProperty('--drift', `${Math.random() * 70 - 35}px`);
      p.style.animationDuration = `${opts.duration ?? (9 + Math.random() * 9)}s`;
      p.style.animationDelay = `${opts.delay ?? Math.random() * 7}s`;
      particles.appendChild(p);
      return p;
    };
    for (let i = 0; i < 16; i++) spawnParticle();

    if (bokeh) {
      for (let i = 0; i < 6; i++) {
        const b = document.createElement('span');
        const size = 40 + Math.random() * 90;
        b.style.width = b.style.height = `${size}px`;
        b.style.left = `${Math.random() * 100}%`;
        b.style.top = `${Math.random() * 100}%`;
        b.style.setProperty('--bx', `${Math.random() * 60 - 30}px`);
        b.style.setProperty('--by', `${Math.random() * 60 - 30}px`);
        b.style.animationDuration = `${6 + Math.random() * 6}s`;
        b.style.animationDelay = `${Math.random() * 4}s`;
        bokeh.appendChild(b);
      }
    }

    const sparkleBurst = () => {
      for (let i = 0; i < 10; i++) {
        const p = spawnParticle({ kind: 'sparkle', left: 42 + Math.random() * 16, bottom: 38, duration: 1.1 + Math.random() * 0.6, delay: 0 });
        p.classList.add('burst');
        p.style.setProperty('--bx', `${Math.random() * 220 - 110}px`);
        p.style.setProperty('--by', `${-(80 + Math.random() * 140)}px`);
        p.addEventListener('animationend', () => p.remove(), { once: true });
      }
    };

    openBtn.addEventListener('click', () => {
      intro.classList.add('opening');
      openBtn.classList.add('pressed');
      openBtn.style.pointerEvents = 'none';

      setTimeout(() => envelope.classList.add('open'), 220);
      setTimeout(sparkleBurst, 350);
      setTimeout(() => { openBtn.style.opacity = '0'; openBtn.style.transition = 'opacity .5s ease'; }, 300);

      setTimeout(() => {
        intro.classList.add('hidden');
        document.body.classList.remove('no-scroll');
        startHeroReveal();
      }, 2200);
    }, { once: true });
  };

  /* ---------------------------------------------------
     HERO — typewriter + reveal (fires after envelope opens)
  --------------------------------------------------- */
  let heroStarted = false;
  const startHeroReveal = () => {
    if (heroStarted) return;
    heroStarted = true;
    const bride = $('#typeBride');
    const groom = $('#typeGroom');
    const rest = $$('.hero .reveal-text');

    setTimeout(() => bride && bride.classList.add('typing'), 200);
    setTimeout(() => { bride && bride.classList.add('done'); groom && groom.classList.add('typing'); }, 1400);
    setTimeout(() => groom && groom.classList.add('done'), 2600);
    rest.forEach((el, i) => setTimeout(() => el.classList.add('in-view'), 2800 + i * 180));
  };

  /* ---------------------------------------------------
     PROGRESS BAR
  --------------------------------------------------- */
  const initProgressBar = () => {
    const bar = $('#progressBar');
    if (!bar) return;
    const onScroll = () => {
      const h = document.documentElement;
      const scrolled = h.scrollTop;
      const max = h.scrollHeight - h.clientHeight;
      bar.style.width = `${max > 0 ? (scrolled / max) * 100 : 0}%`;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  };

  /* ---------------------------------------------------
     CURSOR GLOW
  --------------------------------------------------- */
  const initCursorGlow = () => {
    const glow = $('.cursor-glow');
    if (!glow || matchMedia('(hover: none)').matches) return;
    let x = 0, y = 0, cx = 0, cy = 0;
    window.addEventListener('mousemove', e => { x = e.clientX; y = e.clientY; });
    const loop = () => {
      cx += (x - cx) * 0.12;
      cy += (y - cy) * 0.12;
      glow.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
      requestAnimationFrame(loop);
    };
    loop();
  };

  /* ---------------------------------------------------
     NAV — sticky toggle overlay + back to top
  --------------------------------------------------- */
  const initNav = () => {
    const toggle = $('#navToggle');
    const overlay = $('#navOverlay');
    const links = $$('[data-nav]');
    if (!toggle || !overlay) return;

    const closeMenu = () => {
      overlay.classList.remove('open');
      toggle.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    };
    toggle.addEventListener('click', () => {
      const open = overlay.classList.toggle('open');
      toggle.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', String(open));
    });
    links.forEach(l => l.addEventListener('click', closeMenu));
    overlay.addEventListener('click', e => { if (e.target === overlay) closeMenu(); });

    const backToTop = $('#backToTop');
    window.addEventListener('scroll', () => {
      backToTop.classList.toggle('visible', window.scrollY > 700);
    }, { passive: true });
  };

  /* ---------------------------------------------------
     CINEMATIC SCROLL ENGINE
     Continuous, scrubbable (not played-once) scroll-linked
     motion: hero parallax/pin-unpin + per-section "scene" FX.
     Runs one rAF loop; --p / --hp are pure functions of the
     real scroll position, so reversing the scroll reverses
     the motion exactly — nothing is a fire-once transition.
  --------------------------------------------------- */
  const initCinematicScroll = () => {
    const heroWrap = $('#heroPinWrap');
    const cardNav = $('#cardNav');
    const scenes = $$('.scene[data-fx], .std-page[data-fx]');
    if (!scenes.length && !heroWrap) return;

    const clamp01 = v => v < 0 ? 0 : v > 1 ? 1 : v;
    const startVH = 0.92, endVH = 0.42;

    const frame = () => {
      const vh = window.innerHeight;

      if (heroWrap) {
        const rect = heroWrap.getBoundingClientRect();
        const scrollable = rect.height - vh;
        const hp = scrollable > 0 ? clamp01(-rect.top / scrollable) : 0;
        heroWrap.style.setProperty('--hp', hp.toFixed(4));
        if (cardNav) cardNav.classList.toggle('solid', hp > 0.5);
      }

      for (let i = 0; i < scenes.length; i++) {
        const el = scenes[i];
        const top = el.getBoundingClientRect().top;
        const p = clamp01((startVH * vh - top) / ((startVH - endVH) * vh));
        el.style.setProperty('--p', p.toFixed(4));
      }

      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  };

  /* ---------------------------------------------------
     RIPPLE
  --------------------------------------------------- */
  const initRipple = () => {
    $$('.open-invite-btn, .btn-outline-sm').forEach(btn => {
      btn.addEventListener('click', function (e) {
        const rect = this.getBoundingClientRect();
        const ripple = document.createElement('span');
        const size = Math.max(rect.width, rect.height) * 1.4;
        ripple.className = 'ripple';
        ripple.style.width = ripple.style.height = `${size}px`;
        ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
        ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
        this.style.position = this.style.position || 'relative';
        this.appendChild(ripple);
        ripple.addEventListener('animationend', () => ripple.remove());
      });
    });
  };

  /* ---------------------------------------------------
     COUNTDOWN (with flip digit animation)
  --------------------------------------------------- */
  const initCountdown = () => {
    const el = $('#countdown');
    if (!el) return;
    const target = new Date(el.dataset.weddingDate).getTime();
    const nodes = { d: $('#cd-days'), h: $('#cd-hours'), m: $('#cd-minutes'), s: $('#cd-seconds') };
    const prev = { d: '', h: '', m: '', s: '' };
    const pad = n => String(Math.max(n, 0)).padStart(2, '0');

    const setVal = (node, key, val) => {
      if (prev[key] !== val) {
        node.textContent = val;
        node.classList.remove('flip');
        void node.offsetWidth;
        node.classList.add('flip');
        prev[key] = val;
      }
    };

    const tick = () => {
      const diff = target - Date.now();
      if (diff <= 0) {
        Object.values(nodes).forEach(n => n.textContent = '00');
        clearInterval(timer);
        return;
      }
      setVal(nodes.d, 'd', pad(Math.floor(diff / 86400000)));
      setVal(nodes.h, 'h', pad(Math.floor((diff % 86400000) / 3600000)));
      setVal(nodes.m, 'm', pad(Math.floor((diff % 3600000) / 60000)));
      setVal(nodes.s, 's', pad(Math.floor((diff % 60000) / 1000)));
    };
    tick();
    const timer = setInterval(tick, 1000);
  };

  /* ---------------------------------------------------
     CALENDAR WIDGET
  --------------------------------------------------- */
  const initCalendar = () => {
    const countdownEl = $('#countdown');
    const monthLabel = $('#calendarMonth');
    const grid = $('#calendarGrid');
    if (!countdownEl || !grid) return;

    const date = new Date(countdownEl.dataset.weddingDate);
    const year = date.getFullYear();
    const month = date.getMonth();
    const weddingDay = date.getDate();

    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    monthLabel.textContent = `${monthNames[month]} ${year}`;

    const firstDay = new Date(year, month, 1);
    let startOffset = firstDay.getDay() - 1;
    if (startOffset < 0) startOffset = 6;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    let html = '';
    for (let i = 0; i < startOffset; i++) html += '<span></span>';
    for (let d = 1; d <= daysInMonth; d++) {
      html += `<span class="cal-cell${d === weddingDay ? ' highlight' : ''}">${d}</span>`;
    }
    grid.innerHTML = html;
  };

  /* ---------------------------------------------------
     GALLERY LIGHTBOX
  --------------------------------------------------- */
  const initLightbox = () => {
    const items = $$('.polaroid img');
    const lightbox = $('#lightbox');
    const lbImg = $('#lightboxImg');
    if (!items.length || !lightbox) return;
    let index = 0;

    const show = i => {
      index = (i + items.length) % items.length;
      lbImg.src = items[index].src;
      lbImg.alt = items[index].alt;
    };
    const open = i => {
      show(i);
      lightbox.classList.add('active');
      lightbox.setAttribute('aria-hidden', 'false');
      document.body.classList.add('no-scroll');
    };
    const close = () => {
      lightbox.classList.remove('active');
      lightbox.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('no-scroll');
    };

    items.forEach((img, i) => img.addEventListener('click', () => open(i)));
    $('#lightboxClose').addEventListener('click', close);
    $('#lightboxPrev').addEventListener('click', () => show(index - 1));
    $('#lightboxNext').addEventListener('click', () => show(index + 1));
    lightbox.addEventListener('click', e => { if (e.target === lightbox) close(); });
    window.addEventListener('keydown', e => {
      if (!lightbox.classList.contains('active')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') show(index - 1);
      if (e.key === 'ArrowRight') show(index + 1);
    });
  };

  /* ---------------------------------------------------
     BACKGROUND AUDIO
     One track, picked at random from assets/audio/ on every
     page load, autoplays on loop, and never overlaps itself —
     the single <audio id="songAudio"> element is the only
     source of playback for the whole page. The control lives
     on the hero (landing) screen; while playing, it spawns
     drifting musical notes across the hero.
  --------------------------------------------------- */
  const AUDIO_TRACKS = [
    '10781.mp3', '17371.mp3', '27413.mp3',
    '45168.mp3', '80507.mp3', '8957.mp3'
  ];
  const NOTE_GLYPHS = ['♪', '♫', '♬'];

  const initBackgroundAudio = () => {
    const wrap = $('#heroMusic');
    const btn = $('#songPlayBtn');
    const audio = $('#songAudio');
    const notesLayer = $('#musicNotes');
    if (!wrap || !btn || !audio) return;
    const playIcon = $('.icon-play', btn);
    const pauseIcon = $('.icon-pause', btn);

    const track = AUDIO_TRACKS[Math.floor(Math.random() * AUDIO_TRACKS.length)];
    audio.src = `assets/audio/${track}`;
    audio.loop = true;

    let noteTimer = null;
    const spawnNote = () => {
      if (!notesLayer) return;
      const note = document.createElement('span');
      note.className = 'music-note';
      note.textContent = NOTE_GLYPHS[Math.floor(Math.random() * NOTE_GLYPHS.length)];
      note.style.setProperty('--note-x', `${8 + Math.random() * 80}%`);
      note.style.setProperty('--note-drift', `${(Math.random() * 60 - 30).toFixed(0)}px`);
      note.style.setProperty('--note-rot', `${(Math.random() * 40 - 20).toFixed(0)}deg`);
      note.style.setProperty('--note-dur', `${(4.5 + Math.random() * 2.5).toFixed(1)}s`);
      note.style.fontSize = `${1 + Math.random() * 0.9}rem`;
      note.addEventListener('animationend', () => note.remove());
      notesLayer.appendChild(note);
    };
    const startNotes = () => {
      if (noteTimer) return;
      spawnNote();
      noteTimer = setInterval(spawnNote, 700);
    };
    const stopNotes = () => {
      clearInterval(noteTimer);
      noteTimer = null;
    };

    const setUiPlaying = (isPlaying) => {
      btn.classList.toggle('playing', isPlaying);
      playIcon.hidden = isPlaying;
      pauseIcon.hidden = !isPlaying;
      btn.setAttribute('aria-label', isPlaying ? 'Pause our song' : 'Play our song');
      if (isPlaying) startNotes(); else stopNotes();
    };
    audio.addEventListener('play', () => setUiPlaying(true));
    audio.addEventListener('pause', () => setUiPlaying(false));

    // try to autoplay as soon as the page loads; browsers that block
    // unmuted autoplay before any interaction will reject this quietly,
    // so we also arm a one-time fallback on the very first user gesture
    // (opening the envelope counts) to start it right away instead.
    const tryPlay = () => audio.play().catch(() => {});
    tryPlay();
    ['pointerdown', 'keydown'].forEach(evt =>
      document.addEventListener(evt, () => { if (audio.paused) tryPlay(); }, { once: true })
    );

    btn.addEventListener('click', () => {
      if (audio.paused) tryPlay();
      else audio.pause();
    });
  };

  /* ---------------------------------------------------
     INIT
  --------------------------------------------------- */
  document.addEventListener('DOMContentLoaded', () => {
    initEnvelope();
    initProgressBar();
    initCursorGlow();
    initNav();
    initCinematicScroll();
    initRipple();
    initCountdown();
    initCalendar();
    initLightbox();
    initBackgroundAudio();
  });
})();
