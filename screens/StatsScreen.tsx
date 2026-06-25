import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView,
  TouchableOpacity, Modal, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  getWeekStats, getBreathingSessions, getDiaryEntries, saveDiaryEntry,
  deleteDiaryEntry, calculateStreak, DiaryEntry, Mood,
} from '../utils/storage';

const MOODS: { mood: Mood; emoji: string; label: string; color: string }[] = [
  { mood: 'great', emoji: '😄', label: 'Great', color: '#4ecdc4' },
  { mood: 'good', emoji: '🙂', label: 'Good', color: '#2ecc71' },
  { mood: 'okay', emoji: '😐', label: 'Okay', color: '#f39c12' },
  { mood: 'bad', emoji: '😔', label: 'Bad', color: '#e74c3c' },
];

function getMoodInfo(mood: Mood) { return MOODS.find((m) => m.mood === mood) ?? MOODS[1]; }

export default function StatsScreen() {
  const [weekStats, setWeekStats] = useState<Array<{ date: string; count: number; total: number }>>([]);
  const [breathSessions, setBreathSessions] = useState(0);
  const [streak, setStreak] = useState(0);
  const [diary, setDiary] = useState<DiaryEntry[]>([]);
  const [showDiaryModal, setShowDiaryModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<DiaryEntry | null>(null);
  const [draftText, setDraftText] = useState('');
  const [draftMood, setDraftMood] = useState<Mood>('good');

  const load = useCallback(async () => {
    const [ws, bs, s, d] = await Promise.all([
      getWeekStats(), getBreathingSessions(), calculateStreak(), getDiaryEntries(),
    ]);
    setWeekStats(ws);
    const thisWeek = new Date();
    thisWeek.setDate(thisWeek.getDate() - 7);
    setBreathSessions(bs.filter((s: any) => new Date(s.date) >= thisWeek).length);
    setStreak(s);
    setDiary(d);
  }, []);

  useEffect(() => { load(); }, []);

  const openNewEntry = () => {
    setEditingEntry(null);
    setDraftText('');
    setDraftMood('good');
    setShowDiaryModal(true);
  };

  const openEditEntry = (entry: DiaryEntry) => {
    setEditingEntry(entry);
    setDraftText(entry.text);
    setDraftMood(entry.mood);
    setShowDiaryModal(true);
  };

  const saveEntry = async () => {
    if (!draftText.trim()) return;
    const entry: DiaryEntry = {
      id: editingEntry?.id ?? Date.now().toString(),
      date: editingEntry?.date ?? new Date().toISOString().split('T')[0],
      text: draftText.trim(),
      mood: draftMood,
    };
    await saveDiaryEntry(entry);
    setShowDiaryModal(false);
    load();
  };

  const deleteEntry = async (id: string) => {
    await deleteDiaryEntry(id);
    load();
  };

  const todayStats = weekStats[weekStats.length - 1];
  const weekTotal = weekStats.reduce((a, s) => a + s.count, 0);
  const weekPossible = weekStats.reduce((a, s) => a + s.total, 0);
  const maxBar = Math.max(...weekStats.map((s) => s.total), 1);

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Stats</Text>

        {/* Overview cards */}
        <View style={styles.overviewRow}>
          <View style={[styles.overviewCard, { borderColor: '#6c63ff44' }]}>
            <Text style={styles.overviewNum}>{todayStats?.count ?? 0}</Text>
            <Text style={styles.overviewLabel}>Today</Text>
          </View>
          <View style={[styles.overviewCard, { borderColor: '#f39c1244' }]}>
            <Text style={[styles.overviewNum, { color: '#f39c12' }]}>🔥 {streak}</Text>
            <Text style={styles.overviewLabel}>Streak</Text>
          </View>
          <View style={[styles.overviewCard, { borderColor: '#1abc9c44' }]}>
            <Text style={[styles.overviewNum, { color: '#1abc9c' }]}>{breathSessions}</Text>
            <Text style={styles.overviewLabel}>Breaths</Text>
          </View>
        </View>

        {/* Weekly bar chart */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>This Week</Text>
          <Text style={styles.cardSub}>{weekTotal} habits completed out of {weekPossible}</Text>
          <View style={styles.barChart}>
            {weekStats.map((s, i) => {
              const ratio = s.total > 0 ? s.count / s.total : 0;
              const dayName = new Date(s.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' });
              const isToday = i === weekStats.length - 1;
              return (
                <View key={i} style={styles.barCol}>
                  <View style={styles.barWrap}>
                    <View style={[styles.barFill, {
                      height: `${Math.round(ratio * 100)}%`,
                      backgroundColor: ratio >= 1 ? '#4ecdc4' : isToday ? '#6c63ff' : '#6c63ff88',
                    }]} />
                  </View>
                  <Text style={[styles.barLabel, isToday && { color: '#6c63ff' }]}>{dayName}</Text>
                  <Text style={styles.barCount}>{s.count}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Breathing stats */}
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <Ionicons name="leaf-outline" size={20} color="#1abc9c" />
            <Text style={styles.cardTitle}>Breathing This Week</Text>
          </View>
          <Text style={[styles.bigNum, { color: '#1abc9c' }]}>{breathSessions} session{breathSessions !== 1 ? 's' : ''}</Text>
          <Text style={styles.cardSub}>Head to the Breathe tab to add more</Text>
        </View>

        {/* Journal */}
        <View style={styles.journalHeader}>
          <Text style={styles.cardTitle}>My Journal</Text>
          <TouchableOpacity style={styles.addEntryBtn} onPress={openNewEntry}>
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.addEntryText}>New Entry</Text>
          </TouchableOpacity>
        </View>

        {diary.length === 0 ? (
          <View style={styles.emptyDiary}>
            <Text style={styles.emptyEmoji}>📔</Text>
            <Text style={styles.emptyText}>No journal entries yet.</Text>
            <Text style={styles.emptySub}>Tap "New Entry" to start writing.</Text>
          </View>
        ) : (
          diary.map((entry) => {
            const mood = getMoodInfo(entry.mood);
            return (
              <TouchableOpacity key={entry.id} style={styles.diaryCard} onPress={() => openEditEntry(entry)} activeOpacity={0.8}>
                <View style={styles.diaryTop}>
                  <View style={styles.diaryMeta}>
                    <Text style={styles.diaryEmoji}>{mood.emoji}</Text>
                    <View>
                      <Text style={styles.diaryDate}>
                        {new Date(entry.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </Text>
                      <Text style={[styles.diaryMood, { color: mood.color }]}>{mood.label}</Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => deleteEntry(entry.id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name="trash-outline" size={18} color="#3a3a5e" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.diaryText} numberOfLines={3}>{entry.text}</Text>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Diary entry modal */}
      <Modal visible={showDiaryModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={modal.root}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
            <View style={modal.header}>
              <Text style={modal.title}>{editingEntry ? 'Edit Entry' : 'New Entry'}</Text>
              <TouchableOpacity onPress={() => setShowDiaryModal(false)}>
                <Ionicons name="close" size={26} color="#8888bb" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={modal.content}>
              <Text style={modal.label}>How are you feeling?</Text>
              <View style={modal.moodRow}>
                {MOODS.map((m) => (
                  <TouchableOpacity
                    key={m.mood}
                    style={[modal.moodBtn, draftMood === m.mood && { borderColor: m.color, backgroundColor: m.color + '22' }]}
                    onPress={() => setDraftMood(m.mood)}
                    activeOpacity={0.8}
                  >
                    <Text style={modal.moodEmoji}>{m.emoji}</Text>
                    <Text style={[modal.moodLabel, draftMood === m.mood && { color: m.color }]}>{m.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={modal.label}>Your thoughts</Text>
              <TextInput
                style={modal.textInput}
                placeholder="Write anything on your mind..."
                placeholderTextColor="#444466"
                value={draftText}
                onChangeText={setDraftText}
                multiline
                numberOfLines={8}
                textAlignVertical="top"
                autoFocus
              />
            </ScrollView>

            <View style={modal.footer}>
              <TouchableOpacity
                style={[modal.saveBtn, !draftText.trim() && modal.saveBtnDim]}
                onPress={saveEntry}
                disabled={!draftText.trim()}
              >
                <Text style={modal.saveBtnText}>Save Entry</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0f0f1a' },
  scroll: { padding: 24, paddingBottom: 60 },
  title: { fontSize: 28, fontWeight: '700', color: '#fff', marginBottom: 20 },
  overviewRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  overviewCard: { flex: 1, backgroundColor: '#1a1a2e', borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1 },
  overviewNum: { fontSize: 22, fontWeight: '800', color: '#6c63ff' },
  overviewLabel: { color: '#8888bb', fontSize: 12, marginTop: 4, fontWeight: '600' },
  card: { backgroundColor: '#1a1a2e', borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#2a2a4e' },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  cardTitle: { fontSize: 17, fontWeight: '700', color: '#fff', marginBottom: 4 },
  cardSub: { color: '#8888bb', fontSize: 13, marginBottom: 16 },
  bigNum: { fontSize: 38, fontWeight: '800', marginBottom: 4 },
  barChart: { flexDirection: 'row', gap: 8, height: 120, alignItems: 'flex-end' },
  barCol: { flex: 1, alignItems: 'center', gap: 4 },
  barWrap: { flex: 1, width: '100%', backgroundColor: '#2a2a4e', borderRadius: 6, justifyContent: 'flex-end', overflow: 'hidden' },
  barFill: { width: '100%', borderRadius: 6 },
  barLabel: { color: '#8888bb', fontSize: 10, fontWeight: '600' },
  barCount: { color: '#555588', fontSize: 10 },
  journalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  addEntryBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#6c63ff', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, gap: 6 },
  addEntryText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  emptyDiary: { alignItems: 'center', paddingVertical: 40, backgroundColor: '#1a1a2e', borderRadius: 16, borderWidth: 1, borderColor: '#2a2a4e' },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  emptySub: { color: '#555588', fontSize: 13, marginTop: 6 },
  diaryCard: { backgroundColor: '#1a1a2e', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#2a2a4e' },
  diaryTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  diaryMeta: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  diaryEmoji: { fontSize: 28 },
  diaryDate: { color: '#8888bb', fontSize: 13 },
  diaryMood: { fontWeight: '700', fontSize: 13, marginTop: 2 },
  diaryText: { color: '#cccce0', fontSize: 14, lineHeight: 21 },
});

const modal = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0f0f1a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24 },
  title: { fontSize: 22, fontWeight: '700', color: '#fff' },
  content: { paddingHorizontal: 24, paddingBottom: 20 },
  label: { color: '#8888bb', fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, marginTop: 8 },
  moodRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  moodBtn: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, borderColor: '#2a2a4e', backgroundColor: '#1a1a2e' },
  moodEmoji: { fontSize: 24, marginBottom: 4 },
  moodLabel: { color: '#555588', fontSize: 11, fontWeight: '600' },
  textInput: { backgroundColor: '#1a1a2e', borderWidth: 1, borderColor: '#2a2a4e', borderRadius: 12, padding: 16, color: '#fff', fontSize: 15, minHeight: 200, lineHeight: 22 },
  footer: { padding: 24, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#2a2a4e' },
  saveBtn: { backgroundColor: '#6c63ff', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  saveBtnDim: { opacity: 0.35 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});