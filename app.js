/**
 * ============================================================================
 * FITNESS COUNTER & ENDURANCE TIMER
 * Supports:
 * 1. 1-Minute Splits (Work / Off) with Customizable Rest Periods after N Rounds
 * 2. Long Section Countdown (1 to 15 min) with Voice Notice Every Minute
 * 3. High-Output Synthesizer Beeps (MAX / HIGH / MED)
 * ============================================================================
 */

/**
 * ============================================================================
 * 1. HIGH-OUTPUT WEB AUDIO API SYNTHESIZER
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

  playHarmonicTone(freq, startTime, duration, primaryType = 'square', subType = 'sawtooth') {
    if (!this.ctx) return;
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
    const now = this.ctx.currentTime;
    this.playHarmonicTone(1244.5, now, 0.13, 'square', 'triangle');
    if (navigator.vibrate) navigator.vibrate(45);
  }

  playStartBeep() {
    this.unlock();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    this.playHarmonicTone(1046.5, now, 0.13, 'square', 'sawtooth');
    this.playHarmonicTone(1046.5, now + 0.16, 0.13, 'square', 'sawtooth');
    this.playHarmonicTone(1567.98, now + 0.32, 0.32, 'square', 'sawtooth');
    if (navigator.vibrate) navigator.vibrate([120, 50, 200]);
  }

  playTransitionBeep() {
    this.unlock();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    this.playHarmonicTone(1174.66, now, 0.16, 'square', 'sawtooth');
    this.playHarmonicTone(783.99, now + 0.20, 0.30, 'square', 'sawtooth');
    if (navigator.vibrate) navigator.vibrate([90, 50, 140]);
  }

  playRestBeep() {
    this.unlock();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    this.playHarmonicTone(880.0, now, 0.18, 'triangle', 'sine');
    this.playHarmonicTone(659.25, now + 0.20, 0.25, 'triangle', 'sine');
    this.playHarmonicTone(523.25, now + 0.42, 0.40, 'triangle', 'sine');
    if (navigator.vibrate) navigator.vibrate([150, 60, 250]);
  }

  playFinishBeep() {
    this.unlock();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    this.playHarmonicTone(523.25, now, 0.15, 'square', 'sawtooth');
    this.playHarmonicTone(659.25, now + 0.16, 0.15, 'square', 'sawtooth');
    this.playHarmonicTone(783.99, now + 0.32, 0.15, 'square', 'sawtooth');
    this.playHarmonicTone(1046.50, now + 0.48, 0.45, 'square', 'sawtooth');
    if (navigator.vibrate) navigator.vibrate([200, 80, 400]);
  }
}

const beepEngine = new BeepAudioEngine();

/**
 * ============================================================================
 * 2. SPEECH SYNTHESIS ENGINE (MALE VOICE • MEASURED SPEED • MINUTES COUNT)
 * ============================================================================
 */
