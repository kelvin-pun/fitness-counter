/**
 * ============================================================================
 * 1. SERVER MP3 PLAYLIST CONFIGURATION
 * Replace the URLs below with your own server MP3 paths when deploying:
 * e.g., url: 'audio/workout/track1.mp3'
 * ============================================================================
 */
const PLAYLISTS = {
  workout: [
    {
      title: 'Workout Track 1 - High Energy',
      url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
      // Server path example: 'audio/workout/track1.mp3'
    },
    {
      title: 'Workout Track 2 - Power Tempo',
      url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3'
      // Server path example: 'audio/workout/track2.mp3'
    },
    {
      title: 'Workout Track 3 - Cardio Drive',
      url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3'
      // Server path example: 'audio/workout/track3.mp3'
    }
  ],
  cooldown: [
    {
      title: 'Cool Down 1 - Deep Breath',
      url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3'
      // Server path example: 'audio/cooldown/relax1.mp3'
    },
    {
      title: 'Cool Down 2 - Gentle Stretch',
      url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3'
      // Server path example: 'audio/cooldown/relax2.mp3'
    }
  ]
};

/**
 * ============================================================================
 * 2. HIGH-OUTPUT WEB AUDIO API SYNTHESIZER (WITH LIMITER & MUSIC DUCKING)
 * ============================================================================
 */
class BeepAudioEngine {
  constructor() {
    this.ctx = null;
    this.compressor = null;
    this.masterGain = null;

    this.gainModes = [
      { label: 'MAX', value: 1.35 },
      { label: 'HIGH', value: 0.90 },
      { label: 'MED', value: 0.50 }
    ];
    this.gainIndex = 0;
    this.duckEnabled = true;
    this.duckTimeout = null;
  }

  unlock() {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    if (!this.ctx) {
      this.ctx = new AudioCtx();

      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-14, this.ctx.currentTime);
      this.compressor.knee.setValueAtTime(6, this.ctx.currentTime);
      this.compressor.ratio.setValueAtTime(12, this.ctx.currentTime);
      this.compressor.attack.setValueAtTime(0.002, this.ctx.currentTime);
      this.compressor.release.setValueAtTime(0.15, this.ctx.currentTime);

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.gainModes[this.gainIndex].value, this.ctx.currentTime);

      this.masterGain.connect(this.compressor);
      this.compressor.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  cycleGainMode() {
    this.gainIndex = (this.gainIndex + 1) % this.gainModes.length;
    const mode = this.gainModes[this.gainIndex];
    if (this.ctx && this.masterGain) {
      this.masterGain.gain.setValueAtTime(mode.value, this.ctx.currentTime);
    }
    return mode.label;
  }

  duckBackgroundMusic(durationMs = 450) {
    if (!this.duckEnabled || !bgMusicPlayer || bgMusicPlayer.paused) return;

    const userVol = parseInt(musicVolSlider.value, 10) / 100;
    bgMusicPlayer.volume = Math.max(0.08, userVol * 0.18);

    if (this.duckTimeout) clearTimeout(this.duckTimeout);
    this.duckTimeout = setTimeout(() => {
      if (bgMusicPlayer && !bgMusicPlayer.paused) {
        bgMusicPlayer.volume = parseInt(musicVolSlider.value, 10) / 100;
      }
    }, durationMs);
  }

  playHarmonicTone(freq, startTime, duration, primaryType = 'square', subType = 'sawtooth') {
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const noteGain = this.ctx.createGain();

    osc1.type = primaryType;
    osc1.frequency.setValueAtTime(freq, startTime);

    osc2.type = subType;
    osc2.frequency.setValueAtTime(freq * 1.5, startTime);

    noteGain.gain.setValueAtTime(0.001, startTime);
    noteGain.gain.exponentialRampToValueAtTime(0.95, startTime + 0.008);
    noteGain.gain.setValueAtTime(0.95, startTime + duration - 0.025);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc1.connect(noteGain);
    osc2.connect(noteGain);
    noteGain.connect(this.masterGain);

    osc1.start(startTime);
    osc2.start(startTime);
    osc1.stop(startTime + duration + 0.01);
    osc2.stop(startTime + duration + 0.01);
  }

  playCountdownPip() {
    this.unlock();
    if (!this.ctx) return;

    this.duckBackgroundMusic(260);
    const now = this.ctx.currentTime;
    this.playHarmonicTone(1244.5, now, 0.13, 'square', 'triangle');

    if (navigator.vibrate) navigator.vibrate(45);
  }

