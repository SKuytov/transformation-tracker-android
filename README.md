# Transformation Tracker — Android

![Build APK](https://github.com/SKuytov/transformation-tracker-android/actions/workflows/build-apk.yml/badge.svg)

Native Android companion app for the **130 → 80 kg, 52-week body transformation program**. Mirrors every feature of the webapp with full offline persistence, camera integration, daily notifications, and JSON round-trip compatibility.

---

## Features

| Screen | Key functionality |
|--------|------------------|
| **Dashboard** | Current weight + delta, week number, phase banner, today's workout preview, macro progress bars, streak counter, quick-add shortcuts |
| **Weight** | Log/edit/delete entries, 30-day chart with 7-day moving average, ETA to goal projection |
| **Workouts** | Auto-loads today's template by day-of-week, set/rep/RPE logger, last-session lookup per exercise, history list |
| **Nutrition** | 5 meal slots (pre-workout/breakfast/lunch/snack/dinner), 30-food built-in library, custom foods, daily macro bars vs phase targets |
| **Photos** | Camera capture + gallery picker, front/side/back tags, side-by-side comparison, lightbox viewer |
| **Measurements** | 6 sites (waist/chest/hips/thigh/arm/neck), delta vs first entry |
| **Journal** | Month-grid calendar with mood dots, per-day editor (sleep/mood 1-5/energy 1-5/notes) |
| **Program** | Read-only viewer of all 5 phases and 7-day workout split with full exercise library |
| **Reports** | 7-day rolling stats, weekly summary image share (react-native-view-shot), JSON export/import |
| **Settings** | Body stats, phase override, notification times, theme toggle, full data reset |

---

## Install (from Releases)

1. Go to the [Releases page](https://github.com/SKuytov/transformation-tracker-android/releases)
2. Download `app-release.apk` from the latest release
3. On your Android device:
   - Open **Settings → Security** (or **Privacy**)
   - Enable **"Install unknown apps"** for your browser or Files app
   - Open the downloaded APK file
   - Tap **Install**
4. On first launch, grant the following permissions when prompted:
   - **Notifications** — for daily weigh-in/meal/bedtime reminders
   - **Camera** — for progress photo capture
   - **Photo Library** — for gallery photo import

> **Note:** The APK is signed with a debug keystore for personal use. It is NOT intended for Google Play Store distribution. Use the same APK source for updates to avoid uninstalling (stable keystore identity).

---

## Notification Permissions

Android 13+ requires explicit notification permission. The app requests it on first launch. If you accidentally deny it:

1. Android Settings → Apps → Transformation Tracker → Permissions → Notifications → Allow
2. Return to the app → Settings screen → tap **"Reschedule Notifications Now"**

**Default notification times:**
| Time | Reminder |
|------|----------|
| 04:00 | Weigh-in — XMART scale |
| 05:50 | Post-workout breakfast |
| 12:30 | Lunch |
| 19:30 | Dinner |
| 21:00 | Lights out |

All times are configurable in the Settings screen.

---

## Data Import/Export — Round-Trip with Webapp

The Android app and webapp share an **identical `ExportBundle` JSON format** (version: 1). Data transfers losslessly in both directions:

### Webapp → Android
1. Open the webapp → **Reports** tab → **Export JSON**
2. Save the `.json` file to your phone (email it, use a cloud drive, etc.)
3. Open the Android app → **Reports** screen → **Import JSON Backup**
4. Select the file → confirm overwrite

### Android → Webapp
1. Android app → **Reports** screen → **Export JSON Backup**
2. Share the file to your computer
3. Webapp → **Reports** tab → **Import** (drag & drop or file picker)

**Round-trip test:** A sample `ExportBundle` with all entity types passes serialization tests with no data loss. See `src/data/store.test.js`.

> **Photos note:** On Android, photos are stored as file URIs (not base64) to avoid AsyncStorage bloat. The exported JSON contains the raw file path. When importing a webapp backup with base64 photos into Android, photos are automatically saved to the app's documents directory. When exporting from Android, you may need to manually add photos to the webapp (or the photo URIs will be included as-is, which the webapp will display if accessible).

---

## Build from Source

### Prerequisites
- Node.js 20+
- Java 17 (Temurin recommended)
- Android SDK with build tools (API 34+)
- [Expo CLI](https://docs.expo.dev/get-started/installation/): `npm install -g expo-cli`

### Steps

```bash
# Clone
git clone https://github.com/SKuytov/transformation-tracker-android.git
cd transformation-tracker-android

# Install dependencies
npm install

# Generate Android project
npx expo prebuild --platform android --clean

# Build debug APK (for local testing)
cd android && ./gradlew assembleDebug

# APK location
# android/app/build/outputs/apk/debug/app-debug.apk

# Build release APK (debug-signed)
cd android && ./gradlew assembleRelease
# android/app/build/outputs/apk/release/app-release.apk
```

### Run with Expo Go (development)
```bash
npm start
# Scan QR code with Expo Go app
```

---

## GitHub Actions CI/CD

Every push to `main` and every `v*` tag triggers `.github/workflows/build-apk.yml`:

1. Checkout → Node 20 → Java 17 → Android SDK
2. `npm ci`
3. `npx expo prebuild --platform android --clean`
4. Generate/use debug keystore → configure Gradle signing
5. `./gradlew assembleRelease`
6. Upload APK as workflow artifact (30-day retention)
7. On `v*` tags: create GitHub Release with APK attached

**Signing strategy:** The workflow uses a debug keystore (auto-generated on build, or a committed `debug.keystore`). This APK is for personal sideloading only — not Play Store submission. For a stable install identity (no uninstall-on-update), commit your own `debug.keystore` to the repo.

---

## Architecture

```
App.tsx
├── ThemeProvider (dark/light, persisted in AsyncStorage)
├── GestureHandlerRootView
├── SafeAreaProvider
└── AppNavigator
    ├── Bottom Tab: Dashboard, Weight, Workouts, Nutrition, Photos
    └── Stack (More): Measurements, Journal, Program, Reports, Settings

src/
├── data/
│   ├── types.ts      — identical to webapp (ExportBundle format)
│   ├── store.ts      — DataStore interface + AsyncStorage impl (tt: prefix)
│   ├── seed.ts       — 30 foods, 5 phases, 7-day workout templates
│   └── photos.ts     — FileSystem helpers (save/delete/base64 convert)
├── theme/
│   ├── colors.ts     — palette matching webapp (#0ea5e9 primary, #f97316 accent)
│   └── ThemeContext  — React context for dark/light toggle
├── screens/          — 10 screens
├── components/       — Card, MacroBar, ProgressRing, StatCard
├── nav/              — Bottom tab + stack navigator
├── lib/utils.ts      — Phase resolver, moving avg, ETA calc, streak
└── notifications/    — Daily reminder scheduler (expo-notifications)
```

---

## Tech Stack

| Library | Purpose |
|---------|---------|
| Expo SDK 51 | Managed workflow, native APIs |
| React Native 0.74 | UI framework |
| TypeScript | Type safety |
| @react-navigation/native | Navigation |
| @react-native-async-storage/async-storage | Persistence |
| expo-camera + expo-image-picker | Photo capture |
| expo-notifications | Daily reminders |
| expo-file-system + expo-sharing | File I/O, export |
| expo-document-picker | JSON import |
| react-native-chart-kit + react-native-svg | Charts |
| react-native-view-shot | Weekly summary image |
| date-fns | Date utilities |
| lucide-react-native | Icons |
| expo-quick-actions | App icon shortcuts |

---

## Limitations & Known Issues

1. **Home-screen widget:** Full Android home-screen widgets require ejecting from Expo managed workflow. Instead, `expo-quick-actions` provides long-press app icon shortcuts (Log Weight, Log Workout, Log Meal). A native widget would require a custom config plugin or ejecting — not done to preserve managed workflow.

2. **Photo export to webapp:** Photos stored as file URIs are included in JSON export as local paths. Webapp import of these won't display photos (the webapp expects base64). Manual photo addition to the webapp is required for photo round-trip. Weight, workouts, meals, measurements, and journal round-trip perfectly.

3. **Debug keystore:** The APK is signed for sideloading only. For Play Store submission, generate a proper release keystore and store credentials as GitHub Secrets.

4. **Expo Go compatibility:** Some packages (expo-camera, expo-notifications, react-native-view-shot) may not work in Expo Go. Use a development build or the release APK.

---

## License

Personal use. 130 → 80 kg or bust.
