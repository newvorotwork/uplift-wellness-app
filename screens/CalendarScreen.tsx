import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getDayCompletion, getDayKey, getHabits, HabitDef } from '../utils/storage';

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAY_LABELS = ['S','M','T','W','T','F','S'];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

interface DayData { count: number; total: number; }

export default function CalendarScreen() {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [dayData, setDayData] = useState<Record<string, DayData>>({});
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedHabits, setSelectedHabits] = useState<{ habit: HabitDef; done: boolean }[]>([]);
  const [allHabits, setAllHabits] = useState<HabitDef[]>([]);

  const loadMonth = useCallback(async (year: number, month: number) => {
    const habits = await getHabits();
    setAllHabits(habits);
    const enabled = habits.filter((h) => h.enabled);
    const days = getDaysInMonth(year, month);
    const data: Record<string, DayData> = {};
    await Promise.all(
      Array.from({ length: days }, async (_, i) => {
        const d = new Date(year, month, i + 1);
        const key = getDayKey(d);
        const completed = await getDayCompletion(key);
        data[key] = { count: completed.length, total: enabled.length };
      })
    );
    setDayData(data);
  }, []);

  useEffect(() => { loadMonth(viewYear, viewMonth); }, [viewYear, viewMonth]);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(viewYear - 1); setViewMonth(11); }
    else setViewMonth(viewMonth - 1);
    setSelectedDay(null);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(viewYear + 1); setViewMonth(0); }
    else setViewMonth(viewMonth + 1);
    setSelectedDay(null);
  };

  const selectDay = async (dateStr: string) => {
    setSelectedDay(dateStr);
    const habits = allHabits.filter((h) => h.enabled);
    const completed = await getDayCompletion(dateStr);
    const completedSet = new Set(completed);
    setSelectedHabits(habits.map((h) => ({ habit: h, done: completedSet.has(h.id) })));
  };

  const days = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  const todayStr = getDayKey(today);
  const cells = Array(firstDay).fill(null).concat(
    Array.from({ length: days }, (_, i) => {
      const d = new Date(viewYear, viewMonth, i + 1);
      return getDayKey(d);
    })
  );
  while (cells.length % 7 !== 0) cells.push(null);

  const getColor = (key: string | null) => {
    if (!key) return 'transparent';
    const d = dayData[key];
    if (!d || d.count === 0 || d.total === 0) return '#1a1a2e';
    const ratio = d.count / d.total;
    if (ratio >= 1) return '#4ecdc4';
    if (ratio >= 0.5) return '#6c63ff';
    return '#9b59b644';
  };

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>Calendar</Text>
      </View>

      {/* Month navigation */}
      <View style={styles.monthNav}>
        <TouchableOpacity onPress={prevMonth} style={styles.navBtn}>
          <Ionicons name="chevron-back" size={22} color="#8888bb" />
        </TouchableOpacity>
        <Text style={styles.monthLabel}>{MONTH_NAMES[viewMonth]} {viewYear}</Text>
        <TouchableOpacity onPress={nextMonth} style={styles.navBtn}>
          <Ionicons name="chevron-forward" size={22} color="#8888bb" />
        </TouchableOpacity>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        {[['#1a1a2e','No habits'],['#9b59b644','Partial'],['#6c63ff','Good'],['#4ecdc4','Complete']].map(([c,l]) => (
          <View key={l} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: c as string }]} />
            <Text style={styles.legendText}>{l}</Text>
          </View>
        ))}
      </View>

      {/* Day labels */}
      <View style={styles.dayLabels}>
        {DAY_LABELS.map((d, i) => <Text key={i} style={styles.dayLabel}>{d}</Text>)}
      </View>

      {/* Calendar grid */}
      <View style={styles.grid}>
        {cells.map((key, i) => {
          if (!key) return <View key={i} style={styles.emptyCell} />;
          const dayNum = new Date(key).getDate();
          const isToday = key === todayStr;
          const isSelected = key === selectedDay;
          const bg = getColor(key);
          return (
            <TouchableOpacity
              key={i}
              style={[
                styles.dayCell,
                { backgroundColor: bg },
                isToday && styles.todayCell,
                isSelected && styles.selectedCell,
              ]}
              onPress={() => selectDay(key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.dayNum, isToday && styles.dayNumToday]}>{dayNum}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Selected day details */}
      {selectedDay && (
        <ScrollView style={styles.detail} contentContainerStyle={styles.detailContent}>
          <Text style={styles.detailTitle}>
            {new Date(selectedDay + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </Text>
          {selectedHabits.length === 0 ? (
            <Text style={styles.detailEmpty}>No habits tracked this day</Text>
          ) : (
            selectedHabits.map(({ habit, done }) => (
              <View key={habit.id} style={styles.detailRow}>
                <View style={[styles.detailIcon, { backgroundColor: habit.color + '22' }]}>
                  <Ionicons name={habit.icon as any} size={18} color={habit.color} />
                </View>
                <Text style={[styles.detailName, !done && styles.detailNameMissed]}>{habit.name}</Text>
                <Ionicons name={done ? 'checkmark-circle' : 'ellipse-outline'} size={20} color={done ? '#4ecdc4' : '#2a2a4e'} />
              </View>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0f0f1a' },
  header: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 8 },
  title: { fontSize: 28, fontWeight: '700', color: '#fff' },
  monthNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 12 },
  navBtn: { padding: 8 },
  monthLabel: { fontSize: 18, fontWeight: '700', color: '#fff' },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginBottom: 12, flexWrap: 'wrap', paddingHorizontal: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { color: '#8888bb', fontSize: 11 },
  dayLabels: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 4 },
  dayLabel: { flex: 1, textAlign: 'center', color: '#555588', fontSize: 12, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 4 },
  emptyCell: { width: '13%', aspectRatio: 1, margin: '0.5%' },
  dayCell: { width: '13%', aspectRatio: 1, margin: '0.5%', borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#2a2a4e' },
  todayCell: { borderColor: '#6c63ff', borderWidth: 2 },
  selectedCell: { borderColor: '#fff', borderWidth: 2 },
  dayNum: { color: '#8888bb', fontSize: 13, fontWeight: '600' },
  dayNumToday: { color: '#6c63ff', fontWeight: '800' },
  detail: { flex: 1, marginTop: 16 },
  detailContent: { paddingHorizontal: 24, paddingBottom: 40 },
  detailTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 14 },
  detailEmpty: { color: '#444466', fontSize: 14 },
  detailRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a2e', borderRadius: 12, padding: 12, marginBottom: 8, gap: 12, borderWidth: 1, borderColor: '#2a2a4e' },
  detailIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  detailName: { flex: 1, color: '#fff', fontSize: 14, fontWeight: '500' },
  detailNameMissed: { color: '#444466' },
});