'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Workout, FlattenedStep, IntervalType } from '@/types/workout';
import { playBeep, playBoxingBell, playWhistle, speakCue, triggerHaptic, unlockAudio } from './audio';

export function buildWorkoutSteps(workout: Workout): FlattenedStep[] {
  const steps: FlattenedStep[] = [];
  let stepIdx = 0;

  // 1. Prepare Step
  if (workout.prepareSeconds > 0) {
    steps.push({
      stepIndex: stepIdx++,
      type: 'prepare',
      title: 'PREPARE',
      subtitle: 'Get ready to begin',
      durationSeconds: workout.prepareSeconds,
      roundIndex: 1,
      totalRounds: workout.rounds.length,
      repeatIndex: 1,
      totalRepeats: 1,
      cycleIndex: 1,
      totalCycles: workout.cycles,
      color: '#E8FA32', // Vibrant Lime Yellow
      isWork: false,
    });
  }

  // 2. Cycles & Rounds
  const totalCycles = Math.max(1, workout.cycles);
  const totalRounds = workout.rounds.length;

  for (let c = 1; c <= totalCycles; c++) {
    for (let r = 0; r < totalRounds; r++) {
      const round = workout.rounds[r];
      const totalRepeats = Math.max(1, round.repeats);

      for (let rep = 1; rep <= totalRepeats; rep++) {
        for (const interval of round.intervals) {
          if (interval.durationSeconds <= 0) continue;

          const isWork = interval.type === 'work';
          const stepType: IntervalType = isWork ? 'work' : 'rest';
          const defaultColor = isWork ? '#76E026' : '#FF3B30'; // Neon Green vs Alarm Red

          steps.push({
            stepIndex: stepIdx++,
            type: stepType,
            title: (interval.name || (isWork ? 'WORK' : 'REST')).toUpperCase(),
            subtitle: isWork
              ? `Round ${r + 1} • Set ${rep}/${totalRepeats}`
              : `Rest for this interval`,
            durationSeconds: interval.durationSeconds,
            roundIndex: r + 1,
            totalRounds,
            repeatIndex: rep,
            totalRepeats,
            cycleIndex: c,
            totalCycles,
            color: interval.color || defaultColor,
            isWork,
          });
        }
      }
    }

    // Rest Between Cycles (if more cycles remain)
    if (c < totalCycles && workout.restBetweenCyclesSeconds > 0) {
      steps.push({
        stepIndex: stepIdx++,
        type: 'cycle_rest',
        title: 'REST BETWEEN CYCLES',
        subtitle: `Recovery before Cycle ${c + 1}`,
        durationSeconds: workout.restBetweenCyclesSeconds,
        roundIndex: totalRounds,
        totalRounds,
        repeatIndex: 1,
        totalRepeats: 1,
        cycleIndex: c,
        totalCycles,
        color: '#0A84FF', // Electric Blue
        isWork: false,
      });
    }
  }

  // 3. Cooldown Step
  if (workout.cooldownSeconds > 0) {
    steps.push({
      stepIndex: stepIdx++,
      type: 'cooldown',
      title: 'COOLDOWN',
      subtitle: 'Post-workout recovery & stretching',
      durationSeconds: workout.cooldownSeconds,
      roundIndex: totalRounds,
      totalRounds,
      repeatIndex: 1,
      totalRepeats: 1,
      cycleIndex: totalCycles,
      totalCycles,
      color: '#30D158', // Cool Emerald / Cyan
      isWork: false,
    });
  }

  return steps;
}

export interface WorkoutTimerState {
  currentStepIndex: number;
  currentStep: FlattenedStep | null;
  nextStep: FlattenedStep | null;
  stepRemainingSeconds: number;
  totalRemainingSeconds: number;
  totalElapsedSeconds: number;
  totalWorkoutSeconds: number;
  isPlaying: boolean;
  isPaused: boolean;
  isCompleted: boolean;
  repeatsLeft: number;
  cyclesLeft: number;
  screenFlash: boolean;
  soundEnabled: boolean;
}

