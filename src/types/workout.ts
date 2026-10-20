export type IntervalType = 'prepare' | 'work' | 'rest' | 'cycle_rest' | 'cooldown';

export interface IntervalItem {
  id: string;
  name: string;
  type: 'work' | 'rest' | 'custom';
  durationSeconds: number;
  color?: string; // Hex color override
}

export interface WorkoutRound {
  id: string;
  name: string;
  intervals: IntervalItem[];
  repeats: number; // How many times this round repeats
}

export interface SoundSettings {
  countdownBeeps: boolean; // 3-2-1 countdown beeps
  voiceCues: boolean;      // Speaks "Work", "Rest", etc.
  soundType: 'bell' | 'beep' | 'whistle';
  volume: number;          // 0 to 1
  vibration: boolean;      // Haptic feedback on mobile
}

export interface Workout {
  id: string;
  name: string;
  color: string;           // Accent color (orange, green, purple, blue, etc.)
  prepareSeconds: number;  // Countdown before starting (e.g. 10s)
  rounds: WorkoutRound[];
  cycles: number;          // Number of cycles through all rounds
  restBetweenCyclesSeconds: number; // Rest between cycle repetitions
  cooldownSeconds: number; // Wind down period after workout
  soundSettings: SoundSettings;
  isDefault?: boolean;
  createdAt: number;
}

export interface FlattenedStep {
  stepIndex: number;
  type: IntervalType;
  title: string;
  subtitle: string;
  durationSeconds: number;
  roundIndex: number;
  totalRounds: number;
  repeatIndex: number;
  totalRepeats: number;
  cycleIndex: number;
  totalCycles: number;
  color: string;
  isWork: boolean;
}

export interface WorkoutLog {
  id: string;
  workoutId: string;
  workoutName: string;
  completedAt: number;
  totalDurationSeconds: number;
  cyclesCompleted: number;
  roundsCompleted: number;
}
