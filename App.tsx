import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AppNavigator } from './src/nav/AppNavigator';
import { ThemeProvider } from './src/theme/ThemeContext';
import { initSeedData } from './src/data/store';
import { setupNotificationChannel, scheduleAllNotifications, requestNotificationPermissions } from './src/notifications/scheduler';
import { ensurePhotoDirExists } from './src/data/photos';
import { store } from './src/data/store';
import * as QuickActions from 'expo-quick-actions';
import * as Notifications from 'expo-notifications';

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function bootstrap() {
      try {
        // Seed initial data
        await initSeedData();

        // Ensure photo directory exists
        await ensurePhotoDirExists();

        // Set up Android notification channel
        await setupNotificationChannel();

        // Request notification permissions on first launch and schedule
        const granted = await requestNotificationPermissions();
        if (granted) {
          const settings = await store.getSettings();
          await scheduleAllNotifications(settings);
        }

        // Set up quick action shortcuts (long-press app icon)
        QuickActions.setItems([
          {
            title: 'Log Weight',
            subtitle: 'Quick weigh-in',
            icon: 'shortcut_weight',
            id: '0',
            params: { href: '/weight/add' },
          },
          {
            title: 'Log Workout',
            subtitle: 'Start today\'s session',
            icon: 'shortcut_workout',
            id: '1',
            params: { href: '/workouts/start' },
          },
          {
            title: 'Log Meal',
            subtitle: 'Add food',
            icon: 'shortcut_meal',
            id: '2',
            params: { href: '/nutrition/add' },
          },
        ]).catch(() => {
          // QuickActions not available on all devices — non-fatal
        });
      } catch (e) {
        console.warn('Bootstrap error:', e);
      } finally {
        setReady(true);
      }
    }
    bootstrap();
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0c1220', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#0ea5e9', fontSize: 18, fontWeight: '700' }}>Transformation Tracker</Text>
        <Text style={{ color: '#475569', marginTop: 8 }}>Loading...</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AppNavigator />
          <StatusBar style="light" />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
