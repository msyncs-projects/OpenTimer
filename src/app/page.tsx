'use client';

import React, { useState, useEffect } from 'react';
import { Workout, WorkoutLog } from '@/types/workout';
import {
  DEFAULT_WORKOUTS,
  loadWorkouts,
  saveSingleWorkout,
  deleteWorkout,
  duplicateWorkout,
  loadWorkoutLogs,
  saveWorkoutLog,
  clearWorkoutLogs,
  decodeWorkoutFromUrl,
} from '@/lib/storage';
import { WorkoutListView } from '@/components/WorkoutListView';
import { WorkoutActiveScreen } from '@/components/WorkoutActiveScreen';
import { WorkoutBuilderModal } from '@/components/WorkoutBuilderModal';
import { WorkoutHistoryView } from '@/components/WorkoutHistoryView';
import { ShareModal } from '@/components/ShareModal';
import { unlockAudio, initGlobalAudioUnlock } from '@/lib/audio';
import { Dumbbell, History, Share2, Plus, Sparkles, Smartphone } from 'lucide-react';

export default function Home() {
  const [workouts, setWorkouts] = useState<Workout[]>(DEFAULT_WORKOUTS);
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [activeWorkout, setActiveWorkout] = useState<Workout | null>(null);
  const [builderWorkout, setBuilderWorkout] = useState<Workout | null | undefined>(undefined); // null = new, Workout = edit, undefined = closed
  const [shareWorkout, setShareWorkout] = useState<Workout | null | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<'timers' | 'history'>('timers');
  const [showPwaBanner, setShowPwaBanner] = useState(false);

  // Initialize on mount
  useEffect(() => {
    const loaded = loadWorkouts();
    setWorkouts(loaded);
    setLogs(loadWorkoutLogs());

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
    setLogs(loadWorkoutLogs());
  };

  const handleSaveWorkout = (saved: Workout) => {
    const updated = saveSingleWorkout(saved);
    setWorkouts(updated);
    setBuilderWorkout(undefined);
  };

  const handleDeleteWorkout = (id: string) => {
    if (confirm('Are you sure you want to delete this timer?')) {
      const updated = deleteWorkout(id);
      setWorkouts(updated);
    }
  };

  const handleDuplicateWorkout = (workout: Workout) => {
    const copy = duplicateWorkout(workout);
    const updated = saveSingleWorkout(copy);
    setWorkouts(updated);
  };

  const handleClearHistory = () => {
    if (confirm('Are you sure you want to clear your workout history?')) {
      clearWorkoutLogs();
      setLogs([]);
    }
  };

  return (
    <main className="min-h-dvh flex flex-col bg-black text-white relative">
      {/* Top Header Bar */}
      <header className="safe-top sticky top-0 z-30 bg-black/90 backdrop-blur-md px-5 py-3 border-b border-neutral-800 flex items-center justify-between">
        {/* App Logo & Branding */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-green-500 to-lime-400 flex items-center justify-center text-black font-black text-lg shadow-md shadow-green-500/20">
            +
          </div>
          <div>
            <span className="text-base font-black tracking-tight text-white">TIMER</span>
            <span className="text-base font-black tracking-tight text-green-400">PLUS</span>
          </div>
        </div>

        {/* Top Right Action: Share/Import */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShareWorkout(workouts[0] || null)}
            className="px-3 py-1.5 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white flex items-center gap-1.5 text-xs font-bold active:scale-95 transition"
            title="Share & Backup"
          >
            <Share2 className="w-3.5 h-3.5 text-green-400" />
            <span className="hidden sm:inline">Backup</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 w-full max-w-xl mx-auto px-4 py-4">
        {/* Mobile PWA Install Reminder (dismissible) */}
        {showPwaBanner && (
          <div className="mb-4 p-3 bg-neutral-900 border border-neutral-800 rounded-2xl flex items-center justify-between gap-3 text-xs shadow-lg">
            <div className="flex items-center gap-2 text-neutral-300">
              <Smartphone className="w-4 h-4 text-green-400 shrink-0" />
              <span>
                Tip: Tap <strong className="text-white">Share → Add to Home Screen</strong> for the full standalone app experience!
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowPwaBanner(false)}
              className="text-neutral-500 hover:text-white px-2 py-1 font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Tab Selector */}
        <div className="grid grid-cols-2 gap-2 p-1.5 bg-neutral-900 rounded-2xl border border-neutral-800 mb-4 select-none">
          <button
            type="button"
            onClick={() => setActiveTab('timers')}
            className={`py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer ${
              activeTab === 'timers'
                ? 'bg-neutral-800 text-white shadow'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Dumbbell className="w-4 h-4 text-green-400" />
            Timers ({workouts.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer ${
              activeTab === 'history'
                ? 'bg-neutral-800 text-white shadow'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <History className="w-4 h-4 text-amber-400" />
            Journal ({logs.length})
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'timers' ? (
          <WorkoutListView
            workouts={workouts}
            onStart={handleStartWorkout}
            onEdit={(w) => setBuilderWorkout(w)}
            onDuplicate={handleDuplicateWorkout}
            onDelete={handleDeleteWorkout}
            onShare={(w) => setShareWorkout(w)}
            onCreateNew={() => setBuilderWorkout(null)}
          />
        ) : (
          <WorkoutHistoryView logs={logs} onClear={handleClearHistory} />
        )}
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
