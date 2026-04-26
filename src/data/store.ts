/**
 * Data Store — AsyncStorage implementation.
 *
 * Identical DataStore interface as webapp/src/data/store.ts.
 * Uses the same `tt:` key prefix for cross-platform clarity.
 *
 * The ExportBundle format is byte-identical to the webapp's, enabling
 * lossless round-trip: export on Android → import on webapp, and vice versa.
 *
 * NOTE: Photos are stored as file URIs (file://...) on Android, not base64.
 * During export, the export helper converts URIs to base64 for full compat.
 * During import, base64 photos are saved to FileSystem and URIs stored.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  DayMeals,
  ExportBundle,
  FoodItem,
  JournalEntry,
  MealEntry,
  MealSlot,
  MeasurementEntry,
  ProgressPhoto,
  UserSettings,
  WeightEntry,
  WorkoutLog,
} from './types';

export interface DataStore {
  // settings
  getSettings(): Promise<UserSettings>;
  updateSettings(patch: Partial<UserSettings>): Promise<UserSettings>;

  // weight
  getWeightEntries(): Promise<WeightEntry[]>;
  addWeightEntry(entry: WeightEntry): Promise<void>;
  updateWeightEntry(id: string, patch: Partial<WeightEntry>): Promise<void>;
  deleteWeightEntry(id: string): Promise<void>;

  // workouts
  getWorkoutLogs(): Promise<WorkoutLog[]>;
  saveWorkoutLog(log: WorkoutLog): Promise<void>;
  deleteWorkoutLog(id: string): Promise<void>;

  // nutrition
  getDayMeals(date: string): Promise<DayMeals | null>;
  setDayMeals(meals: DayMeals): Promise<void>;
  addMealEntry(date: string, slot: MealSlot, entry: MealEntry): Promise<void>;
  removeMealEntry(date: string, slot: MealSlot, index: number): Promise<void>;
  getAllMeals(): Promise<DayMeals[]>;

  // foods
  getCustomFoods(): Promise<FoodItem[]>;
  addCustomFood(food: FoodItem): Promise<void>;
  deleteCustomFood(id: string): Promise<void>;

  // photos
  getPhotos(): Promise<ProgressPhoto[]>;
  addPhoto(photo: ProgressPhoto): Promise<void>;
  deletePhoto(id: string): Promise<void>;

  // measurements
  getMeasurements(): Promise<MeasurementEntry[]>;
  addMeasurement(entry: MeasurementEntry): Promise<void>;
  deleteMeasurement(id: string): Promise<void>;

  // journal
  getJournal(date: string): Promise<JournalEntry | null>;
  setJournal(entry: JournalEntry): Promise<void>;
  getAllJournal(): Promise<JournalEntry[]>;

  // bulk
  exportAll(): Promise<ExportBundle>;
  importAll(bundle: ExportBundle): Promise<void>;
  resetAll(): Promise<void>;
}

// Storage keys — same tt: prefix as webapp for clarity
const KEYS = {
  settings: 'tt:settings',
  weight: 'tt:weight',
  workouts: 'tt:workouts',
  meals: 'tt:meals', // map<date, DayMeals>
  customFoods: 'tt:customFoods',
  photos: 'tt:photos',
  measurements: 'tt:measurements',
  journal: 'tt:journal', // map<date, JournalEntry>
} as const;

async function readAsync<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeAsync(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Failed to persist', key, e);
    throw e;
  }
}

export const DEFAULT_SETTINGS: UserSettings = {
  startWeightKg: 130,
  goalWeightKg: 80,
  startDate: '2026-04-27',
  heightCm: 185,
  age: 35,
  sex: 'male',
  phaseOverride: null,
  notifications: {
    weighInTime: '04:00',
    workoutTime: '04:50',
    mealReminders: true,
  },
  theme: 'dark',
};

class AsyncStorageStore implements DataStore {
  // settings
  async getSettings(): Promise<UserSettings> {
    const stored = await readAsync<Partial<UserSettings>>(KEYS.settings, {});
    return {
      ...DEFAULT_SETTINGS,
      ...stored,
      notifications: {
        ...DEFAULT_SETTINGS.notifications,
        ...(stored.notifications ?? {}),
      },
    } as UserSettings;
  }

  async updateSettings(patch: Partial<UserSettings>): Promise<UserSettings> {
    const current = await this.getSettings();
    const merged: UserSettings = {
      ...current,
      ...patch,
      notifications: {
        ...current.notifications,
        ...(patch.notifications ?? {}),
      },
    };
    await writeAsync(KEYS.settings, merged);
    return merged;
  }

  // weight
  async getWeightEntries(): Promise<WeightEntry[]> {
    const arr = await readAsync<WeightEntry[]>(KEYS.weight, []);
    return [...arr].sort((a, b) => a.date.localeCompare(b.date));
  }

  async addWeightEntry(entry: WeightEntry): Promise<void> {
    const arr = await readAsync<WeightEntry[]>(KEYS.weight, []);
    arr.push(entry);
    await writeAsync(KEYS.weight, arr);
  }

  async updateWeightEntry(id: string, patch: Partial<WeightEntry>): Promise<void> {
    const arr = await readAsync<WeightEntry[]>(KEYS.weight, []);
    const i = arr.findIndex((e) => e.id === id);
    if (i >= 0) {
      arr[i] = { ...arr[i], ...patch };
      await writeAsync(KEYS.weight, arr);
    }
  }

  async deleteWeightEntry(id: string): Promise<void> {
    const arr = (await readAsync<WeightEntry[]>(KEYS.weight, [])).filter((e) => e.id !== id);
    await writeAsync(KEYS.weight, arr);
  }

  // workouts
  async getWorkoutLogs(): Promise<WorkoutLog[]> {
    const arr = await readAsync<WorkoutLog[]>(KEYS.workouts, []);
    return [...arr].sort((a, b) => b.date.localeCompare(a.date));
  }

  async saveWorkoutLog(log: WorkoutLog): Promise<void> {
    const arr = await readAsync<WorkoutLog[]>(KEYS.workouts, []);
    const i = arr.findIndex((w) => w.id === log.id);
    if (i >= 0) arr[i] = log;
    else arr.push(log);
    await writeAsync(KEYS.workouts, arr);
  }

  async deleteWorkoutLog(id: string): Promise<void> {
    const arr = (await readAsync<WorkoutLog[]>(KEYS.workouts, [])).filter((w) => w.id !== id);
    await writeAsync(KEYS.workouts, arr);
  }

  // nutrition
  async getDayMeals(date: string): Promise<DayMeals | null> {
    const map = await readAsync<Record<string, DayMeals>>(KEYS.meals, {});
    return map[date] ?? null;
  }

  async setDayMeals(meals: DayMeals): Promise<void> {
    const map = await readAsync<Record<string, DayMeals>>(KEYS.meals, {});
    map[meals.date] = meals;
    await writeAsync(KEYS.meals, map);
  }

  async addMealEntry(date: string, slot: MealSlot, entry: MealEntry): Promise<void> {
    const map = await readAsync<Record<string, DayMeals>>(KEYS.meals, {});
    const day: DayMeals = map[date] ?? {
      date,
      meals: { 'pre-workout': [], breakfast: [], lunch: [], snack: [], dinner: [] },
    };
    day.meals[slot] = [...(day.meals[slot] ?? []), entry];
    map[date] = day;
    await writeAsync(KEYS.meals, map);
  }

  async removeMealEntry(date: string, slot: MealSlot, index: number): Promise<void> {
    const map = await readAsync<Record<string, DayMeals>>(KEYS.meals, {});
    const day = map[date];
    if (!day) return;
    day.meals[slot] = (day.meals[slot] ?? []).filter((_, i) => i !== index);
    map[date] = day;
    await writeAsync(KEYS.meals, map);
  }

  async getAllMeals(): Promise<DayMeals[]> {
    const map = await readAsync<Record<string, DayMeals>>(KEYS.meals, {});
    return Object.values(map);
  }

  // foods
  async getCustomFoods(): Promise<FoodItem[]> {
    return readAsync<FoodItem[]>(KEYS.customFoods, []);
  }

  async addCustomFood(food: FoodItem): Promise<void> {
    const arr = await readAsync<FoodItem[]>(KEYS.customFoods, []);
    arr.push(food);
    await writeAsync(KEYS.customFoods, arr);
  }

  async deleteCustomFood(id: string): Promise<void> {
    const arr = (await readAsync<FoodItem[]>(KEYS.customFoods, [])).filter((f) => f.id !== id);
    await writeAsync(KEYS.customFoods, arr);
  }

  // photos
  async getPhotos(): Promise<ProgressPhoto[]> {
    const arr = await readAsync<ProgressPhoto[]>(KEYS.photos, []);
    return [...arr].sort((a, b) => b.date.localeCompare(a.date));
  }

  async addPhoto(photo: ProgressPhoto): Promise<void> {
    const arr = await readAsync<ProgressPhoto[]>(KEYS.photos, []);
    arr.push(photo);
    await writeAsync(KEYS.photos, arr);
  }

  async deletePhoto(id: string): Promise<void> {
    const arr = (await readAsync<ProgressPhoto[]>(KEYS.photos, [])).filter((p) => p.id !== id);
    await writeAsync(KEYS.photos, arr);
  }

  // measurements
  async getMeasurements(): Promise<MeasurementEntry[]> {
    const arr = await readAsync<MeasurementEntry[]>(KEYS.measurements, []);
    return [...arr].sort((a, b) => a.date.localeCompare(b.date));
  }

  async addMeasurement(entry: MeasurementEntry): Promise<void> {
    const arr = await readAsync<MeasurementEntry[]>(KEYS.measurements, []);
    arr.push(entry);
    await writeAsync(KEYS.measurements, arr);
  }

  async deleteMeasurement(id: string): Promise<void> {
    const arr = (await readAsync<MeasurementEntry[]>(KEYS.measurements, [])).filter(
      (m) => m.id !== id
    );
    await writeAsync(KEYS.measurements, arr);
  }

  // journal
  async getJournal(date: string): Promise<JournalEntry | null> {
    const map = await readAsync<Record<string, JournalEntry>>(KEYS.journal, {});
    return map[date] ?? null;
  }

  async setJournal(entry: JournalEntry): Promise<void> {
    const map = await readAsync<Record<string, JournalEntry>>(KEYS.journal, {});
    map[entry.date] = entry;
    await writeAsync(KEYS.journal, map);
  }

  async getAllJournal(): Promise<JournalEntry[]> {
    const map = await readAsync<Record<string, JournalEntry>>(KEYS.journal, {});
    return Object.values(map);
  }

  // bulk
  async exportAll(): Promise<ExportBundle> {
    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      settings: await this.getSettings(),
      weightEntries: await this.getWeightEntries(),
      workoutLogs: await this.getWorkoutLogs(),
      meals: await this.getAllMeals(),
      customFoods: await this.getCustomFoods(),
      photos: await this.getPhotos(),
      measurements: await this.getMeasurements(),
      journal: await this.getAllJournal(),
    };
  }

  async importAll(bundle: ExportBundle): Promise<void> {
    if (!bundle || bundle.version !== 1) throw new Error('Invalid backup file');
    await writeAsync(KEYS.settings, bundle.settings);
    await writeAsync(KEYS.weight, bundle.weightEntries);
    await writeAsync(KEYS.workouts, bundle.workoutLogs);
    const mealMap: Record<string, DayMeals> = {};
    for (const m of bundle.meals) mealMap[m.date] = m;
    await writeAsync(KEYS.meals, mealMap);
    await writeAsync(KEYS.customFoods, bundle.customFoods);
    await writeAsync(KEYS.photos, bundle.photos);
    await writeAsync(KEYS.measurements, bundle.measurements);
    const jMap: Record<string, JournalEntry> = {};
    for (const j of bundle.journal) jMap[j.date] = j;
    await writeAsync(KEYS.journal, jMap);
  }

  async resetAll(): Promise<void> {
    await AsyncStorage.multiRemove(Object.values(KEYS));
  }
}

export const store: DataStore = new AsyncStorageStore();

// Helpers ------------------------------------------------------------------

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

/** Seed first-run data so charts and dashboards render meaningfully. */
export async function initSeedData(): Promise<void> {
  try {
    const existing = await AsyncStorage.getItem(KEYS.weight);
    if (!existing || existing === '[]') {
      const seedEntry: WeightEntry = {
        id: uid(),
        date: DEFAULT_SETTINGS.startDate,
        weightKg: DEFAULT_SETTINGS.startWeightKg,
        notes: 'Starting weight',
      };
      await AsyncStorage.setItem(KEYS.weight, JSON.stringify([seedEntry]));
    }
    const existingSettings = await AsyncStorage.getItem(KEYS.settings);
    if (!existingSettings) {
      await AsyncStorage.setItem(KEYS.settings, JSON.stringify(DEFAULT_SETTINGS));
    }
  } catch (e) {
    console.warn('seed init failed', e);
  }
}
