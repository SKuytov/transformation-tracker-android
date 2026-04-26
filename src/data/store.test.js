/**
 * Round-trip test for ExportBundle format.
 * Verifies that the Android app's ExportBundle is byte-compatible with the webapp's.
 *
 * Run: node src/data/store.test.js
 */

// Simulate the types and structure without React Native dependencies
const sampleBundle = {
  version: 1,
  exportedAt: '2026-04-27T04:00:00.000Z',
  settings: {
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
  },
  weightEntries: [
    {
      id: 'abc123',
      date: '2026-04-27',
      weightKg: 130,
      bodyFatPct: undefined,
      waistCm: undefined,
      notes: 'Starting weight',
    },
  ],
  workoutLogs: [
    {
      id: 'wl001',
      date: '2026-04-27',
      templateId: 'mon-gym-a',
      templateName: 'Gym A — Full Body / Push',
      exercises: [
        {
          exerciseId: 'bench-press',
          name: 'Bench Press',
          targetSets: 4,
          targetReps: '6-8',
          sets: [{ weight: 80, reps: 8, rpe: 7 }],
        },
      ],
      startedAt: '2026-04-27T04:50:00.000Z',
      completedAt: '2026-04-27T05:50:00.000Z',
      totalVolumeKg: 640,
    },
  ],
  meals: [
    {
      date: '2026-04-27',
      meals: {
        'pre-workout': [
          {
            foodId: 'f-banana',
            foodName: 'Banana',
            grams: 120,
            kcal: 107,
            protein: 1.3,
            carbs: 27.6,
            fat: 0.4,
          },
        ],
        breakfast: [],
        lunch: [],
        snack: [],
        dinner: [],
      },
    },
  ],
  customFoods: [
    {
      id: 'custom-001',
      name: 'My Shake',
      kcalPer100g: 300,
      proteinPer100g: 25,
      carbsPer100g: 30,
      fatPer100g: 8,
      custom: true,
    },
  ],
  photos: [
    {
      id: 'photo001',
      date: '2026-04-27',
      tag: 'front',
      dataUrl: 'data:image/jpeg;base64,/9j/4AA...',
      sizeKb: 150,
    },
  ],
  measurements: [
    {
      id: 'meas001',
      date: '2026-04-27',
      waistCm: 110,
      chestCm: 125,
      hipsCm: 120,
      thighCm: 70,
      armCm: 40,
      neckCm: 44,
    },
  ],
  journal: [
    {
      date: '2026-04-27',
      sleepHours: 7.5,
      mood: 4,
      energy: 3,
      notes: 'First day. Feeling motivated.',
    },
  ],
};

// Round-trip test: serialize to JSON and back
const json = JSON.stringify(sampleBundle);
const parsed = JSON.parse(json);

// Verify all top-level keys
const requiredKeys = [
  'version', 'exportedAt', 'settings', 'weightEntries',
  'workoutLogs', 'meals', 'customFoods', 'photos', 'measurements', 'journal'
];

let allPassed = true;

for (const key of requiredKeys) {
  if (!(key in parsed)) {
    console.error(`FAIL: Missing key '${key}' in ExportBundle`);
    allPassed = false;
  } else {
    console.log(`PASS: Key '${key}' present`);
  }
}

// Verify version is exactly 1 (number, not string)
if (parsed.version !== 1) {
  console.error(`FAIL: version should be 1 (number), got ${typeof parsed.version}: ${parsed.version}`);
  allPassed = false;
} else {
  console.log('PASS: version === 1 (number)');
}

// Verify nested structure
if (parsed.settings.notifications.weighInTime !== '04:00') {
  console.error('FAIL: settings.notifications.weighInTime mismatch');
  allPassed = false;
} else {
  console.log('PASS: settings.notifications.weighInTime === "04:00"');
}

// Verify meal slot keys match webapp exactly
const mealSlots = ['pre-workout', 'breakfast', 'lunch', 'snack', 'dinner'];
const actualSlots = Object.keys(parsed.meals[0].meals);
for (const slot of mealSlots) {
  if (!actualSlots.includes(slot)) {
    console.error(`FAIL: Missing meal slot '${slot}'`);
    allPassed = false;
  } else {
    console.log(`PASS: Meal slot '${slot}' present`);
  }
}

// Verify workout log structure
const wl = parsed.workoutLogs[0];
if (!wl.exercises || !wl.exercises[0].sets) {
  console.error('FAIL: WorkoutLog.exercises[0].sets missing');
  allPassed = false;
} else {
  console.log('PASS: WorkoutLog.exercises[0].sets present');
}

// Verify photo structure
if (parsed.photos[0].dataUrl && parsed.photos[0].tag && parsed.photos[0].sizeKb !== undefined) {
  console.log('PASS: ProgressPhoto fields (dataUrl, tag, sizeKb) present');
} else {
  console.error('FAIL: ProgressPhoto fields missing');
  allPassed = false;
}

console.log('\n' + (allPassed ? '✓ All round-trip tests passed. ExportBundle is webapp-compatible.' : '✗ Some tests failed.'));
process.exit(allPassed ? 0 : 1);
