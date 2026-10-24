'use client';

import React, { useState } from 'react';
import { Workout, WorkoutRound, IntervalItem, SoundSettings } from '@/types/workout';
import { formatSecondsToMMSS } from '@/lib/storage';
import { testSound, unlockAudio } from '@/lib/audio';
import {
  X,
  Check,
  Plus,
  Trash2,
  AlertCircle,
  RotateCw,
  Pause,
  Snowflake,
  Volume2,
  ChevronRight,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';

interface WorkoutBuilderModalProps {
  initialWorkout?: Workout | null;
  onSave: (workout: Workout) => void;
  onDelete?: (id: string) => boolean | void;
  onClose: () => void;
}

const ACCENT_COLORS = [
  '#FF9500', // Orange (Default)
  '#34C759', // Green
  '#FF3B30', // Red
  '#0A84FF', // Blue
  '#AF52DE', // Purple
  '#FFCC00', // Yellow
  '#30D158', // Mint
  '#5AC8FA', // Cyan
];

// Helper to create a new unique ID
const uid = () => `id_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

export function WorkoutBuilderModal({
  initialWorkout,
  onSave,
  onDelete,
  onClose,
}: WorkoutBuilderModalProps) {
  const [name, setName] = useState(initialWorkout?.name || 'My Custom Workout');
  const [color, setColor] = useState(initialWorkout?.color || ACCENT_COLORS[0]);
  const [prepareSeconds, setPrepareSeconds] = useState(initialWorkout?.prepareSeconds ?? 10);
  const [cycles, setCycles] = useState(initialWorkout?.cycles ?? 1);
  const [restBetweenCyclesSeconds, setRestBetweenCyclesSeconds] = useState(
    initialWorkout?.restBetweenCyclesSeconds ?? 30
  );
  const [cooldownSeconds, setCooldownSeconds] = useState(initialWorkout?.cooldownSeconds ?? 0);

  const [soundSettings, setSoundSettings] = useState<SoundSettings>(
    initialWorkout?.soundSettings || {
      countdownBeeps: true,
      voiceCues: true,
      soundType: 'bell',
      volume: 0.9,
      vibration: true,
    }
  );

  const [rounds, setRounds] = useState<WorkoutRound[]>(
    initialWorkout?.rounds || [
      {
        id: uid(),
        name: 'Round 1',
        intervals: [
          { id: uid(), name: 'WORK', type: 'work', durationSeconds: 30 },
          { id: uid(), name: 'REST', type: 'rest', durationSeconds: 15 },
        ],
        repeats: 5,
      },
    ]
  );

  // Time Dial Dialog State
  const [activePicker, setActivePicker] = useState<{
    title: string;
    seconds: number;
    onSelect: (sec: number) => void;
  } | null>(null);

  // Sound Settings Collapsible
  const [showSounds, setShowSounds] = useState(false);

  // Save Workout
  const handleSave = () => {
    if (!name.trim()) return;

    const workout: Workout = {
      id: initialWorkout?.id || `workout_${Date.now()}`,
      name: name.trim(),
      color,
      prepareSeconds,
      rounds,
      cycles: Math.max(1, cycles),
      restBetweenCyclesSeconds,
      cooldownSeconds,
      soundSettings,
      isDefault: false,
      createdAt: initialWorkout?.createdAt || Date.now(),
    };

    onSave(workout);
  };

  // Round Management
  const addRound = () => {
    const newRound: WorkoutRound = {
      id: uid(),
      name: `Round ${rounds.length + 1}`,
      intervals: [
        { id: uid(), name: 'WORK', type: 'work', durationSeconds: 30 },
        { id: uid(), name: 'REST', type: 'rest', durationSeconds: 15 },
      ],
      repeats: 4,
    };
    setRounds([...rounds, newRound]);
  };

  const removeRound = (roundId: string) => {
    if (rounds.length <= 1) return;
    setRounds(rounds.filter((r) => r.id !== roundId));
  };

  const addIntervalToRound = (roundId: string, type: 'work' | 'rest') => {
    setRounds(
      rounds.map((r) => {
        if (r.id !== roundId) return r;
        const newInterval: IntervalItem = {
          id: uid(),
          name: type === 'work' ? 'WORK' : 'REST',
          type,
          durationSeconds: type === 'work' ? 30 : 15,
        };
        return { ...r, intervals: [...r.intervals, newInterval] };
      })
    );
  };

  const removeIntervalFromRound = (roundId: string, intervalId: string) => {
    setRounds(
      rounds.map((r) => {
        if (r.id !== roundId) return r;
        if (r.intervals.length <= 1) return r;
        return {
          ...r,
          intervals: r.intervals.filter((i) => i.id !== intervalId),
        };
      })
    );
  };

  const updateInterval = (
    roundId: string,
    intervalId: string,
    updates: Partial<IntervalItem>
  ) => {
    setRounds(
      rounds.map((r) => {
        if (r.id !== roundId) return r;
        return {
          ...r,
          intervals: r.intervals.map((i) => (i.id === intervalId ? { ...i, ...updates } : i)),
        };
      })
    );
  };

  const updateRoundRepeats = (roundId: string, delta: number) => {
    setRounds(
      rounds.map((r) => {
        if (r.id !== roundId) return r;
        return { ...r, repeats: Math.max(1, Math.min(99, r.repeats + delta)) };
      })
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-lg h-[92vh] sm:h-[88vh] bg-neutral-900 border border-neutral-800 rounded-t-[32px] sm:rounded-[32px] flex flex-col overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <header className="safe-top px-5 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/90 z-10">
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-300 hover:text-white transition active:scale-95 cursor-pointer"
            aria-label="Cancel"
          >
            <X className="w-5 h-5" />
          </button>

          <h2 className="text-base font-black uppercase tracking-wider text-white">
            {initialWorkout ? 'Edit Workout' : 'New Workout'}
          </h2>

          <div className="flex items-center gap-2">
            {initialWorkout && onDelete && (
              <button
                type="button"
                onClick={() => {
                  const res = onDelete(initialWorkout.id);
                  if (res !== false) {
                    onClose();
                  }
                }}
                className="w-10 h-10 rounded-full bg-neutral-800 hover:bg-red-500/20 text-neutral-400 hover:text-red-400 flex items-center justify-center transition active:scale-95 cursor-pointer"
                title="Delete timer"
                aria-label="Delete timer"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}

            <button
              type="button"
              onClick={handleSave}
              className="w-10 h-10 rounded-full bg-green-500 hover:bg-green-400 flex items-center justify-center text-black shadow-lg shadow-green-500/30 transition active:scale-95 font-bold cursor-pointer"
              aria-label="Save Workout"
            >
              <Check className="w-5 h-5 stroke-[3]" />
            </button>
          </div>
        </header>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* NAME & ACCENT COLOR */}
          <div className="space-y-2">
            <label className="text-[10px] font-black tracking-widest uppercase text-neutral-400 px-1">
              NAME
            </label>
            <div className="flex items-center gap-2 p-1.5 bg-neutral-950 rounded-2xl border border-neutral-800 focus-within:border-neutral-600">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Tabata Workout"
                className="flex-1 bg-transparent px-3 py-2 text-white font-bold text-base focus:outline-none placeholder-neutral-600"
              />
              {/* Color Swatch Dot */}
              <div className="flex items-center gap-1.5 pr-2">
                {ACCENT_COLORS.slice(0, 4).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-6 h-6 rounded-full transition-all ${
                      color === c ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-neutral-900' : 'opacity-60 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* PREPARE COUNTDOWN */}
          <div
            onClick={() =>
              setActivePicker({
                title: 'PREPARE TIME',
                seconds: prepareSeconds,
                onSelect: (sec) => setPrepareSeconds(sec),
              })
            }
            className="p-3.5 bg-neutral-950 rounded-2xl border border-neutral-800 flex items-center justify-between cursor-pointer hover:border-neutral-700 active:scale-[0.99] transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                <AlertCircle className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-black uppercase text-white tracking-wide">
                  PREPARE
                </div>
                <div className="text-xs text-neutral-400">Countdown before you start</div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-lg font-black text-white tabular-nums">
              <span>{formatSecondsToMMSS(prepareSeconds)}</span>
              <ChevronRight className="w-4 h-4 text-neutral-500" />
            </div>
          </div>

          {/* ROUNDS LIST */}
          <div className="space-y-3">
            {rounds.map((round, rIdx) => (
              <div
                key={round.id}
                className="bg-neutral-950 rounded-2xl border border-neutral-800 p-3.5 space-y-3"
              >
                {/* Round Header */}
                <div className="flex items-center justify-between pb-2 border-b border-neutral-850">
                  <span className="text-xs font-black uppercase tracking-wider text-neutral-300">
                    {round.name || `ROUND ${rIdx + 1}`}
                  </span>
                  {rounds.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRound(round.id)}
                      className="text-neutral-500 hover:text-red-400 transition p-1"
                      title="Delete Round"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Intervals within round */}
                <div className="space-y-2">
                  {round.intervals.map((interval) => {
                    const isWork = interval.type === 'work';
                    const dotColor = isWork ? '#76E026' : '#FF3B30';

                    return (
                      <div
                        key={interval.id}
                        className="p-3 bg-neutral-900/90 rounded-xl border border-neutral-800 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: dotColor }}
                          />
                          <div>
                            <input
                              type="text"
                              value={interval.name}
                              onChange={(e) =>
                                updateInterval(round.id, interval.id, {
                                  name: e.target.value,
                                })
                              }
                              className="bg-transparent text-white font-black text-sm uppercase focus:outline-none w-28 sm:w-36 border-b border-transparent focus:border-neutral-600"
                            />
                            <div className="text-[11px] text-neutral-400">
                              {isWork ? 'Work interval' : 'Rest for this long'}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setActivePicker({
                                title: `${interval.name} DURATION`,
                                seconds: interval.durationSeconds,
                                onSelect: (sec) =>
                                  updateInterval(round.id, interval.id, {
                                    durationSeconds: sec,
                                  }),
                              })
                            }
                            className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-black text-sm tabular-nums flex items-center gap-1 active:scale-95"
                          >
                            <span>{formatSecondsToMMSS(interval.durationSeconds)}</span>
                            <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
                          </button>

                          {round.intervals.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeIntervalFromRound(round.id, interval.id)}
                              className="text-neutral-500 hover:text-red-400 p-1"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Add Interval to Round buttons */}
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => addIntervalToRound(round.id, 'work')}
                    className="flex-1 py-2 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-[11px] font-black uppercase text-green-400 flex items-center justify-center gap-1 active:scale-95 transition"
                  >
                    <Plus className="w-3.5 h-3.5" /> Work
                  </button>
                  <button
                    type="button"
                    onClick={() => addIntervalToRound(round.id, 'rest')}
                    className="flex-1 py-2 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-[11px] font-black uppercase text-red-400 flex items-center justify-center gap-1 active:scale-95 transition"
                  >
                    <Plus className="w-3.5 h-3.5" /> Rest
                  </button>
                </div>

                {/* Round Repeats Stepper */}
                <div className="flex items-center justify-between pt-2 border-t border-neutral-850">
                  <div className="flex items-center gap-2">
                    <RotateCw className="w-4 h-4 text-blue-400" />
                    <div>
                      <div className="text-xs font-black uppercase text-white">REPEATS</div>
                      <div className="text-[10px] text-neutral-400">
                        Repetitions of intervals in round
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateRoundRepeats(round.id, -1)}
                      className="w-7 h-7 rounded-lg bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-white active:scale-90 font-bold"
                    >
                      -
                    </button>
                    <span className="text-base font-black text-blue-400 tabular-nums w-6 text-center">
                      {round.repeats}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateRoundRepeats(round.id, 1)}
                      className="w-7 h-7 rounded-lg bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-white active:scale-90 font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* ADD ROUND BUTTON */}
            <button
              type="button"
              onClick={addRound}
              className="w-full py-3 rounded-2xl bg-neutral-950 border border-neutral-800 hover:border-neutral-700 text-xs font-black uppercase tracking-wider text-neutral-300 flex items-center justify-center gap-2 active:scale-95 transition"
            >
              <Plus className="w-4 h-4" /> Add Round
            </button>
          </div>

          {/* CYCLES & REST BETWEEN CYCLES */}
          <div className="bg-neutral-950 rounded-2xl border border-neutral-800 p-3.5 space-y-3">
            {/* Cycles Count */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <RotateCw className="w-4 h-4 text-amber-400" />
                <div>
                  <div className="text-xs font-black uppercase text-white">CYCLES</div>
                  <div className="text-[10px] text-neutral-400">
                    Number of repetitions of all rounds
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCycles(Math.max(1, cycles - 1))}
                  className="w-7 h-7 rounded-lg bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-white active:scale-90 font-bold"
                >
                  -
                </button>
                <span className="text-base font-black text-amber-400 tabular-nums w-6 text-center">
                  {cycles}
                </span>
                <button
                  type="button"
                  onClick={() => setCycles(Math.min(99, cycles + 1))}
                  className="w-7 h-7 rounded-lg bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-white active:scale-90 font-bold"
                >
                  +
                </button>
              </div>
            </div>

            {/* Rest Between Cycles */}
            {cycles > 1 && (
              <div
                onClick={() =>
                  setActivePicker({
                    title: 'REST BETWEEN CYCLES',
                    seconds: restBetweenCyclesSeconds,
                    onSelect: (sec) => setRestBetweenCyclesSeconds(sec),
                  })
                }
                className="flex items-center justify-between pt-2 border-t border-neutral-850 cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Pause className="w-4 h-4 text-blue-400" />
                  <div>
                    <div className="text-xs font-black uppercase text-white">
                      REST BETWEEN CYCLES
                    </div>
                    <div className="text-[10px] text-neutral-400">Recovery interval</div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-sm font-black text-white tabular-nums">
                  <span>{formatSecondsToMMSS(restBetweenCyclesSeconds)}</span>
                  <ChevronRight className="w-4 h-4 text-neutral-500" />
                </div>
              </div>
            )}
          </div>

          {/* COOLDOWN */}
          <div
            onClick={() =>
              setActivePicker({
                title: 'COOLDOWN TIME',
                seconds: cooldownSeconds,
                onSelect: (sec) => setCooldownSeconds(sec),
              })
            }
            className="p-3.5 bg-neutral-950 rounded-2xl border border-neutral-800 flex items-center justify-between cursor-pointer hover:border-neutral-700 active:scale-[0.99] transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
                <Snowflake className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-black uppercase text-white tracking-wide">
                  COOLDOWN
                </div>
                <div className="text-xs text-neutral-400">Cooldown after workout</div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-sm font-black text-white tabular-nums">
              <span>{formatSecondsToMMSS(cooldownSeconds)}</span>
              <ChevronRight className="w-4 h-4 text-neutral-500" />
            </div>
          </div>

          {/* SOUNDS & CUES SETTINGS */}
          <div className="bg-neutral-950 rounded-2xl border border-neutral-800 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowSounds(!showSounds)}
              className="w-full p-3.5 flex items-center justify-between text-left hover:bg-neutral-900/50 transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center font-bold">
                  <Volume2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-black uppercase text-white tracking-wide">
                    SOUNDS & VOICE
                  </div>
                  <div className="text-xs text-neutral-400">Audio cues, speech, vibration</div>
                </div>
              </div>
              {showSounds ? <ChevronUp className="w-5 h-5 text-neutral-400" /> : <ChevronDown className="w-5 h-5 text-neutral-400" />}
            </button>

            {showSounds && (
              <div className="p-4 pt-1 space-y-3 border-t border-neutral-850">
                {/* Sound Type */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-neutral-300">Tone Type</span>
                    <button
                      type="button"
                      onClick={() => {
                        unlockAudio();
                        testSound(soundSettings.soundType, soundSettings.volume || 0.9);
                      }}
                      className="px-2 py-0.5 rounded-md bg-neutral-800 hover:bg-neutral-700 text-[10px] font-bold text-green-400 active:scale-95 transition"
                      title="Play Preview Sound"
                    >
                      ▶ Test
                    </button>
                  </div>
                  <div className="flex bg-neutral-900 p-1 rounded-xl border border-neutral-800">
                    {(['bell', 'whistle', 'beep'] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => {
                          unlockAudio();
                          setSoundSettings({ ...soundSettings, soundType: type });
                          testSound(type, soundSettings.volume || 0.9);
                        }}
                        className={`px-3 py-1 rounded-lg text-xs font-black uppercase transition ${
                          soundSettings.soundType === type
                            ? 'bg-green-500 text-black shadow'
                            : 'text-neutral-400 hover:text-white'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Voice Coach Toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-neutral-300">Voice Coach</div>
                    <div className="text-[10px] text-neutral-400">Announces Work & Rest</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={soundSettings.voiceCues}
                    onChange={(e) =>
                      setSoundSettings({ ...soundSettings, voiceCues: e.target.checked })
                    }
                    className="w-5 h-5 accent-green-500 rounded cursor-pointer"
                  />
                </div>

                {/* Countdown Beeps Toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-neutral-300">3-2-1 Countdown Beeps</div>
                    <div className="text-[10px] text-neutral-400">High pitch alert before next set</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={soundSettings.countdownBeeps}
                    onChange={(e) =>
                      setSoundSettings({ ...soundSettings, countdownBeeps: e.target.checked })
                    }
                    className="w-5 h-5 accent-green-500 rounded cursor-pointer"
                  />
                </div>

                {/* Mobile Haptic Vibration Toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-neutral-300">Phone Vibration (Haptics)</div>
                    <div className="text-[10px] text-neutral-400">Vibrate phone on interval change</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={soundSettings.vibration}
                    onChange={(e) =>
                      setSoundSettings({ ...soundSettings, vibration: e.target.checked })
                    }
                    className="w-5 h-5 accent-green-500 rounded cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Bottom Save Action for easy thumb reach */}
        <footer className="safe-bottom p-4 border-t border-neutral-800 bg-neutral-900 space-y-2">
          <button
            type="button"
            onClick={handleSave}
            className="w-full py-4 bg-green-500 hover:bg-green-400 text-black font-black uppercase tracking-wider rounded-2xl shadow-xl shadow-green-500/20 active:scale-95 transition cursor-pointer"
          >
            Save Workout
          </button>

          {initialWorkout && onDelete && (
            <button
              type="button"
              onClick={() => {
                const res = onDelete(initialWorkout.id);
                if (res !== false) {
                  onClose();
                }
              }}
              className="w-full py-3 bg-neutral-950 hover:bg-red-500/10 border border-neutral-800 hover:border-red-500/30 text-neutral-400 hover:text-red-400 font-bold uppercase tracking-wider rounded-2xl transition active:scale-95 flex items-center justify-center gap-2 text-xs cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              Delete Timer
            </button>
          )}
        </footer>
      </div>

      {/* ========================================================
          TIME DIAL PICKER MODAL (Authentic Cylinder Wheel Picker)
         ======================================================== */}
      {activePicker && (
        <TimeDialModal
          title={activePicker.title}
          initialSeconds={activePicker.seconds}
          onSave={(sec) => {
            activePicker.onSelect(sec);
            setActivePicker(null);
          }}
          onClose={() => setActivePicker(null)}
        />
      )}
    </div>
  );
}

