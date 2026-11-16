/**
 * ============================================================================
 * FITNESS COUNTER & ENDURANCE TIMER
 * Supports:
 * 1. 1-Minute Splits (Work / Off) with Customizable Loops (1-5, Continuous)
 *    and Customizable Rounds per Loop (1-8), Default: 2 Loops x 5 Rounds
 * 2. 1-Minute Rest Break between Loops
 * 3. Long Section Countdown (1 to 15 min, 8-min default)
 * 4. High-Output Synthesizer Beeps & Fanfare (MAX / HIGH / MED)
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
 * 2. SCREEN WAKE LOCK
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
      // Fallback
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
 * 3. TIMER STATE & DOM ELEMENTS
 * ============================================================================
 */
const TOTAL_CYCLE_SECONDS = 60;
const PREP_DURATION_SECONDS = 3;
const RING_CIRCUMFERENCE = 2 * Math.PI * 98;
const BREAK_BETWEEN_LOOPS_SECONDS = 60; // 1 minute break between loops

const timerState = {
  mode: 'intervals', // 'intervals' | 'longSection'
  isRunning: false,

  // Intervals settings (Default: 2 Loops x 5 Rounds)
  sectionASeconds: 45,
  sectionBSeconds: 15,
  targetLoops: 2,           // 1..5, or 0 = continuous
  roundsPerLoop: 5,         // 1..8
  currentLoop: 1,           // 1..targetLoops
  currentRoundInLoop: 1,    // 1..roundsPerLoop
  currentPhase: 'A',        // 'PREP' | 'A' | 'B' | 'REST'
  isPrepPhase: false,
  prepElapsedMs: 0,
  elapsedInPhaseMs: 0,

  // Long section settings
  longMinutes: 8,
  longElapsedMs: 0,

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

// Loops and Rounds selectors
const loopsValueDisplay = document.getElementById('loopsValueDisplay');
const roundsValueDisplay = document.getElementById('roundsValueDisplay');
const loopChips = document.querySelectorAll('[data-loop]');
const roundChips = document.querySelectorAll('[data-round]');
const loopSummaryText = document.getElementById('loopSummaryText');

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

/**
 * ============================================================================
 * 4. UI VISUAL HELPERS
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

function updateLoopSummaryText() {
  const loops = timerState.targetLoops;
  const rnds = timerState.roundsPerLoop;

  loopsValueDisplay.textContent = loops === 0 ? '∞' : String(loops);
  roundsValueDisplay.textContent = String(rnds);

  if (loops === 0) {
    loopSummaryText.textContent = `Continuous: ${rnds} rounds of ${timerState.sectionASeconds}s on / ${timerState.sectionBSeconds}s off with 1m rest between loops`;
  } else if (loops === 1) {
    loopSummaryText.textContent = `1 loop × ${rnds} rounds (${rnds} mins total, finishes after round ${rnds})`;
  } else {
    const totalWorkoutRnds = loops * rnds;
    const totalBreaks = loops - 1;
    loopSummaryText.textContent = `${loops} loops × ${rnds} rounds (${totalWorkoutRnds} rounds total) with ${totalBreaks} × 1m rest between loops`;
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

  updateLoopSummaryText();

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
  if (timerState.isRunning) return;

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
 * 5. RENDER LOGIC
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

  const loopLabel = timerState.targetLoops > 0
    ? `Loop ${timerState.currentLoop}/${timerState.targetLoops}`
    : `Loop ${timerState.currentLoop}`;

  // 1. PREP PHASE
  if (timerState.isPrepPhase) {
    const prepDurationMs = PREP_DURATION_SECONDS * 1000;
    const prepRemainingMs = Math.max(0, prepDurationMs - timerState.prepElapsedMs);
    const prepSecondsLeft = Math.ceil(prepRemainingMs / 1000);
    const prepProgressFraction = prepRemainingMs / prepDurationMs;

    document.body.setAttribute('data-phase', 'prep');
    phaseBadge.textContent = 'GET READY • 3-2-1';
    timeDisplay.textContent = String(prepSecondsLeft).padStart(2, '0');
    cycleSubLeft.innerHTML = `<strong>${loopLabel}</strong>`;
    cycleSubRight.innerHTML = `Round <strong>${timerState.currentRoundInLoop}/${timerState.roundsPerLoop}</strong>`;

    const dashOffset = RING_CIRCUMFERENCE * (1 - prepProgressFraction);
    ringProgress.style.strokeDashoffset = dashOffset.toFixed(2);
    return;
  }

  // 2. REST / 1-MINUTE BREAK BETWEEN LOOPS
  if (timerState.currentPhase === 'REST') {
    const restTotalMs = BREAK_BETWEEN_LOOPS_SECONDS * 1000;
    const restRemainingMs = Math.max(0, restTotalMs - timerState.elapsedInPhaseMs);
    const restSecondsLeft = Math.ceil(restRemainingMs / 1000);
    const restFraction = restRemainingMs / restTotalMs;

    document.body.setAttribute('data-phase', 'restPeriod');
    phaseBadge.textContent = '1M BREAK • RECOVER';

    if (restSecondsLeft >= 60) {
      const m = Math.floor(restSecondsLeft / 60);
      const s = restSecondsLeft % 60;
      timeDisplay.textContent = `${m}:${String(s).padStart(2, '0')}`;
      timeDisplay.classList.add('long-format');
    } else {
      timeDisplay.textContent = String(restSecondsLeft).padStart(2, '0');
      timeDisplay.classList.remove('long-format');
    }

    cycleSubLeft.innerHTML = `Break: <strong>1m</strong>`;
    const nextLoopNum = timerState.currentLoop + 1;
    const nextLoopStr = timerState.targetLoops > 0 ? `Loop ${nextLoopNum}/${timerState.targetLoops}` : `Loop ${nextLoopNum}`;
    cycleSubRight.innerHTML = `Next: <strong>${nextLoopStr}</strong>`;

    // 3-2-1 pips before break finishes
    if (timerState.isRunning && restSecondsLeft <= 3 && restSecondsLeft >= 1) {
      const warnKey = `BREAK-${restSecondsLeft}`;
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

  // 3. WORK SECTION A OR SECTION B (OFF)
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
  cycleSubLeft.innerHTML = `<strong>${loopLabel}</strong>`;
  cycleSubRight.innerHTML = `Round <strong>${timerState.currentRoundInLoop}/${timerState.roundsPerLoop}</strong>`;

  // 3-2-1 countdown pip warnings
  if (timerState.isRunning && secRemainingCeil <= 3 && secRemainingCeil >= 1) {
    const warnKey = `L${timerState.currentLoop}-R${timerState.currentRoundInLoop}-${timerState.currentPhase}-${secRemainingCeil}`;
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
 * 6. TIMER ENGINE LOOP
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
      // Transition from PREP to LOOP 1 ROUND 1 SECTION A
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

  // 2. 1-MINUTE BREAK BETWEEN LOOPS
  if (timerState.currentPhase === 'REST') {
    timerState.elapsedInPhaseMs += deltaMs;
    const restTotalMs = BREAK_BETWEEN_LOOPS_SECONDS * 1000;

    if (timerState.elapsedInPhaseMs >= restTotalMs) {
      // Break is complete! Start next loop round 1
      const overflowMs = timerState.elapsedInPhaseMs - restTotalMs;
      timerState.currentLoop += 1;
      timerState.currentRoundInLoop = 1;
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

      // Finished round in loop
      if (timerState.currentRoundInLoop < timerState.roundsPerLoop) {
        // Next round within the same loop
        timerState.currentRoundInLoop += 1;
        timerState.currentPhase = 'A';
        timerState.elapsedInPhaseMs = overflowMs;

        beepEngine.playStartBeep();
        triggerVisualFlash();
      } else {
        // Finished all rounds of this loop!
        // Check if workout is completely finished (reached targetLoops)
        if (timerState.targetLoops > 0 && timerState.currentLoop >= timerState.targetLoops) {
          pauseTimer();
          beepEngine.playFinishBeep();
          triggerVisualFlash();
          return;
        }

        // Otherwise, enter 1-minute break between loops
        timerState.currentPhase = 'REST';
        timerState.elapsedInPhaseMs = overflowMs;

        beepEngine.playRestBeep();
        triggerVisualFlash();
      }
    }
  }
}

function handleLongSectionTick(deltaMs) {
  timerState.longElapsedMs += deltaMs;
  const totalLongMs = timerState.longMinutes * 60 * 1000;

  if (timerState.longElapsedMs >= totalLongMs) {
    timerState.longElapsedMs = totalLongMs;
    pauseTimer();
    beepEngine.playFinishBeep();
    triggerVisualFlash();
  }
}

/**
 * ============================================================================
 * 7. START / PAUSE / RESET ACTIONS
 * ============================================================================
 */
function startTimer() {
  beepEngine.unlock();
  requestWakeLock();

  if (timerState.mode === 'intervals') {
    const isFreshStart =
      timerState.elapsedInPhaseMs === 0 &&
      timerState.currentLoop === 1 &&
      timerState.currentRoundInLoop === 1 &&
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
    if (timerState.longElapsedMs === 0) {
      beepEngine.playStartBeep();
      triggerVisualFlash();
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
  timerState.currentLoop = 1;
  timerState.currentRoundInLoop = 1;

  // Reset Long Section
  timerState.longElapsedMs = 0;
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
 * 8. EVENT LISTENERS
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

// Loops Selector: 1, 2, 3, 4, 5, or Continuous (0)
loopChips.forEach(chip => {
  chip.addEventListener('click', () => {
    if (timerState.isRunning) return;
    loopChips.forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    timerState.targetLoops = parseInt(chip.dataset.loop, 10);
    updateLoopSummaryText();
    renderTimerUI();
  });
});

// Rounds Selector: 1, 2, 3, 4, 5, 6, 7, 8
roundChips.forEach(chip => {
  chip.addEventListener('click', () => {
    if (timerState.isRunning) return;
    roundChips.forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    timerState.roundsPerLoop = parseInt(chip.dataset.round, 10);
    updateLoopSummaryText();
    renderTimerUI();
  });
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

// Test Button
testBeepBtn.addEventListener('click', () => {
  beepEngine.playStartBeep();
  triggerVisualFlash();
});

// Initialize on Load (Default: 2 Loops x 5 Rounds, 45s/15s split, 8m long)
timerState.targetLoops = 2;
timerState.roundsPerLoop = 5;
updateSplitConfiguration(45);
updateLoopSummaryText();
updateLongConfiguration(8);
setMode('intervals');
