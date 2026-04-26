import React, { useContext, useState, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Alert, ActivityIndicator, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import ViewShot from 'react-native-view-shot';
import { format, subDays } from 'date-fns';
import { BarChart2, Download, Upload, Share2, TrendingDown } from 'lucide-react-native';
import { ThemeContext } from '../theme/ThemeContext';
import { Colors } from '../theme/colors';
import { store } from '../data/store';
import { getCurrentPhase, todayStr, movingAverage } from '../lib/utils';
import { MacroBar } from '../components/MacroBar';
import type { ExportBundle, UserSettings, WeightEntry, WorkoutLog, DayMeals } from '../data/types';

export function ReportsScreen() {
  const { theme } = useContext(ThemeContext);
  const t = theme === 'dark' ? Colors.dark : Colors.light;
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>([]);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);
  const [meals, setMeals] = useState<DayMeals[]>([]);
  const summaryCardRef = useRef<ViewShot>(null);

  const load = useCallback(async () => {
    const [s, w, wl, m] = await Promise.all([
      store.getSettings(),
      store.getWeightEntries(),
      store.getWorkoutLogs(),
      store.getAllMeals(),
    ]);
    setSettings(s);
    setWeightEntries(w);
    setWorkoutLogs(wl);
    setMeals(m);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  // 7-day window
  const today = new Date();
  const weekAgo = subDays(today, 7);
  const weekAgoStr = format(weekAgo, 'yyyy-MM-dd');
  const todayStr2 = todayStr();

  const weekWeight = weightEntries.filter(e => e.date >= weekAgoStr && e.date <= todayStr2);
  const weekWorkouts = workoutLogs.filter(l => l.date >= weekAgoStr && l.date <= todayStr2 && l.completedAt);
  const weekMeals = meals.filter(m => m.date >= weekAgoStr && m.date <= todayStr2);

  const avgKcal = weekMeals.length > 0
    ? weekMeals.reduce((sum, dm) => sum + Object.values(dm.meals).flat().reduce((s, e) => s + e.kcal, 0), 0) / weekMeals.length
    : 0;

  const weightDelta = weekWeight.length >= 2
    ? weekWeight[weekWeight.length - 1].weightKg - weekWeight[0].weightKg
    : null;

  const phase = settings ? getCurrentPhase(settings) : null;

  // Top lift PR this week
  const prExercise = (() => {
    let best: { name: string; weight: number } | null = null;
    for (const wl of weekWorkouts) {
      for (const ex of wl.exercises) {
        const maxSet = ex.sets.reduce((max, s) => s.weight > max ? s.weight : max, 0);
        if (!best || maxSet > best.weight) best = { name: ex.name, weight: maxSet };
      }
    }
    return best;
  })();

  const exportData = async () => {
    try {
      setLoading(true);
      const bundle = await store.exportAll();
      const json = JSON.stringify(bundle, null, 2);
      const filename = `transformation-tracker-${format(new Date(), 'yyyy-MM-dd-HHmm')}.json`;
      const fileUri = FileSystem.documentDirectory + filename;
      await FileSystem.writeAsStringAsync(fileUri, json);
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/json',
        dialogTitle: 'Export Transformation Data',
        UTI: 'public.json',
      });
    } catch (e) {
      Alert.alert('Export failed', String(e));
    } finally {
      setLoading(false);
    }
  };

  const importData = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const fileUri = result.assets[0].uri;
      const json = await FileSystem.readAsStringAsync(fileUri);
      const bundle: ExportBundle = JSON.parse(json);
      if (!bundle || bundle.version !== 1) {
        Alert.alert('Invalid file', 'This does not appear to be a valid Transformation Tracker backup.');
        return;
      }
      Alert.alert(
        'Import Data',
        `This will overwrite ALL existing data with the backup from ${bundle.exportedAt.split('T')[0]}. Continue?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Import', style: 'destructive', onPress: async () => {
              setLoading(true);
              await store.importAll(bundle);
              await load();
              setLoading(false);
              Alert.alert('Success', 'Data imported successfully!');
            }
          },
        ]
      );
    } catch (e) {
      Alert.alert('Import failed', String(e));
    }
  };

  const shareWeeklySummary = async () => {
    try {
      setLoading(true);
      if (!summaryCardRef.current) {
        Alert.alert('Error', 'Summary card not ready');
        return;
      }
      // @ts-ignore
      const uri = await summaryCardRef.current.capture();
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: 'Share Weekly Summary',
      });
    } catch (e) {
      Alert.alert('Share failed', String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        <Text style={[styles.title, { color: t.text }]}>Reports</Text>

        {/* 7-day summary */}
        <View style={[styles.weekCard, { backgroundColor: t.card, borderColor: t.border }]}>
          <Text style={[styles.cardTitle, { color: t.text }]}>Last 7 Days</Text>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={[styles.statVal, { color: weightDelta !== null && weightDelta < 0 ? Colors.success : weightDelta !== null && weightDelta > 0 ? Colors.error : t.textMuted }]}>
                {weightDelta !== null ? `${weightDelta >= 0 ? '+' : ''}${weightDelta.toFixed(1)} kg` : '—'}
              </Text>
              <Text style={[styles.statLabel, { color: t.textMuted }]}>Weight Δ</Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statVal, { color: Colors.primary }]}>{weekWorkouts.length}</Text>
              <Text style={[styles.statLabel, { color: t.textMuted }]}>Workouts</Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statVal, { color: Colors.kcal }]}>{avgKcal.toFixed(0)}</Text>
              <Text style={[styles.statLabel, { color: t.textMuted }]}>Avg kcal</Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statVal, { color: Colors.accent }]}>{weekWeight.length}</Text>
              <Text style={[styles.statLabel, { color: t.textMuted }]}>Weigh-ins</Text>
            </View>
          </View>
          {prExercise && (
            <View style={[styles.prRow, { backgroundColor: Colors.accent + '22' }]}>
              <Text style={{ color: Colors.accent, fontWeight: '700', fontSize: 13 }}>
                🏆 Top lift: {prExercise.name} — {prExercise.weight} kg
              </Text>
            </View>
          )}
          {phase && (
            <MacroBar label="Avg Calories" current={avgKcal} target={phase.kcal} color={Colors.kcal} unit=" kcal" theme={theme} />
          )}
        </View>

        {/* Off-screen summary card for sharing */}
        <ViewShot ref={summaryCardRef} options={{ format: 'png', quality: 1.0 }}>
          <WeeklySummaryCard
            week={settings ? Math.ceil((new Date().getTime() - new Date(settings.startDate).getTime()) / (7 * 24 * 60 * 60 * 1000)) : 1}
            weightDelta={weightDelta}
            workoutsCount={weekWorkouts.length}
            avgKcal={avgKcal}
            prExercise={prExercise}
            currentWeight={weightEntries.length > 0 ? weightEntries[weightEntries.length - 1].weightKg : null}
            goalWeight={settings?.goalWeightKg ?? 80}
          />
        </ViewShot>

        {/* Actions */}
        <Text style={[styles.sectionTitle, { color: t.text, marginTop: 16, marginBottom: 10 }]}>Actions</Text>

        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: Colors.primary }]}
          onPress={shareWeeklySummary}
          disabled={loading}
        >
          <Share2 size={18} color="#fff" />
          <Text style={styles.actionBtnText}>Share This Week</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: Colors.success }]}
          onPress={exportData}
          disabled={loading}
        >
          <Download size={18} color="#fff" />
          <Text style={styles.actionBtnText}>Export JSON Backup</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: t.card, borderWidth: 1, borderColor: t.border }]}
          onPress={importData}
          disabled={loading}
        >
          <Upload size={18} color={Colors.primary} />
          <Text style={[styles.actionBtnText, { color: Colors.primary }]}>Import JSON Backup</Text>
        </TouchableOpacity>

        {loading && <ActivityIndicator color={Colors.primary} style={{ marginTop: 16 }} />}

        <View style={[styles.interopNote, { backgroundColor: t.card, borderColor: t.border }]}>
          <Text style={[styles.interopTitle, { color: t.text }]}>Data Round-Trip</Text>
          <Text style={[styles.interopText, { color: t.textMuted }]}>
            The exported JSON is fully compatible with the Transformation Tracker webapp.
            Export from this app → import on web, or export from web → import here.
            All data (weight, workouts, meals, photos, measurements, journal) transfers losslessly.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

interface WeeklySummaryCardProps {
  week: number;
  weightDelta: number | null;
  workoutsCount: number;
  avgKcal: number;
  prExercise: { name: string; weight: number } | null;
  currentWeight: number | null;
  goalWeight: number;
}

function WeeklySummaryCard({ week, weightDelta, workoutsCount, avgKcal, prExercise, currentWeight, goalWeight }: WeeklySummaryCardProps) {
  return (
    <View style={summaryStyles.card}>
      <View style={summaryStyles.header}>
        <Text style={summaryStyles.weekLabel}>WEEK {week} SUMMARY</Text>
        <Text style={summaryStyles.date}>{format(new Date(), 'MMM d, yyyy')}</Text>
      </View>
      <Text style={summaryStyles.appName}>Transformation Tracker</Text>
      <Text style={summaryStyles.subtitle}>130 → 80 kg journey</Text>

      <View style={summaryStyles.statsGrid}>
        <View style={summaryStyles.statBox}>
          <Text style={[summaryStyles.statVal, { color: weightDelta !== null && weightDelta < 0 ? '#22c55e' : '#f97316' }]}>
            {weightDelta !== null ? `${weightDelta >= 0 ? '+' : ''}${weightDelta.toFixed(1)}` : '—'}
          </Text>
          <Text style={summaryStyles.statLabel}>kg this week</Text>
        </View>
        <View style={summaryStyles.statBox}>
          <Text style={summaryStyles.statVal}>{workoutsCount}</Text>
          <Text style={summaryStyles.statLabel}>workouts</Text>
        </View>
        <View style={summaryStyles.statBox}>
          <Text style={summaryStyles.statVal}>{avgKcal.toFixed(0)}</Text>
          <Text style={summaryStyles.statLabel}>avg kcal</Text>
        </View>
        <View style={summaryStyles.statBox}>
          <Text style={summaryStyles.statVal}>{currentWeight?.toFixed(1) ?? '—'}</Text>
          <Text style={summaryStyles.statLabel}>current kg</Text>
        </View>
      </View>

      {prExercise && (
        <View style={summaryStyles.prBox}>
          <Text style={summaryStyles.prText}>🏆 {prExercise.name}: {prExercise.weight} kg</Text>
        </View>
      )}

      <Text style={summaryStyles.footer}>
        Goal: {goalWeight} kg · Keep going!
      </Text>
    </View>
  );
}

const summaryStyles = StyleSheet.create({
  card: {
    width: 360,
    backgroundColor: '#0c1220',
    borderRadius: 20,
    padding: 24,
    margin: 0,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  weekLabel: { color: '#0ea5e9', fontWeight: '800', fontSize: 14, letterSpacing: 1 },
  date: { color: '#475569', fontSize: 12 },
  appName: { color: '#e2e8f0', fontSize: 22, fontWeight: '800', marginBottom: 2 },
  subtitle: { color: '#64748b', fontSize: 13, marginBottom: 20 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  statBox: { width: '47%', backgroundColor: '#152035', borderRadius: 12, padding: 14, alignItems: 'center' },
  statVal: { color: '#0ea5e9', fontSize: 28, fontWeight: '800' },
  statLabel: { color: '#64748b', fontSize: 12, marginTop: 4 },
  prBox: { backgroundColor: '#f97316' + '22', borderRadius: 10, padding: 12, marginBottom: 14 },
  prText: { color: '#f97316', fontWeight: '700', fontSize: 14 },
  footer: { color: '#475569', fontSize: 12, textAlign: 'center' },
});

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '800', marginBottom: 14 },
  weekCard: { borderRadius: 12, borderWidth: 1, padding: 16, marginBottom: 14 },
  cardTitle: { fontSize: 15, fontWeight: '700', marginBottom: 12 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  stat: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 11, marginTop: 2 },
  prRow: { borderRadius: 8, padding: 10, marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '700' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 15, borderRadius: 12, marginBottom: 10 },
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  interopNote: { borderRadius: 12, borderWidth: 1, padding: 14, marginTop: 8 },
  interopTitle: { fontSize: 14, fontWeight: '700', marginBottom: 6 },
  interopText: { fontSize: 13, lineHeight: 20 },
});