  playStartBeep() {
    this.unlock();
    if (!this.ctx) return;

    this.duckBackgroundMusic(700);
    const now = this.ctx.currentTime;
    this.playHarmonicTone(1046.5, now, 0.13, 'square', 'sawtooth');
    this.playHarmonicTone(1046.5, now + 0.16, 0.13, 'square', 'sawtooth');
    this.playHarmonicTone(1567.98, now + 0.32, 0.32, 'square', 'sawtooth');

    if (navigator.vibrate) navigator.vibrate([120, 50, 200]);
  }

  playTransitionBeep() {
    this.unlock();
    if (!this.ctx) return;

    this.duckBackgroundMusic(600);
    const now = this.ctx.currentTime;
    this.playHarmonicTone(1174.66, now, 0.16, 'square', 'sawtooth');
    this.playHarmonicTone(783.99, now + 0.20, 0.30, 'square', 'sawtooth');

    if (navigator.vibrate) navigator.vibrate([90, 50, 140]);
  }
}

const beepEngine = new BeepAudioEngine();

/**
 * ============================================================================
 * 3. SCREEN WAKE LOCK (KEEPS PHONE AWAKE DURING WORKOUT)
 * ============================================================================
 */
let wakeLockSentinel = null;
const wakeLockIndicator = document.getElementById('wakeLockIndicator');

async function requestWakeLock() {
  if ('wakeLock' in navigator) {
    try {
      wakeLockSentinel = await navigator.wakeLock.request('screen');
      wakeLockIndicator.style.background = '#10b981';
    } catch (err) {
      // Fallback if battery saver blocks wakeLock
    }
  }
}

function releaseWakeLock() {
  if (wakeLockSentinel) {
    wakeLockSentinel.release().then(() => {
      wakeLockSentinel = null;
    });
  }
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && timerState.isRunning) {
    requestWakeLock();
  }
});

/**
 * ============================================================================
 * 4. 60-SECOND INTERVAL TIMER ENGINE (WITH INITIAL 3-2-1 PREP & WARNING CUES)
 * ============================================================================
 */
const TOTAL_CYCLE_SECONDS = 60;
const PREP_DURATION_SECONDS = 3;
const RING_CIRCUMFERENCE = 2 * Math.PI * 98;

const timerState = {
  isRunning: false,
  sectionASeconds: 40,
  sectionBSeconds: 20,
  isPrepPhase: false,
  prepElapsedMs: 0,
  elapsedInCycleMs: 0,
  lastFrameTime: 0,
  currentPhase: 'A',
  roundCount: 1,
  rafId: null,
  lastWarnSecondFired: null
};

const splitSlider = document.getElementById('splitSlider');
const secALabel = document.getElementById('secALabel');
const secBLabel = document.getElementById('secBLabel');
const stepMinusBtn = document.getElementById('stepMinusBtn');
const stepPlusBtn = document.getElementById('stepPlusBtn');
const presetChips = document.querySelectorAll('.preset-chip');
const splitCard = document.getElementById('splitCard');

const phaseBadge = document.getElementById('phaseBadge');
const sectionTimeDisplay = document.getElementById('sectionTimeDisplay');
const totalCycleDisplay = document.getElementById('totalCycleDisplay');
const roundCountDisplay = document.getElementById('roundCountDisplay');
const ringProgress = document.getElementById('ringProgress');
const ringContainer = document.getElementById('ringContainer');

const startStopBtn = document.getElementById('startStopBtn');
const startStopIcon = document.getElementById('startStopIcon');
const startStopText = document.getElementById('startStopText');
const resetBtn = document.getElementById('resetBtn');

const testBeepBtn = document.getElementById('testBeepBtn');
const beepGainBtn = document.getElementById('beepGainBtn');
const beepGainLabel = document.getElementById('beepGainLabel');
const duckToggleBtn = document.getElementById('duckToggleBtn');
const duckToggleLabel = document.getElementById('duckToggleLabel');

function updateSplitConfiguration(newSecA) {
  const clampedA = Math.min(55, Math.max(5, parseInt(newSecA, 10)));
  const clampedB = TOTAL_CYCLE_SECONDS - clampedA;

  timerState.sectionASeconds = clampedA;
  timerState.sectionBSeconds = clampedB;

  splitSlider.value = clampedA;
  const pct = ((clampedA - 5) / 50) * 100;
  splitSlider.style.setProperty('--split-pct', `${pct}%`);

  secALabel.textContent = `${clampedA}s`;
  secBLabel.textContent = `${clampedB}s`;

  presetChips.forEach(chip => {
    chip.classList.toggle('active', parseInt(chip.dataset.split, 10) === clampedA);
  });

  if (!timerState.isRunning && timerState.elapsedInCycleMs === 0 && !timerState.isPrepPhase) {
    sectionTimeDisplay.textContent = String(clampedA).padStart(2, '0');
    totalCycleDisplay.textContent = '60s';
    ringProgress.style.strokeDashoffset = '0';
  }
}

