import React, { useContext, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Alert, TextInput, Modal, FlatList, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { format } from 'date-fns';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { Plus, Trash2, TrendingDown, Target } from 'lucide-react-native';
import { ThemeContext } from '../theme/ThemeContext';
import { Colors } from '../theme/colors';
import { store, uid } from '../data/store';
import { movingAverage, etaToGoal, todayStr } from '../lib/utils';
import type { WeightEntry, UserSettings } from '../data/types';

const W = Dimensions.get('window').width;

export function WeightScreen() {
  const { theme } = useContext(ThemeContext);
  const t = theme === 'dark' ? Colors.dark : Colors.light;
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [addKg, setAddKg] = useState('');
  const [addDate, setAddDate] = useState(todayStr());
  const [addNotes, setAddNotes] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [e, s] = await Promise.all([store.getWeightEntries(), store.getSettings()]);
    setEntries(e);
    setSettings(s);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const addEntry = async () => {
    const kg = parseFloat(addKg);
    if (isNaN(kg) || kg < 30 || kg > 300) {
      Alert.alert('Invalid', 'Enter a weight between 30–300 kg'); return;
    }
    await store.addWeightEntry({ id: uid(), date: addDate, weightKg: kg, notes: addNotes || undefined });
    setShowAdd(false); setAddKg(''); setAddNotes('');
    await load();
  };

  const deleteEntry = (id: string) => {
    Alert.alert('Delete', 'Delete this entry?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await store.deleteWeightEntry(id); await load(); } },
    ]);
  };

  // Chart data
  const chartEntries = entries.slice(-30);
  const mavg = movingAverage(chartEntries);

  const chartData = chartEntries.length > 1 ? {
    labels: chartEntries.filter((_, i) => i % Math.ceil(chartEntries.length / 5) === 0).map(e => format(new Date(e.date), 'M/d')),
    datasets: [
      {
        data: chartEntries.map(e => e.weightKg),
        color: () => Colors.primary,
        strokeWidth: 2,
      },
      {
        data: mavg.map(m => m.avg),
        color: () => Colors.accent,
        strokeWidth: 2,
        withDots: false,
      },
    ],
    legend: ['Weight', '7-day avg'],
  } : null;

  const latest = entries.length > 0 ? entries[entries.length - 1] : null;
  const eta = settings ? etaToGoal(entries, settings.goalWeightKg) : '';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: t.text }]}>Weight</Text>
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: Colors.primary }]}
            onPress={() => setShowAdd(true)}
          >
            <Plus size={20} color="#fff" />
            <Text style={styles.addBtnText}>Log</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        {latest && settings && (
          <View style={styles.statsRow}>
            <View style={[styles.stat, { backgroundColor: t.card, borderColor: t.border }]}>
              <Text style={[styles.statLabel, { color: t.textMuted }]}>Current</Text>
              <Text style={[styles.statVal, { color: Colors.primary }]}>{latest.weightKg.toFixed(1)} kg</Text>
            </View>
            <View style={[styles.stat, { backgroundColor: t.card, borderColor: t.border }]}>
              <Text style={[styles.statLabel, { color: t.textMuted }]}>Lost</Text>
              <Text style={[styles.statVal, { color: Colors.success }]}>{(settings.startWeightKg - latest.weightKg).toFixed(1)} kg</Text>
            </View>
            <View style={[styles.stat, { backgroundColor: t.card, borderColor: t.border }]}>
              <Text style={[styles.statLabel, { color: t.textMuted }]}>Goal</Text>
              <Text style={[styles.statVal, { color: Colors.accent }]}>{settings.goalWeightKg} kg</Text>
            </View>
          </View>
        )}

        {settings && (
          <View style={[styles.etaCard, { backgroundColor: t.card, borderColor: t.border }]}>
            <TrendingDown size={16} color={Colors.success} />
            <Text style={{ color: t.textMuted, fontSize: 13 }}> ETA to {settings.goalWeightKg} kg: </Text>
            <Text style={{ color: Colors.success, fontSize: 13, fontWeight: '700' }}>{eta}</Text>
          </View>
        )}

        {/* Chart */}
        {chartData && (
          <View style={[styles.chartCard, { backgroundColor: t.card, borderColor: t.border }]}>
            <Text style={[styles.sectionTitle, { color: t.text, marginBottom: 8 }]}>Last 30 Days</Text>
            <LineChart
              data={chartData}
              width={W - 64}
              height={200}
              chartConfig={{
                backgroundColor: t.card,
                backgroundGradientFrom: t.card,
                backgroundGradientTo: t.card,
                decimalPlaces: 1,
                color: (opacity = 1) => Colors.primary,
                labelColor: () => t.textMuted,
                propsForDots: { r: '3', strokeWidth: '1', stroke: Colors.primary },
              }}
              bezier
              style={{ borderRadius: 8 }}
              withInnerLines={false}
              withOuterLines={false}
              withShadow={false}
            />
            <Text style={{ color: t.textFaint, fontSize: 11, marginTop: 4 }}>
              Blue = daily · Orange = 7-day avg
            </Text>
          </View>
        )}

        {entries.length === 0 && (
          <View style={styles.empty}>
            <Text style={{ color: t.textMuted, fontSize: 16 }}>No weight entries yet.</Text>
            <Text style={{ color: t.textFaint, fontSize: 13 }}>Tap "Log" to add your first entry.</Text>
          </View>
        )}

        {/* History */}
        <Text style={[styles.sectionTitle, { color: t.text, marginTop: 8, marginBottom: 10 }]}>History</Text>
        {[...entries].reverse().map((entry) => (
          <View key={entry.id} style={[styles.entryRow, { backgroundColor: t.card, borderColor: t.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.entryDate, { color: t.textMuted }]}>{format(new Date(entry.date), 'EEE, MMM d yyyy')}</Text>
              <Text style={[styles.entryWeight, { color: t.text }]}>{entry.weightKg.toFixed(1)} kg</Text>
              {entry.notes && <Text style={[styles.entryNotes, { color: t.textFaint }]}>{entry.notes}</Text>}
            </View>
            <TouchableOpacity onPress={() => deleteEntry(entry.id)} style={{ padding: 8 }}>
              <Trash2 size={18} color={Colors.error} />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {/* Add Modal */}
      <Modal visible={showAdd} transparent animationType="slide" onRequestClose={() => setShowAdd(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, { backgroundColor: t.surface, borderColor: t.border }]}>
            <Text style={[styles.modalTitle, { color: t.text }]}>Log Weight</Text>
            <TextInput
              style={[styles.input, { color: t.text, borderColor: t.border, backgroundColor: t.surfaceAlt }]}
              placeholder="Weight (kg)"
              placeholderTextColor={t.textFaint}
              keyboardType="decimal-pad"
              value={addKg}
              onChangeText={setAddKg}
              autoFocus
            />
            <TextInput
              style={[styles.input, { color: t.text, borderColor: t.border, backgroundColor: t.surfaceAlt }]}
              placeholder="Date (YYYY-MM-DD)"
              placeholderTextColor={t.textFaint}
              value={addDate}
              onChangeText={setAddDate}
            />
            <TextInput
              style={[styles.input, { color: t.text, borderColor: t.border, backgroundColor: t.surfaceAlt }]}
              placeholder="Notes (optional)"
              placeholderTextColor={t.textFaint}
              value={addNotes}
              onChangeText={setAddNotes}
            />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
              <TouchableOpacity style={[styles.btn, { backgroundColor: t.border, flex: 1 }]} onPress={() => setShowAdd(false)}>
                <Text style={{ color: t.text, fontWeight: '700' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, { backgroundColor: Colors.primary, flex: 1 }]} onPress={addEntry}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 28, fontWeight: '800' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  stat: { flex: 1, borderRadius: 12, borderWidth: 1, padding: 12, alignItems: 'center' },
  statLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },
  statVal: { fontSize: 20, fontWeight: '800', marginTop: 4 },
  etaCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 10, borderWidth: 1, padding: 12, marginBottom: 14 },
  chartCard: { borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '700' },
  entryRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 10, borderWidth: 1, padding: 12, marginBottom: 8 },
  entryDate: { fontSize: 12, marginBottom: 2 },
  entryWeight: { fontSize: 18, fontWeight: '700' },
  entryNotes: { fontSize: 12, marginTop: 2 },
  empty: { alignItems: 'center', padding: 40, gap: 8 },
  modalOverlay: { flex: 1, backgroundColor: '#0008', justifyContent: 'flex-end' },
  modal: { borderRadius: 20, borderWidth: 1, padding: 24, margin: 12 },
  modalTitle: { fontSize: 20, fontWeight: '800', marginBottom: 16 },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 16, marginBottom: 10 },
  btn: { padding: 14, borderRadius: 10, alignItems: 'center' },
});
