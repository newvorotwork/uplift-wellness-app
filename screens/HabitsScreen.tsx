import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, SafeAreaView, Modal, Switch, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  getHabits, saveHabits, getDayCompletion, setDayCompletion,
  getTodayKey, calculateStreak, getWeekStats, HabitDef, DEFAULT_HABITS,
} from '../utils/storage';

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function WeekDots({ stats }: { stats: Array<{ date: string; count: number; total: number }> }) {
  const today = new Date().getDay();
  return (
    <View style={dot.row}>
      {stats.map((s, i) => {
        const ratio = s.total > 0 ? s.count / s.total : 0;
        const isToday = i === 6;
        const color = ratio === 0 ? '#2a2a4e' : ratio >= 1 ? '#4ecdc4' : '#6c63ff';
        return (
          <View key={i} style={dot.item}>
            <View style={[dot.circle, { backgroundColor: color, opacity: ratio === 0 ? 0.4 : 1 }]}>
              {ratio >= 1 && <Ionicons name="checkmark" size={10} color="#fff" />}
            </View>
            <Text style={[dot.label, isToday && dot.labelToday]}>{DAYS[(today - 6 + i + 7) % 7]}</Text>
          </View>
        );
      })}
    </View>
  );
}

const dot = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  item: { alignItems: 'center', gap: 4 },
  circle: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  label: { fontSize: 10, color: '#555588', fontWeight: '600' },
  labelToday: { color: '#6c63ff' },
});

function RewardOverlay({ visible, streak }: { visible: boolean; streak: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (visible) {
      anim.setValue(0);
      Animated.spring(anim, { toValue: 1, useNativeDriver: true, tension: 80, friction: 7 }).start();
    }
  }, [visible]);
  if (!visible) return null;
  return (
    <View style={rwd.overlay} pointerEvents="none">
      <Animated.View style={[rwd.card, {
        opacity: anim,
        transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) }],
      }]}>
        <Text style={rwd.emoji}>🎉</Text>
        <Text style={rwd.title}>Habit Done!</Text>
        {streak > 1 && <Text style={rwd.streak}>🔥 {streak} day streak!</Text>}
      </Animated.View>
    </View>
  );
}

const rwd = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', zIndex: 99 },
  card: {
    backgroundColor: '#1e1e38', borderRadius: 24, paddingVertical: 28, paddingHorizontal: 40,
    alignItems: 'center', borderWidth: 1, borderColor: '#6c63ff44',
    shadowColor: '#6c63ff', shadowOpacity: 0.3, shadowRadius: 20, elevation: 10,
  },
  emoji: { fontSize: 44, marginBottom: 8 },
  title: { color: '#fff', fontSize: 20, fontWeight: '800' },
  streak: { color: '#f39c12', fontSize: 15, fontWeight: '700', marginTop: 6 },
});

