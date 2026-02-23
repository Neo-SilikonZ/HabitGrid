export type HabitStatus = 'done' | 'failed' | 'none';

export interface Habit {
  id: string;
  name: string;
  targetTime: number; // in minutes
  color?: string;
}

export interface HabitEntry {
  habitId: string;
  date: string; // ISO string (YYYY-MM-DD)
  status: HabitStatus;
  timeSpent: number; // in minutes
  notes?: string;
}

export interface AppState {
  habits: Habit[];
  entries: HabitEntry[];
}
