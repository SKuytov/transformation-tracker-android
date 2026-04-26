import type { FoodItem, PhaseKey } from './types';

// ---------------------------------------------------------------------------
// Built-in food library — identical to webapp/src/data/foods.ts
// ---------------------------------------------------------------------------
export const BUILTIN_FOODS: FoodItem[] = [
  { id: 'f-chicken-breast', name: 'Chicken breast (raw)', kcalPer100g: 165, proteinPer100g: 31, carbsPer100g: 0, fatPer100g: 3.6 },
  { id: 'f-white-rice', name: 'White rice (cooked)', kcalPer100g: 130, proteinPer100g: 2.7, carbsPer100g: 28, fatPer100g: 0.3 },
  { id: 'f-eggs', name: 'Eggs (whole)', kcalPer100g: 155, proteinPer100g: 13, carbsPer100g: 1.1, fatPer100g: 11 },
  { id: 'f-greek-yogurt', name: 'Greek yogurt 2%', kcalPer100g: 73, proteinPer100g: 10, carbsPer100g: 4, fatPer100g: 2 },
  { id: 'f-salmon', name: 'Salmon', kcalPer100g: 208, proteinPer100g: 20, carbsPer100g: 0, fatPer100g: 13 },
  { id: 'f-oats', name: 'Oats (dry)', kcalPer100g: 389, proteinPer100g: 17, carbsPer100g: 66, fatPer100g: 7 },
  { id: 'f-banana', name: 'Banana', kcalPer100g: 89, proteinPer100g: 1.1, carbsPer100g: 23, fatPer100g: 0.3 },
  { id: 'f-almonds', name: 'Almonds', kcalPer100g: 579, proteinPer100g: 21, carbsPer100g: 22, fatPer100g: 50 },
  { id: 'f-sweet-potato', name: 'Sweet potato', kcalPer100g: 86, proteinPer100g: 1.6, carbsPer100g: 20, fatPer100g: 0.1 },
  { id: 'f-cottage-cheese', name: 'Cottage cheese', kcalPer100g: 98, proteinPer100g: 11, carbsPer100g: 3.4, fatPer100g: 4.3 },
  { id: 'f-sirene', name: 'Sirene (Bulgarian white cheese)', kcalPer100g: 270, proteinPer100g: 17, carbsPer100g: 1, fatPer100g: 22 },
  { id: 'f-kiselo-mlyako', name: 'Kiselo mlyako 2%', kcalPer100g: 64, proteinPer100g: 4.8, carbsPer100g: 5, fatPer100g: 2 },
  { id: 'f-tuna', name: 'Tuna in water', kcalPer100g: 116, proteinPer100g: 26, carbsPer100g: 0, fatPer100g: 1 },
  { id: 'f-broccoli', name: 'Broccoli', kcalPer100g: 34, proteinPer100g: 2.8, carbsPer100g: 7, fatPer100g: 0.4 },
  { id: 'f-ground-beef', name: 'Lean ground beef', kcalPer100g: 200, proteinPer100g: 26, carbsPer100g: 0, fatPer100g: 11 },
  { id: 'f-quinoa', name: 'Quinoa (cooked)', kcalPer100g: 120, proteinPer100g: 4.4, carbsPer100g: 21, fatPer100g: 1.9 },
  { id: 'f-lentils', name: 'Lentils (cooked)', kcalPer100g: 116, proteinPer100g: 9, carbsPer100g: 20, fatPer100g: 0.4 },
  { id: 'f-whey', name: 'Whey protein', kcalPer100g: 380, proteinPer100g: 80, carbsPer100g: 8, fatPer100g: 5 },
  { id: 'f-olive-oil', name: 'Olive oil', kcalPer100g: 884, proteinPer100g: 0, carbsPer100g: 0, fatPer100g: 100 },
  { id: 'f-apple', name: 'Apple', kcalPer100g: 52, proteinPer100g: 0.3, carbsPer100g: 14, fatPer100g: 0.2 },
  { id: 'f-spinach', name: 'Spinach', kcalPer100g: 23, proteinPer100g: 2.9, carbsPer100g: 3.6, fatPer100g: 0.4 },
  { id: 'f-potato', name: 'Potato', kcalPer100g: 77, proteinPer100g: 2, carbsPer100g: 17, fatPer100g: 0.1 },
  { id: 'f-bread', name: 'Bread (whole grain)', kcalPer100g: 247, proteinPer100g: 13, carbsPer100g: 41, fatPer100g: 4.2 },
  { id: 'f-tomato', name: 'Tomato', kcalPer100g: 18, proteinPer100g: 0.9, carbsPer100g: 3.9, fatPer100g: 0.2 },
  { id: 'f-cucumber', name: 'Cucumber', kcalPer100g: 16, proteinPer100g: 0.7, carbsPer100g: 3.6, fatPer100g: 0.1 },
  { id: 'f-pork-loin', name: 'Pork loin', kcalPer100g: 143, proteinPer100g: 21, carbsPer100g: 0, fatPer100g: 6 },
  { id: 'f-turkey-breast', name: 'Turkey breast', kcalPer100g: 135, proteinPer100g: 30, carbsPer100g: 0, fatPer100g: 1 },
  { id: 'f-peanut-butter', name: 'Peanut butter', kcalPer100g: 588, proteinPer100g: 25, carbsPer100g: 20, fatPer100g: 50 },
  { id: 'f-honey', name: 'Honey', kcalPer100g: 304, proteinPer100g: 0.3, carbsPer100g: 82, fatPer100g: 0 },
  { id: 'f-coffee', name: 'Coffee (black)', kcalPer100g: 2, proteinPer100g: 0.3, carbsPer100g: 0, fatPer100g: 0 },
];

