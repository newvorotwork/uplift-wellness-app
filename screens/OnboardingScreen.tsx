import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, Animated, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { saveProfile } from '../utils/storage';

interface Props { onComplete: () => void; }

const FEATURES = [
  { icon: 'checkmark-circle-outline' as const, color: '#6c63ff', title: 'Build Daily Habits', desc: 'Pick habits that matter to you and check them off each day to stay consistent.' },
  { icon: 'flame-outline' as const, color: '#f39c12', title: 'Win Streaks', desc: 'Keep your streak alive! Every day you complete habits adds to your fire.' },
  { icon: 'bar-chart-outline' as const, color: '#2ecc71', title: 'Track Progress', desc: 'Weekly stats, calendar history, and a dashboard to keep you motivated.' },
  { icon: 'leaf-outline' as const, color: '#1abc9c', title: 'Breathing Exercises', desc: 'Box Breathing, 4-7-8, Calm Breath — full-screen guided sessions anytime.' },
  { icon: 'create-outline' as const, color: '#e67e22', title: 'Daily Journal', desc: 'Write your thoughts, track your mood, and reflect on your journey.' },
  { icon: 'notifications-outline' as const, color: '#9b59b6', title: 'Reminders', desc: 'Enable notifications so you never miss a habit check-in.' },
];

export default function OnboardingScreen({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [goals, setGoals] = useState('');
  const slideAnim = useRef(new Animated.Value(0)).current;

  const goNext = () => {
    Animated.timing(slideAnim, { toValue: -420, duration: 260, useNativeDriver: true }).start(() => {
      setStep(1);
      slideAnim.setValue(420);
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 11 }).start();
    });
  };

  const handleDone = async () => {
    await saveProfile({ name: name.trim() || 'Friend', age, goals, onboardingDone: true });
    onComplete();
  };

  return (
    <SafeAreaView style={styles.root}>
      <Animated.View style={[{ flex: 1 }, { transform: [{ translateX: slideAnim }] }]}>
        {step === 0 ? (
          <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
            <View style={styles.logoWrap}>
              <View style={styles.logoCircle}>
                <Ionicons name="sparkles-outline" size={38} color="#6c63ff" />
              </View>
              <Text style={styles.appName}>Uplift</Text>
              <Text style={styles.tagline}>Your daily wellness companion</Text>
            </View>

            <Text style={styles.sectionLabel}>HOW IT WORKS</Text>
            {FEATURES.map((f, i) => (
              <View key={i} style={styles.featureRow}>
                <View style={[styles.featureIcon, { backgroundColor: f.color + '22' }]}>
                  <Ionicons name={f.icon} size={22} color={f.color} />
                </View>
                <View style={styles.featureText}>
                  <Text style={styles.featureTitle}>{f.title}</Text>
                  <Text style={styles.featureDesc}>{f.desc}</Text>
                </View>
              </View>
            ))}

            <TouchableOpacity style={styles.btn} onPress={goNext} activeOpacity={0.85}>
              <Text style={styles.btnText}>Get Started</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>
          </ScrollView>
        ) : (
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
              <Text style={styles.setupTitle}>Tell us about you</Text>
              <Text style={styles.setupSub}>Personalize your experience</Text>

              <Text style={styles.label}>Your name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Alex"
                placeholderTextColor="#444466"
                value={name}
                onChangeText={setName}
              />

              <Text style={styles.label}>Age</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 28"
                placeholderTextColor="#444466"
                value={age}
                onChangeText={setAge}
                keyboardType="numeric"
              />

              <Text style={styles.label}>My main goal</Text>
              <TextInput
                style={[styles.input, styles.inputMulti]}
                placeholder="e.g. Build consistent healthy habits and reduce stress"
                placeholderTextColor="#444466"
                value={goals}
                onChangeText={setGoals}
                multiline
                numberOfLines={3}
              />

              <TouchableOpacity
                style={[styles.btn, !name.trim() && styles.btnDim]}
                onPress={handleDone}
                activeOpacity={0.85}
                disabled={!name.trim()}
              >
                <Text style={styles.btnText}>Start My Journey</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleDone} style={styles.skipBtn}>
                <Text style={styles.skipText}>Skip for now</Text>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        )}
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0f0f1a' },
  page: { padding: 24, paddingBottom: 60 },
  logoWrap: { alignItems: 'center', marginVertical: 32 },
  logoCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#6c63ff18', borderWidth: 2, borderColor: '#6c63ff44',
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  appName: { fontSize: 38, fontWeight: '800', color: '#fff', letterSpacing: 1 },
  tagline: { fontSize: 15, color: '#8888bb', marginTop: 6 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: '#555588', letterSpacing: 2, marginBottom: 20 },
  featureRow: { flexDirection: 'row', marginBottom: 22, gap: 16 },
  featureIcon: { width: 50, height: 50, borderRadius: 14, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  featureText: { flex: 1 },
  featureTitle: { color: '#fff', fontWeight: '700', fontSize: 15, marginBottom: 3 },
  featureDesc: { color: '#8888bb', fontSize: 13, lineHeight: 19 },
  btn: {
    backgroundColor: '#6c63ff', borderRadius: 16, paddingVertical: 18,
    marginTop: 32, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10,
  },
  btnDim: { opacity: 0.35 },
  btnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  setupTitle: { fontSize: 30, fontWeight: '800', color: '#fff', marginTop: 24, marginBottom: 6 },
  setupSub: { color: '#8888bb', fontSize: 15, marginBottom: 32 },
  label: { color: '#8888bb', fontSize: 12, fontWeight: '600', marginBottom: 8, marginTop: 20, textTransform: 'uppercase', letterSpacing: 1 },
  input: {
    backgroundColor: '#1a1a2e', borderWidth: 1, borderColor: '#2a2a4e',
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, color: '#fff', fontSize: 16,
  },
  inputMulti: { minHeight: 90, textAlignVertical: 'top' },
  skipBtn: { alignItems: 'center', marginTop: 16, paddingVertical: 8 },
  skipText: { color: '#444466', fontSize: 14 },
});