class VoiceEngine {
  constructor() {
    this.enabled = true;
    this.hasSynthesis = 'speechSynthesis' in window;
    this.voice = null;

    if (this.hasSynthesis) {
      this.initVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => this.initVoices();
      }
    }
  }

  initVoices() {
    if (!this.hasSynthesis) return;
    const voices = window.speechSynthesis.getVoices();

    // Prioritize natural male English voices
    const maleNames = [
      'Daniel', 'Arthur', 'Oliver', 'George', 'Aaron', 'James',
      'David', 'Mark', 'Guy', 'Tom', 'Ryan', 'Google UK English Male',
      'Google US English Male', 'Microsoft David', 'Microsoft Mark'
    ];

    this.voice = voices.find(v => v.lang.startsWith('en') && maleNames.some(name => v.name.includes(name)))
      || voices.find(v => v.lang.startsWith('en') && (v.name.toLowerCase().includes('male') || !v.name.toLowerCase().includes('female')))
      || voices.find(v => v.lang.startsWith('en'))
      || voices[0] || null;
  }

  speak(text, options = {}) {
    if (!this.enabled || !this.hasSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      if (this.voice) utterance.voice = this.voice;
      // Lower, measured speed (0.86) and deep resonant male pitch (0.88)
      utterance.rate = options.rate !== undefined ? options.rate : 0.86;
      utterance.pitch = options.pitch !== undefined ? options.pitch : 0.88;
      utterance.volume = options.volume !== undefined ? options.volume : 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      // Ignore if blocked by browser policy
    }
  }

  speakMinuteRemaining(minsRemaining) {
    const numberWords = {
      1: 'One',
      2: 'Two',
      3: 'Three',
      4: 'Four,',
      5: 'Five',
      6: 'Six',
      7: 'Seven',
      8: 'Eight',
      9: 'Nine',
      10: 'Ten',
      11: 'Eleven',
      12: 'Twelve',
      13: 'Thirteen',
      14: 'Fourteen',
      15: 'Fifteen'
    };

    const word = numberWords[minsRemaining] || `${minsRemaining}`;
    const unit = minsRemaining === 1 ? 'minute' : 'minutes';
    // "Four, minutes remaining." delivers that distinct, measured "Four~ minutes remaining" intonation
    const phrase = `${word} ${unit} remaining.`;

    this.speak(phrase, { rate: 0.84, pitch: 0.88 });
  }
}

const voiceEngine = new VoiceEngine();

/**
 * ============================================================================
 * 3. SCREEN WAKE LOCK
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
      // Fallback if battery saver blocks
    }
  }
}

function releaseWakeLock() {
  if (wakeLockSentinel) {
    wakeLockSentinel.release().then(() => {
      wakeLockSentinel = null;
      wakeLockIndicator.style.background = 'var(--text-muted)';
    }).catch(() => {});
  }
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && timerState.isRunning) {
    requestWakeLock();
  }
});

/**
 * ============================================================================
 * 4. TIMER STATE & DOM ELEMENTS
 * ============================================================================
 */
const TOTAL_CYCLE_SECONDS = 60;
const PREP_DURATION_SECONDS = 3;
const RING_CIRCUMFERENCE = 2 * Math.PI * 98;

const timerState = {
  mode: 'intervals', // 'intervals' | 'longSection'
  isRunning: false,

  // Intervals settings
  sectionASeconds: 45,
  sectionBSeconds: 15,
  restEveryRounds: 4,      // 0 = disabled
  restDurationSeconds: 60, // 60s = 1 min
  currentRound: 1,
  currentPhase: 'A',       // 'PREP' | 'A' | 'B' | 'REST'
  isPrepPhase: false,
  prepElapsedMs: 0,
  elapsedInPhaseMs: 0,

  // Long section settings
  longMinutes: 8,
  longElapsedMs: 0,
  lastVoiceMinuteAnnounced: null,

  // RAF engine
  lastFrameTime: 0,
  rafId: null,
  lastWarnSecondFired: null
};

// Mode switch tabs
const tabIntervals = document.getElementById('tabIntervals');
const tabLongSection = document.getElementById('tabLongSection');
const intervalsPanel = document.getElementById('intervalsPanel');
const longSectionPanel = document.getElementById('longSectionPanel');

// Ring & readout
const ringContainer = document.getElementById('ringContainer');
const ringProgress = document.getElementById('ringProgress');
const phaseBadge = document.getElementById('phaseBadge');
const timeDisplay = document.getElementById('timeDisplay');
const cycleSubDisplay = document.getElementById('cycleSubDisplay');
const cycleSubLeft = document.getElementById('cycleSubLeft');
const cycleSubRight = document.getElementById('cycleSubRight');
const roundCountDisplay = document.getElementById('roundCountDisplay');

// Intervals controls
const splitSlider = document.getElementById('splitSlider');
const secALabel = document.getElementById('secALabel');
const secBLabel = document.getElementById('secBLabel');
const stepMinusBtn = document.getElementById('stepMinusBtn');
const stepPlusBtn = document.getElementById('stepPlusBtn');
const presetChips = document.querySelectorAll('.preset-chip[data-split]');
const restEveryRoundsSelect = document.getElementById('restEveryRounds');
const restDurationSelect = document.getElementById('restDuration');
const restSummaryText = document.getElementById('restSummaryText');