// ---------------------------------------------------------------------------
// 5 Phases — identical to webapp/src/data/program.ts
// ---------------------------------------------------------------------------
export interface Phase {
  key: PhaseKey;
  name: string;
  weeksLabel: string;
  weekStart: number;
  weekEnd: number;
  weightTarget: string;
  why: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  steps: number;
  splitName: string;
  cardio: string;
  notes?: string;
}

export const PHASES: Phase[] = [
  {
    key: 'foundation',
    name: 'Foundation',
    weeksLabel: 'Weeks 1–8',
    weekStart: 1,
    weekEnd: 8,
    weightTarget: '130 → ~120 kg',
    why: 'Build adherence, learn movement patterns, repair sleep/stress, drop initial water weight.',
    kcal: 2400,
    protein: 200,
    carbs: 240,
    fat: 75,
    steps: 8000,
    splitName: 'Full Body A/B/C + Home Cardio + Mobility',
    cardio: '2 × 30 min Zone 2 (HR 115–135)',
  },
  {
    key: 'acceleration',
    name: 'Acceleration',
    weeksLabel: 'Weeks 9–16',
    weekStart: 9,
    weekEnd: 16,
    weightTarget: '120 → 112 kg',
    why: 'Body has adapted; lifts feel lighter; ramp the deficit.',
    kcal: 2200,
    protein: 200,
    carbs: 200,
    fat: 70,
    steps: 10000,
    splitName: 'Upper / Lower / Push / Pull / Home-Cardio',
    cardio: '2 × Zone 2 + 1 × HIIT (8 × 30s/30s)',
    notes: 'Diet break: Week 12 (eat at 2,800 kcal — recover)',
  },
  {
    key: 'grind',
    name: 'Grind',
    weeksLabel: 'Weeks 17–28',
    weekStart: 17,
    weekEnd: 28,
    weightTarget: '112 → 100 kg (double digits!)',
    why: 'This is where most people quit. The system carries you.',
    kcal: 2100,
    protein: 190,
    carbs: 190,
    fat: 65,
    steps: 10000,
    splitName: 'Push / Pull / Legs / Upper / Lower (hypertrophy bias)',
    cardio: '10k steps + 2 × 60min weekend walks',
    notes: 'Diet breaks: Weeks 20, 26. Saturday refeed (+100g carbs).',
  },
  {
    key: 'reveal',
    name: 'Reveal',
    weeksLabel: 'Weeks 29–40',
    weekStart: 29,
    weekEnd: 40,
    weightTarget: '100 → 88 kg',
    why: 'The vanity phase. Abs start showing around 92–95 kg. Body recomp is real here.',
    kcal: 2000,
    protein: 190,
    carbs: 175,
    fat: 60,
    steps: 12000,
    splitName: 'PPL × 2 split (or keep 5-day)',
    cardio: '2 × 20 min HIIT on lower-volume days',
    notes: 'Diet breaks: Weeks 32, 38. Refeed Saturdays at 2,400.',
  },
  {
    key: 'final-cut',
    name: 'Final Cut',
    weeksLabel: 'Weeks 41–52',
    weekStart: 41,
    weekEnd: 52,
    weightTarget: '88 → 80 kg',
    why: 'Bringing it home. Highest discipline, highest payoff.',
    kcal: 1950,
    protein: 185,
    carbs: 165,
    fat: 55,
    steps: 12000,
    splitName: 'Maintain strength. No new junk volume.',
    cardio: '12k steps + 3 × 45min Zone 2',
    notes: 'Diet break: Week 46. Last 2 weeks: optional sodium/water management.',
  },
];

export function phaseForWeek(week: number): Phase {
  if (week < 1) return PHASES[0];
  for (const p of PHASES) {
    if (week >= p.weekStart && week <= p.weekEnd) return p;
  }
  return PHASES[PHASES.length - 1];
}

// ---------------------------------------------------------------------------
// 7-day Workout Templates — identical to webapp/src/data/program.ts
// ---------------------------------------------------------------------------
export interface ExerciseTemplate {
  id: string;
  name: string;
  sets: number;
  reps: string;
  notes?: string;
}

