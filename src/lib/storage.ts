import { Workout, WorkoutLog } from '@/types/workout';

export const DEFAULT_WORKOUTS: Workout[] = [
  {
    id: 'tabata-standard',
    name: 'Tabata Standard',
    color: '#FF9500', // Orange
    prepareSeconds: 10,
    rounds: [
      {
        id: 'r1',
        name: 'Tabata Round',
        intervals: [
          { id: 'i1', name: 'WORK', type: 'work', durationSeconds: 20 },
          { id: 'i2', name: 'REST', type: 'rest', durationSeconds: 10 },
        ],
        repeats: 8,
      },
    ],
    cycles: 1,
    restBetweenCyclesSeconds: 60,
    cooldownSeconds: 30,
    soundSettings: {
      countdownBeeps: true,
      voiceCues: true,
      soundType: 'bell',
      volume: 0.9,
      vibration: true,
    },
    isDefault: true,
    createdAt: 1700000000000,
  },
  {
    id: 'hiit-burner',
    name: 'HIIT Circuit 30/15',
    color: '#34C759', // Green
    prepareSeconds: 10,
    rounds: [
      {
        id: 'r1',
        name: 'Circuit',
        intervals: [
          { id: 'i1', name: 'WORK', type: 'work', durationSeconds: 30 },
          { id: 'i2', name: 'REST', type: 'rest', durationSeconds: 15 },
        ],
        repeats: 5,
      },
    ],
    cycles: 3,
    restBetweenCyclesSeconds: 60,
    cooldownSeconds: 45,
    soundSettings: {
      countdownBeeps: true,
      voiceCues: true,
      soundType: 'whistle',
      volume: 0.9,
      vibration: true,
    },
    isDefault: true,
    createdAt: 1700000000001,
  },
  {
    id: 'boxing-rounds',
    name: 'Boxing Championship',
    color: '#FF3B30', // Red
    prepareSeconds: 15,
    rounds: [
      {
        id: 'r1',
        name: 'Boxing Round',
        intervals: [
          { id: 'i1', name: 'ROUND', type: 'work', durationSeconds: 180 }, // 3 minutes
          { id: 'i2', name: 'CORNER REST', type: 'rest', durationSeconds: 60 }, // 1 minute
        ],
        repeats: 12,
      },
    ],
    cycles: 1,
    restBetweenCyclesSeconds: 0,
    cooldownSeconds: 60,
    soundSettings: {
      countdownBeeps: true,
      voiceCues: true,
      soundType: 'bell',
      volume: 1.0,
      vibration: true,
    },
    isDefault: true,
    createdAt: 1700000000002,
  },
  {
    id: 'scientific-7min',
    name: '7-Minute Scientific',
    color: '#AF52DE', // Purple
    prepareSeconds: 10,
    rounds: [
      {
        id: 'r1',
        name: 'High Intensity',
        intervals: [
          { id: 'i1', name: 'WORK', type: 'work', durationSeconds: 30 },
          { id: 'i2', name: 'REST', type: 'rest', durationSeconds: 10 },
        ],
        repeats: 12,
      },
    ],
    cycles: 1,
    restBetweenCyclesSeconds: 0,
    cooldownSeconds: 30,
    soundSettings: {
      countdownBeeps: true,
      voiceCues: true,
      soundType: 'beep',
      volume: 0.8,
      vibration: true,
    },
    isDefault: true,
    createdAt: 1700000000003,
  },
];

const STORAGE_KEY_WORKOUTS = 'opentimer_workouts_v1';
const LEGACY_STORAGE_KEY_WORKOUTS = 'timerplus_workouts_v1';
const STORAGE_KEY_LOGS = 'opentimer_logs_v1';
const LEGACY_STORAGE_KEY_LOGS = 'timerplus_logs_v1';

