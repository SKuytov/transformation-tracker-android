import React, { useContext, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Alert, TextInput, Modal, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { format } from 'date-fns';
import { Dumbbell, Plus, Trash2, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react-native';
import { ThemeContext } from '../theme/ThemeContext';
import { Colors } from '../theme/colors';
import { store, uid } from '../data/store';
import { todayStr } from '../lib/utils';
import { templateForDate, WORKOUT_TEMPLATES } from '../data/seed';
import type { WorkoutLog, ExerciseLog, SetEntry } from '../data/types';

export function WorkoutsScreen() {
  const { theme } = useContext(ThemeContext);
  const t = theme === 'dark' ? Colors.dark : Colors.light;
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [activeLog, setActiveLog] = useState<WorkoutLog | null>(null);
  const [expandedEx, setExpandedEx] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [historyLogs, setHistoryLogs] = useState<WorkoutLog[]>([]);

  const today = templateForDate(new Date());

  const load = useCallback(async () => {
    const all = await store.getWorkoutLogs();
    setLogs(all);
    setHistoryLogs(all.slice(0, 20));
    // Check if today already has a log
    const todayLog = all.find(l => l.date === todayStr());
    if (todayLog) setActiveLog(todayLog);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const startSession = () => {
    const newLog: WorkoutLog = {
      id: uid(),
      date: todayStr(),
      templateId: today.id,
      templateName: today.name,
      exercises: today.exercises.map(ex => ({
        exerciseId: ex.id,
        name: ex.name,
        targetSets: ex.sets,
        targetReps: ex.reps,
        sets: [],
      })),
      startedAt: new Date().toISOString(),
      totalVolumeKg: 0,
    };
    setActiveLog(newLog);
  };

  const addSet = (exerciseId: string, set: SetEntry) => {
    if (!activeLog) return;
    const updated: WorkoutLog = {
      ...activeLog,
      exercises: activeLog.exercises.map(ex =>
        ex.exerciseId === exerciseId
          ? { ...ex, sets: [...ex.sets, set] }
          : ex
      ),
    };
    updated.totalVolumeKg = updated.exercises.reduce(
      (total, ex) => total + ex.sets.reduce((s, set) => s + set.weight * set.reps, 0), 0
    );
    setActiveLog(updated);
  };

  const removeLastSet = (exerciseId: string) => {
    if (!activeLog) return;
    const updated: WorkoutLog = {
      ...activeLog,
      exercises: activeLog.exercises.map(ex =>
        ex.exerciseId === exerciseId
          ? { ...ex, sets: ex.sets.slice(0, -1) }
          : ex
      ),
    };
    setActiveLog(updated);
  };

  const finishSession = async () => {
    if (!activeLog) return;
    const completed: WorkoutLog = { ...activeLog, completedAt: new Date().toISOString() };
    await store.saveWorkoutLog(completed);
    setActiveLog(null);
    await load();
    Alert.alert('Session saved!', `Total volume: ${completed.totalVolumeKg.toFixed(0)} kg`);
  };

  const deleteLog = (id: string) => {
    Alert.alert('Delete', 'Delete this workout log?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await store.deleteWorkoutLog(id); await load(); } },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        <Text style={[styles.title, { color: t.text }]}>Workouts</Text>

        {/* Active session or start button */}
        {activeLog ? (
          <ActiveSession
            log={activeLog}
            theme={theme}
            expandedEx={expandedEx}
            setExpandedEx={setExpandedEx}
            onAddSet={addSet}
            onRemoveLastSet={removeLastSet}
            onFinish={finishSession}
            logs={historyLogs}
          />
        ) : (
          <>
            {/* Today's Template Preview */}
            <View style={[styles.todayCard, { backgroundColor: t.card, borderColor: t.border }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <Dumbbell size={20} color={Colors.primary} />
                <Text style={[styles.sectionTitle, { color: t.text }]}>Today</Text>
                <View style={[styles.typeBadge, { backgroundColor: (today.type === 'gym' ? Colors.primary : Colors.accent) + '22' }]}>
                  <Text style={{ color: today.type === 'gym' ? Colors.primary : Colors.accent, fontSize: 11, fontWeight: '700' }}>
                    {today.type.toUpperCase()}
                  </Text>
                </View>
              </View>
              <Text style={[styles.workoutName, { color: Colors.primary }]}>{today.name}</Text>
              {today.exercises.map(ex => (
                <View key={ex.id} style={styles.exPreview}>
                  <Text style={[styles.exName, { color: t.text }]}>{ex.name}</Text>
                  <Text style={[styles.exSets, { color: t.textMuted }]}>{ex.sets}×{ex.reps}</Text>
                </View>
              ))}
              {today.type !== 'rest' && today.type !== 'prep' && (
                <TouchableOpacity
                  style={[styles.startBtn, { backgroundColor: Colors.primary }]}
                  onPress={startSession}
                >
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Start Session</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* History */}
            <Text style={[styles.sectionTitle, { color: t.text, marginTop: 8, marginBottom: 10 }]}>History</Text>
            {historyLogs.length === 0 && (
              <Text style={{ color: t.textMuted, textAlign: 'center', padding: 20 }}>No workout history yet.</Text>
            )}
            {historyLogs.map(log => (
              <View key={log.id} style={[styles.logRow, { backgroundColor: t.card, borderColor: t.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.logDate, { color: t.textMuted }]}>{format(new Date(log.date), 'EEE, MMM d')}</Text>
                  <Text style={[styles.logName, { color: t.text }]}>{log.templateName}</Text>
                  <Text style={[styles.logVolume, { color: t.textFaint }]}>{log.exercises.length} exercises · {log.totalVolumeKg.toFixed(0)} kg volume</Text>
                </View>
                {log.completedAt && <CheckCircle size={18} color={Colors.success} />}
                <TouchableOpacity onPress={() => deleteLog(log.id)} style={{ padding: 8 }}>
                  <Trash2 size={16} color={Colors.error} />
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

interface ActiveSessionProps {
  log: WorkoutLog;
  theme: 'dark' | 'light';
  expandedEx: string | null;
  setExpandedEx: (id: string | null) => void;
  onAddSet: (exerciseId: string, set: SetEntry) => void;
  onRemoveLastSet: (exerciseId: string) => void;
  onFinish: () => void;
  logs: WorkoutLog[];
}

function ActiveSession({ log, theme, expandedEx, setExpandedEx, onAddSet, onRemoveLastSet, onFinish, logs }: ActiveSessionProps) {
  const t = theme === 'dark' ? Colors.dark : Colors.light;
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [rpe, setRpe] = useState('');

  // Find last time this exercise was done
  function getLastSets(exerciseId: string): SetEntry[] | null {
    for (const log of logs) {
      const ex = log.exercises.find(e => e.exerciseId === exerciseId);
      if (ex && ex.sets.length > 0) return ex.sets;
    }
    return null;
  }

  return (
    <>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Text style={{ color: Colors.primary, fontWeight: '700', fontSize: 15 }}>
          {log.templateName}
        </Text>
        <TouchableOpacity
          style={{ backgroundColor: Colors.success, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 }}
          onPress={onFinish}
        >
          <Text style={{ color: '#fff', fontWeight: '700' }}>Finish</Text>
        </TouchableOpacity>
      </View>
      <Text style={{ color: Colors.accent, marginBottom: 12, fontWeight: '600' }}>
        Volume: {log.totalVolumeKg.toFixed(0)} kg
      </Text>

      {log.exercises.map(ex => {
        const isExpanded = expandedEx === ex.exerciseId;
        const lastSets = getLastSets(ex.exerciseId);

        return (
          <View key={ex.exerciseId} style={{ borderRadius: 12, borderWidth: 1, borderColor: t.border, backgroundColor: t.card, marginBottom: 10, overflow: 'hidden' }}>
            <TouchableOpacity
              style={{ padding: 14, flexDirection: 'row', alignItems: 'center' }}
              onPress={() => setExpandedEx(isExpanded ? null : ex.exerciseId)}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ color: t.text, fontWeight: '700', fontSize: 15 }}>{ex.name}</Text>
                <Text style={{ color: t.textMuted, fontSize: 12 }}>Target: {ex.targetSets}×{ex.targetReps} · Done: {ex.sets.length} sets</Text>
                {lastSets && (
                  <Text style={{ color: t.textFaint, fontSize: 11 }}>
                    Last: {lastSets.map(s => `${s.weight}kg×${s.reps}`).join(', ')}
                  </Text>
                )}
              </View>
              {isExpanded ? <ChevronUp size={18} color={t.textMuted} /> : <ChevronDown size={18} color={t.textMuted} />}
            </TouchableOpacity>

            {isExpanded && (
              <View style={{ padding: 14, paddingTop: 0 }}>
                {/* Logged sets */}
                {ex.sets.map((set, i) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                    <Text style={{ color: t.textMuted, width: 28, fontSize: 13 }}>{i + 1}.</Text>
                    <Text style={{ color: t.text, flex: 1, fontSize: 13 }}>{set.weight} kg × {set.reps} reps{set.rpe ? ` @ RPE ${set.rpe}` : ''}</Text>
                  </View>
                ))}

                {/* Add set row */}
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                  <TextInput
                    style={{ flex: 1, borderWidth: 1, borderColor: t.border, borderRadius: 8, padding: 8, color: t.text, backgroundColor: t.surfaceAlt, fontSize: 14 }}
                    placeholder="kg"
                    placeholderTextColor={t.textFaint}
                    keyboardType="decimal-pad"
                    value={weight}
                    onChangeText={setWeight}
                  />
                  <TextInput
                    style={{ flex: 1, borderWidth: 1, borderColor: t.border, borderRadius: 8, padding: 8, color: t.text, backgroundColor: t.surfaceAlt, fontSize: 14 }}
                    placeholder="reps"
                    placeholderTextColor={t.textFaint}
                    keyboardType="number-pad"
                    value={reps}
                    onChangeText={setReps}
                  />
                  <TextInput
                    style={{ width: 52, borderWidth: 1, borderColor: t.border, borderRadius: 8, padding: 8, color: t.text, backgroundColor: t.surfaceAlt, fontSize: 14 }}
                    placeholder="RPE"
                    placeholderTextColor={t.textFaint}
                    keyboardType="decimal-pad"
                    value={rpe}
                    onChangeText={setRpe}
                  />
                </View>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                  <TouchableOpacity
                    style={{ flex: 1, backgroundColor: Colors.primary, borderRadius: 8, padding: 10, alignItems: 'center' }}
                    onPress={() => {
                      const w = parseFloat(weight);
                      const r = parseInt(reps);
                      if (isNaN(w) || isNaN(r)) return;
                      onAddSet(ex.exerciseId, { weight: w, reps: r, rpe: rpe ? parseFloat(rpe) : undefined });
                      setWeight(''); setReps(''); setRpe('');
                    }}
                  >
                    <Text style={{ color: '#fff', fontWeight: '700' }}>+ Add Set</Text>
                  </TouchableOpacity>
                  {ex.sets.length > 0 && (
                    <TouchableOpacity
                      style={{ backgroundColor: Colors.error + '22', borderRadius: 8, padding: 10, paddingHorizontal: 14 }}
                      onPress={() => onRemoveLastSet(ex.exerciseId)}
                    >
                      <Text style={{ color: Colors.error, fontWeight: '700' }}>Undo</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}
          </View>
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '800', marginBottom: 16 },
  todayCard: { borderRadius: 12, borderWidth: 1, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '700' },
  workoutName: { fontSize: 17, fontWeight: '700', marginBottom: 10 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginLeft: 'auto' as any },
  exPreview: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  exName: { fontSize: 14 },
  exSets: { fontSize: 13 },
  startBtn: { marginTop: 14, padding: 14, borderRadius: 10, alignItems: 'center' },
  logRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 10, borderWidth: 1, padding: 12, marginBottom: 8, gap: 8 },
  logDate: { fontSize: 12, marginBottom: 2 },
  logName: { fontSize: 15, fontWeight: '700' },
  logVolume: { fontSize: 12, marginTop: 2 },
});