splitSlider.addEventListener('input', (e) => updateSplitConfiguration(e.target.value));
stepMinusBtn.addEventListener('click', () => updateSplitConfiguration(timerState.sectionASeconds - 5));
stepPlusBtn.addEventListener('click', () => updateSplitConfiguration(timerState.sectionASeconds + 5));

presetChips.forEach(chip => {
  chip.addEventListener('click', () => updateSplitConfiguration(chip.dataset.split));
});

function triggerVisualFlash() {
  ringContainer.classList.remove('flash-transition');
  void ringContainer.offsetWidth;
  ringContainer.classList.add('flash-transition');
}

function triggerCountdownDigitsPulse() {
  sectionTimeDisplay.classList.remove('countdown-warn');
  void sectionTimeDisplay.offsetWidth;
  sectionTimeDisplay.classList.add('countdown-warn');
}

function renderTimerUI() {
  if (timerState.isPrepPhase) {
    const prepDurationMs = PREP_DURATION_SECONDS * 1000;
    const prepRemainingMs = Math.max(0, prepDurationMs - timerState.prepElapsedMs);
    const prepSecondsLeft = Math.ceil(prepRemainingMs / 1000);
    const prepProgressFraction = prepRemainingMs / prepDurationMs;

    document.body.setAttribute('data-phase', 'prep');
    phaseBadge.textContent = 'GET READY • 3-2-1';
    sectionTimeDisplay.textContent = String(prepSecondsLeft).padStart(2, '0');
    totalCycleDisplay.textContent = 'PREP';
    roundCountDisplay.textContent = timerState.roundCount;

    const dashOffset = RING_CIRCUMFERENCE * (1 - prepProgressFraction);
    ringProgress.style.strokeDashoffset = dashOffset.toFixed(2);
    return;
  }

  const secAMs = timerState.sectionASeconds * 1000;
  const secBMs = timerState.sectionBSeconds * 1000;
  const totalMs = TOTAL_CYCLE_SECONDS * 1000;

  const inSectionA = timerState.elapsedInCycleMs < secAMs;
  let sectionRemainingMs = 0;
  let sectionDurationMs = 1;

  if (inSectionA) {
    sectionRemainingMs = secAMs - timerState.elapsedInCycleMs;
    sectionDurationMs = secAMs;
    document.body.setAttribute('data-phase', 'sectionA');
    phaseBadge.textContent = 'SECTION A • WORK';
  } else {
    sectionRemainingMs = totalMs - timerState.elapsedInCycleMs;
    sectionDurationMs = secBMs;
    document.body.setAttribute('data-phase', 'sectionB');
    phaseBadge.textContent = 'SECTION B • REST';
  }

  const secRemainingCeil = Math.min(
    Math.ceil(sectionDurationMs / 1000),
    Math.max(1, Math.ceil(sectionRemainingMs / 1000))
  );

  if (timerState.isRunning && secRemainingCeil <= 3 && secRemainingCeil >= 1) {
    const warnKey = `${timerState.roundCount}-${inSectionA ? 'A' : 'B'}-${secRemainingCeil}`;
    if (timerState.lastWarnSecondFired !== warnKey) {
      timerState.lastWarnSecondFired = warnKey;
      beepEngine.playCountdownPip();
      triggerCountdownDigitsPulse();
    }
  }

  const totalRemainingCeil = Math.max(1, Math.ceil((totalMs - timerState.elapsedInCycleMs) / 1000));

  sectionTimeDisplay.textContent = String(secRemainingCeil).padStart(2, '0');
  totalCycleDisplay.textContent = `${totalRemainingCeil}s`;
  roundCountDisplay.textContent = timerState.roundCount;

  const progressFraction = Math.max(0, Math.min(1, sectionRemainingMs / sectionDurationMs));
  const dashOffset = RING_CIRCUMFERENCE * (1 - progressFraction);
  ringProgress.style.strokeDashoffset = dashOffset.toFixed(2);
}

