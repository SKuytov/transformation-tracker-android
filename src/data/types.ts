// Domain types — shared between the data layer and the UI.

export type ID = string;

export type PhaseKey = 'foundation' | 'acceleration' | 'grind' | 'reveal' | 'final-cut';

export interface WeightEntry {
  id: ID;
  date: string; // YYYY-MM-DD
  weightKg: number;
  bodyFatPct?: number;
  waistCm?: number;
  notes?: string;
}

export interface SetEntry {
  weight: number; // kg
  reps: number;
  rpe?: number; // 1-10
}

export interface ExerciseLog {
  exerciseId: string; // matches program library exercise id
  name: string;
  targetSets: number;
  targetReps: string; // e.g. "6-8" or "AMRAP" or "60s"
  sets: SetEntry[];
}

export interface WorkoutLog {
  id: ID;
  date: string; // YYYY-MM-DD
  templateId: string; // e.g. 'p1-mon-gym-a'
  templateName: string;
  exercises: ExerciseLog[];
  startedAt: string; // ISO
  completedAt?: string; // ISO
  totalVolumeKg: number;
}

export interface FoodItem {
  id: ID;
  name: string;
  kcalPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  custom?: boolean;
}

export type MealSlot = 'pre-workout' | 'breakfast' | 'lunch' | 'snack' | 'dinner';

export interface MealEntry {
  foodId: ID;
  foodName: string;
  grams: number;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface DayMeals {
  date: string; // YYYY-MM-DD
  meals: Record<MealSlot, MealEntry[]>;
}

export type PhotoTag = 'front' | 'side' | 'back';

export interface ProgressPhoto {
  id: ID;
  date: string; // YYYY-MM-DD
  tag: PhotoTag;
  dataUrl: string; // base64 (webapp compat) OR file URI (android — prefixed with file://)
  sizeKb: number;
}

export interface MeasurementEntry {
  id: ID;
  date: string;
  waistCm?: number;
  chestCm?: number;
  hipsCm?: number;
  thighCm?: number;
  armCm?: number;
  neckCm?: number;
}

export interface JournalEntry {
  date: string; // YYYY-MM-DD — primary key
  sleepHours?: number;
  mood?: number; // 1-5
  energy?: number; // 1-5
  notes?: string;
}

export interface UserSettings {
  startWeightKg: number;
  goalWeightKg: number;
  startDate: string; // YYYY-MM-DD
  heightCm: number;
  age: number;
  sex: 'male' | 'female';
  phaseOverride?: PhaseKey | null;
  notifications: {
    weighInTime: string; // HH:mm
    workoutTime: string; // HH:mm
    mealReminders: boolean;
  };
  theme: 'dark' | 'light';
}

export interface ExportBundle {
  version: 1;
  exportedAt: string;
  settings: UserSettings;
  weightEntries: WeightEntry[];
  workoutLogs: WorkoutLog[];
  meals: DayMeals[];
  customFoods: FoodItem[];
  photos: ProgressPhoto[];
  measurements: MeasurementEntry[];
  journal: JournalEntry[];
}
