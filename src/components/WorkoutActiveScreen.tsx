'use client';

import React, { useState, useEffect } from 'react';
import { Workout } from '@/types/workout';
import { useWorkoutTimer } from '@/lib/useWorkoutTimer';
import { formatSecondsToMMSS } from '@/lib/storage';
import { useWakeLock } from '@/lib/useWakeLock';
import { unlockAudio, playBeep } from '@/lib/audio';
import confetti from 'canvas-confetti';
import {
  Volume2,
  VolumeX,
  RotateCcw,
  SkipBack,
  SkipForward,
  Play,
  Pause,
  X,
  Flame,
  Award,
  Clock,
} from 'lucide-react';

interface WorkoutActiveScreenProps {
  workout: Workout;
  onExit: () => void;
  onFinish: (totalSeconds: number) => void;
}

export function WorkoutActiveScreen({ workout, onExit, onFinish }: WorkoutActiveScreenProps) {
  const [isLandscape, setIsLandscape] = useState(false);

  const {
    currentStep,
    nextStep,
    stepRemainingSeconds,
    totalRemainingSeconds,
    totalElapsedSeconds,
    isPlaying,
    isPaused,
    isCompleted,
    repeatsLeft,
    cyclesLeft,
    screenFlash,
    soundEnabled,
    setSoundEnabled,
    start,
    togglePause,
    skipForward,
    skipBackward,
    reset,
  } = useWorkoutTimer(workout, () => {
    // Launch celebratory confetti
    try {
      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }
    onFinish(totalElapsedSeconds);
  });

  // Keep phone screen awake while in workout
  useWakeLock(isPlaying || isPaused);

  // Auto-start on load
  useEffect(() => {
    const timer = setTimeout(() => {
      start();
    }, 300);
    return () => clearTimeout(timer);
  }, [start]);

  // Handle window orientation changes
  useEffect(() => {
    const checkOrientation = () => {
      if (typeof window !== 'undefined') {
        const isWide = window.innerWidth > window.innerHeight && window.innerWidth >= 600;
        setIsLandscape(isWide);
      }
    };
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  // Determine current theme colors
  const phaseType = currentStep?.type || 'prepare';
  const isWork = phaseType === 'work';
  const isPrepare = phaseType === 'prepare';
  const isRest = phaseType === 'rest';
  const isCycleRest = phaseType === 'cycle_rest';
  const isCooldown = phaseType === 'cooldown';

  let bgColor = '#E8FA32'; // Prepare: Lime
  let textColor = '#000000';
  let chevronColor = 'rgba(0, 0, 0, 0.08)';

  if (isWork) {
    bgColor = currentStep?.color || '#76E026'; // Neon Green
    textColor = '#000000';
    chevronColor = 'rgba(0, 0, 0, 0.08)';
  } else if (isRest) {
    bgColor = currentStep?.color || '#FF3B30'; // Alarm Red
    textColor = '#FFFFFF';
    chevronColor = 'rgba(255, 255, 255, 0.12)';
  } else if (isCycleRest) {
    bgColor = '#0A84FF'; // Electric Blue
    textColor = '#FFFFFF';
    chevronColor = 'rgba(255, 255, 255, 0.12)';
  } else if (isCooldown) {
    bgColor = '#30D158'; // Emerald / Cyan
    textColor = '#000000';
    chevronColor = 'rgba(0, 0, 0, 0.08)';
  }

  // Next step theme
  const nextIsWork = nextStep?.type === 'work';
  const nextBgColor = nextIsWork
    ? '#76E026'
    : nextStep?.type === 'rest'
    ? '#FF3B30'
    : nextStep?.type === 'cycle_rest'
    ? '#0A84FF'
    : '#30D158';
  const nextTextColor = nextIsWork || nextStep?.type === 'prepare' || nextStep?.type === 'cooldown' ? '#000000' : '#FFFFFF';

  // Flash styling
  const flashStyle = screenFlash ? 'brightness-150 scale-[1.01]' : 'brightness-100 scale-100';

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col bg-black text-white select-none transition-all duration-150 overflow-hidden ${flashStyle}`}
    >
      {/* ========================================================
          PORTRAIT LAYOUT (Optimized for Distance Reading & Visibility)
         ======================================================== */}
      {!isLandscape ? (
        <div className="flex flex-col h-full w-full">
          {/* Top Header: High-visibility Total Time & Controls */}
          <header className="safe-top bg-black/95 px-6 py-4 flex items-center justify-between border-b border-white/10 z-20">
            {/* Total Remaining Time (EXTRA LARGE & PROMINENT) */}
            <div className="flex items-center gap-3">
              <div className="flex flex-col">
                <span className="text-sm sm:text-base font-black uppercase tracking-widest text-neutral-400 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-neutral-400 shrink-0" /> TOTAL TIME
                </span>
                <span className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-white tabular-nums leading-none mt-1">
                  {formatSecondsToMMSS(totalRemainingSeconds)}
                </span>
              </div>
            </div>

            {/* Quick Actions (Large Tap Targets) */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  const next = !soundEnabled;
                  setSoundEnabled(next);
                  if (next) {
                    unlockAudio();
                    playBeep(true, 0.9);
                  }
                }}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-300 hover:text-white transition active:scale-95 cursor-pointer"
                aria-label="Toggle Sound"
                title={soundEnabled ? 'Sound Enabled (Tap to Mute)' : 'Sound Muted (Tap to Unmute)'}
              >
                {soundEnabled ? <Volume2 className="w-7 h-7 sm:w-8 sm:h-8 text-green-400" /> : <VolumeX className="w-7 h-7 sm:w-8 sm:h-8 text-neutral-500" />}
              </button>

              <button
                type="button"
                onClick={onExit}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-red-400 hover:text-red-300 transition active:scale-95 cursor-pointer"
                aria-label="Exit Workout"
              >
                <X className="w-7 h-7 sm:w-8 sm:h-8 stroke-[2.5]" />
              </button>
            </div>
          </header>

          {/* Center Main Stage (Giant Numbers & Ultra-Legible Phase Name) */}
          <main
            onClick={togglePause}
            className="flex-1 flex flex-col items-center justify-between p-4 sm:p-6 relative overflow-hidden transition-colors duration-300 cursor-pointer"
            style={{ backgroundColor: bgColor }}
          >
            {/* Background Chevrons */}
            <div
              className="absolute inset-0 pointer-events-none opacity-40 bg-chevrons"
              style={{
                backgroundImage: `repeating-linear-gradient(-55deg, ${chevronColor} 0px, ${chevronColor} 26px, transparent 26px, transparent 52px)`,
              }}
            />

            {/* Top Phase Header: Bold, Huge Phase Title */}
            <div className="w-full text-center pt-2 z-10 px-2">
              <span
                className="text-sm sm:text-base font-black tracking-widest uppercase px-5 py-1.5 rounded-full bg-black/20 inline-block mb-2 shadow-sm"
                style={{ color: textColor }}
              >
                {workout.name}
              </span>
              <h1
                className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tight uppercase leading-none"
                style={{ color: textColor }}
              >
                {currentStep?.title || 'WORK'}
              </h1>
              <p
                className="text-2xl sm:text-3xl md:text-4xl font-black opacity-90 mt-2 uppercase tracking-wider"
                style={{ color: textColor }}
              >
                {currentStep?.subtitle}
              </p>
            </div>

            {/* MASSIVE COUNTDOWN DIGITS (Visible from across the room!) */}
            <div className="my-auto text-center z-10 flex flex-col items-center justify-center w-full py-2">
              <div
                className="timer-digits font-black tracking-tighter leading-none select-none text-[38vw] sm:text-[190px] md:text-[240px]"
                style={{ color: textColor }}
              >
                {formatSecondsToMMSS(stepRemainingSeconds)}
              </div>
              {isPaused && (
                <div className="mt-4 px-6 py-2.5 rounded-full bg-black/50 text-white font-black text-base sm:text-lg uppercase tracking-widest animate-pulse backdrop-blur-md border border-white/20">
                  PAUSED (TAP SCREEN TO RESUME)
                </div>
              )}
            </div>

            {/* In-Phase Quick Navigation (Big Rewind & Skip Buttons) */}
            <div
              className="w-full max-w-md flex items-center justify-between px-6 pb-3 z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={skipBackward}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-black/25 hover:bg-black/35 active:scale-90 transition backdrop-blur-sm flex items-center justify-center cursor-pointer shadow-lg"
                style={{ color: textColor }}
                title="Rewind / Previous Set"
              >
                <SkipBack className="w-9 h-9 sm:w-11 sm:h-11" />
              </button>

              <span
                className="text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-widest opacity-90"
                style={{ color: textColor }}
              >
                {currentStep ? `Set ${currentStep.repeatIndex}/${currentStep.totalRepeats}` : ''}
              </span>

              <button
                type="button"
                onClick={skipForward}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-black/25 hover:bg-black/35 active:scale-90 transition backdrop-blur-sm flex items-center justify-center cursor-pointer shadow-lg"
                style={{ color: textColor }}
                title="Skip to Next Set"
              >
                <SkipForward className="w-9 h-9 sm:w-11 sm:h-11" />
              </button>
            </div>
          </main>

          {/* "UP NEXT" Ribbon (EXTRA LARGE & HIGH CONTRAST) */}
          <div
            className="w-full py-5 sm:py-6 px-6 sm:px-8 flex items-center justify-between relative overflow-hidden transition-colors duration-300 border-t-2 border-black/25 z-10"
            style={{ backgroundColor: nextBgColor }}
          >
            {/* Ribbon Chevrons */}
            <div className="absolute inset-0 pointer-events-none opacity-30 bg-chevrons" />

            <div className="flex items-center gap-3.5 z-10 min-w-0">
              <span
                className="text-sm sm:text-base font-black uppercase tracking-widest px-3.5 py-1.5 rounded-xl bg-black/30 shrink-0"
                style={{ color: nextTextColor }}
              >
                UP NEXT
              </span>
              <span
                className="text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-tight truncate"
                style={{ color: nextTextColor }}
              >
                {nextStep ? nextStep.title : 'WORKOUT COMPLETE'}
              </span>
            </div>

            <span
              className="text-3xl sm:text-4xl md:text-5xl font-black tabular-nums font-mono z-10 shrink-0 ml-4"
              style={{ color: nextTextColor }}
            >
              {nextStep ? formatSecondsToMMSS(nextStep.durationSeconds) : '00:00'}
            </span>
          </div>

          {/* Bottom Black Control Dock (MUCH BIGGER NUMBERS & BUTTONS) */}
          <footer className="safe-bottom bg-neutral-950 px-6 sm:px-8 py-5 flex items-center justify-between border-t border-neutral-900 z-20">
            {/* Left: Repeats Left (MASSIVE NUMBER) */}
            <div className="flex flex-col items-center min-w-[100px] sm:min-w-[120px]">
              <span className="text-sm sm:text-base font-black uppercase tracking-widest text-neutral-400 mb-1">
                REPEATS LEFT
              </span>
              <span className="text-7xl sm:text-8xl md:text-9xl font-black text-blue-400 tabular-nums leading-none">
                {repeatsLeft}
              </span>
            </div>

            {/* Center: Extra Large Play / Pause Button */}
            <button
              type="button"
              onClick={togglePause}
              className={`w-24 h-24 sm:w-28 sm:h-28 rounded-3xl flex items-center justify-center transition-all duration-150 active:scale-95 shadow-2xl cursor-pointer ${
                isPlaying
                  ? 'bg-neutral-900 border-2 border-neutral-700 hover:border-neutral-500 text-green-400 shadow-green-950/50'
                  : 'bg-green-500 border-2 border-green-300 text-black shadow-green-500/50 scale-105'
              }`}
              aria-label={isPlaying ? 'Pause Workout' : 'Start Workout'}
            >
              {isPlaying ? (
                <Pause className="w-12 h-12 sm:w-14 sm:h-14 fill-green-400 text-green-400" />
              ) : (
                <Play className="w-13 h-13 sm:w-15 sm:h-15 fill-black text-black ml-1.5" />
              )}
            </button>

            {/* Right: Cycles Left (MASSIVE NUMBER) */}
            <div className="flex flex-col items-center min-w-[100px] sm:min-w-[120px]">
              <span className="text-sm sm:text-base font-black uppercase tracking-widest text-neutral-400 mb-1">
                CYCLES LEFT
              </span>
              <span className="text-7xl sm:text-8xl md:text-9xl font-black text-amber-400 tabular-nums leading-none">
                {cyclesLeft}
              </span>
            </div>
          </footer>
        </div>
      ) : (
        /* ========================================================
           LANDSCAPE SCOREBOARD LAYOUT (Phone Sideways / Gym Board)
           Matching screenshot timerplus_0.png!
           ======================================================== */
        <div className="flex h-full w-full">
          {/* Left Large Timer Stage */}
          <div
            onClick={togglePause}
            className="flex-1 flex flex-col justify-between p-6 sm:p-8 relative overflow-hidden transition-colors duration-300 cursor-pointer"
            style={{ backgroundColor: bgColor }}
          >
            {/* Chevrons */}
            <div
              className="absolute inset-0 pointer-events-none opacity-40 bg-chevrons"
              style={{
                backgroundImage: `repeating-linear-gradient(-55deg, ${chevronColor} 0px, ${chevronColor} 26px, transparent 26px, transparent 52px)`,
              }}
            />

            {/* Landscape Top Bar */}
            <div className="flex items-center justify-between w-full z-10" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-3">
                <span
                  className="text-sm sm:text-base font-black tracking-widest uppercase px-4 py-1.5 rounded-full bg-black/20"
                  style={{ color: textColor }}
                >
                  {workout.name}
                </span>
                <span
                  className="text-4xl sm:text-5xl font-black tracking-tight uppercase"
                  style={{ color: textColor }}
                >
                  {currentStep?.title || 'WORK'}
                </span>
              </div>

              <div className="flex flex-col items-end">
                <span className="text-sm sm:text-base font-black uppercase tracking-widest opacity-85" style={{ color: textColor }}>
                  TOTAL TIME
                </span>
                <span className="text-4xl sm:text-5xl font-black tabular-nums leading-none mt-1" style={{ color: textColor }}>
                  {formatSecondsToMMSS(totalRemainingSeconds)}
                </span>
              </div>
            </div>

            {/* Giant Digits */}
            <div className="my-auto text-center z-10">
              <div
                className="timer-digits font-black tracking-tighter leading-none select-none text-[28vw]"
                style={{ color: textColor }}
              >
                {formatSecondsToMMSS(stepRemainingSeconds)}
              </div>
            </div>

            {/* In-Phase Navigation */}
            <div className="flex items-center justify-between w-full z-10 px-4" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={skipBackward}
                className="p-5 rounded-2xl bg-black/20 hover:bg-black/30 active:scale-95 transition cursor-pointer shadow-lg"
                style={{ color: textColor }}
              >
                <SkipBack className="w-10 h-10" />
              </button>

              <span
                className="text-2xl sm:text-3xl font-black uppercase tracking-wider opacity-90"
                style={{ color: textColor }}
              >
                {currentStep?.subtitle}
              </span>

              <button
                type="button"
                onClick={skipForward}
                className="p-5 rounded-2xl bg-black/20 hover:bg-black/30 active:scale-95 transition cursor-pointer shadow-lg"
                style={{ color: textColor }}
              >
                <SkipForward className="w-10 h-10" />
              </button>
            </div>
          </div>

          {/* Right Vertical Control Panel */}
          <aside className="w-64 sm:w-72 bg-neutral-950 flex flex-col justify-between border-l border-neutral-800 p-6 z-20">
            {/* Top Controls */}
            <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
              <button
                type="button"
                onClick={() => {
                  const next = !soundEnabled;
                  setSoundEnabled(next);
                  if (next) {
                    unlockAudio();
                    playBeep(true, 0.9);
                  }
                }}
                className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white cursor-pointer active:scale-95"
                title={soundEnabled ? 'Sound Enabled' : 'Sound Muted'}
              >
                {soundEnabled ? <Volume2 className="w-7 h-7 text-green-400" /> : <VolumeX className="w-7 h-7 text-neutral-500" />}
              </button>

              <button
                type="button"
                onClick={onExit}
                className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 text-red-400 hover:text-red-300 cursor-pointer active:scale-95"
              >
                <X className="w-7 h-7 stroke-[2.5]" />
              </button>
            </div>

            {/* Big Play / Pause Button in Landscape */}
            <div className="my-auto flex flex-col items-center gap-6">
              <button
                type="button"
                onClick={togglePause}
                className={`w-32 h-32 rounded-3xl flex items-center justify-center transition active:scale-95 shadow-2xl cursor-pointer ${
                  isPlaying
                    ? 'bg-neutral-900 border-2 border-neutral-700 text-green-400 shadow-green-950/50'
                    : 'bg-green-500 border-2 border-green-300 text-black scale-105 shadow-green-500/50'
                }`}
              >
                {isPlaying ? <Pause className="w-14 h-14 fill-green-400" /> : <Play className="w-16 h-16 fill-black ml-1.5" />}
              </button>

              {/* Repeats Left Badge */}
              <div className="text-center">
                <div className="text-sm font-black uppercase tracking-widest text-neutral-400 mb-1">
                  REPEATS LEFT
                </div>
                <div className="text-7xl sm:text-8xl font-black text-blue-400 tabular-nums leading-none">
                  {repeatsLeft}
                </div>
              </div>
            </div>

            {/* Next Ribbon & Cycles */}
            <div className="space-y-4 pt-4 border-t border-neutral-800">
              <div
                className="p-5 rounded-2xl text-center font-black uppercase shadow-lg"
                style={{ backgroundColor: nextBgColor, color: nextTextColor }}
              >
                <div className="text-xs opacity-85 mb-0.5 tracking-wider font-black">UP NEXT</div>
                <div className="text-2xl sm:text-3xl font-black">{nextStep?.title || 'FINISH'}</div>
                <div className="text-lg font-black tabular-nums font-mono mt-1">
                  {nextStep ? formatSecondsToMMSS(nextStep.durationSeconds) : '00:00'}
                </div>
              </div>

              <div className="flex items-center justify-between px-2">
                <span className="text-sm font-black uppercase tracking-wider text-neutral-400">
                  CYCLES LEFT
                </span>
                <span className="text-5xl sm:text-6xl font-black text-amber-400 tabular-nums leading-none">
                  {cyclesLeft}
                </span>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* ========================================================
          WORKOUT COMPLETED MODAL
         ======================================================== */}
      {isCompleted && (
        <div className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl p-6 text-center space-y-5 shadow-2xl">
            <div className="w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-400 flex items-center justify-center mx-auto text-green-400">
              <Award className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl font-black uppercase tracking-tight text-white">
                Workout Complete!
              </h2>
              <p className="text-sm text-neutral-400">
                You crushed your {workout.name} session!
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 py-2">
              <div className="p-3 bg-neutral-950 rounded-2xl border border-neutral-800">
                <div className="text-xs text-neutral-500 font-medium">TOTAL TIME</div>
                <div className="text-2xl font-black text-white tabular-nums mt-0.5">
                  {formatSecondsToMMSS(totalElapsedSeconds)}
                </div>
              </div>
              <div className="p-3 bg-neutral-950 rounded-2xl border border-neutral-800">
                <div className="text-xs text-neutral-500 font-medium">EST. CALORIES</div>
                <div className="text-2xl font-black text-orange-400 tabular-nums mt-0.5 flex items-center justify-center gap-1">
                  <Flame className="w-5 h-5" />
                  {Math.round(totalElapsedSeconds * 0.16)}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  reset();
                  start();
                }}
                className="w-full py-4 bg-neutral-800 hover:bg-neutral-700 text-white rounded-2xl font-bold transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                Repeat Workout
              </button>

              <button
                type="button"
                onClick={onExit}
                className="w-full py-4 bg-green-500 hover:bg-green-400 text-black rounded-2xl font-black uppercase tracking-wide transition active:scale-95 shadow-lg shadow-green-500/20 cursor-pointer"
              >
                Back to Workouts
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