function timerLoop(now) {
  if (!timerState.isRunning) return;

  const deltaMs = now - timerState.lastFrameTime;
  timerState.lastFrameTime = now;

  if (timerState.isPrepPhase) {
    timerState.prepElapsedMs += deltaMs;
    const prepTotalMs = PREP_DURATION_SECONDS * 1000;

    if (timerState.prepElapsedMs < prepTotalMs) {
      const prepSecLeft = Math.ceil((prepTotalMs - timerState.prepElapsedMs) / 1000);
      const prepWarnKey = `PREP-${prepSecLeft}`;
      if (prepSecLeft <= 3 && prepSecLeft >= 1 && timerState.lastWarnSecondFired !== prepWarnKey) {
        timerState.lastWarnSecondFired = prepWarnKey;
        beepEngine.playCountdownPip();
        triggerCountdownDigitsPulse();
      }
      renderTimerUI();
      timerState.rafId = requestAnimationFrame(timerLoop);
      return;
    } else {
      const overflowMs = timerState.prepElapsedMs - prepTotalMs;
      timerState.isPrepPhase = false;
      timerState.prepElapsedMs = 0;
      timerState.elapsedInCycleMs = overflowMs;
      timerState.currentPhase = 'A';
      timerState.lastWarnSecondFired = null;

      beepEngine.playStartBeep();
      triggerVisualFlash();
    }
  } else {
    timerState.elapsedInCycleMs += deltaMs;
  }

  const secAMs = timerState.sectionASeconds * 1000;
  const totalMs = TOTAL_CYCLE_SECONDS * 1000;

  if (timerState.currentPhase === 'A' && timerState.elapsedInCycleMs >= secAMs && timerState.elapsedInCycleMs < totalMs) {
    timerState.currentPhase = 'B';
    timerState.lastWarnSecondFired = null;
    beepEngine.playTransitionBeep();
    triggerVisualFlash();
  }

  if (timerState.elapsedInCycleMs >= totalMs) {
    timerState.elapsedInCycleMs = timerState.elapsedInCycleMs % totalMs;
    timerState.currentPhase = 'A';
    timerState.roundCount += 1;
    timerState.lastWarnSecondFired = null;
    beepEngine.playStartBeep();
    triggerVisualFlash();
  }

  renderTimerUI();
  timerState.rafId = requestAnimationFrame(timerLoop);
}

function startTimer() {
  beepEngine.unlock();
  requestWakeLock();

  const isFreshStart =
    timerState.elapsedInCycleMs === 0 &&
    timerState.roundCount === 1 &&
    !timerState.isPrepPhase &&
    timerState.prepElapsedMs === 0;

  if (isFreshStart) {
    timerState.isPrepPhase = true;
    timerState.prepElapsedMs = 0;
    timerState.lastWarnSecondFired = 'PREP-3';
    beepEngine.playCountdownPip();
    triggerCountdownDigitsPulse();
    renderTimerUI();
  }

  timerState.isRunning = true;
  timerState.lastFrameTime = performance.now();

  startStopBtn.classList.add('running');
  startStopIcon.textContent = '⏸';
  startStopText.textContent = 'Pause Timer';
  splitCard.classList.add('locked');

  timerState.rafId = requestAnimationFrame(timerLoop);
}

function pauseTimer() {
  timerState.isRunning = false;
  if (timerState.rafId) cancelAnimationFrame(timerState.rafId);
  releaseWakeLock();

  startStopBtn.classList.remove('running');
  startStopIcon.textContent = '▶';
  startStopText.textContent = 'Resume Timer';
}

function resetTimer() {
  pauseTimer();
  timerState.isPrepPhase = false;
  timerState.prepElapsedMs = 0;
  timerState.elapsedInCycleMs = 0;
  timerState.currentPhase = 'A';
  timerState.roundCount = 1;
  timerState.lastWarnSecondFired = null;

  startStopIcon.textContent = '▶';
  startStopText.textContent = 'Start Timer';
  splitCard.classList.remove('locked');
  document.body.setAttribute('data-phase', 'sectionA');
  phaseBadge.textContent = 'READY • SECTION A';
  sectionTimeDisplay.classList.remove('countdown-warn');

  updateSplitConfiguration(timerState.sectionASeconds);
  roundCountDisplay.textContent = '1';
}

startStopBtn.addEventListener('click', () => {
  if (timerState.isRunning) {
    pauseTimer();
  } else {
    startTimer();
  }
});

resetBtn.addEventListener('click', resetTimer);

beepGainBtn.addEventListener('click', () => {
  const newLabel = beepEngine.cycleGainMode();
  beepGainLabel.textContent = newLabel;
  beepEngine.playCountdownPip();
});

