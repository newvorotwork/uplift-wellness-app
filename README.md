# Uplift — Daily Wellness App

A React Native / Expo wellness app for tracking daily habits, breathing exercises, and personal growth.

## Features

- **Habit Tracker** — Check off daily habits, manage your list, add custom habits
- **Win Streaks** — 🔥 Streak counter that tracks consecutive days of habit completion
- **Reward Animation** — Celebration popup every time you complete a habit
- **Habit Calendar** — Monthly calendar showing your habit history day by day
- **Breathing Exercises** — Box Breathing, 4-7-8, and Calm Breath with full-screen guided sessions
- **Stats Dashboard** — Weekly bar chart, breathing session count, and streak overview
- **Daily Journal** — Write entries with mood tracking (Great / Good / Okay / Bad)
- **Profile** — Personal info, goals, and app settings
- **Onboarding** — Two-screen intro explaining the app and collecting your profile

## Tech Stack

- [Expo SDK 54](https://docs.expo.dev/versions/v54.0.0/)
- React Native 0.81 + React 19.1
- React Navigation v7 (bottom tabs)
- AsyncStorage for local persistence
- TypeScript (strict mode)
- `@expo/vector-icons` Ionicons

## Getting Started

```bash
npm install --legacy-peer-deps
npm start          # Scan QR with Expo Go
npm run web        # Open in browser
```

> Requires Expo Go 54.x on your phone. Web requires `react-dom` and `react-native-web` (already in dependencies).

## Project Structure

```
App.tsx                  # Root — onboarding check + tab navigator
utils/storage.ts         # All AsyncStorage logic and data types
screens/
  OnboardingScreen.tsx   # 2-step setup wizard
  HabitsScreen.tsx       # Daily habits + streak + reward animation
  CalendarScreen.tsx     # Monthly habit history calendar
  BreathingScreen.tsx    # Guided breathing with full-screen session modal
  StatsScreen.tsx        # Weekly stats + journal/diary
  ProfileScreen.tsx      # Profile editing + settings
```

## Screenshots

| Habits | Breathe | Stats |
|--------|---------|-------|
| Daily habit list with streak badge and week dots | Full-screen breathing session with phase countdown | Weekly bar chart and journal entries |