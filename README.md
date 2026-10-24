# Fitness Counter

A mobile-first HTML5 1-minute split interval fitness timer built for Android Chrome and iOS Safari.

## Features
- **1-Minute Split Configuration:** Divide a 60-second loop into Section A (Work) and Section B (Rest) using the touch slider, +/- steppers, or quick presets (`45/15`, `40/20`, `30/30`, `50/10`).
- **3-2-1 Get Ready & Transition Cues:** Includes an initial 3-second amber "GET READY" countdown before Round 1, plus 3-2-1 countdown warning pips before every section switch.
- **High-Output Web Audio Synthesizer:** Dual-oscillator harmonic beeps routed through a `DynamicsCompressorNode` maximizer (`MAX`, `HIGH`, `MED`) designed to cut through smartphone speakers.
- **Dual Server MP3 Playlists & Auto-Ducking:** Separate controls for **Workout Music** and **Cool Down Music** with automatic background volume ducking when interval beeps fire.
- **Mobile Safeguards:** Delta-time (`performance.now()`) drift prevention and HTML5 Screen Wake Lock API integration.

## Project Structure
- `index.html` - Main application layout
- `style.css` - Mobile-first dark mode styles & animations
- `app.js` - Timer engine, Web Audio synth, and MP3 playlist controller
- `audio/workout/` - Place workout `.mp3` files here
- `audio/cooldown/` - Place cool-down `.mp3` files here

## Using Your Own MP3 Files
1. Upload your `.mp3` tracks into `audio/workout/` and `audio/cooldown/`.
2. Open `app.js` and update the `PLAYLISTS` object at the top of the file with your file paths.