export function calculateTotalWorkoutSeconds(workout: Workout): number {
  let total = workout.prepareSeconds;
  let singleCycleSeconds = 0;

  for (const round of workout.rounds) {
    let roundIntervals = 0;
    for (const interval of round.intervals) {
      roundIntervals += interval.durationSeconds;
    }
    singleCycleSeconds += roundIntervals * Math.max(1, round.repeats);
  }

  total += singleCycleSeconds * Math.max(1, workout.cycles);
  if (workout.cycles > 1) {
    total += (workout.cycles - 1) * workout.restBetweenCyclesSeconds;
  }
  total += workout.cooldownSeconds;

  return total;
}

export function formatSecondsToMMSS(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function loadWorkouts(): Workout[] {
  if (typeof window === 'undefined') return DEFAULT_WORKOUTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_WORKOUTS) || localStorage.getItem(LEGACY_STORAGE_KEY_WORKOUTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_WORKOUTS, JSON.stringify(DEFAULT_WORKOUTS));
      return DEFAULT_WORKOUTS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return DEFAULT_WORKOUTS;
  } catch (e) {
    console.error('Failed to load workouts from localStorage', e);
    return DEFAULT_WORKOUTS;
  }
}

export function saveWorkouts(workouts: Workout[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_WORKOUTS, JSON.stringify(workouts));
  } catch (e) {
    console.error('Failed to save workouts to localStorage', e);
  }
}

export function saveSingleWorkout(workout: Workout): Workout[] {
  const current = loadWorkouts();
  const existingIdx = current.findIndex((w) => w.id === workout.id);
  let updated: Workout[];

  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = workout;
  } else {
    updated = [workout, ...current];
  }

  saveWorkouts(updated);
  return updated;
}

export function deleteWorkout(id: string): Workout[] {
  const current = loadWorkouts();
  const updated = current.filter((w) => w.id !== id);
  saveWorkouts(updated);
  return updated;
}

export function duplicateWorkout(workout: Workout): Workout {
  const copy: Workout = {
    ...JSON.parse(JSON.stringify(workout)),
    id: `workout_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name: `${workout.name} (Copy)`,
    isDefault: false,
    createdAt: Date.now(),
  };
  return copy;
}

// Workout Logs / Journal
export function loadWorkoutLogs(): WorkoutLog[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LOGS) || localStorage.getItem(LEGACY_STORAGE_KEY_LOGS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveWorkoutLog(log: WorkoutLog): void {
  if (typeof window === 'undefined') return;
  try {
    const current = loadWorkoutLogs();
    const updated = [log, ...current].slice(0, 100); // keep last 100
    localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save workout log', e);
  }
}

export function clearWorkoutLogs(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY_LOGS);
}

// Export / Import
export function exportWorkoutsAsJson(): string {
  const workouts = loadWorkouts();
  return JSON.stringify(workouts, null, 2);
}

export function importWorkoutsFromJson(jsonStr: string): Workout[] {
  const parsed = JSON.parse(jsonStr);
  if (!Array.isArray(parsed)) {
    throw new Error('Invalid format: expected array of workouts');
  }
  const current = loadWorkouts();
  const mergedMap = new Map<string, Workout>();
  current.forEach((w) => mergedMap.set(w.id, w));
  parsed.forEach((w) => {
    if (w.id && w.name && Array.isArray(w.rounds)) {
      mergedMap.set(w.id, w);
    }
  });
  const merged = Array.from(mergedMap.values());
  saveWorkouts(merged);
  return merged;
}

export function encodeWorkoutForUrl(workout: Workout): string {
  const json = JSON.stringify(workout);
  if (typeof window !== 'undefined') {
    return btoa(encodeURIComponent(json));
  }
  return Buffer.from(encodeURIComponent(json)).toString('base64');
}

export function decodeWorkoutFromUrl(encoded: string): Workout | null {
  try {
    const json = decodeURIComponent(atob(encoded));
    const parsed = JSON.parse(json);
    if (parsed && parsed.name && Array.isArray(parsed.rounds)) {
      return {
        ...parsed,
        id: `shared_${Date.now()}`,
        isDefault: false,
      };
    }
    return null;
  } catch {
    return null;
  }
}