// Long Section controls
const longSlider = document.getElementById('longSlider');
const longDurationLabel = document.getElementById('longDurationLabel');
const longMinusBtn = document.getElementById('longMinusBtn');
const longPlusBtn = document.getElementById('longPlusBtn');
const longChips = document.querySelectorAll('.long-chip');

// Main buttons
const startStopBtn = document.getElementById('startStopBtn');
const startStopIcon = document.getElementById('startStopIcon');
const startStopText = document.getElementById('startStopText');
const resetBtn = document.getElementById('resetBtn');

// Top audio buttons
const testBeepBtn = document.getElementById('testBeepBtn');
const beepGainBtn = document.getElementById('beepGainBtn');
const beepGainLabel = document.getElementById('beepGainLabel');
const voiceToggleBtn = document.getElementById('voiceToggleBtn');
const voiceToggleLabel = document.getElementById('voiceToggleLabel');

/**
 * ============================================================================
 * 5. UI VISUAL HELPERS & SOUNDS
 * ============================================================================
 */
function triggerVisualFlash() {
  ringContainer.classList.remove('flash-transition');
  void ringContainer.offsetWidth;
  ringContainer.classList.add('flash-transition');
}

function triggerCountdownDigitsPulse() {
  timeDisplay.classList.remove('countdown-warn');
  void timeDisplay.offsetWidth;
  timeDisplay.classList.add('countdown-warn');
}

function updateRestSummaryText() {
  const rounds = parseInt(restEveryRoundsSelect.value, 10);
  const durSecs = parseInt(restDurationSelect.value, 10);
  const durText = durSecs >= 60 ? `${durSecs / 60}m` : `${durSecs}s`;

  if (rounds === 0) {
    restSummaryText.textContent = 'Continuous rounds (no rest period)';
    restSummaryText.style.color = 'var(--text-muted)';
  } else {
    restSummaryText.textContent = `Rest ${durText} after every ${rounds} rounds`;
    restSummaryText.style.color = 'var(--rest-primary)';
  }
}

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

  if (!timerState.isRunning && timerState.mode === 'intervals') {
    timeDisplay.textContent = String(clampedA).padStart(2, '0');
    ringProgress.style.strokeDashoffset = '0';
  }
}

function updateLongConfiguration(newMins) {
  const clampedMins = Math.min(15, Math.max(1, parseInt(newMins, 10)));
  timerState.longMinutes = clampedMins;

  longSlider.value = clampedMins;
  const pct = ((clampedMins - 1) / 14) * 100;
  longSlider.style.setProperty('--long-pct', `${pct}%`);

  longDurationLabel.textContent = `${clampedMins}m 00s`;

  longChips.forEach(chip => {
    chip.classList.toggle('active', parseInt(chip.dataset.mins, 10) === clampedMins);
  });

  if (!timerState.isRunning && timerState.mode === 'longSection') {
    const minsStr = String(clampedMins).padStart(2, '0');
    timeDisplay.textContent = `${minsStr}:00`;
    timeDisplay.classList.add('long-format');
    ringProgress.style.strokeDashoffset = '0';
  }
}

function setMode(mode) {
  if (timerState.isRunning) return; // locked during active timer

  timerState.mode = mode;
  tabIntervals.classList.toggle('active', mode === 'intervals');
  tabLongSection.classList.toggle('active', mode === 'longSection');

  intervalsPanel.classList.toggle('hidden', mode !== 'intervals');
  longSectionPanel.classList.toggle('hidden', mode !== 'longSection');

  startStopBtn.classList.toggle('mode-long', mode === 'longSection');

  resetTimer();
}

/**
 * ============================================================================
 * 6. RENDER LOGIC
 * ============================================================================
 */
function renderTimerUI() {
  if (timerState.mode === 'intervals') {
    renderIntervalsUI();
  } else {
    renderLongSectionUI();
  }
}

