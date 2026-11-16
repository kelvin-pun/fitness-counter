# Fitness Interval & Endurance Counter

A mobile-first HTML5 fitness interval timer and endurance countdown built for Android Chrome and iOS Safari.

## Features

### 1. 1-Minute Splits with Customizable Loops & Rounds
- **Split Configuration:** Divide each 60-second round into Section A (Work) and Section B (Off) using the interactive slider, `+/-5s` steppers, or quick presets (`45/15`, `40/20`, `30/30`, `50/10`).
- **Loop Selector (1 to 5, or Continuous `∞`):** Choose how many loops to execute.
- **Rounds Selector (1 to 8):** Choose how many rounds per loop.
- **Default:** **`2 Loops × 5 Rounds`** (10 rounds total with a 1-minute rest break between Loop 1 and Loop 2).
- **1-Minute Rest Break:** Automatically occurs at the end of every loop (after the selected number of rounds), accompanied by a calming rest chime and transition back to Work.

### 2. Long Section Countdown (1 to 15 Minutes, 8-Min Default)
- **Customizable Duration:** Defaults to 8 minutes, with quick adjustment from 1 to 15 minutes via slider, `+/-1m` steppers, or chips (`15m`, `10m`, `8m`, `5m`, `3m`, `1m`).
- **Clean Synthesizer Audio:**
  - 3-second amber "GET READY" initial countdown.
  - 3-2-1 countdown warning pips before switches and section completion.
  - Dual-oscillator harmonic start, transition, rest, and victory beeps. No voice speech.

### 3. High-Output Synthesizer
- Web Audio API synth with dynamic range compressor maximizer (`MAX`, `HIGH`, `MED`) designed to cut through gym noise.
- Screen Wake Lock API keeps your smartphone screen awake during workouts.
