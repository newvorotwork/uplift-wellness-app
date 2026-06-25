import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserProfile {
  name: string;
  age: string;
  goals: string;
  onboardingDone: boolean;
}

export interface HabitDef {
  id: string;
  name: string;
  icon: string;
  color: string;
  enabled: boolean;
}

export interface BreathingSession {
  id: string;
  date: string;
  technique: string;
  durationSecs: number;
}

export type Mood = 'great' | 'good' | 'okay' | 'bad';

export interface DiaryEntry {
  id: string;
  date: string;
  text: string;
  mood: Mood;
}

export const DEFAULT_HABITS: HabitDef[] = [
  { id: '1', name: 'Morning Meditation', icon: 'flower-outline', color: '#9b59b6', enabled: true },
  { id: '2', name: 'Exercise 30 min', icon: 'barbell-outline', color: '#e74c3c', enabled: true },
  { id: '3', name: 'Drink 8 glasses', icon: 'water-outline', color: '#3498db', enabled: true },
  { id: '4', name: 'Read 20 pages', icon: 'book-outline', color: '#2ecc71', enabled: true },
  { id: '5', name: 'No screens before bed', icon: 'moon-outline', color: '#f39c12', enabled: true },
  { id: '6', name: 'Breathing exercise', icon: 'leaf-outline', color: '#1abc9c', enabled: true },
  { id: '7', name: 'Journaling', icon: 'pencil-outline', color: '#e67e22', enabled: false },
  { id: '8', name: 'Cold shower', icon: 'snow-outline', color: '#2980b9', enabled: false },
  { id: '9', name: 'Gratitude practice', icon: 'heart-outline', color: '#e91e63', enabled: false },
  { id: '10', name: 'Healthy eating', icon: 'restaurant-outline', color: '#27ae60', enabled: false },
];

const KEYS = {
  PROFILE: 'profile_v1',
  HABITS: 'habits_def_v1',
  DIARY: 'diary_v1',
  BREATHING: 'breathing_sessions_v1',
};

export const getDayKey = (date: Date): string => date.toISOString().split('T')[0];
export const getTodayKey = (): string => getDayKey(new Date());

export const getDayCompletion = async (dateKey: string): Promise<string[]> => {
  try { const v = await AsyncStorage.getItem(`day_${dateKey}`); return v ? JSON.parse(v) : []; }
  catch { return []; }
};

export const setDayCompletion = async (dateKey: string, ids: string[]): Promise<void> => {
  try { await AsyncStorage.setItem(`day_${dateKey}`, JSON.stringify(ids)); } catch {}
};

export const getProfile = async (): Promise<UserProfile | null> => {
  try { const v = await AsyncStorage.getItem(KEYS.PROFILE); return v ? JSON.parse(v) : null; }
  catch { return null; }
};

export const saveProfile = async (profile: UserProfile): Promise<void> => {
  try { await AsyncStorage.setItem(KEYS.PROFILE, JSON.stringify(profile)); } catch {}
};

export const getHabits = async (): Promise<HabitDef[]> => {
  try { const v = await AsyncStorage.getItem(KEYS.HABITS); return v ? JSON.parse(v) : DEFAULT_HABITS; }
  catch { return DEFAULT_HABITS; }
};

export const saveHabits = async (habits: HabitDef[]): Promise<void> => {
  try { await AsyncStorage.setItem(KEYS.HABITS, JSON.stringify(habits)); } catch {}
};

export const addBreathingSession = async (technique: string, durationSecs: number): Promise<void> => {
  try {
    const v = await AsyncStorage.getItem(KEYS.BREATHING);
    const sessions: BreathingSession[] = v ? JSON.parse(v) : [];
    sessions.unshift({ id: Date.now().toString(), date: getTodayKey(), technique, durationSecs });
    await AsyncStorage.setItem(KEYS.BREATHING, JSON.stringify(sessions.slice(0, 500)));
  } catch {}
};

export const getBreathingSessions = async (): Promise<BreathingSession[]> => {
  try { const v = await AsyncStorage.getItem(KEYS.BREATHING); return v ? JSON.parse(v) : []; }
  catch { return []; }
};

export const getDiaryEntries = async (): Promise<DiaryEntry[]> => {
  try { const v = await AsyncStorage.getItem(KEYS.DIARY); return v ? JSON.parse(v) : []; }
  catch { return []; }
};

export const saveDiaryEntry = async (entry: DiaryEntry): Promise<void> => {
  try {
    const entries = await getDiaryEntries();
    const idx = entries.findIndex((e) => e.id === entry.id);
    if (idx >= 0) entries[idx] = entry; else entries.unshift(entry);
    await AsyncStorage.setItem(KEYS.DIARY, JSON.stringify(entries));
  } catch {}
};

export const deleteDiaryEntry = async (id: string): Promise<void> => {
  try {
    const entries = await getDiaryEntries();
    await AsyncStorage.setItem(KEYS.DIARY, JSON.stringify(entries.filter((e) => e.id !== id)));
  } catch {}
};

export const calculateStreak = async (): Promise<number> => {
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const completed = await getDayCompletion(getDayKey(d));
    if (completed.length > 0) { streak++; }
    else if (i > 0) { break; }
  }
  return streak;
};

export const getWeekStats = async (): Promise<Array<{ date: string; count: number; total: number }>> => {
  const habits = await getHabits();
  const total = habits.filter((h) => h.enabled).length;
  const today = new Date();
  const result = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = getDayKey(d);
    const completed = await getDayCompletion(key);
    result.push({ date: key, count: completed.length, total });
  }
  return result;
};