export function useWorkoutTimer(workout: Workout, onComplete?: () => void) {
  const steps = useMemo(() => buildWorkoutSteps(workout), [workout]);

  const totalWorkoutDuration = useMemo(() => {
    return steps.reduce((sum, s) => sum + s.durationSeconds, 0);
  }, [steps]);

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [stepRemaining, setStepRemaining] = useState(steps[0]?.durationSeconds || 0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [screenFlash, setScreenFlash] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // References for precise timing without drift
  const currentStepRef = useRef(0);
  const stepRemainingRef = useRef(steps[0]?.durationSeconds || 0);
  const isPlayingRef = useRef(false);
  const isPausedRef = useRef(false);
  const lastTickTimeRef = useRef(0);
  const lastBeepSecondRef = useRef<number | null>(null);

  currentStepRef.current = currentStepIndex;
  stepRemainingRef.current = stepRemaining;
  isPlayingRef.current = isPlaying;
  isPausedRef.current = isPaused;

  const currentStep = steps[currentStepIndex] || null;
  const nextStep = steps[currentStepIndex + 1] || null;

  // Repeats left and cycles left
  const repeatsLeft = useMemo(() => {
    if (!currentStep) return 0;
    return Math.max(0, currentStep.totalRepeats - currentStep.repeatIndex);
  }, [currentStep]);

  const cyclesLeft = useMemo(() => {
    if (!currentStep) return 0;
    return Math.max(0, currentStep.totalCycles - currentStep.cycleIndex);
  }, [currentStep]);

  // Calculate total remaining
  const totalRemaining = useMemo(() => {
    if (isCompleted) return 0;
    let sum = Math.max(0, Math.ceil(stepRemaining));
    for (let i = currentStepIndex + 1; i < steps.length; i++) {
      sum += steps[i].durationSeconds;
    }
    return sum;
  }, [currentStepIndex, stepRemaining, steps, isCompleted]);

  const totalElapsed = Math.max(0, totalWorkoutDuration - totalRemaining);

  // Play transition sound for the given step
  const triggerTransitionSound = useCallback((step: FlattenedStep) => {
    if (!soundEnabled) return;
    const settings = workout.soundSettings || {
      countdownBeeps: true,
      voiceCues: true,
      soundType: 'bell',
      volume: 0.9,
      vibration: true,
    };
    const vol = typeof settings.volume === 'number' ? settings.volume : 0.9;

    // Flash screen
    setScreenFlash(true);
    setTimeout(() => setScreenFlash(false), 300);

    // Haptics
    if (settings.vibration) {
      triggerHaptic([150, 80, 150]);
    }

    // Audio cue
    if (settings.soundType === 'bell') {
      playBoxingBell(vol);
    } else if (settings.soundType === 'whistle') {
      playWhistle(vol);
    } else {
      playBeep(true, vol);
    }

    // Voice announcement
    if (settings.voiceCues) {
      if (step.type === 'work') {
        speakCue(`${step.title}!`);
      } else if (step.type === 'rest') {
        speakCue('Rest');
      } else if (step.type === 'cycle_rest') {
        speakCue('Rest between cycles');
      } else if (step.type === 'cooldown') {
        speakCue('Cooldown');
      }
    }
  }, [soundEnabled, workout.soundSettings]);

  // Handle countdown sound at 3, 2, 1 seconds
  const handleCountdownCue = useCallback((sec: number) => {
    if (!soundEnabled) return;
    const settings = workout.soundSettings || {
      countdownBeeps: true,
      voiceCues: true,
      soundType: 'bell',
      volume: 0.9,
      vibration: true,
    };
    const vol = typeof settings.volume === 'number' ? settings.volume : 0.9;

    if (settings.countdownBeeps) {
      playBeep(false, vol * 0.7);
    }
    if (settings.vibration) {
      triggerHaptic(80);
    }
    if (settings.voiceCues && sec <= 3 && sec >= 1) {
      speakCue(sec.toString());
    }
  }, [soundEnabled, workout.soundSettings]);

  // Transition to specific step
  const goToStep = useCallback((targetIndex: number) => {
    if (targetIndex >= steps.length) {
      // Completed!
      setIsPlaying(false);
      setIsPaused(false);
      setIsCompleted(true);
      setStepRemaining(0);
      if (soundEnabled && workout.soundSettings.voiceCues) {
        speakCue('Workout complete! Great job!');
      }
      if (soundEnabled) {
        playBoxingBell(1.0);
      }
      triggerHaptic([300, 100, 300, 100, 400]);
      onComplete?.();
      return;
    }

    if (targetIndex < 0) {
      targetIndex = 0;
    }

    const next = steps[targetIndex];
    setCurrentStepIndex(targetIndex);
    setStepRemaining(next.durationSeconds);
    lastTickTimeRef.current = Date.now();
    lastBeepSecondRef.current = null;
    triggerTransitionSound(next);
  }, [steps, soundEnabled, workout.soundSettings, onComplete, triggerTransitionSound]);

  // Start workout
  const start = useCallback(() => {
    unlockAudio();
    if (isCompleted) {
      setCurrentStepIndex(0);
      setStepRemaining(steps[0]?.durationSeconds || 0);
      setIsCompleted(false);
    }
    setIsPlaying(true);
    setIsPaused(false);
    lastTickTimeRef.current = Date.now();
    lastBeepSecondRef.current = null;

    if (currentStepIndex === 0 && steps[0]) {
      triggerTransitionSound(steps[0]);
    }
  }, [isCompleted, steps, currentStepIndex, triggerTransitionSound]);

  // Pause
  const pause = useCallback(() => {
    setIsPlaying(false);
    setIsPaused(true);
  }, []);

  // Resume
  const resume = useCallback(() => {
    unlockAudio();
    setIsPlaying(true);
    setIsPaused(false);
    lastTickTimeRef.current = Date.now();
  }, []);

  const togglePause = useCallback(() => {
    if (!isPlaying && !isPaused) {
      start();
    } else if (isPlaying) {
      pause();
    } else {
      resume();
    }
  }, [isPlaying, isPaused, start, pause, resume]);

  // Skip to next interval
  const skipForward = useCallback(() => {
    goToStep(currentStepRef.current + 1);
  }, [goToStep]);

  // Rewind to start of interval or previous interval
  const skipBackward = useCallback(() => {
    const curIdx = currentStepRef.current;
    const rem = stepRemainingRef.current;
    const curDuration = steps[curIdx]?.durationSeconds || 0;

    // If more than 3 seconds in, restart current interval; else go to previous
    if (curDuration - rem > 3 && curIdx >= 0) {
      setStepRemaining(curDuration);
      lastTickTimeRef.current = Date.now();
      lastBeepSecondRef.current = null;
    } else if (curIdx > 0) {
      goToStep(curIdx - 1);
    } else {
      setStepRemaining(curDuration);
      lastTickTimeRef.current = Date.now();
    }
  }, [steps, goToStep]);

  // Reset to initial state
  const reset = useCallback(() => {
    setIsPlaying(false);
    setIsPaused(false);
    setIsCompleted(false);
    setCurrentStepIndex(0);
    setStepRemaining(steps[0]?.durationSeconds || 0);
    lastTickTimeRef.current = 0;
    lastBeepSecondRef.current = null;
  }, [steps]);

  // Precision Tick Loop
  useEffect(() => {
    if (!isPlaying || isPaused || isCompleted) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const deltaSec = (now - lastTickTimeRef.current) / 1000;
      lastTickTimeRef.current = now;

      setStepRemaining((prev) => {
        const nextSec = prev - deltaSec;
        const wholeSec = Math.ceil(nextSec);

        // Check countdown beeps at 3, 2, 1
        if (wholeSec <= 3 && wholeSec >= 1 && lastBeepSecondRef.current !== wholeSec) {
          lastBeepSecondRef.current = wholeSec;
          handleCountdownCue(wholeSec);
        }

        if (nextSec <= 0) {
          // Advance to next step
          goToStep(currentStepRef.current + 1);
          return 0;
        }

        return nextSec;
      });
    }, 50); // High-frequency update for smooth visual countdown

    return () => clearInterval(interval);
  }, [isPlaying, isPaused, isCompleted, goToStep, handleCountdownCue]);

  return {
    steps,
    currentStepIndex,
    currentStep,
    nextStep,
    stepRemainingSeconds: Math.max(0, stepRemaining),
    totalRemainingSeconds: totalRemaining,
    totalElapsedSeconds: totalElapsed,
    totalWorkoutSeconds: totalWorkoutDuration,
    isPlaying,
    isPaused,
    isCompleted,
    repeatsLeft,
    cyclesLeft,
    screenFlash,
    soundEnabled,
    setSoundEnabled,
    start,
    pause,
    resume,
    togglePause,
    skipForward,
    skipBackward,
    reset,
  };
}
