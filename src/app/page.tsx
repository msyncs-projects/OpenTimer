'use client';

import React, { useState, useEffect } from 'react';
import { Workout, WorkoutLog } from '@/types/workout';
import {
  DEFAULT_WORKOUTS,
  loadWorkouts,
  saveSingleWorkout,
  deleteWorkout,
  duplicateWorkout,
  saveWorkoutLog,
  decodeWorkoutFromUrl,
} from '@/lib/storage';
import { WorkoutListView } from '@/components/WorkoutListView';
import { WorkoutActiveScreen } from '@/components/WorkoutActiveScreen';
import { WorkoutBuilderModal } from '@/components/WorkoutBuilderModal';
import { ShareModal } from '@/components/ShareModal';
import { unlockAudio, initGlobalAudioUnlock } from '@/lib/audio';
import { Share2, Smartphone } from 'lucide-react';

export default function Home() {
  const [workouts, setWorkouts] = useState<Workout[]>(DEFAULT_WORKOUTS);
  const [activeWorkout, setActiveWorkout] = useState<Workout | null>(null);
  const [builderWorkout, setBuilderWorkout] = useState<Workout | null | undefined>(undefined); // null = new, Workout = edit, undefined = closed
  const [shareWorkout, setShareWorkout] = useState<Workout | null | undefined>(undefined);
  const [showPwaBanner, setShowPwaBanner] = useState(false);

  // Initialize on mount
  useEffect(() => {
    const loaded = loadWorkouts();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setWorkouts(loaded);

    // Check for shared workout in URL
    if (typeof window !== 'undefined') {
      initGlobalAudioUnlock();
      const params = new URLSearchParams(window.location.search);
      const sharedCode = params.get('w');
      if (sharedCode) {
        const decoded = decodeWorkoutFromUrl(sharedCode);
        if (decoded) {
          const updated = saveSingleWorkout(decoded);
          setWorkouts(updated);
          // Clean URL
          window.history.replaceState({}, document.title, window.location.pathname);
          // Automatically prompt or start
          setActiveWorkout(decoded);
        }
      }

      // Check if not running standalone (show mobile Add to Home Screen tip)
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      if (!isStandalone && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
        setShowPwaBanner(true);
      }

      // Register Offline PWA Service Worker
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            reg.update();
          })
          .catch((err) => console.warn('Service worker registration failed:', err));
      }
    }
  }, []);

  // Handlers
  const handleStartWorkout = (workout: Workout) => {
    unlockAudio();
    setActiveWorkout(workout);
  };

  const handleFinishWorkout = (totalSeconds: number) => {
    if (!activeWorkout) return;
    const log: WorkoutLog = {
      id: `log_${Date.now()}`,
      workoutId: activeWorkout.id,
      workoutName: activeWorkout.name,
      completedAt: Date.now(),
      totalDurationSeconds: totalSeconds,
      cyclesCompleted: activeWorkout.cycles,
      roundsCompleted: activeWorkout.rounds.length * (activeWorkout.rounds[0]?.repeats || 1),
    };
    saveWorkoutLog(log);
  };

  const handleSaveWorkout = (saved: Workout) => {
    const updated = saveSingleWorkout(saved);
    setWorkouts(updated);
    setBuilderWorkout(undefined);
  };

  const handleDeleteWorkout = (id: string): boolean => {
    if (confirm('Are you sure you want to delete this timer?')) {
      const updated = deleteWorkout(id);
      setWorkouts(updated);
      if (builderWorkout && builderWorkout.id === id) {
        setBuilderWorkout(undefined);
      }
      if (shareWorkout && shareWorkout.id === id) {
        setShareWorkout(undefined);
      }
      if (activeWorkout && activeWorkout.id === id) {
        setActiveWorkout(null);
      }
      return true;
    }
    return false;
  };

  const handleDuplicateWorkout = (workout: Workout) => {
    const copy = duplicateWorkout(workout);
    const updated = saveSingleWorkout(copy);
    setWorkouts(updated);
  };

  return (
    <main className="min-h-dvh flex flex-col bg-black text-white relative">
      {/* Top Header Bar */}
      <header className="safe-top safe-x sticky top-0 z-30 bg-black/90 backdrop-blur-md px-5 py-3.5 border-b border-neutral-800 flex items-center justify-between">
        {/* App Logo & Branding */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-green-500 to-lime-400 flex items-center justify-center text-black font-black text-xl shadow-md shadow-green-500/20">
            +
          </div>
          <div>
            <span className="text-lg font-black tracking-tight text-white">TIMER</span>
            <span className="text-lg font-black tracking-tight text-green-400">PLUS</span>
          </div>
        </div>

        {/* Top Right Action: Share/Import */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShareWorkout(workouts[0] || null)}
            className="px-3.5 py-2 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white flex items-center gap-1.5 text-xs font-bold active:scale-95 transition cursor-pointer"
            title="Share & Backup"
          >
            <Share2 className="w-4 h-4 text-green-400" />
            <span className="hidden sm:inline font-bold">Backup</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 w-full max-w-xl mx-auto px-4 py-4 safe-x">
        {/* Mobile PWA Install Reminder (dismissible) */}
        {showPwaBanner && (
          <div className="mb-4 p-3.5 bg-neutral-900 border border-neutral-800 rounded-2xl flex items-center justify-between gap-3 text-xs shadow-lg">
            <div className="flex items-center gap-2.5 text-neutral-300">
              <Smartphone className="w-5 h-5 text-green-400 shrink-0" />
              <span>
                Tip: Tap <strong className="text-white">Share → Add to Home Screen</strong> for the full standalone app experience!
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowPwaBanner(false)}
              className="text-neutral-500 hover:text-white px-2 py-1 font-bold text-sm cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Workout List */}
        <WorkoutListView
          workouts={workouts}
          onStart={handleStartWorkout}
          onEdit={(w) => setBuilderWorkout(w)}
          onDuplicate={handleDuplicateWorkout}
          onDelete={handleDeleteWorkout}
          onShare={(w) => setShareWorkout(w)}
          onCreateNew={() => setBuilderWorkout(null)}
        />
      </div>

      {/* ========================================================
          ACTIVE WORKOUT SCREEN (Full Screen Workout Experience)
         ======================================================== */}
      {activeWorkout && (
        <WorkoutActiveScreen
          workout={activeWorkout}
          onExit={() => setActiveWorkout(null)}
          onFinish={handleFinishWorkout}
        />
      )}

      {/* ========================================================
          WORKOUT BUILDER MODAL (Create & Edit Timers)
         ======================================================== */}
      {builderWorkout !== undefined && (
        <WorkoutBuilderModal
          initialWorkout={builderWorkout}
          onSave={handleSaveWorkout}
          onDelete={handleDeleteWorkout}
          onClose={() => setBuilderWorkout(undefined)}
        />
      )}

      {/* ========================================================
          SHARE / IMPORT MODAL
         ======================================================== */}
      {shareWorkout !== undefined && (
        <ShareModal
          workout={shareWorkout}
          onImportSuccess={() => setWorkouts(loadWorkouts())}
          onClose={() => setShareWorkout(undefined)}
        />
      )}
    </main>
  );
}