interface TimeDialModalProps {
  title: string;
  initialSeconds: number;
  onSave: (sec: number) => void;
  onClose: () => void;
}

function TimeDialModal({ title, initialSeconds, onSave, onClose }: TimeDialModalProps) {
  const [mins, setMins] = useState(Math.floor(initialSeconds / 60));
  const [secs, setSecs] = useState(initialSeconds % 60);

  const presets = [5, 10, 15, 20, 30, 45, 60, 90, 120, 180, 300];

  return (
    <div className="fixed inset-0 z-60 bg-black/90 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150 safe-area-all">
      <div className="w-full sm:max-w-sm bg-neutral-900 border border-neutral-800 rounded-t-[32px] sm:rounded-[32px] p-5 space-y-4 shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
          <span className="text-xs font-black uppercase tracking-wider text-neutral-400">
            {title}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cylinder / Dial Display */}
        <div className="flex items-center justify-center gap-6 py-4">
          {/* Minutes Column */}
          <div className="flex flex-col items-center">
            <button
              type="button"
              onClick={() => setMins(Math.min(59, mins + 1))}
              className="p-2 text-neutral-400 hover:text-white active:scale-90"
            >
              <ChevronUp className="w-6 h-6" />
            </button>
            <div className="w-20 h-20 rounded-2xl bg-neutral-950 border-2 border-neutral-700 flex flex-col items-center justify-center shadow-inner">
              <span className="text-3xl font-black text-white tabular-nums">
                {mins.toString().padStart(2, '0')}
              </span>
              <span className="text-[10px] font-black uppercase text-neutral-500">MIN</span>
            </div>
            <button
              type="button"
              onClick={() => setMins(Math.max(0, mins - 1))}
              className="p-2 text-neutral-400 hover:text-white active:scale-90"
            >
              <ChevronDown className="w-6 h-6" />
            </button>
          </div>

          <span className="text-3xl font-black text-neutral-600 mb-4">:</span>

          {/* Seconds Column */}
          <div className="flex flex-col items-center">
            <button
              type="button"
              onClick={() => setSecs(secs >= 55 ? 0 : secs + 5)}
              className="p-2 text-neutral-400 hover:text-white active:scale-90"
            >
              <ChevronUp className="w-6 h-6" />
            </button>
            <div className="w-20 h-20 rounded-2xl bg-neutral-950 border-2 border-neutral-700 flex flex-col items-center justify-center shadow-inner">
              <span className="text-3xl font-black text-white tabular-nums">
                {secs.toString().padStart(2, '0')}
              </span>
              <span className="text-[10px] font-black uppercase text-neutral-500">SEC</span>
            </div>
            <button
              type="button"
              onClick={() => setSecs(secs <= 0 ? 55 : secs - 5)}
              className="p-2 text-neutral-400 hover:text-white active:scale-90"
            >
              <ChevronDown className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-black uppercase tracking-wider text-neutral-500">
            QUICK PRESETS
          </span>
          <div className="grid grid-cols-4 gap-1.5">
            {presets.slice(0, 8).map((presetSec) => (
              <button
                key={presetSec}
                type="button"
                onClick={() => {
                  setMins(Math.floor(presetSec / 60));
                  setSecs(presetSec % 60);
                }}
                className={`py-1.5 rounded-xl text-xs font-bold transition active:scale-95 ${
                  mins * 60 + secs === presetSec
                    ? 'bg-green-500 text-black font-black'
                    : 'bg-neutral-950 hover:bg-neutral-800 text-neutral-300 border border-neutral-800'
                }`}
              >
                {presetSec < 60 ? `${presetSec}s` : `${presetSec / 60}m`}
              </button>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={() => onSave(mins * 60 + secs)}
          className="w-full py-3.5 bg-green-500 hover:bg-green-400 text-black font-black uppercase tracking-wider rounded-2xl shadow-xl shadow-green-500/20 active:scale-95 transition"
        >
          Set Duration
        </button>
      </div>
    </div>
  );
}
