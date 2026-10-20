'use client';

import React, { useState, useEffect } from 'react';
import { Workout } from '@/types/workout';
import { useWorkoutTimer } from '@/lib/useWorkoutTimer';
import { formatSecondsToMMSS } from '@/lib/storage';
import { useWakeLock } from '@/lib/useWakeLock';
import confetti from 'canvas-confetti';
import {
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  RotateCcw,
  SkipBack,
  SkipForward,
  Play,
  Pause,
  X,
  Heart,
  Flame,
  Award,
  Clock,
  Sparkles,
} from 'lucide-react';

interface WorkoutActiveScreenProps {
  workout: Workout;
  onExit: () => void;
  onFinish: (totalSeconds: number) => void;
}

export function WorkoutActiveScreen({ workout, onExit, onFinish }: WorkoutActiveScreenProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
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
    simulatedBpm,
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
        particleCount: 120,
        spread: 80,
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
    }, 400);
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

  const toggleFullscreen = async () => {
    if (typeof document === 'undefined') return;
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      // ignore fullscreen restrictions
    }
  };

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
          PORTRAIT LAYOUT (Default mobile phone orientation)
         ======================================================== */}
      {!isLandscape ? (
        <div className="flex flex-col h-full w-full">
          {/* Top Black Header */}
          <header className="safe-top bg-black/95 px-4 py-2.5 flex items-center justify-between border-b border-white/10 z-20">
            {/* Heart Rate / Stats */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-900 border border-neutral-800">
                <Heart className="w-4 h-4 text-red-500 fill-red-500 animate-pulse" />
                <span className="text-xs font-black tracking-tight text-white tabular-nums">
                  {simulatedBpm} <span className="text-[10px] text-neutral-400 font-medium">BPM</span>
                </span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="w-9 h-9 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-300 hover:text-white transition active:scale-95"
                aria-label="Toggle Sound"
              >
                {soundEnabled ? <Volume2 className="w-4 h-4 text-green-400" /> : <VolumeX className="w-4 h-4 text-neutral-500" />}
              </button>

              <button
                type="button"
                onClick={toggleFullscreen}
                className="w-9 h-9 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-300 hover:text-white transition active:scale-95"
                aria-label="Toggle Fullscreen"
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={onExit}
                className="w-9 h-9 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-300 hover:text-white transition active:scale-95"
                aria-label="Exit Workout"
              >
                <X className="w-4 h-4 text-red-400" />
              </button>
            </div>

            {/* Total Remaining Time */}
            <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800">
              <Clock className="w-3.5 h-3.5 text-neutral-400" />
              <span className="text-xs font-bold tracking-tight text-neutral-200 tabular-nums">
                {formatSecondsToMMSS(totalRemainingSeconds)}
              </span>
            </div>
          </header>

          {/* Center Main Stage (Colored Box with Huge Digits) */}
          <main
            className="flex-1 flex flex-col items-center justify-between p-4 relative overflow-hidden transition-colors duration-300"
            style={{ backgroundColor: bgColor }}
          >
            {/* Background Chevrons */}
            <div
              className="absolute inset-0 pointer-events-none opacity-40 bg-chevrons"
              style={{
                backgroundImage: `repeating-linear-gradient(-55deg, ${chevronColor} 0px, ${chevronColor} 26px, transparent 26px, transparent 52px)`,
              }}
            />

            {/* Top Phase Title & Subtitle */}
            <div className="w-full text-center pt-2 z-10">
              <span
                className="text-xs font-black tracking-widest uppercase px-3 py-1 rounded-full bg-black/10 inline-block mb-1"
                style={{ color: textColor }}
              >
                {workout.name}
              </span>
              <h1
                className="text-3xl sm:text-4xl font-black tracking-tight uppercase"
                style={{ color: textColor }}
              >
                {currentStep?.title || 'WORK'}
              </h1>
              <p
                className="text-xs sm:text-sm font-semibold opacity-75 mt-0.5 tracking-wide"
                style={{ color: textColor }}
              >
                {currentStep?.subtitle}
              </p>
            </div>

            {/* Giant Countdown Digits */}
            <div className="my-auto text-center z-10 flex flex-col items-center justify-center">
              <div
                className="timer-digits font-black tracking-tighter leading-none select-none text-[28vw] sm:text-[130px] md:text-[160px]"
                style={{ color: textColor }}
              >
                {formatSecondsToMMSS(stepRemainingSeconds)}
              </div>
            </div>

            {/* In-Phase Quick Navigation (Rewind & Skip) */}
            <div className="w-full max-w-sm flex items-center justify-between px-6 pb-2 z-10">
              <button
                type="button"
                onClick={skipBackward}
                className="p-3 rounded-full bg-black/15 hover:bg-black/25 active:scale-90 transition backdrop-blur-sm"
                style={{ color: textColor }}
                title="Rewind / Previous"
              >
                <SkipBack className="w-6 h-6" />
              </button>

              <span
                className="text-xs font-bold uppercase tracking-widest opacity-60"
                style={{ color: textColor }}
              >
                {currentStep ? `Interval ${currentStep.stepIndex + 1}/${workout.rounds.length * (workout.rounds[0]?.repeats || 1)}` : ''}
              </span>

              <button
                type="button"
                onClick={skipForward}
                className="p-3 rounded-full bg-black/15 hover:bg-black/25 active:scale-90 transition backdrop-blur-sm"
                style={{ color: textColor }}
                title="Skip to Next"
              >
                <SkipForward className="w-6 h-6" />
              </button>
            </div>
          </main>

          {/* "UP NEXT" Ribbon (Authentic Timer Plus Style) */}
          <div
            className="w-full py-2.5 px-4 flex items-center justify-between relative overflow-hidden transition-colors duration-300 border-t border-black/20 z-10"
            style={{ backgroundColor: nextBgColor }}
          >
            {/* Ribbon Chevrons */}
            <div className="absolute inset-0 pointer-events-none opacity-30 bg-chevrons" />

            <div className="flex items-center gap-2 z-10">
              <span
                className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-black/20"
                style={{ color: nextTextColor }}
              >
                UP NEXT
              </span>
              <span
                className="text-sm font-black uppercase tracking-tight"
                style={{ color: nextTextColor }}
              >
                {nextStep ? nextStep.title : 'FINISH'}
              </span>
            </div>

            <span
              className="text-sm font-black tabular-nums z-10"
              style={{ color: nextTextColor }}
            >
              {nextStep ? formatSecondsToMMSS(nextStep.durationSeconds) : '00:00'}
            </span>
          </div>

          {/* Bottom Black Control Dock */}
          <footer className="safe-bottom bg-neutral-950 px-6 py-4 flex items-center justify-between border-t border-neutral-900 z-20">
            {/* Left: Repeats Left */}
            <div className="flex flex-col items-center min-w-[70px]">
              <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                REPEATS LEFT
              </span>
              <span className="text-3xl font-black text-blue-500 tabular-nums">
                {repeatsLeft}
              </span>
            </div>

            {/* Center: Big Square Pause / Resume Button */}
            <button
              type="button"
              onClick={togglePause}
              className={`w-18 h-18 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center transition-all duration-150 active:scale-95 shadow-xl ${
                isPlaying
                  ? 'bg-neutral-900 border-2 border-neutral-700 hover:border-neutral-500 text-green-400 shadow-green-950/40'
                  : 'bg-green-500 border-2 border-green-400 text-black shadow-green-500/40 scale-105'
              }`}
              aria-label={isPlaying ? 'Pause Workout' : 'Start Workout'}
            >
              {isPlaying ? (
                <Pause className="w-8 h-8 fill-green-400 text-green-400" />
              ) : (
                <Play className="w-9 h-9 fill-black text-black ml-1" />
              )}
            </button>

            {/* Right: Cycles Left */}
            <div className="flex flex-col items-center min-w-[70px]">
              <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                CYCLES LEFT
              </span>
              <span className="text-3xl font-black text-amber-400 tabular-nums">
                {cyclesLeft}
              </span>
            </div>
          </footer>
        </div>
      ) : (
        /* ========================================================
           LANDSCAPE SCOREBOARD LAYOUT (Phone sideways / iPad / Gym TV)
           Matching screenshot timerplus_0.png!
           ======================================================== */
        <div className="flex h-full w-full">
          {/* Left Large Timer Stage */}
          <div
            className="flex-1 flex flex-col justify-between p-6 relative overflow-hidden transition-colors duration-300"
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
            <div className="flex items-center justify-between w-full z-10">
              <div className="flex items-center gap-3">
                <span
                  className="text-xs font-black tracking-widest uppercase px-3 py-1 rounded-full bg-black/15"
                  style={{ color: textColor }}
                >
                  {workout.name}
                </span>
                <span
                  className="text-2xl font-black tracking-tight uppercase"
                  style={{ color: textColor }}
                >
                  {currentStep?.title || 'WORK'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/15 font-black text-xs">
                  <Heart className="w-4 h-4 text-red-500 fill-red-500 animate-pulse" />
                  <span style={{ color: textColor }}>{simulatedBpm} BPM</span>
                </div>
                <div className="px-3 py-1 rounded-full bg-black/15 font-black text-xs tabular-nums" style={{ color: textColor }}>
                  {formatSecondsToMMSS(totalRemainingSeconds)}
                </div>
              </div>
            </div>

            {/* Giant Digits */}
            <div className="my-auto text-center z-10">
              <div
                className="timer-digits font-black tracking-tighter leading-none select-none text-[22vw]"
                style={{ color: textColor }}
              >
                {formatSecondsToMMSS(stepRemainingSeconds)}
              </div>
            </div>

            {/* In-Phase Navigation */}
            <div className="flex items-center justify-between w-full z-10 px-4">
              <button
                type="button"
                onClick={skipBackward}
                className="p-3 rounded-full bg-black/15 hover:bg-black/25 active:scale-95 transition"
                style={{ color: textColor }}
              >
                <SkipBack className="w-7 h-7" />
              </button>

              <span
                className="text-xs font-bold uppercase tracking-widest opacity-70"
                style={{ color: textColor }}
              >
                {currentStep?.subtitle}
              </span>

              <button
                type="button"
                onClick={skipForward}
                className="p-3 rounded-full bg-black/15 hover:bg-black/25 active:scale-95 transition"
                style={{ color: textColor }}
              >
                <SkipForward className="w-7 h-7" />
              </button>
            </div>
          </div>

          {/* Right Vertical Control Panel (Authentic Timer Plus Landscape Sidebar) */}
          <aside className="w-48 sm:w-56 bg-neutral-950 flex flex-col justify-between border-l border-neutral-800 p-4 z-20">
            {/* Top Controls */}
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-2 rounded-lg bg-neutral-900 text-neutral-300 hover:text-white"
              >
                {soundEnabled ? <Volume2 className="w-5 h-5 text-green-400" /> : <VolumeX className="w-5 h-5 text-neutral-500" />}
              </button>

              <button
                type="button"
                onClick={toggleFullscreen}
                className="p-2 rounded-lg bg-neutral-900 text-neutral-300 hover:text-white"
              >
                {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
              </button>

              <button
                type="button"
                onClick={onExit}
                className="p-2 rounded-lg bg-neutral-900 text-red-400 hover:text-red-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Big Play / Pause Button in Landscape */}
            <div className="my-auto flex flex-col items-center gap-4">
              <button
                type="button"
                onClick={togglePause}
                className={`w-24 h-24 rounded-2xl flex items-center justify-center transition active:scale-95 shadow-2xl ${
                  isPlaying
                    ? 'bg-neutral-900 border-2 border-neutral-700 text-green-400'
                    : 'bg-green-500 border-2 border-green-400 text-black scale-105'
                }`}
              >
                {isPlaying ? <Pause className="w-10 h-10 fill-green-400" /> : <Play className="w-10 h-10 fill-black ml-1" />}
              </button>

              {/* Repeats Left Badge */}
              <div className="text-center">
                <div className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                  REPEATS LEFT
                </div>
                <div className="text-3xl font-black text-blue-500 tabular-nums">
                  {repeatsLeft}
                </div>
              </div>
            </div>

            {/* Next Ribbon & Cycles */}
            <div className="space-y-3 pt-3 border-t border-neutral-800">
              <div
                className="p-2.5 rounded-xl text-center font-black uppercase text-xs shadow"
                style={{ backgroundColor: nextBgColor, color: nextTextColor }}
              >
                <div className="text-[9px] opacity-80">UP NEXT</div>
                <div>{nextStep?.title || 'FINISH'}</div>
                <div className="text-[11px] tabular-nums font-mono">
                  {nextStep ? formatSecondsToMMSS(nextStep.durationSeconds) : '00:00'}
                </div>
              </div>

              <div className="flex items-center justify-between px-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400">
                  CYCLES LEFT
                </span>
                <span className="text-xl font-black text-amber-400 tabular-nums">
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
                className="w-full py-3.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-2xl font-bold transition active:scale-95 flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Repeat Workout
              </button>

              <button
                type="button"
                onClick={onExit}
                className="w-full py-3.5 bg-green-500 hover:bg-green-400 text-black rounded-2xl font-black uppercase tracking-wide transition active:scale-95 shadow-lg shadow-green-500/20"
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