function renderIntervalsUI() {
  timeDisplay.classList.remove('long-format');

  // 1. PREP PHASE
  if (timerState.isPrepPhase) {
    const prepDurationMs = PREP_DURATION_SECONDS * 1000;
    const prepRemainingMs = Math.max(0, prepDurationMs - timerState.prepElapsedMs);
    const prepSecondsLeft = Math.ceil(prepRemainingMs / 1000);
    const prepProgressFraction = prepRemainingMs / prepDurationMs;

    document.body.setAttribute('data-phase', 'prep');
    phaseBadge.textContent = 'GET READY • 3-2-1';
    timeDisplay.textContent = String(prepSecondsLeft).padStart(2, '0');
    cycleSubLeft.innerHTML = 'Phase: <strong>PREP</strong>';
    cycleSubRight.innerHTML = `Round <strong>${timerState.currentRound}</strong>`;

    const dashOffset = RING_CIRCUMFERENCE * (1 - prepProgressFraction);
    ringProgress.style.strokeDashoffset = dashOffset.toFixed(2);
    return;
  }

  // 2. REST PERIOD PHASE
  if (timerState.currentPhase === 'REST') {
    const restTotalMs = timerState.restDurationSeconds * 1000;
    const restRemainingMs = Math.max(0, restTotalMs - timerState.elapsedInPhaseMs);
    const restSecondsLeft = Math.ceil(restRemainingMs / 1000);
    const restFraction = restRemainingMs / restTotalMs;

    document.body.setAttribute('data-phase', 'restPeriod');
    phaseBadge.textContent = 'REST PERIOD • RECOVER';

    // Format mm:ss or ss
    if (restSecondsLeft >= 60) {
      const m = Math.floor(restSecondsLeft / 60);
      const s = restSecondsLeft % 60;
      timeDisplay.textContent = `${m}:${String(s).padStart(2, '0')}`;
      timeDisplay.classList.add('long-format');
    } else {
      timeDisplay.textContent = String(restSecondsLeft).padStart(2, '0');
      timeDisplay.classList.remove('long-format');
    }

    cycleSubLeft.innerHTML = `Break: <strong>${timerState.restDurationSeconds}s</strong>`;
    cycleSubRight.innerHTML = `Next: <strong>Round ${timerState.currentRound + 1}</strong>`;

    // 3-2-1 warning before rest ends
    if (timerState.isRunning && restSecondsLeft <= 3 && restSecondsLeft >= 1) {
      const warnKey = `REST-${restSecondsLeft}`;
      if (timerState.lastWarnSecondFired !== warnKey) {
        timerState.lastWarnSecondFired = warnKey;
        beepEngine.playCountdownPip();
        triggerCountdownDigitsPulse();
      }
    }

    const dashOffset = RING_CIRCUMFERENCE * (1 - restFraction);
    ringProgress.style.strokeDashoffset = dashOffset.toFixed(2);
    return;
  }

  // 3. SECTION A OR B
  const secAMs = timerState.sectionASeconds * 1000;
  const secBMs = timerState.sectionBSeconds * 1000;
  const inSectionA = timerState.currentPhase === 'A';

  const sectionDurationMs = inSectionA ? secAMs : secBMs;
  const sectionRemainingMs = Math.max(0, sectionDurationMs - timerState.elapsedInPhaseMs);
  const secRemainingCeil = Math.max(1, Math.ceil(sectionRemainingMs / 1000));

  if (inSectionA) {
    document.body.setAttribute('data-phase', 'sectionA');
    phaseBadge.textContent = 'SECTION A • WORK';
  } else {
    document.body.setAttribute('data-phase', 'sectionB');
    phaseBadge.textContent = 'SECTION B • OFF';
  }

  timeDisplay.textContent = String(secRemainingCeil).padStart(2, '0');
  cycleSubLeft.innerHTML = `Loop: <strong>60s</strong>`;
  cycleSubRight.innerHTML = `Round <strong>${timerState.currentRound}</strong>`;

  // 3-2-1 countdown pip warnings
  if (timerState.isRunning && secRemainingCeil <= 3 && secRemainingCeil >= 1) {
    const warnKey = `${timerState.currentRound}-${timerState.currentPhase}-${secRemainingCeil}`;
    if (timerState.lastWarnSecondFired !== warnKey) {
      timerState.lastWarnSecondFired = warnKey;
      beepEngine.playCountdownPip();
      triggerCountdownDigitsPulse();
    }
  }

  const progressFraction = Math.max(0, Math.min(1, sectionRemainingMs / sectionDurationMs));
  const dashOffset = RING_CIRCUMFERENCE * (1 - progressFraction);
  ringProgress.style.strokeDashoffset = dashOffset.toFixed(2);
}

