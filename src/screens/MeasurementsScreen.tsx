import React, { useContext, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Modal, Alert, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { format } from 'date-fns';
import { Ruler, Plus, Trash2 } from 'lucide-react-native';
import { ThemeContext } from '../theme/ThemeContext';
import { Colors } from '../theme/colors';
import { store, uid } from '../data/store';
import { todayStr } from '../lib/utils';
import type { MeasurementEntry } from '../data/types';

const SITES = [
  { key: 'waistCm' as const, label: 'Waist' },
  { key: 'chestCm' as const, label: 'Chest' },
  { key: 'hipsCm' as const, label: 'Hips' },
  { key: 'thighCm' as const, label: 'Thigh' },
  { key: 'armCm' as const, label: 'Arm' },
  { key: 'neckCm' as const, label: 'Neck' },
];

export function MeasurementsScreen() {
  const { theme } = useContext(ThemeContext);
  const t = theme === 'dark' ? Colors.dark : Colors.light;
  const [entries, setEntries] = useState<MeasurementEntry[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [addDate, setAddDate] = useState(todayStr());
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const e = await store.getMeasurements();
    setEntries(e);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const save = async () => {
    const entry: MeasurementEntry = {
      id: uid(),
      date: addDate,
      ...Object.fromEntries(SITES.map(s => [s.key, form[s.key] ? parseFloat(form[s.key]) : undefined])),
    };
    await store.addMeasurement(entry);
    setShowAdd(false);
    setForm({});
    await load();
  };

  const del = (id: string) => {
    Alert.alert('Delete', 'Delete this measurement?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await store.deleteMeasurement(id); await load(); } },
    ]);
  };

  // Sparkline: last value for each site
  const latest = entries.length > 0 ? entries[entries.length - 1] : null;
  const oldest = entries.length > 0 ? entries[0] : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: t.text }]}>Measurements</Text>
          <TouchableOpacity style={[styles.addBtn, { backgroundColor: Colors.primary }]} onPress={() => setShowAdd(true)}>
            <Plus size={18} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '700' }}>Log</Text>
          </TouchableOpacity>
        </View>

        {/* Site summary */}
        <View style={styles.siteGrid}>
          {SITES.map(site => {
            const latestVal = latest?.[site.key];
            const oldestVal = oldest?.[site.key];
            const delta = latestVal && oldestVal ? latestVal - oldestVal : null;

            return (
              <View key={site.key} style={[styles.siteCard, { backgroundColor: t.card, borderColor: t.border }]}>
                <Text style={[styles.siteLabel, { color: t.textMuted }]}>{site.label}</Text>
                <Text style={[styles.siteVal, { color: Colors.primary }]}>
                  {latestVal ? `${latestVal.toFixed(1)} cm` : '—'}
                </Text>
                {delta !== null && (
                  <Text style={{ color: delta < 0 ? Colors.success : Colors.error, fontSize: 11, fontWeight: '700' }}>
                    {delta >= 0 ? '+' : ''}{delta.toFixed(1)} cm
                  </Text>
                )}
              </View>
            );
          })}
        </View>

        {/* History */}
        <Text style={[styles.sectionTitle, { color: t.text, marginTop: 16, marginBottom: 10 }]}>History</Text>
        {entries.length === 0 && (
          <View style={{ alignItems: 'center', padding: 32 }}>
            <Ruler size={40} color={t.textFaint} />
            <Text style={{ color: t.textMuted, marginTop: 12 }}>No measurements yet.</Text>
          </View>
        )}
        {[...entries].reverse().map(entry => (
          <View key={entry.id} style={[styles.entryRow, { backgroundColor: t.card, borderColor: t.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.entryDate, { color: t.textMuted }]}>{format(new Date(entry.date), 'EEE, MMM d yyyy')}</Text>
              <View style={styles.entryMeasures}>
                {SITES.map(site => entry[site.key] ? (
                  <Text key={site.key} style={[styles.measure, { color: t.text }]}>
                    {site.label}: {(entry[site.key] as number).toFixed(1)}cm
                  </Text>
                ) : null)}
              </View>
            </View>
            <TouchableOpacity onPress={() => del(entry.id)} style={{ padding: 8 }}>
              <Trash2 size={16} color={Colors.error} />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {/* Add Modal */}
      <Modal visible={showAdd} transparent animationType="slide" onRequestClose={() => setShowAdd(false)}>
        <View style={styles.overlay}>
          <ScrollView style={[styles.modal, { backgroundColor: t.surface, borderColor: t.border }]}>
            <Text style={[styles.modalTitle, { color: t.text }]}>Log Measurements</Text>
            <TextInput
              style={[styles.input, { color: t.text, borderColor: t.border, backgroundColor: t.surfaceAlt }]}
              placeholder="Date (YYYY-MM-DD)"
              placeholderTextColor={t.textFaint}
              value={addDate}
              onChangeText={setAddDate}
            />
            {SITES.map(site => (
              <TextInput
                key={site.key}
                style={[styles.input, { color: t.text, borderColor: t.border, backgroundColor: t.surfaceAlt }]}
                placeholder={`${site.label} (cm) — optional`}
                placeholderTextColor={t.textFaint}
                keyboardType="decimal-pad"
                value={form[site.key] ?? ''}
                onChangeText={v => setForm({ ...form, [site.key]: v })}
              />
            ))}
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 8, marginBottom: 20 }}>
              <TouchableOpacity style={[styles.btn, { backgroundColor: t.border, flex: 1 }]} onPress={() => setShowAdd(false)}>
                <Text style={{ color: t.text, fontWeight: '700' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, { backgroundColor: Colors.primary, flex: 1 }]} onPress={save}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>Save</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 28, fontWeight: '800' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  siteGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  siteCard: { width: '30%', borderRadius: 10, borderWidth: 1, padding: 12, alignItems: 'center' },
  siteLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },
  siteVal: { fontSize: 18, fontWeight: '800', marginTop: 4 },
  sectionTitle: { fontSize: 15, fontWeight: '700' },
  entryRow: { borderRadius: 10, borderWidth: 1, padding: 12, marginBottom: 8, flexDirection: 'row', alignItems: 'flex-start' },
  entryDate: { fontSize: 12, marginBottom: 6 },
  entryMeasures: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  measure: { fontSize: 13, fontWeight: '600' },
  overlay: { flex: 1, backgroundColor: '#0008', justifyContent: 'flex-end' },
  modal: { borderRadius: 20, borderWidth: 1, padding: 20, margin: 10, maxHeight: '90%' },
  modalTitle: { fontSize: 20, fontWeight: '800', marginBottom: 14 },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 15, marginBottom: 8 },
  btn: { padding: 14, borderRadius: 10, alignItems: 'center' },
});
