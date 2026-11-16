# Fitness Counter & Endurance Timer

A mobile-first HTML5 fitness interval timer and endurance countdown built for Android Chrome and iOS Safari.

## Features

### 1. 1-Minute Splits with Configurable Rest Periods
- **Work / Off Splits:** Split each 60-second round into Section A (Work) and Section B (Off) using the interactive slider, `+/-5s` steppers, or quick presets (`45/15`, `40/20`, `30/30`, `50/10`).
- **Rest Period Between Rounds:** Automatically inserts a dedicated Rest / Recovery phase (e.g. 1 minute, 45s, 30s, 2m) after every selected number of rounds (e.g., after 4 rounds of 45s on / 15s off).
- **Audio & Haptic Cues:**
  - Initial 3-second amber "GET READY" countdown.
  - 3-2-1 warning pips before section transitions and rest periods.
  - Distinct harmonic start, transition, and rest period beeps.

### 2. Long Section Countdown (1 to 15 Minutes)
- **Customizable Duration:** Set a sustained workout or cool-down block from 1 to 15 minutes via slider, `+/-1m` steppers, or quick chips (`15m`, `10m`, `5m`, `3m`, `1m`).
- **Voice Time Announcements:** Uses the browser SpeechSynthesis API to speak vocal notices at every remaining minute mark (e.g., *"4 minutes remaining"*, *"1 minute remaining"*), followed by 3-2-1 warning pips and finish tones.

### 3. High-Output Synthesizer
- Dual-oscillator Web Audio API synth with dynamic range compressor maximizer (`MAX`, `HIGH`, `MED`) designed to cut through ambient gym noise.
- Screen Wake Lock API keeps your smartphone screen awake during the workout.