function renderLongSectionUI() {
  timeDisplay.classList.add('long-format');
  document.body.setAttribute('data-phase', 'longSection');

  const totalLongMs = timerState.longMinutes * 60 * 1000;
  const remainingMs = Math.max(0, totalLongMs - timerState.longElapsedMs);
  const totalSecondsLeft = Math.ceil(remainingMs / 1000);

  const minsLeft = Math.floor(totalSecondsLeft / 60);
  const secsLeft = totalSecondsLeft % 60;

  phaseBadge.textContent = 'LONG SECTION • ENDURANCE';
  timeDisplay.textContent = `${String(minsLeft).padStart(2, '0')}:${String(secsLeft).padStart(2, '0')}`;
  cycleSubLeft.innerHTML = `Total: <strong>${timerState.longMinutes}m</strong>`;
  cycleSubRight.innerHTML = `Remaining: <strong>${minsLeft}m ${secsLeft}s</strong>`;

  // Final 3-2-1 pips before long section ends
  if (timerState.isRunning && totalSecondsLeft <= 3 && totalSecondsLeft >= 1) {
    const warnKey = `LONG-END-${totalSecondsLeft}`;
    if (timerState.lastWarnSecondFired !== warnKey) {
      timerState.lastWarnSecondFired = warnKey;
      beepEngine.playCountdownPip();
      triggerCountdownDigitsPulse();
    }
  }

  const progressFraction = Math.max(0, Math.min(1, remainingMs / totalLongMs));
  const dashOffset = RING_CIRCUMFERENCE * (1 - progressFraction);
  ringProgress.style.strokeDashoffset = dashOffset.toFixed(2);
}

/**
 * ============================================================================
 * 7. TIMER ENGINE LOOP
 * ============================================================================
 */
function timerLoop(now) {
  if (!timerState.isRunning) return;

  const deltaMs = now - timerState.lastFrameTime;
  timerState.lastFrameTime = now;

  if (timerState.mode === 'intervals') {
    handleIntervalsTick(deltaMs);
  } else {
    handleLongSectionTick(deltaMs);
  }

  renderTimerUI();
  if (timerState.isRunning) {
    timerState.rafId = requestAnimationFrame(timerLoop);
  }
}

