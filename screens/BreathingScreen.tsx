import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
  Animated, ScrollView, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { addBreathingSession } from '../utils/storage';

interface Phase { name: string; duration: number; targetScale: number; targetOpacity: number; }
interface Technique { id: string; name: string; description: string; phases: Phase[]; color: string; }

const TECHNIQUES: Technique[] = [
  {
    id: 'box', name: 'Box Breathing', description: 'Calm the nervous system. Equal counts for each phase.', color: '#6c63ff',
    phases: [
      { name: 'Inhale', duration: 4, targetScale: 1.5, targetOpacity: 1 },
      { name: 'Hold', duration: 4, targetScale: 1.5, targetOpacity: 0.8 },
      { name: 'Exhale', duration: 4, targetScale: 1, targetOpacity: 0.55 },
      { name: 'Hold', duration: 4, targetScale: 1, targetOpacity: 0.55 },
    ],
  },
  {
    id: '478', name: '4-7-8', description: 'Reduces anxiety and helps you fall asleep.', color: '#e05fd0',
    phases: [
      { name: 'Inhale', duration: 4, targetScale: 1.5, targetOpacity: 1 },
      { name: 'Hold', duration: 7, targetScale: 1.5, targetOpacity: 0.8 },
      { name: 'Exhale', duration: 8, targetScale: 1, targetOpacity: 0.55 },
    ],
  },
  {
    id: 'calm', name: 'Calm Breath', description: 'Simple everyday relaxation technique.', color: '#2ecc71',
    phases: [
      { name: 'Inhale', duration: 4, targetScale: 1.5, targetOpacity: 1 },
      { name: 'Exhale', duration: 6, targetScale: 1, targetOpacity: 0.55 },
    ],
  },
];

