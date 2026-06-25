# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Expo SDK Version

This project uses **Expo SDK 54** (downgraded from 56 for Expo Go compatibility). Always read docs at https://docs.expo.dev/versions/v54.0.0/ before writing any code — do NOT use SDK 56 docs or assume SDK 56 APIs.

## Commands

```bash
npm start              # Start Metro bundler (scan QR with Expo Go)
npm run web            # Start web version (opens in browser at localhost:8081)
npm run android        # Open on Android emulator
npm install --legacy-peer-deps   # Install packages (required flag due to peer dep conflicts)
npx expo install <pkg> --fix     # Add a new Expo-compatible package and auto-fix versions
```

There are no tests. TypeScript is the only static check — run `npx tsc --noEmit` to typecheck.

## Architecture

**Entry point:** `index.ts` → `App.tsx`

`App.tsx` checks AsyncStorage on launch: if `profile.onboardingDone` is false, renders `OnboardingScreen`; otherwise renders the bottom tab navigator with 5 tabs.

### Data layer — `utils/storage.ts`

Single source of truth for all persistence. Everything goes through AsyncStorage with these key namespaces:

| Key pattern | Data |
|-------------|------|
| `profile_v1` | `UserProfile` (name, age, goals, onboardingDone) |
| `habits_def_v1` | `HabitDef[]` (which habits exist and which are enabled) |
| `day_<YYYY-MM-DD>` | `string[]` of completed habit IDs for that date |
| `breathing_sessions_v1` | `BreathingSession[]` (technique, duration, date) |
| `diary_v1` | `DiaryEntry[]` |

`DEFAULT_HABITS` lives in `storage.ts` and is used when no saved habits exist. Streak is calculated by walking backwards day-by-day until a day with 0 completions is found.

### Screens

- **OnboardingScreen** — 2-step wizard (feature explanation → profile form). Calls `saveProfile` then invokes the `onComplete` prop to signal `App.tsx` to switch to main nav.
- **HabitsScreen** — loads habits + today's completions on mount. Streak badge top-right. Reward overlay animates in when a habit is checked (not unchecked). Week dots show last 7 days' completion ratio. "Manage Habits" opens a Modal with Switch toggles + custom habit input.
- **CalendarScreen** — builds a month grid from scratch (no calendar library). Loads all days of the viewed month in parallel via `Promise.all`. Tapping a day fetches that day's completions and shows them below the grid.
- **BreathingScreen** — technique selector → start triggers a full-screen `Modal` that covers the tab bar. Session duration is tracked and saved via `addBreathingSession` when the user ends the session (only if >5s elapsed).
- **StatsScreen** — aggregates `getWeekStats`, `getBreathingSessions`, `calculateStreak` on mount. Inline diary: entries are listed with mood emoji; new/edit entry uses a second `Modal` with mood picker + `TextInput`.
- **ProfileScreen** — displays profile info, streak, total breathing sessions. Edit mode toggles inline form. "Reset All Data" calls `AsyncStorage.clear()`.

### Navigation

React Navigation v7 bottom tabs. Tab icons use `@expo/vector-icons` Ionicons. Tab bar hidden during breathing session via the breathing `Modal` overlay (not via navigation options).

### Styling conventions

- Background: `#0f0f1a`, cards: `#1a1a2e`, borders: `#2a2a4e`
- Accent purple: `#6c63ff`, teal success: `#4ecdc4`, streak orange: `#f39c12`
- All styles are `StyleSheet.create` at the bottom of each file (no shared style file)
- No external UI library — all components are built from RN primitives + Ionicons

### Writing files on Windows

PowerShell 5.1 writes UTF-8 with BOM by default, which breaks Expo's JSON parser. Always use:
```powershell
[System.IO.File]::WriteAllText($path, $content, (New-Object System.Text.UTF8Encoding($false)))
```