function handleIntervalsTick(deltaMs) {
  // 1. PREP TICK
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
      return;
    } else {
      // Transition from PREP to ROUND 1 SECTION A
      const overflowMs = timerState.prepElapsedMs - prepTotalMs;
      timerState.isPrepPhase = false;
      timerState.prepElapsedMs = 0;
      timerState.currentPhase = 'A';
      timerState.elapsedInPhaseMs = overflowMs;
      timerState.lastWarnSecondFired = null;

      beepEngine.playStartBeep();
      triggerVisualFlash();
      return;
    }
  }

  // 2. REST PERIOD TICK
  if (timerState.currentPhase === 'REST') {
    timerState.elapsedInPhaseMs += deltaMs;
    const restTotalMs = timerState.restDurationSeconds * 1000;

    if (timerState.elapsedInPhaseMs >= restTotalMs) {
      // Rest period finished! Advance to next round, Section A
      const overflowMs = timerState.elapsedInPhaseMs - restTotalMs;
      timerState.currentRound += 1;
      timerState.currentPhase = 'A';
      timerState.elapsedInPhaseMs = overflowMs;
      timerState.lastWarnSecondFired = null;

      beepEngine.playStartBeep();
      triggerVisualFlash();
    }
    return;
  }

  // 3. WORK SECTION A TICK
  if (timerState.currentPhase === 'A') {
    timerState.elapsedInPhaseMs += deltaMs;
    const secAMs = timerState.sectionASeconds * 1000;

    if (timerState.elapsedInPhaseMs >= secAMs) {
      // Switch from Section A to Section B (Off)
      const overflowMs = timerState.elapsedInPhaseMs - secAMs;
      timerState.currentPhase = 'B';
      timerState.elapsedInPhaseMs = overflowMs;
      timerState.lastWarnSecondFired = null;

      beepEngine.playTransitionBeep();
      triggerVisualFlash();
    }
    return;
  }

  // 4. OFF SECTION B TICK
  if (timerState.currentPhase === 'B') {
    timerState.elapsedInPhaseMs += deltaMs;
    const secBMs = timerState.sectionBSeconds * 1000;

    if (timerState.elapsedInPhaseMs >= secBMs) {
      const overflowMs = timerState.elapsedInPhaseMs - secBMs;
      timerState.lastWarnSecondFired = null;

      // Check if this round triggers a REST PERIOD
      const restInterval = timerState.restEveryRounds;
      const shouldTriggerRest = restInterval > 0 && (timerState.currentRound % restInterval === 0);

      if (shouldTriggerRest) {
        // Switch to extended Rest Period
        timerState.currentPhase = 'REST';
        timerState.elapsedInPhaseMs = overflowMs;
        beepEngine.playRestBeep();
        triggerVisualFlash();
      } else {
        // Normal next round
        timerState.currentRound += 1;
        timerState.currentPhase = 'A';
        timerState.elapsedInPhaseMs = overflowMs;
        beepEngine.playStartBeep();
        triggerVisualFlash();
      }
    }
  }
}

function handleLongSectionTick(deltaMs) {
  timerState.longElapsedMs += deltaMs;
  const totalLongMs = timerState.longMinutes * 60 * 1000;

  if (timerState.longElapsedMs >= totalLongMs) {
    // Finished long section
    timerState.longElapsedMs = totalLongMs;
    pauseTimer();
    beepEngine.playFinishBeep();
    triggerVisualFlash();
    return;
  }

  // Check minute voice announcement
  const remainingSeconds = Math.ceil((totalLongMs - timerState.longElapsedMs) / 1000);
  // Announce exactly when remainingSeconds is a multiple of 60 (e.g., 420s = 7m, 360s = 6m, etc.)
  if (remainingSeconds > 0 && remainingSeconds % 60 === 0) {
    const minsRemaining = remainingSeconds / 60;
    if (timerState.lastVoiceMinuteAnnounced !== minsRemaining) {
      timerState.lastVoiceMinuteAnnounced = minsRemaining;
      voiceEngine.speakMinuteRemaining(minsRemaining);
    }
  }
}

/**
 * ============================================================================
 * 8. START / PAUSE / RESET ACTIONS
 * ============================================================================
 */
