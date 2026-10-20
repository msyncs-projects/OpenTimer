// Web Audio API Synthesizer & Speech Synthesis for Timer Plus
// Works 100% offline with zero external audio assets
// Optimized for iOS Safari (including silent switch bypass) & Android Chrome

let audioCtx: AudioContext | null = null;
let isAudioUnlocked = false;
let silentAudioEl: HTMLAudioElement | null = null;

// RIFF 1-second 8kHz 8-bit mono silence WAV data URI
const SILENT_WAV_URI = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAP8A';

export function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  return audioCtx;
}

/**
 * Configure modern iOS audio session to playback channel
 * so workout timer sounds play even if phone is on silent / mute switch.
 */
function setPlaybackAudioSession() {
  if (typeof navigator === 'undefined') return;
  try {
    const nav = navigator as unknown as {
      audioSession?: { type: string };
    };
    if (nav.audioSession) {
      nav.audioSession.type = 'playback';
    }
  } catch {
    // Ignore unsupported browser
  }
}

/**
 * Play a silent HTML5 audio loop to route Web Audio to the media channel on older iOS
 */
function playSilentAudioHack() {
  if (typeof window === 'undefined') return;
  try {
    if (!silentAudioEl) {
      silentAudioEl = document.createElement('audio');
      silentAudioEl.setAttribute('x-webkit-airplay', 'deny');
      silentAudioEl.setAttribute('playsinline', 'true');
      silentAudioEl.setAttribute('webkit-playsinline', 'true');
      silentAudioEl.preload = 'auto';
      silentAudioEl.loop = true;
      silentAudioEl.src = SILENT_WAV_URI;
      silentAudioEl.volume = 0.01;
    }
    if (silentAudioEl.paused) {
      silentAudioEl.play().catch(() => {});
    }
  } catch {
    // Ignore
  }
}

/**
 * Ensure audio context is running on user interaction.
 * Call this on any click, touch, or keypress.
 */
export function unlockAudio(): void {
  if (typeof window === 'undefined') return;

  // 1. Force iOS playback session
  setPlaybackAudioSession();
  playSilentAudioHack();

  // 2. Initialize and resume Web Audio Context
  const ctx = getAudioContext();
  if (ctx) {
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    if (!isAudioUnlocked) {
      try {
        const buffer = ctx.createBuffer(1, 1, 22050);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start(0);
        isAudioUnlocked = true;
      } catch {
        // Ignore
      }
    }
  }

  // 3. Prime SpeechSynthesis
  try {
    if ('speechSynthesis' in window && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
  } catch {
    // Ignore
  }
}

/**
 * Attach global one-shot listeners so the very first touch/click unlocks audio
 */
export function initGlobalAudioUnlock(): void {
  if (typeof window === 'undefined') return;

  const handleUnlock = () => {
    unlockAudio();
  };

  ['pointerdown', 'touchstart', 'touchend', 'click', 'keydown'].forEach((eventType) => {
    window.addEventListener(eventType, handleUnlock, { capture: true, passive: true });
  });
}

/**
 * Helper to ensure AudioContext is awake before scheduling sound
 */
async function readyContext(): Promise<AudioContext | null> {
  unlockAudio();
  const ctx = getAudioContext();
  if (!ctx) return null;

  if (ctx.state === 'suspended') {
    try {
      await ctx.resume();
    } catch {
      // Continue anyway
    }
  }
  return ctx;
}

/**
 * Play a crisp countdown beep
 * @param isHigh true for transition tone (1760Hz), false for 3-2-1 pips (880Hz)
 */
export async function playBeep(isHigh = false, volume = 0.9): Promise<void> {
  const ctx = await readyContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    const freq = isHigh ? 1760 : 880;
    const now = ctx.currentTime;
    const duration = isHigh ? 0.35 : 0.12;

    osc.frequency.setValueAtTime(freq, now);

    // Use safe minimum values (never 0) for WebKit exponential ramps
    const safeVolume = Math.min(1.0, Math.max(0.01, volume));
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(safeVolume, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration + 0.05);

    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };
  } catch (e) {
    console.warn('Audio playBeep failed', e);
  }
}

/**
 * Play a resonant boxing bell sound
 */
export async function playBoxingBell(volume = 0.9): Promise<void> {
  const ctx = await readyContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    // Harmonic frequencies simulating metallic bell
    const frequencies = [600, 840, 1180, 1500];
    const safeVolume = Math.min(1.0, Math.max(0.01, volume));

    frequencies.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = idx === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      const amp = Math.max(0.0001, (safeVolume / frequencies.length) * (1 - idx * 0.15));
      const decay = 1.2 - idx * 0.2;

      gain.gain.setValueAtTime(amp, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + decay);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + decay + 0.05);

      osc.onended = () => {
        osc.disconnect();
        gain.disconnect();
      };
    });
  } catch (e) {
    console.warn('Boxing bell error', e);
  }
}

/**
 * Play a dual-tone sports referee whistle
 */
export async function playWhistle(volume = 0.9): Promise<void> {
  const ctx = await readyContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const duration = 0.45;
    const safeVolume = Math.min(1.0, Math.max(0.01, volume));

    // Dual frequencies for acoustic beating
    const freqs = [2200, 2350];

    freqs.forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      // Fast tremolo modulation
      const mod = ctx.createOscillator();
      const modGain = ctx.createGain();
      mod.frequency.setValueAtTime(35, now);
      modGain.gain.setValueAtTime(30, now);
      mod.connect(osc.frequency);
      mod.start(now);
      mod.stop(now + duration);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(safeVolume * 0.4, now + 0.05);
      gain.gain.setValueAtTime(safeVolume * 0.4, now + duration - 0.05);
      gain.gain.linearRampToValueAtTime(0.0001, now + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + duration + 0.05);

      osc.onended = () => {
        osc.disconnect();
        gain.disconnect();
        mod.disconnect();
        modGain.disconnect();
      };
    });
  } catch (e) {
    console.warn('Whistle error', e);
  }
}

/**
 * Preview / test sound tone
 */
export function testSound(type: 'bell' | 'whistle' | 'beep', volume = 0.9): void {
  unlockAudio();
  if (type === 'bell') {
    playBoxingBell(volume);
  } else if (type === 'whistle') {
    playWhistle(volume);
  } else {
    playBeep(true, volume);
  }
}

/**
 * Voice Coach speech announcement via Web Speech API
 */
export function speakCue(text: string): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  try {
    // In WebKit / iOS Safari, do NOT call cancel() immediately before speak()
    // Resume in case speech synthesis went dormant
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Pick English or default device language
    if (typeof navigator !== 'undefined' && navigator.language) {
      utterance.lang = navigator.language.startsWith('de') ? 'de-DE' : 'en-US';
    }

    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.warn('Speech synthesis error', e);
  }
}

/**
 * Mobile Haptic Vibration
 */
export function triggerHaptic(pattern: number | number[] = 100): void {
  if (typeof window === 'undefined' || !('navigator' in window)) return;
  if (navigator.vibrate) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Ignore vibration error if blocked by OS
    }
  }
}
