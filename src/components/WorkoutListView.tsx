'use client';

import React, { useState } from 'react';
import { Workout } from '@/types/workout';
import { calculateTotalWorkoutSeconds, formatSecondsToMMSS } from '@/lib/storage';
import {
  Play,
  Edit2,
  Copy,
  Trash2,
  Share2,
  Plus,
  Clock,
  RotateCw,
  Flame,
  Dumbbell,
} from 'lucide-react';

interface WorkoutListViewProps {
  workouts: Workout[];
  onStart: (workout: Workout) => void;
  onEdit: (workout: Workout) => void;
  onDuplicate: (workout: Workout) => void;
  onDelete: (id: string) => void;
  onShare: (workout: Workout) => void;
  onCreateNew: () => void;
}

export function WorkoutListView({
  workouts,
  onStart,
  onEdit,
  onDuplicate,
  onDelete,
  onShare,
  onCreateNew,
}: WorkoutListViewProps) {
  const [search, setSearch] = useState('');

  const filteredWorkouts = workouts.filter((w) =>
    w.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4 pb-28">
      {/* Search / Filter (if more than 3 workouts) */}
      {workouts.length > 3 && (
        <div className="px-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search custom timers..."
            className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl px-4 py-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600"
          />
        </div>
      )}

      {/* Workout Card List */}
      <div className="space-y-3">
        {filteredWorkouts.map((workout) => {
          const totalSec = calculateTotalWorkoutSeconds(workout);
          const firstRound = workout.rounds[0];
          const workInterval = firstRound?.intervals.find((i) => i.type === 'work');
          const restInterval = firstRound?.intervals.find((i) => i.type === 'rest');
          const totalSets = workout.rounds.reduce((acc, r) => acc + r.repeats, 0);

          return (
            <div
              key={workout.id}
              onClick={() => onStart(workout)}
              className="group bg-neutral-900 hover:bg-neutral-850 active:bg-neutral-800 border border-neutral-800 rounded-3xl p-4 transition-all duration-150 shadow-lg relative overflow-hidden cursor-pointer select-none"
            >
              {/* Accent Left Border Indicator */}
              <div
                className="absolute left-0 top-0 bottom-0 w-1.5"
                style={{ backgroundColor: workout.color || '#34C759' }}
              />

              <div className="flex items-start justify-between gap-3 pl-1">
                {/* Title & Stats */}
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: workout.color || '#34C759' }}
                    />
                    <h3 className="text-base font-black uppercase tracking-tight text-white line-clamp-1">
                      {workout.name}
                    </h3>
                  </div>

                  {/* Badges / Metrics */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold text-neutral-300">
                    <span className="px-2.5 py-1 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center gap-1 text-green-400 tabular-nums">
                      <Clock className="w-3.5 h-3.5" />
                      {formatSecondsToMMSS(totalSec)}
                    </span>

                    <span className="px-2.5 py-1 rounded-xl bg-neutral-950 border border-neutral-800 tabular-nums">
                      {totalSets} {totalSets === 1 ? 'set' : 'sets'}
                    </span>

                    {workout.cycles > 1 && (
                      <span className="px-2.5 py-1 rounded-xl bg-neutral-950 border border-neutral-800 text-amber-400 tabular-nums">
                        {workout.cycles} cycles
                      </span>
                    )}

                    {workInterval && restInterval && (
                      <span className="px-2.5 py-1 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-400">
                        {workInterval.durationSeconds}s / {restInterval.durationSeconds}s
                      </span>
                    )}
                  </div>
                </div>

                {/* Big Green Start Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStart(workout);
                  }}
                  className="w-14 h-14 rounded-2xl bg-green-500 hover:bg-green-400 flex items-center justify-center text-black shadow-lg shadow-green-500/30 transition-all active:scale-95 shrink-0 cursor-pointer"
                  aria-label={`Start ${workout.name}`}
                >
                  <Play className="w-7 h-7 fill-black ml-0.5" />
                </button>
              </div>

              {/* Action Bar (Edit, Duplicate, Share, Delete) */}
              <div
                className="flex items-center justify-between pt-3 mt-3 border-t border-neutral-800/80 pl-1"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(workout);
                    }}
                    className="px-3 py-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 text-xs font-bold flex items-center gap-1 transition active:scale-95 cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicate(workout);
                    }}
                    className="px-3 py-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 text-xs font-bold flex items-center gap-1 transition active:scale-95 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copy
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onShare(workout);
                    }}
                    className="px-3 py-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 text-xs font-bold flex items-center gap-1 transition active:scale-95 cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" /> Share
                  </button>
                </div>

                {!workout.isDefault && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(workout.id);
                    }}
                    className="p-2 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-neutral-800 transition active:scale-95 cursor-pointer"
                    title="Delete timer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredWorkouts.length === 0 && (
        <div className="p-8 text-center text-neutral-400 bg-neutral-900/50 rounded-3xl border border-neutral-800">
          No timers found matching &quot;{search}&quot;.
        </div>
      )}

      {/* Floating Action Button (FAB) - Matching screenshot timerplus_4.png! */}
      <div className="fixed right-5 bottom-6 z-40">
        <button
          type="button"
          onClick={onCreateNew}
          className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-400 text-black flex items-center justify-center shadow-2xl shadow-green-500/50 transition-all duration-200 active:scale-90 font-black border-2 border-green-300 cursor-pointer"
          aria-label="Create Custom Workout"
        >
          <Plus className="w-8 h-8 stroke-[3]" />
        </button>
      </div>
    </div>
  );
}