duckToggleBtn.addEventListener('click', () => {
  beepEngine.duckEnabled = !beepEngine.duckEnabled;
  duckToggleLabel.textContent = beepEngine.duckEnabled ? 'ON' : 'OFF';
  duckToggleLabel.style.color = beepEngine.duckEnabled ? 'var(--sec-a-primary)' : 'var(--text-muted)';
});

testBeepBtn.addEventListener('click', () => {
  beepEngine.playStartBeep();
  triggerVisualFlash();
});

/**
 * ============================================================================
 * 5. DUAL PLAYLIST MP3 CONTROLLER (WORKOUT & COOL DOWN)
 * ============================================================================
 */
const bgMusicPlayer = document.getElementById('bgMusicPlayer');
const workoutMusicBtn = document.getElementById('workoutMusicBtn');
const cooldownMusicBtn = document.getElementById('cooldownMusicBtn');
const workoutStatusText = document.getElementById('workoutStatusText');
const cooldownStatusText = document.getElementById('cooldownStatusText');
const nowPlayingText = document.getElementById('nowPlayingText');
const trackDot = document.getElementById('trackDot');
const nextTrackBtn = document.getElementById('nextTrackBtn');
const musicVolSlider = document.getElementById('musicVolSlider');

const musicState = {
  activeCategory: null,
  trackIndex: 0,
  isPlaying: false
};

bgMusicPlayer.volume = 0.75;

musicVolSlider.addEventListener('input', (e) => {
  bgMusicPlayer.volume = parseInt(e.target.value, 10) / 100;
});

function loadAndPlayTrack(category, index) {
  const list = PLAYLISTS[category];
  if (!list || list.length === 0) return;

  musicState.activeCategory = category;
  musicState.trackIndex = index % list.length;
  const track = list[musicState.trackIndex];

  bgMusicPlayer.src = track.url;
  bgMusicPlayer.volume = parseInt(musicVolSlider.value, 10) / 100;
  const playPromise = bgMusicPlayer.play();

  if (playPromise !== undefined) {
    playPromise
      .then(() => {
        musicState.isPlaying = true;
        updateMusicUI();
      })
      .catch(() => {
        musicState.isPlaying = false;
        nowPlayingText.textContent = `Unable to load: ${track.title}`;
        updateMusicUI();
      });
  }
}

function toggleMusicCategory(category) {
  beepEngine.unlock();

  if (musicState.activeCategory === category) {
    if (musicState.isPlaying) {
      bgMusicPlayer.pause();
      musicState.isPlaying = false;
    } else {
      bgMusicPlayer.play().then(() => {
        musicState.isPlaying = true;
        updateMusicUI();
      }).catch(() => {});
    }
    updateMusicUI();
  } else {
    loadAndPlayTrack(category, 0);
  }
}

function skipToNextTrack() {
  if (!musicState.activeCategory) return;
  loadAndPlayTrack(musicState.activeCategory, musicState.trackIndex + 1);
}

bgMusicPlayer.addEventListener('ended', () => {
  skipToNextTrack();
});

function updateMusicUI() {
  const isWorkout = musicState.activeCategory === 'workout';
  const isCooldown = musicState.activeCategory === 'cooldown';

  workoutMusicBtn.classList.toggle('active', isWorkout && musicState.isPlaying);
  cooldownMusicBtn.classList.toggle('active', isCooldown && musicState.isPlaying);

  workoutStatusText.textContent = isWorkout
    ? (musicState.isPlaying ? 'Playing • Tap to Pause' : 'Paused • Tap to Resume')
    : 'Tap to play MP3s';

  cooldownStatusText.textContent = isCooldown
    ? (musicState.isPlaying ? 'Playing • Tap to Pause' : 'Paused • Tap to Resume')
    : 'Tap to play Relax MP3s';

  trackDot.classList.toggle('playing', musicState.isPlaying);
  nextTrackBtn.disabled = !musicState.activeCategory;

  if (musicState.activeCategory) {
    const currentTrack = PLAYLISTS[musicState.activeCategory][musicState.trackIndex];
    const prefix = musicState.isPlaying ? 'Playing:' : 'Paused:';
    nowPlayingText.textContent = `${prefix} ${currentTrack.title}`;
  } else {
    nowPlayingText.textContent = 'Music Stopped • Select a playlist above';
  }
}

workoutMusicBtn.addEventListener('click', () => toggleMusicCategory('workout'));
cooldownMusicBtn.addEventListener('click', () => toggleMusicCategory('cooldown'));
nextTrackBtn.addEventListener('click', skipToNextTrack);

// Initialize default 40s / 20s view on load
updateSplitConfiguration(40);
