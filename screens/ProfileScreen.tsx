import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView,
  TouchableOpacity, TextInput, Switch, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getProfile, saveProfile, UserProfile, calculateStreak, getBreathingSessions } from '../utils/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ProfileScreen() {
  const [profile, setProfile] = useState<UserProfile>({ name: '', age: '', goals: '', onboardingDone: true });
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<UserProfile>({ name: '', age: '', goals: '', onboardingDone: true });
  const [streak, setStreak] = useState(0);
  const [totalSessions, setTotalSessions] = useState(0);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  const load = useCallback(async () => {
    const [p, s, bs] = await Promise.all([getProfile(), calculateStreak(), getBreathingSessions()]);
    if (p) { setProfile(p); }
    setStreak(s);
    setTotalSessions(bs.length);
  }, []);

  useEffect(() => { load(); }, []);

  const startEdit = () => { setDraft({ ...profile }); setEditing(true); };

  const saveEdit = async () => {
    const updated = { ...draft, onboardingDone: true };
    await saveProfile(updated);
    setProfile(updated);
    setEditing(false);
  };

  const handleReset = () => {
    Alert.alert('Reset All Data', 'This will delete all your habits, stats, and journal entries. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset', style: 'destructive', onPress: async () => {
          await AsyncStorage.clear();
          setProfile({ name: '', age: '', goals: '', onboardingDone: true });
          setStreak(0);
          setTotalSessions(0);
        }
      },
    ]);
  };

  const initial = profile.name ? profile.name[0].toUpperCase() : '?';

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Profile</Text>

        {/* Avatar + name */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <Text style={styles.profileName}>{profile.name || 'Your Name'}</Text>
          {profile.age ? <Text style={styles.profileAge}>Age {profile.age}</Text> : null}
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>🔥 {streak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNum, { color: '#1abc9c' }]}>{totalSessions}</Text>
            <Text style={styles.statLabel}>Breaths</Text>
          </View>
        </View>

        {/* Profile info */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>About Me</Text>
            {!editing && (
              <TouchableOpacity onPress={startEdit} style={styles.editBtn}>
                <Ionicons name="create-outline" size={18} color="#6c63ff" />
                <Text style={styles.editBtnText}>Edit</Text>
              </TouchableOpacity>
            )}
          </View>

          {editing ? (
            <>
              <Text style={styles.label}>Name</Text>
              <TextInput style={styles.input} value={draft.name} onChangeText={(v) => setDraft({ ...draft, name: v })} placeholderTextColor="#444466" placeholder="Your name" />
              <Text style={styles.label}>Age</Text>
              <TextInput style={styles.input} value={draft.age} onChangeText={(v) => setDraft({ ...draft, age: v })} placeholderTextColor="#444466" placeholder="Your age" keyboardType="numeric" />
              <Text style={styles.label}>My Goal</Text>
              <TextInput style={[styles.input, styles.inputMulti]} value={draft.goals} onChangeText={(v) => setDraft({ ...draft, goals: v })} placeholderTextColor="#444466" placeholder="What are you working towards?" multiline numberOfLines={3} />
              <View style={styles.editActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditing(false)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={saveEdit}>
                  <Text style={styles.saveBtnText}>Save</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <InfoRow icon="person-outline" label="Name" value={profile.name || '—'} />
              <InfoRow icon="calendar-outline" label="Age" value={profile.age || '—'} />
              <InfoRow icon="flag-outline" label="Goal" value={profile.goals || '—'} />
            </>
          )}
        </View>

        {/* Settings */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Settings</Text>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="notifications-outline" size={20} color="#9b59b6" />
              <View>
                <Text style={styles.settingLabel}>Daily Reminder</Text>
                <Text style={styles.settingSub}>Remind me to check my habits</Text>
              </View>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#2a2a4e', true: '#6c63ff' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Danger zone */}
        <TouchableOpacity style={styles.resetBtn} onPress={handleReset} activeOpacity={0.8}>
          <Ionicons name="trash-outline" size={18} color="#e74c3c" />
          <Text style={styles.resetBtnText}>Reset All Data</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Uplift v1.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={18} color="#6c63ff" />
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0f0f1a' },
  scroll: { padding: 24, paddingBottom: 60 },
  title: { fontSize: 28, fontWeight: '700', color: '#fff', marginBottom: 24 },
  avatarSection: { alignItems: 'center', marginBottom: 28 },
  avatar: { width: 88, height: 88, borderRadius: 44, backgroundColor: '#6c63ff', justifyContent: 'center', alignItems: 'center', marginBottom: 14, borderWidth: 3, borderColor: '#6c63ff44' },
  avatarText: { fontSize: 36, fontWeight: '800', color: '#fff' },
  profileName: { fontSize: 24, fontWeight: '700', color: '#fff' },
  profileAge: { color: '#8888bb', fontSize: 14, marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: '#1a1a2e', borderRadius: 14, padding: 18, alignItems: 'center', borderWidth: 1, borderColor: '#2a2a4e' },
  statNum: { fontSize: 22, fontWeight: '800', color: '#f39c12', marginBottom: 4 },
  statLabel: { color: '#8888bb', fontSize: 12, fontWeight: '600' },
  card: { backgroundColor: '#1a1a2e', borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#2a2a4e' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cardTitle: { fontSize: 17, fontWeight: '700', color: '#fff' },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  editBtnText: { color: '#6c63ff', fontWeight: '600', fontSize: 14 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginBottom: 16 },
  infoLabel: { color: '#8888bb', fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8 },
  infoValue: { color: '#fff', fontSize: 15, marginTop: 2, lineHeight: 20 },
  label: { color: '#8888bb', fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginTop: 12 },
  input: { backgroundColor: '#12122a', borderWidth: 1, borderColor: '#2a2a4e', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, color: '#fff', fontSize: 15 },
  inputMulti: { minHeight: 80, textAlignVertical: 'top' },
  editActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: '#2a2a4e', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  cancelBtnText: { color: '#8888bb', fontWeight: '600' },
  saveBtn: { flex: 1, backgroundColor: '#6c63ff', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '700' },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  settingLabel: { color: '#fff', fontSize: 15, fontWeight: '500' },
  settingSub: { color: '#8888bb', fontSize: 12, marginTop: 2 },
  resetBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: '#e74c3c44', marginBottom: 24 },
  resetBtnText: { color: '#e74c3c', fontWeight: '600', fontSize: 15 },
  version: { textAlign: 'center', color: '#2a2a4e', fontSize: 12 },
});