function startTimer() {
  beepEngine.unlock();
  requestWakeLock();

  if (timerState.mode === 'intervals') {
    const isFreshStart =
      timerState.elapsedInPhaseMs === 0 &&
      timerState.currentRound === 1 &&
      !timerState.isPrepPhase &&
      timerState.prepElapsedMs === 0 &&
      timerState.currentPhase === 'A';

    if (isFreshStart) {
      timerState.isPrepPhase = true;
      timerState.prepElapsedMs = 0;
      timerState.lastWarnSecondFired = 'PREP-3';
      beepEngine.playCountdownPip();
      triggerCountdownDigitsPulse();
      renderTimerUI();
    }
  } else {
    // Long Section start
    if (timerState.longElapsedMs === 0) {
      beepEngine.playStartBeep();
      triggerVisualFlash();
      voiceEngine.speak(`${timerState.longMinutes} minutes remaining.`);
    }
  }

  timerState.isRunning = true;
  timerState.lastFrameTime = performance.now();

  startStopBtn.classList.add('running');
  startStopIcon.textContent = '⏸';
  startStopText.textContent = 'Pause Timer';

  intervalsPanel.classList.add('locked');
  longSectionPanel.classList.add('locked');

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

  // Reset Intervals
  timerState.isPrepPhase = false;
  timerState.prepElapsedMs = 0;
  timerState.elapsedInPhaseMs = 0;
  timerState.currentPhase = 'A';
  timerState.currentRound = 1;

  // Reset Long Section
  timerState.longElapsedMs = 0;
  timerState.lastVoiceMinuteAnnounced = null;
  timerState.lastWarnSecondFired = null;

  startStopIcon.textContent = '▶';
  startStopText.textContent = 'Start Timer';

  intervalsPanel.classList.remove('locked');
  longSectionPanel.classList.remove('locked');

  timeDisplay.classList.remove('countdown-warn');

  if (timerState.mode === 'intervals') {
    document.body.setAttribute('data-phase', 'sectionA');
    phaseBadge.textContent = 'READY • WORK';
    updateSplitConfiguration(timerState.sectionASeconds);
  } else {
    document.body.setAttribute('data-phase', 'longSection');
    phaseBadge.textContent = 'READY • ENDURANCE';
    updateLongConfiguration(timerState.longMinutes);
  }
}

/**
 * ============================================================================
 * 9. EVENT LISTENERS
 * ============================================================================
 */
// Tabs
tabIntervals.addEventListener('click', () => setMode('intervals'));
tabLongSection.addEventListener('click', () => setMode('longSection'));

// Intervals Split Slider & Steppers
splitSlider.addEventListener('input', (e) => updateSplitConfiguration(e.target.value));
stepMinusBtn.addEventListener('click', () => updateSplitConfiguration(timerState.sectionASeconds - 5));
stepPlusBtn.addEventListener('click', () => updateSplitConfiguration(timerState.sectionASeconds + 5));

presetChips.forEach(chip => {
  chip.addEventListener('click', () => updateSplitConfiguration(chip.dataset.split));
});

// Rest Period Selects
restEveryRoundsSelect.addEventListener('change', (e) => {
  timerState.restEveryRounds = parseInt(e.target.value, 10);
  updateRestSummaryText();
});

restDurationSelect.addEventListener('change', (e) => {
  timerState.restDurationSeconds = parseInt(e.target.value, 10);
  updateRestSummaryText();
});

// Long Section Slider & Steppers
longSlider.addEventListener('input', (e) => updateLongConfiguration(e.target.value));
longMinusBtn.addEventListener('click', () => updateLongConfiguration(timerState.longMinutes - 1));
longPlusBtn.addEventListener('click', () => updateLongConfiguration(timerState.longMinutes + 1));

longChips.forEach(chip => {
  chip.addEventListener('click', () => updateLongConfiguration(chip.dataset.mins));
});

// Action Buttons
startStopBtn.addEventListener('click', () => {
  if (timerState.isRunning) {
    pauseTimer();
  } else {
    startTimer();
  }
});

resetBtn.addEventListener('click', resetTimer);

// Beep Loudness
beepGainBtn.addEventListener('click', () => {
  const newLabel = beepEngine.cycleGainMode();
  beepGainLabel.textContent = newLabel;
  beepEngine.playCountdownPip();
});

// Voice Toggle
voiceToggleBtn.addEventListener('click', () => {
  voiceEngine.enabled = !voiceEngine.enabled;
  voiceToggleLabel.textContent = voiceEngine.enabled ? 'ON' : 'OFF';
  voiceToggleLabel.style.color = voiceEngine.enabled ? 'var(--sec-a-primary)' : 'var(--text-muted)';
  if (voiceEngine.enabled) {
    voiceEngine.speak('Voice enabled');
  }
});

// Test Button
testBeepBtn.addEventListener('click', () => {
  beepEngine.playStartBeep();
  triggerVisualFlash();
  voiceEngine.speakMinuteRemaining(4);
});

// Initialize on Load
updateSplitConfiguration(45);
updateRestSummaryText();
updateLongConfiguration(8);
setMode('intervals');
