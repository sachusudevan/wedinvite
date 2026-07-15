// ==========================================================================
// Floating music player: play/pause, mute, volume, track switching, visualizer
// ==========================================================================
WED.onReady(() => {
  const player = document.getElementById("musicPlayer");
  const audio = document.getElementById("bgAudio");
  if (!player || !audio) return;

  const tracks = [
    { src: "assets/audio/8957.mp3", label: "Melody I" },
    { src: "assets/audio/10781.mp3", label: "Melody II" },
    { src: "assets/audio/17371.mp3", label: "Melody III" },
    { src: "assets/audio/27413.mp3", label: "Melody IV" },
    { src: "assets/audio/45168.mp3", label: "Melody V" },
    { src: "assets/audio/80507.mp3", label: "Melody VI" },
  ];

  const toggleBtn = document.getElementById("playerToggle");
  const ring = document.getElementById("playerRing");
  const trackName = document.getElementById("playerTrackName");
  const prevBtn = document.getElementById("playerPrevTrack");
  const nextBtn = document.getElementById("playerNextTrack");
  const muteBtn = document.getElementById("playerMute");
  const muteIconOn = document.getElementById("muteIconOn");
  const muteIconOff = document.getElementById("muteIconOff");
  const volumeSlider = document.getElementById("playerVolume");
  const visualizerBars = document.querySelectorAll("#playerVisualizer span");

  const RING_C = 2 * Math.PI * 23;
  ring.style.strokeDasharray = `${RING_C}`;
  ring.style.strokeDashoffset = `${RING_C}`;

  // Pick a random track every time the page refreshes
  let trackIndex = Math.floor(Math.random() * tracks.length);
  let audioCtx, analyser, dataArray, sourceNode;
  let rafId = null;

  function loadTrack(index, autoplay) {
    trackIndex = (index + tracks.length) % tracks.length;
    audio.src = tracks[trackIndex].src;
    trackName.textContent = tracks[trackIndex].label;
    if (autoplay) audio.play().catch(() => {});
  }
  loadTrack(trackIndex, false);

  const savedVolume = parseFloat(localStorage.getItem("wed_volume") || "0.6");
  audio.volume = savedVolume;
  volumeSlider.value = String(savedVolume);

  function setupAnalyser() {
    if (audioCtx) return;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      audioCtx = new Ctx();
      sourceNode = audioCtx.createMediaElementSource(audio);
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      dataArray = new Uint8Array(analyser.frequencyBinCount);
      sourceNode.connect(analyser);
      analyser.connect(audioCtx.destination);
    } catch (err) {
      analyser = null;
    }
  }

  function drawVisualizer() {
    if (analyser && !player.classList.contains("is-idle-viz")) {
      analyser.getByteFrequencyData(dataArray);
      const step = Math.floor(dataArray.length / visualizerBars.length);
      visualizerBars.forEach((bar, i) => {
        const v = dataArray[i * step] || 0;
        bar.style.height = `${WED.clamp(12 + (v / 255) * 88, 12, 100)}%`;
      });
    } else {
      visualizerBars.forEach((bar, i) => {
        const t = Date.now() / 300 + i;
        bar.style.height = `${20 + Math.abs(Math.sin(t)) * 60}%`;
      });
    }
    rafId = requestAnimationFrame(drawVisualizer);
  }

  function play() {
    setupAnalyser();
    if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
    audio
      .play()
      .then(() => {
        player.classList.add("is-playing");
        if (!rafId) drawVisualizer();
      })
      .catch(() => {});
  }
  function pause() {
    audio.pause();
    player.classList.remove("is-playing");
  }

  toggleBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (player.classList.contains("is-playing")) pause();
    else play();
  });

  prevBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const wasPlaying = player.classList.contains("is-playing");
    loadTrack(trackIndex - 1, wasPlaying);
  });
  nextBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const wasPlaying = player.classList.contains("is-playing");
    loadTrack(trackIndex + 1, wasPlaying);
  });
  audio.addEventListener("ended", () => loadTrack(trackIndex + 1, true));

  audio.addEventListener("timeupdate", () => {
    if (!audio.duration) return;
    const ratio = audio.currentTime / audio.duration;
    ring.style.strokeDashoffset = `${RING_C * (1 - ratio)}`;
  });

  muteBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    audio.muted = !audio.muted;
    muteIconOn.hidden = audio.muted;
    muteIconOff.hidden = !audio.muted;
  });

  volumeSlider.addEventListener("input", (e) => {
    const v = parseFloat(e.target.value);
    audio.volume = v;
    localStorage.setItem("wed_volume", String(v));
    if (v === 0) {
      audio.muted = true;
      muteIconOn.hidden = true;
      muteIconOff.hidden = false;
    } else if (audio.muted) {
      audio.muted = false;
      muteIconOn.hidden = false;
      muteIconOff.hidden = true;
    }
  });

  // Expand panel on hover (fine pointer) or tap (touch)
  if (!WED.flags.coarsePointer) {
    player.addEventListener("mouseenter", () => player.classList.add("is-expanded"));
    player.addEventListener("mouseleave", () => player.classList.remove("is-expanded"));
  } else {
    player.addEventListener("click", (e) => {
      if (e.target.closest(".player-disc-btn")) return;
      player.classList.toggle("is-expanded");
    });
  }

  // Attempt autoplay right after the intro gate's user gesture
  document.addEventListener("intro:enter", () => {
    play();
  });
});