export default function HabitsScreen() {
  const [habits, setHabits] = useState<HabitDef[]>([]);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [streak, setStreak] = useState(0);
  const [weekStats, setWeekStats] = useState<Array<{ date: string; count: number; total: number }>>([]);
  const [showManager, setShowManager] = useState(false);
  const [showReward, setShowReward] = useState(false);
  const [draftHabits, setDraftHabits] = useState<HabitDef[]>([]);
  const [newHabitName, setNewHabitName] = useState('');
  const progressAnim = useRef(new Animated.Value(0)).current;
  const rewardTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const enabledHabits = habits.filter((h) => h.enabled);

  const load = useCallback(async () => {
    const [h, c, s, w] = await Promise.all([
      getHabits(), getDayCompletion(getTodayKey()), calculateStreak(), getWeekStats(),
    ]);
    setHabits(h);
    setCompleted(new Set(c));
    setStreak(s);
    setWeekStats(w);
  }, []);

  useEffect(() => { load(); }, []);

  useEffect(() => {
    Animated.spring(progressAnim, {
      toValue: enabledHabits.length > 0 ? completed.size / enabledHabits.length : 0,
      useNativeDriver: false,
    }).start();
  }, [completed.size, enabledHabits.length]);

  const toggleHabit = async (id: string) => {
    const next = new Set(completed);
    const wasCompleted = next.has(id);
    if (wasCompleted) { next.delete(id); } else {
      next.add(id);
      if (rewardTimer.current) clearTimeout(rewardTimer.current);
      setShowReward(true);
      rewardTimer.current = setTimeout(() => setShowReward(false), 1600);
    }
    setCompleted(next);
    await setDayCompletion(getTodayKey(), [...next]);
    const s = await calculateStreak();
    setStreak(s);
    const w = await getWeekStats();
    setWeekStats(w);
  };

  const openManager = () => { setDraftHabits([...habits]); setNewHabitName(''); setShowManager(true); };

  const saveManager = async () => {
    await saveHabits(draftHabits);
    setHabits(draftHabits);
    setShowManager(false);
    const w = await getWeekStats();
    setWeekStats(w);
  };

  const addCustomHabit = () => {
    const trimmed = newHabitName.trim();
    if (!trimmed) return;
    const colors = ['#9b59b6', '#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#1abc9c', '#e67e22'];
    const newH: HabitDef = {
      id: Date.now().toString(), name: trimmed, icon: 'star-outline',
      color: colors[draftHabits.length % colors.length], enabled: true,
    };
    setDraftHabits([...draftHabits, newH]);
    setNewHabitName('');
  };

  const allDone = enabledHabits.length > 0 && completed.size >= enabledHabits.length;

  return (
    <SafeAreaView style={styles.container}>
      <RewardOverlay visible={showReward} streak={streak} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Today's Habits</Text>
          <Text style={styles.date}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </Text>
        </View>
        <View style={styles.streakBadge}>
          <Text style={styles.streakFire}>🔥</Text>
          <Text style={styles.streakNum}>{streak}</Text>
        </View>
      </View>

      {/* Progress card */}
      <View style={styles.progressCard}>
        <View style={styles.progressTop}>
          <Text style={styles.progressLabel}>Daily Progress</Text>
          <Text style={styles.progressCount}>{completed.size}/{enabledHabits.length}</Text>
        </View>
        <View style={styles.progressTrack}>
          <Animated.View
            style={[styles.progressFill, {
              width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
              backgroundColor: allDone ? '#4ecdc4' : '#6c63ff',
            }]}
          />
        </View>
        {allDone && <Text style={styles.allDoneText}>🌟 All habits done today!</Text>}
        <WeekDots stats={weekStats} />
      </View>

      {/* Habits list */}
      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {enabledHabits.map((habit) => {
          const done = completed.has(habit.id);
          return (
            <HabitItem key={habit.id} habit={habit} completed={done} onToggle={() => toggleHabit(habit.id)} />
          );
        })}

        <TouchableOpacity style={styles.manageBtn} onPress={openManager} activeOpacity={0.8}>
          <Ionicons name="settings-outline" size={18} color="#6c63ff" />
          <Text style={styles.manageBtnText}>Manage Habits</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Habit Manager Modal */}
      <Modal visible={showManager} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={mgr.root}>
          <View style={mgr.header}>
            <Text style={mgr.title}>Manage Habits</Text>
            <TouchableOpacity onPress={() => setShowManager(false)}>
              <Ionicons name="close" size={26} color="#8888bb" />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={mgr.list}>
            {draftHabits.map((h) => (
              <View key={h.id} style={mgr.row}>
                <View style={[mgr.icon, { backgroundColor: h.color + '22' }]}>
                  <Ionicons name={h.icon as any} size={20} color={h.color} />
                </View>
                <Text style={mgr.name}>{h.name}</Text>
                <Switch
                  value={h.enabled}
                  onValueChange={(v) =>
                    setDraftHabits(draftHabits.map((x) => x.id === h.id ? { ...x, enabled: v } : x))
                  }
                  trackColor={{ false: '#2a2a4e', true: '#6c63ff' }}
                  thumbColor="#fff"
                />
              </View>
            ))}

            <Text style={mgr.addLabel}>Add custom habit</Text>
            <View style={mgr.addRow}>
              <TextInput
                style={mgr.addInput}
                placeholder="Habit name..."
                placeholderTextColor="#444466"
                value={newHabitName}
                onChangeText={setNewHabitName}
              />
              <TouchableOpacity style={mgr.addBtn} onPress={addCustomHabit}>
                <Ionicons name="add" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
          </ScrollView>

          <View style={mgr.footer}>
            <TouchableOpacity style={mgr.saveBtn} onPress={saveManager}>
              <Text style={mgr.saveBtnText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function HabitItem({ habit, completed, onToggle }: { habit: HabitDef; completed: boolean; onToggle: () => void }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 0.96, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }),
    ]).start();
    onToggle();
  };

  return (
    <Animated.View style={[styles.habitCard, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity style={styles.habitRow} onPress={handlePress} activeOpacity={0.8}>
        <View style={[styles.habitIcon, { backgroundColor: habit.color + '22' }]}>
          <Ionicons name={habit.icon as any} size={22} color={habit.color} />
        </View>
        <Text style={[styles.habitName, completed && styles.habitNameDone]}>{habit.name}</Text>
        <View style={[styles.checkCircle, {
          backgroundColor: completed ? habit.color : 'transparent',
          borderColor: completed ? habit.color : '#3a3a5e',
        }]}>
          {completed && <Ionicons name="checkmark" size={15} color="#fff" />}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  header: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontSize: 28, fontWeight: '700', color: '#fff' },
  date: { fontSize: 14, color: '#8888bb', marginTop: 4 },
  streakBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e1a0a', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: '#f39c1244' },
  streakFire: { fontSize: 18 },
  streakNum: { color: '#f39c12', fontWeight: '800', fontSize: 18, marginLeft: 4 },
  progressCard: { marginHorizontal: 24, marginBottom: 16, backgroundColor: '#1a1a2e', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#2a2a4e' },
  progressTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  progressLabel: { color: '#b0b0cc', fontSize: 14 },
  progressCount: { color: '#fff', fontWeight: '700', fontSize: 14 },
  progressTrack: { height: 8, backgroundColor: '#2a2a4e', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: 8, borderRadius: 4 },
  allDoneText: { color: '#4ecdc4', marginTop: 10, textAlign: 'center', fontWeight: '600', fontSize: 14 },
  list: { paddingHorizontal: 24, paddingBottom: 40 },
  habitCard: { backgroundColor: '#1a1a2e', borderRadius: 14, marginBottom: 10, borderWidth: 1, borderColor: '#2a2a4e' },
  habitRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
  habitIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  habitName: { flex: 1, color: '#fff', fontSize: 16, fontWeight: '500' },
  habitNameDone: { color: '#444466', textDecorationLine: 'line-through' },
  checkCircle: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  manageBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: '#2a2a4e', borderStyle: 'dashed' },
  manageBtnText: { color: '#6c63ff', fontWeight: '600', fontSize: 15 },
});

const mgr = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0f0f1a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24 },
  title: { fontSize: 22, fontWeight: '700', color: '#fff' },
  list: { paddingHorizontal: 24, paddingBottom: 40 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a2e', borderRadius: 12, padding: 14, marginBottom: 10, gap: 12, borderWidth: 1, borderColor: '#2a2a4e' },
  icon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  name: { flex: 1, color: '#fff', fontSize: 15, fontWeight: '500' },
  addLabel: { color: '#8888bb', fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginTop: 24, marginBottom: 10 },
  addRow: { flexDirection: 'row', gap: 10 },
  addInput: { flex: 1, backgroundColor: '#1a1a2e', borderWidth: 1, borderColor: '#2a2a4e', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: '#fff', fontSize: 15 },
  addBtn: { backgroundColor: '#6c63ff', borderRadius: 12, width: 46, justifyContent: 'center', alignItems: 'center' },
  footer: { padding: 24, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#2a2a4e' },
  saveBtn: { backgroundColor: '#6c63ff', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});