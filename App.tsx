import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import HabitsScreen from './screens/HabitsScreen';
import CalendarScreen from './screens/CalendarScreen';
import BreathingScreen from './screens/BreathingScreen';
import StatsScreen from './screens/StatsScreen';
import ProfileScreen from './screens/ProfileScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import { getProfile } from './utils/storage';

const Tab = createBottomTabNavigator();

const ICONS: Record<string, any> = {
  Habits: 'checkmark-circle-outline',
  Calendar: 'calendar-outline',
  Breathe: 'leaf-outline',
  Stats: 'bar-chart-outline',
  Profile: 'person-outline',
};

export default function App() {
  const [loading, setLoading] = useState(true);
  const [onboardingDone, setOnboardingDone] = useState(false);

  useEffect(() => {
    getProfile()
      .then((p) => { setOnboardingDone(!!p?.onboardingDone); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0f0f1a', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color="#6c63ff" size="large" />
      </View>
    );
  }

  if (!onboardingDone) {
    return (
      <>
        <StatusBar style="light" />
        <OnboardingScreen onComplete={() => setOnboardingDone(true)} />
      </>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#12122a',
            borderTopColor: '#2a2a4e',
            borderTopWidth: 1,
            paddingBottom: 8,
            paddingTop: 8,
            height: 64,
          },
          tabBarActiveTintColor: '#6c63ff',
          tabBarInactiveTintColor: '#444466',
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600' as const },
          tabBarIcon: ({ color, size }) => (
            <Ionicons name={ICONS[route.name]} size={size} color={color} />
          ),
        })}
      >
        <Tab.Screen name="Habits" component={HabitsScreen} />
        <Tab.Screen name="Calendar" component={CalendarScreen} />
        <Tab.Screen name="Breathe" component={BreathingScreen} />
        <Tab.Screen name="Stats" component={StatsScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}