export interface WorkoutTemplate {
  id: string;
  dayOfWeek: number; // 1=Mon ... 7=Sun
  shortDay: string;
  name: string;
  type: 'gym' | 'home' | 'rest' | 'prep';
  exercises: ExerciseTemplate[];
}

export const WORKOUT_TEMPLATES: WorkoutTemplate[] = [
  {
    id: 'mon-gym-a',
    dayOfWeek: 1,
    shortDay: 'Mon',
    name: 'Gym A — Full Body / Push',
    type: 'gym',
    exercises: [
      { id: 'bench-press', name: 'Bench Press', sets: 4, reps: '6-8' },
      { id: 'squat', name: 'Back Squat', sets: 4, reps: '6-8' },
      { id: 'bent-over-row', name: 'Bent-Over Row', sets: 4, reps: '6-8' },
      { id: 'overhead-press', name: 'Overhead Press', sets: 3, reps: '8-10' },
      { id: 'pull-up', name: 'Pull-up', sets: 3, reps: 'AMRAP' },
      { id: 'plank', name: 'Plank', sets: 3, reps: '60s' },
    ],
  },
  {
    id: 'tue-home-cardio',
    dayOfWeek: 2,
    shortDay: 'Tue',
    name: 'Home — Zone 2 Cardio + Core',
    type: 'home',
    exercises: [
      { id: 'zone2-cardio', name: 'Zone 2 Cardio (HR 115–135)', sets: 1, reps: '30 min' },
      { id: 'hanging-leg-raise', name: 'Hanging Leg Raise', sets: 3, reps: '12' },
      { id: 'russian-twist', name: 'Russian Twist', sets: 3, reps: '20' },
      { id: 'plank', name: 'Plank', sets: 3, reps: '60s' },
    ],
  },
  {
    id: 'wed-gym-b',
    dayOfWeek: 3,
    shortDay: 'Wed',
    name: 'Gym B — Pull / Lower',
    type: 'gym',
    exercises: [
      { id: 'deadlift', name: 'Deadlift', sets: 3, reps: '5' },
      { id: 'lat-pulldown', name: 'Lat Pulldown', sets: 4, reps: '8-10' },
      { id: 'romanian-deadlift', name: 'Romanian Deadlift', sets: 4, reps: '8-10' },
      { id: 'cable-row', name: 'Cable Row', sets: 3, reps: '10-12' },
      { id: 'face-pull', name: 'Face Pull', sets: 3, reps: '15' },
      { id: 'bicep-curl', name: 'Bicep Curl', sets: 3, reps: '12' },
    ],
  },
  {
    id: 'thu-home-hiit',
    dayOfWeek: 4,
    shortDay: 'Thu',
    name: 'Home — Mobility + HIIT',
    type: 'home',
    exercises: [
      { id: 'mobility-flow', name: 'Mobility Flow', sets: 1, reps: '5 min' },
      { id: 'hiit-burpees', name: 'HIIT — Burpees / Mountain Climbers', sets: 8, reps: '30s on / 30s off' },
      { id: 'cool-down', name: 'Cool Down', sets: 1, reps: '5 min' },
    ],
  },
  {
    id: 'fri-gym-c',
    dayOfWeek: 5,
    shortDay: 'Fri',
    name: 'Gym C — Legs / Upper',
    type: 'gym',
    exercises: [
      { id: 'front-squat', name: 'Front Squat', sets: 4, reps: '6-8' },
      { id: 'incline-db-press', name: 'Incline DB Press', sets: 4, reps: '8-10' },
      { id: 'leg-press', name: 'Leg Press', sets: 3, reps: '10-12' },
      { id: 'lateral-raise', name: 'Lateral Raise', sets: 3, reps: '12-15' },
      { id: 'tricep-pushdown', name: 'Tricep Pushdown', sets: 3, reps: '12' },
      { id: 'hanging-leg-raise', name: 'Hanging Leg Raise', sets: 3, reps: '10' },
    ],
  },
  {
    id: 'sat-rest',
    dayOfWeek: 6,
    shortDay: 'Sat',
    name: 'Active Rest — Refeed Day',
    type: 'rest',
    exercises: [
      { id: 'walk', name: 'Outdoor Walk (optional)', sets: 1, reps: '60 min' },
    ],
  },
  {
    id: 'sun-prep',
    dayOfWeek: 7,
    shortDay: 'Sun',
    name: 'Meal Prep + Long Walk',
    type: 'prep',
    exercises: [
      { id: 'meal-prep', name: 'Meal Prep', sets: 1, reps: '2 hours' },
      { id: 'long-walk', name: 'Long Walk', sets: 1, reps: '60 min' },
    ],
  },
];

export function templateForDate(date: Date): WorkoutTemplate {
  const js = date.getDay(); // 0..6
  const iso = js === 0 ? 7 : js; // 1=Mon...7=Sun
  return WORKOUT_TEMPLATES.find((t) => t.dayOfWeek === iso) ?? WORKOUT_TEMPLATES[0];
}
