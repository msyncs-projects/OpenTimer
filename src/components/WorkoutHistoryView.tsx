'use client';

import React from 'react';
import { WorkoutLog } from '@/types/workout';
import { formatSecondsToMMSS, clearWorkoutLogs } from '@/lib/storage';
import { Award, Flame, Clock, Trash2, Calendar, Dumbbell } from 'lucide-react';

interface WorkoutHistoryViewProps {
  logs: WorkoutLog[];
  onClear: () => void;
}

export function WorkoutHistoryView({ logs, onClear }: WorkoutHistoryViewProps) {
  const totalSecondsAllTime = logs.reduce((sum, l) => sum + l.totalDurationSeconds, 0);
  const totalCaloriesAllTime = Math.round(totalSecondsAllTime * 0.16);

  const formatLogDate = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3 text-center">
          <Award className="w-5 h-5 text-amber-400 mx-auto mb-1" />
          <div className="text-xl font-black text-white tabular-nums">{logs.length}</div>
          <div className="text-[10px] font-black uppercase text-neutral-400">Workouts</div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3 text-center">
          <Clock className="w-5 h-5 text-blue-400 mx-auto mb-1" />
          <div className="text-xl font-black text-white tabular-nums">
            {Math.round(totalSecondsAllTime / 60)}m
          </div>
          <div className="text-[10px] font-black uppercase text-neutral-400">Total Time</div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3 text-center">
          <Flame className="w-5 h-5 text-orange-400 mx-auto mb-1" />
          <div className="text-xl font-black text-white tabular-nums">{totalCaloriesAllTime}</div>
          <div className="text-[10px] font-black uppercase text-neutral-400">Est. kcal</div>
        </div>
      </div>

      {/* History Log List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-black uppercase tracking-wider text-neutral-400">
            Workout Journal ({logs.length})
          </span>
          {logs.length > 0 && (
            <button
              type="button"
              onClick={onClear}
              className="text-[11px] text-neutral-500 hover:text-red-400 font-bold flex items-center gap-1 transition"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear History
            </button>
          )}
        </div>

        {logs.length === 0 ? (
          <div className="p-10 bg-neutral-900/60 border border-neutral-800 rounded-3xl text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-neutral-800 flex items-center justify-center mx-auto text-neutral-500">
              <Dumbbell className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">No workouts recorded yet</h3>
              <p className="text-xs text-neutral-400 mt-1 max-w-xs mx-auto">
                Start a workout session and your completed routines and stats will appear right here!
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => (
              <div
                key={log.id}
                className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3.5 flex items-center justify-between"
              >
                <div className="space-y-1">
                  <div className="text-sm font-black text-white tracking-tight">
                    {log.workoutName}
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-neutral-400 font-medium">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-neutral-500" />
                      {formatLogDate(log.completedAt)}
                    </span>
                    <span>•</span>
                    <span>{log.roundsCompleted} sets finished</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-base font-black text-green-400 tabular-nums">
                    {formatSecondsToMMSS(log.totalDurationSeconds)}
                  </div>
                  <div className="text-[10px] text-neutral-400 font-bold">
                    ~{Math.round(log.totalDurationSeconds * 0.16)} kcal
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
