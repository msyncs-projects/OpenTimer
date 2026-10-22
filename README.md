# ⏱️ OpenTimer

> **Modern, free and open-source interval timer for HIIT, Tabata, Boxing, and Circuit Training.**  
> Built as an offline-first Progressive Web App (PWA) with high-visibility scoreboard typography.

---

## ✨ Features

- **📱 Progressive Web App (PWA) & 100% Offline**: Add to your iOS or Android home screen. Works completely without an internet connection in any gym or basement.
- **📟 High-Visibility Gym Scoreboard UI**:
  - Extra-large countdown digits readable from across the room.
  - Dedicated **Landscape Scoreboard Mode** designed for phone stands and gym walls.
  - Distinctive color coding for every phase: *Prepare (Lime)*, *Work (Neon Green)*, *Rest (Alarm Red)*, *Cycle Rest (Blue)*, *Cooldown (Emerald)*.
- **🔊 Zero-Latency Audio Synthesizer**:
  - Generated in real-time via the Web Audio API (no delayed MP3 downloads).
  - Countdown warning beeps (3-2-1) and high-pitch phase transition chimes.
  - Optional voice cues using speech synthesis.
- **⚙️ Full Workout Customization**:
  - Custom work and rest intervals.
  - Multi-round repeats and multi-cycle workouts with intermediate rest.
  - Built-in presets: *Tabata Standard*, *HIIT Circuit 30/15*, *Boxing 3-Minute Rounds*, *7-Minute Scientific*.
- **🔗 Instant Workout Sharing**:
  - Share custom routines with friends via simple shareable URLs — no account or backend needed.
- **🔒 100% Private & Ad-Free**:
  - No user tracking, no third-party cookies, no paid subscriptions, no ads.
  - All routines and workout history are stored securely in your browser's local storage.

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18 or newer)
- npm, pnpm, or yarn

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/mctechnology-projects/OpenTimer.git

# 2. Enter the directory
cd OpenTimer

# 3. Install dependencies
npm install

# 4. Start the local development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
npm run build
npm start
```

---

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, Turbopack)
- **Library**: [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Audio**: Web Audio API (native browser synthesis) + Web Speech API
- **PWA**: Service Worker caching (`public/sw.js`) & Web App Manifest

---

## ⚠️ Health & Safety Disclaimer

*OpenTimer is intended for general fitness and interval timing purposes only. High-intensity interval training (HIIT) can place significant demand on your cardiovascular and muscular systems. Please consult a qualified physician or healthcare professional before beginning any new or strenuous exercise program.*

---

## 📄 License

This project is licensed under the [MIT License](LICENSE) — free to use, modify, and distribute.