export default function BreathingScreen() {
  const [technique, setTechnique] = useState(TECHNIQUES[0]);
  const [isRunning, setIsRunning] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [sessionSecs, setSessionSecs] = useState(0);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.55)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const ringAnim = useRef(new Animated.Value(0)).current;

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const circleAnimRef = useRef<Animated.CompositeAnimation | null>(null);
  const ringLoopRef = useRef<Animated.CompositeAnimation | null>(null);
  const techniqueRef = useRef(technique);
  const runningRef = useRef(false);
  const sessionSecsRef = useRef(0);

  useEffect(() => { techniqueRef.current = technique; }, [technique]);

  const clearAll = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (sessionTimerRef.current) { clearInterval(sessionTimerRef.current); sessionTimerRef.current = null; }
    if (circleAnimRef.current) { circleAnimRef.current.stop(); circleAnimRef.current = null; }
    if (ringLoopRef.current) { ringLoopRef.current.stop(); ringLoopRef.current = null; }
  }, []);

  const resetCircle = useCallback(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 0.55, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  const runPhase = useCallback((index: number) => {
    const t = techniqueRef.current;
    const phase = t.phases[index];
    setPhaseIndex(index);
    setCountdown(phase.duration);
    circleAnimRef.current?.stop();
    const anim = Animated.parallel([
      Animated.timing(scaleAnim, { toValue: phase.targetScale, duration: phase.duration * 1000, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: phase.targetOpacity, duration: phase.duration * 1000, useNativeDriver: true }),
    ]);
    circleAnimRef.current = anim;
    anim.start();
    if (timerRef.current) clearInterval(timerRef.current);
    let remaining = phase.duration;
    timerRef.current = setInterval(() => {
      remaining -= 1;
      setCountdown(remaining);
      if (remaining <= 0) {
        clearInterval(timerRef.current!);
        timerRef.current = null;
        if (runningRef.current) runPhase((index + 1) % techniqueRef.current.phases.length);
      }
    }, 1000);
  }, []);

  const startSession = useCallback(() => {
    runningRef.current = true;
    sessionSecsRef.current = 0;
    setSessionSecs(0);
    setIsRunning(true);
    ringAnim.setValue(0);
    const ring = Animated.loop(Animated.timing(ringAnim, { toValue: 1, duration: 16000, useNativeDriver: true }));
    ringLoopRef.current = ring;
    ring.start();
    sessionTimerRef.current = setInterval(() => {
      sessionSecsRef.current += 1;
      setSessionSecs(sessionSecsRef.current);
    }, 1000);
    runPhase(0);
  }, [runPhase]);

  const stopSession = useCallback(async () => {
    runningRef.current = false;
    setIsRunning(false);
    setPhaseIndex(0);
    setCountdown(0);
    clearAll();
    resetCircle();
    if (sessionSecsRef.current > 5) {
      await addBreathingSession(techniqueRef.current.name, sessionSecsRef.current);
    }
  }, [clearAll, resetCircle]);

  const handleSelectTechnique = (t: Technique) => {
    if (isRunning) stopSession();
    setTechnique(t);
  };

  useEffect(() => {
    if (!isRunning) {
      const pulse = Animated.loop(Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.06, duration: 1800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1800, useNativeDriver: true }),
      ]));
      pulse.start();
      return () => pulse.stop();
    }
  }, [isRunning]);

  useEffect(() => () => clearAll(), []);

  const ringRotate = ringAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const currentPhase = technique.phases[phaseIndex];
  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const BreathCircle = () => (
    <View style={styles.circleWrap}>
      <Animated.View style={[styles.outerRing, { borderColor: technique.color + '55', transform: [{ rotate: ringRotate }, { scale: scaleAnim }] }]} />
      <Animated.View style={[styles.midRing, { borderColor: technique.color + '33', transform: [{ scale: scaleAnim }], opacity: opacityAnim }]} />
      <Animated.View style={[styles.circle, {
        backgroundColor: technique.color + '22', borderColor: technique.color,
        transform: [{ scale: isRunning ? scaleAnim : pulseAnim }],
        opacity: opacityAnim,
      }]}>
        {isRunning ? (
          <>
            <Text style={[styles.phaseName, { color: technique.color }]}>{currentPhase.name}</Text>
            <Text style={styles.countdownNum}>{countdown}</Text>
          </>
        ) : (
          <Text style={styles.readyLabel}>Ready</Text>
        )}
      </Animated.View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Breathe</Text>
        <Text style={styles.subtitle}>{technique.description}</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        {TECHNIQUES.map((t) => (
          <TouchableOpacity
            key={t.id}
            style={[styles.chip, technique.id === t.id && { borderColor: t.color, backgroundColor: t.color + '22' }]}
            onPress={() => handleSelectTechnique(t)}
            activeOpacity={0.8}
          >
            <Text style={[styles.chipText, technique.id === t.id && { color: t.color }]}>{t.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.phaseLegend}>
        {technique.phases.map((p, i) => (
          <View key={i} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: isRunning && i === phaseIndex ? technique.color : '#3a3a5e' }]} />
            <Text style={[styles.legendText, isRunning && i === phaseIndex && { color: technique.color }]}>
              {p.name} {p.duration}s
            </Text>
          </View>
        ))}
      </View>

      <BreathCircle />

      {isRunning && (
        <Text style={styles.sessionTime}>{formatTime(sessionSecs)}</Text>
      )}

      <TouchableOpacity
        style={[styles.btn, { backgroundColor: isRunning ? '#2a2a4e' : technique.color }]}
        onPress={isRunning ? stopSession : startSession}
        activeOpacity={0.85}
      >
        <Text style={[styles.btnText, isRunning && { color: '#8888bb' }]}>
          {isRunning ? 'End Session' : 'Start Breathing'}
        </Text>
      </TouchableOpacity>

      {/* Full-screen overlay during session */}
      <Modal visible={isRunning} transparent animationType="fade" statusBarTranslucent>
        <View style={fs.overlay}>
          <View style={fs.header}>
            <Text style={fs.techName}>{technique.name}</Text>
            <Text style={fs.timer}>{formatTime(sessionSecs)}</Text>
          </View>

          <View style={fs.phaseLegend}>
            {technique.phases.map((p, i) => (
              <View key={i} style={fs.legendItem}>
                <View style={[fs.legendDot, { backgroundColor: i === phaseIndex ? technique.color : '#3a3a5e' }]} />
                <Text style={[fs.legendText, i === phaseIndex && { color: technique.color }]}>{p.name} {p.duration}s</Text>
              </View>
            ))}
          </View>

          <View style={fs.circleWrap}>
            <Animated.View style={[styles.outerRing, { width: 300, height: 300, borderRadius: 150, borderColor: technique.color + '55', transform: [{ rotate: ringRotate }, { scale: scaleAnim }] }]} />
            <Animated.View style={[styles.midRing, { width: 250, height: 250, borderRadius: 125, borderColor: technique.color + '33', transform: [{ scale: scaleAnim }], opacity: opacityAnim }]} />
            <Animated.View style={[styles.circle, { width: 200, height: 200, borderRadius: 100, backgroundColor: technique.color + '22', borderColor: technique.color, transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}>
              <Text style={[styles.phaseName, { color: technique.color, fontSize: 16 }]}>{currentPhase.name}</Text>
              <Text style={[styles.countdownNum, { fontSize: 72 }]}>{countdown}</Text>
            </Animated.View>
          </View>

          <TouchableOpacity style={[fs.stopBtn, { backgroundColor: technique.color }]} onPress={stopSession} activeOpacity={0.85}>
            <Text style={fs.stopBtnText}>End Session</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  header: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 8 },
  title: { fontSize: 28, fontWeight: '700', color: '#fff' },
  subtitle: { fontSize: 14, color: '#8888bb', marginTop: 4 },
  chipRow: { paddingHorizontal: 20, paddingVertical: 16, gap: 10 },
  chip: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20, borderWidth: 1.5, borderColor: '#2a2a4e', backgroundColor: '#1a1a2e' },
  chipText: { color: '#8888bb', fontWeight: '600', fontSize: 13 },
  phaseLegend: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 16, paddingHorizontal: 24, marginBottom: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { color: '#555588', fontSize: 13, fontWeight: '500' },
  circleWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  outerRing: { position: 'absolute', width: 240, height: 240, borderRadius: 120, borderWidth: 1 },
  midRing: { position: 'absolute', width: 200, height: 200, borderRadius: 100, borderWidth: 1 },
  circle: { width: 160, height: 160, borderRadius: 80, borderWidth: 2.5, justifyContent: 'center', alignItems: 'center' },
  phaseName: { fontSize: 15, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2 },
  countdownNum: { fontSize: 52, fontWeight: '200', color: '#fff', marginTop: 2, lineHeight: 58 },
  readyLabel: { fontSize: 18, color: '#555588', fontWeight: '500' },
  sessionTime: { textAlign: 'center', color: '#555588', fontSize: 16, marginBottom: 8 },
  btn: { marginHorizontal: 32, marginBottom: 36, paddingVertical: 18, borderRadius: 16, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 18, fontWeight: '700', letterSpacing: 0.5 },
});

const fs = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: '#0a0a18', justifyContent: 'space-between', paddingVertical: 60, paddingHorizontal: 24 },
  header: { alignItems: 'center' },
  techName: { color: '#8888bb', fontSize: 16, fontWeight: '600', letterSpacing: 1 },
  timer: { color: '#fff', fontSize: 20, fontWeight: '200', marginTop: 4 },
  phaseLegend: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { color: '#555588', fontSize: 13, fontWeight: '500' },
  circleWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  stopBtn: { borderRadius: 16, paddingVertical: 18, alignItems: 'center' },
  stopBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});