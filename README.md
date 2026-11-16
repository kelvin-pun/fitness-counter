# Fitness Interval & Endurance Counter

A mobile-first HTML5 fitness interval timer and endurance countdown built for Android Chrome and iOS Safari.

## Features

### 1. 1-Minute Splits with Configurable 4-Round Loops & 1m Break
- **Split Configuration:** Divide each 60-second round into Section A (Work) and Section B (Off) using the interactive slider, `+/-5s` steppers, or quick presets (`45/15`, `40/20`, `30/30`, `50/10`).
- **Loop Selector (1, 2, 3, 4, 5 × 4 Rounds or Continuous):**
  - Choose between `1 × 4 rnds`, `2 × 4 rnds`, `3 × 4 rnds`, `4 × 4 rnds`, `5 × 4 rnds`, or `Continuous`.
  - Automatically executes **4 consecutive rounds** of Work/Off, followed by a dedicated **1-minute rest break** between loops.
  - Automatically tracks current loop and round (e.g., `Loop 1/3 • Round 2/4`).
  - Finishes with victory fanfare when your chosen target loops are completed.

### 2. Long Section Countdown (1 to 15 Minutes, 8-Min Default)
- **Customizable Duration:** Defaults to 8 minutes, with quick adjustment from 1 to 15 minutes via slider, `+/-1m` steppers, or chips (`15m`, `10m`, `8m`, `5m`, `3m`, `1m`).
- **Clean Synthesizer Audio:**
  - 3-second amber "GET READY" initial countdown.
  - 3-2-1 countdown warning pips before switches and section completion.
  - Dual-oscillator harmonic start, transition, rest, and victory beeps. No distracting voice speech.

### 3. High-Output Synthesizer
- Web Audio API synth with dynamic range compressor maximizer (`MAX`, `HIGH`, `MED`) designed to cut through gym noise.
- Screen Wake Lock API keeps your smartphone screen awake during workouts.
