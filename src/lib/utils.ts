import { format, differenceInDays, differenceInWeeks, addDays } from 'date-fns';
import { PHASES, Phase } from '../data/seed';
import type { WeightEntry, UserSettings } from '../data/types';

/** Format YYYY-MM-DD for today */
export function todayStr(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

/** Week number since start date (1-indexed) */
export function currentWeek(startDate: string): number {
  const start = new Date(startDate);
  const now = new Date();
  return differenceInWeeks(now, start) + 1;
}

/** Get current phase based on settings */
export function getCurrentPhase(settings: UserSettings): Phase {
  if (settings.phaseOverride) {
    return PHASES.find((p) => p.key === settings.phaseOverride) ?? PHASES[0];
  }
  const week = currentWeek(settings.startDate);
  if (week < 1) return PHASES[0];
  for (const p of PHASES) {
    if (week >= p.weekStart && week <= p.weekEnd) return p;
  }
  return PHASES[PHASES.length - 1];
}

/** 7-day moving average for weight entries */
export function movingAverage(entries: WeightEntry[], days = 7): Array<{ date: string; avg: number }> {
  if (entries.length === 0) return [];
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  return sorted.map((entry, i) => {
    const slice = sorted.slice(Math.max(0, i - days + 1), i + 1);
    const avg = slice.reduce((sum, e) => sum + e.weightKg, 0) / slice.length;
    return { date: entry.date, avg: Math.round(avg * 10) / 10 };
  });
}

/** ETA to goal weight based on current trend */
export function etaToGoal(
  entries: WeightEntry[],
  goalKg: number
): string {
  if (entries.length < 2) return 'Need more data';
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const last = sorted[sorted.length - 1];
  const first = sorted[0];
  const daysDiff = differenceInDays(new Date(last.date), new Date(first.date));
  if (daysDiff === 0) return 'Need more data';
  const kgPerDay = (first.weightKg - last.weightKg) / daysDiff;
  if (kgPerDay <= 0) return 'Trend going wrong direction';
  const remaining = last.weightKg - goalKg;
  if (remaining <= 0) return 'Goal reached!';
  const daysToGoal = Math.ceil(remaining / kgPerDay);
  const eta = addDays(new Date(), daysToGoal);
  return format(eta, 'MMM d, yyyy');
}

/** Format kg delta with sign */
export function fmtDelta(delta: number): string {
  return `${delta >= 0 ? '+' : ''}${delta.toFixed(1)} kg`;
}

/** Clamp a number between min and max */
export function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max);
}

/** Calculate macros from grams and food */
export function calcMacros(
  kcalPer100g: number,
  proteinPer100g: number,
  carbsPer100g: number,
  fatPer100g: number,
  grams: number
) {
  const factor = grams / 100;
  return {
    kcal: Math.round(kcalPer100g * factor),
    protein: Math.round(proteinPer100g * factor * 10) / 10,
    carbs: Math.round(carbsPer100g * factor * 10) / 10,
    fat: Math.round(fatPer100g * factor * 10) / 10,
  };
}

/** Day of week label */
export const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Format date to display string */
export function fmtDate(dateStr: string): string {
  return format(new Date(dateStr), 'EEE, MMM d');
}

/** Calculate streak (consecutive days with at least one entry) */
export function calcStreak(dates: string[]): number {
  if (dates.length === 0) return 0;
  const sorted = [...new Set(dates)].sort((a, b) => b.localeCompare(a));
  let streak = 0;
  const today = todayStr();
  let check = today;
  for (const d of sorted) {
    if (d === check) {
      streak++;
      const prev = new Date(check);
      prev.setDate(prev.getDate() - 1);
      check = format(prev, 'yyyy-MM-dd');
    } else {
      break;
    }
  }
  return streak;
}
