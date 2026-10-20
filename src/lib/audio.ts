// Web Audio API Synthesizer & Speech Synthesis for Timer Plus
// Works 100% offline with zero external audio assets

let audioCtx: AudioContext | null = null;

export function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

// Ensure audio context is running on user interaction
export function unlockAudio() {
  const ctx = getAudioContext();
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
}

/**
 * Play a crisp countdown beep
 * @param isHigh true for transition tone (e.g. 1760Hz), false for 3-2-1 pips (880Hz)
 */
export function playBeep(isHigh = false, volume = 0.8) {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    const freq = isHigh ? 1760 : 880;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    const now = ctx.currentTime;
    const duration = isHigh ? 0.35 : 0.12;

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration);
  } catch (e) {
    console.warn('Audio play failed', e);
  }
}

/**
 * Play a resonant boxing bell sound
 */
export function playBoxingBell(volume = 0.8) {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    // Harmonic frequencies simulating metallic bell
    const frequencies = [600, 840, 1180, 1500];

    frequencies.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = idx === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      const amp = (volume / frequencies.length) * (1 - idx * 0.15);
      const decay = 1.2 - idx * 0.2;

      gain.gain.setValueAtTime(amp, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + decay);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + decay);
    });
  } catch (e) {
    console.warn('Boxing bell error', e);
  }
}

/**
 * Play a dual-tone sports referee whistle
 */
export function playWhistle(volume = 0.8) {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const duration = 0.45;

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

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(volume * 0.4, now + 0.05);
      gain.gain.setValueAtTime(volume * 0.4, now + duration - 0.05);
      gain.gain.linearRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + duration);
    });
  } catch (e) {
    console.warn('Whistle error', e);
  }
}

/**
 * Voice Coach speech announcement via Web Speech API
 */
export function speakCue(text: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  try {
    window.speechSynthesis.cancel(); // Cancel any ongoing speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.1; // Slightly faster for workout motivation
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.warn('Speech synthesis error', e);
  }
}

/**
 * Mobile Haptic Vibration
 */
export function triggerHaptic(pattern: number | number[] = 100) {
  if (typeof window === 'undefined' || !('navigator' in window)) return;
  if (navigator.vibrate) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Ignore vibration error if blocked by OS
    }
  }
}
