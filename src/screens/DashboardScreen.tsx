import React, { useContext, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { format } from 'date-fns';
import { Scale, Dumbbell, Apple, Flame, Zap, TrendingDown, Target } from 'lucide-react-native';
import { ThemeContext } from '../theme/ThemeContext';
import { Colors } from '../theme/colors';
import { store, uid } from '../data/store';
import { StatCard } from '../components/StatCard';
import { MacroBar } from '../components/MacroBar';
import { Card } from '../components/Card';
import { getCurrentPhase, currentWeek, todayStr, calcStreak, movingAverage, fmtDelta } from '../lib/utils';
import { templateForDate } from '../data/seed';
import type { WeightEntry, UserSettings, DayMeals, WorkoutLog } from '../data/types';

export function DashboardScreen() {
  const { theme } = useContext(ThemeContext);
  const t = theme === 'dark' ? Colors.dark : Colors.light;
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>([]);
  const [todayMeals, setTodayMeals] = useState<DayMeals | null>(null);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [s, w, meals, logs] = await Promise.all([
      store.getSettings(),
      store.getWeightEntries(),
      store.getDayMeals(todayStr()),
      store.getWorkoutLogs(),
    ]);
    setSettings(s);
    setWeightEntries(w);
    setTodayMeals(meals);
    setWorkoutLogs(logs);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  if (!settings) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: t.bg, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: t.textMuted }}>Loading...</Text>
      </SafeAreaView>
    );
  }

  const phase = getCurrentPhase(settings);
  const week = currentWeek(settings.startDate);
  const today = templateForDate(new Date());

  // Weight stats
  const latestWeight = weightEntries.length > 0 ? weightEntries[weightEntries.length - 1].weightKg : settings.startWeightKg;
  const delta = latestWeight - settings.startWeightKg;
  const remaining = latestWeight - settings.goalWeightKg;
  const pctDone = Math.min(((settings.startWeightKg - latestWeight) / (settings.startWeightKg - settings.goalWeightKg)) * 100, 100);

  // Macros today
  const allMealEntries = todayMeals
    ? Object.values(todayMeals.meals).flat()
    : [];
  const totalKcal = allMealEntries.reduce((s, e) => s + e.kcal, 0);
  const totalProtein = allMealEntries.reduce((s, e) => s + e.protein, 0);
  const totalCarbs = allMealEntries.reduce((s, e) => s + e.carbs, 0);
  const totalFat = allMealEntries.reduce((s, e) => s + e.fat, 0);

  // Streak
  const weightDates = weightEntries.map((e) => e.date);
  const streak = calcStreak(weightDates);

  // Today's workout logged?
  const todayLogged = workoutLogs.some((l) => l.date === todayStr());

  const quickLogWeight = async () => {
    Alert.prompt(
      'Log Weight',
      `Enter weight (kg):`,
      async (val) => {
        if (!val) return;
        const kg = parseFloat(val);
        if (isNaN(kg) || kg < 30 || kg > 300) {
          Alert.alert('Invalid', 'Enter a weight between 30–300 kg');
          return;
        }
        await store.addWeightEntry({
          id: uid(),
          date: todayStr(),
          weightKg: kg,
        });
        await load();
      },
      'plain-text',
      latestWeight.toString()
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: t.textMuted }]}>
              {format(new Date(), 'EEEE, MMM d')}
            </Text>
            <Text style={[styles.title, { color: t.text }]}>Transformation</Text>
          </View>
          <View style={[styles.weekBadge, { backgroundColor: Colors.primaryDark }]}>
            <Text style={styles.weekText}>Week {week}</Text>
          </View>
        </View>

        {/* Phase Banner */}
        <View style={[styles.phaseBanner, { backgroundColor: (Colors.phases as any)[phase.key] + '22', borderColor: (Colors.phases as any)[phase.key] + '44' }]}>
          <Text style={[styles.phaseName, { color: (Colors.phases as any)[phase.key] }]}>
            Phase: {phase.name}
          </Text>
          <Text style={[styles.phaseTarget, { color: t.textMuted }]}>
            {phase.weightTarget} · {phase.kcal} kcal/day
          </Text>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <StatCard
            label="Current"
            value={`${latestWeight.toFixed(1)} kg`}
            sublabel={fmtDelta(delta)}
            theme={theme}
            style={{ marginRight: 8 }}
          />
          <StatCard
            label="To Goal"
            value={`${remaining.toFixed(1)} kg`}
            sublabel={`${pctDone.toFixed(0)}% done`}
            color={Colors.success}
            theme={theme}
            style={{ marginLeft: 8 }}
          />
        </View>

        {/* Streak */}
        {streak > 0 && (
          <Card theme={theme} style={styles.streakCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Flame size={22} color={Colors.accent} />
              <Text style={[styles.streakText, { color: Colors.accent }]}>
                {streak} day streak
              </Text>
              <Text style={[styles.streakSub, { color: t.textMuted }]}>— keep it up!</Text>
            </View>
          </Card>
        )}

        {/* Today's Workout */}
        <Card theme={theme}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <Dumbbell size={18} color={Colors.primary} />
            <Text style={[styles.sectionTitle, { color: t.text }]}>Today's Session</Text>
            {todayLogged && (
              <View style={[styles.doneBadge, { backgroundColor: Colors.success + '22' }]}>
                <Text style={{ color: Colors.success, fontSize: 11, fontWeight: '700' }}>DONE</Text>
              </View>
            )}
          </View>
          <Text style={[styles.workoutName, { color: Colors.primary }]}>{today.name}</Text>
          <Text style={[styles.workoutType, { color: t.textMuted }]}>
            {today.exercises.length} exercises · {today.type.toUpperCase()}
          </Text>
          {today.exercises.slice(0, 3).map((ex) => (
            <Text key={ex.id} style={[styles.exercise, { color: t.textFaint }]}>
              · {ex.name} {ex.sets}×{ex.reps}
            </Text>
          ))}
          {today.exercises.length > 3 && (
            <Text style={[styles.exercise, { color: t.textFaint }]}>
              + {today.exercises.length - 3} more...
            </Text>
          )}
        </Card>

        {/* Today's Macros */}
        <Card theme={theme}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <Apple size={18} color={Colors.primary} />
            <Text style={[styles.sectionTitle, { color: t.text }]}>Today's Nutrition</Text>
          </View>
          <MacroBar label="Calories" current={totalKcal} target={phase.kcal} color={Colors.kcal} unit=" kcal" theme={theme} />
          <MacroBar label="Protein" current={totalProtein} target={phase.protein} color={Colors.protein} theme={theme} />
          <MacroBar label="Carbs" current={totalCarbs} target={phase.carbs} color={Colors.carbs} theme={theme} />
          <MacroBar label="Fat" current={totalFat} target={phase.fat} color={Colors.fat} theme={theme} />
        </Card>

        {/* Quick Actions */}
        <Text style={[styles.sectionTitle, { color: t.text, marginBottom: 10 }]}>Quick Add</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.quickBtn, { backgroundColor: Colors.primary + '22', borderColor: Colors.primary + '44' }]}
            onPress={quickLogWeight}
          >
            <Scale size={22} color={Colors.primary} />
            <Text style={[styles.quickLabel, { color: Colors.primary }]}>Log Weight</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickBtn, { backgroundColor: Colors.accent + '22', borderColor: Colors.accent + '44' }]}
          >
            <Apple size={22} color={Colors.accent} />
            <Text style={[styles.quickLabel, { color: Colors.accent }]}>Log Meal</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickBtn, { backgroundColor: Colors.success + '22', borderColor: Colors.success + '44' }]}
          >
            <Zap size={22} color={Colors.success} />
            <Text style={[styles.quickLabel, { color: Colors.success }]}>Log Workout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 32 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  greeting: { fontSize: 13, fontWeight: '500', marginBottom: 2 },
  title: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  weekBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  weekText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  phaseBanner: { borderRadius: 10, borderWidth: 1, padding: 12, marginBottom: 14 },
  phaseName: { fontWeight: '700', fontSize: 14 },
  phaseTarget: { fontSize: 12, marginTop: 2 },
  statsRow: { flexDirection: 'row', marginBottom: 12 },
  streakCard: { flexDirection: 'row', paddingVertical: 10 },
  streakText: { fontSize: 16, fontWeight: '800' },
  streakSub: { fontSize: 13 },
  sectionTitle: { fontSize: 15, fontWeight: '700' },
  workoutName: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  workoutType: { fontSize: 12, marginBottom: 8 },
  exercise: { fontSize: 13, marginBottom: 2 },
  doneBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginLeft: 'auto' as any },
  quickActions: { flexDirection: 'row', gap: 10 },
  quickBtn: { flex: 1, borderWidth: 1, borderRadius: 12, padding: 14, alignItems: 'center', gap: 8 },
  quickLabel: { fontSize: 11, fontWeight: '700', textAlign: 'center' },
});
