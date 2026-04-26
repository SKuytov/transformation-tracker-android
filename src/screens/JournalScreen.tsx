import React, { useContext, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Modal, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Moon, Zap, Smile } from 'lucide-react-native';
import { ThemeContext } from '../theme/ThemeContext';
import { Colors } from '../theme/colors';
import { store } from '../data/store';
import { todayStr } from '../lib/utils';
import type { JournalEntry } from '../data/types';

export function JournalScreen() {
  const { theme } = useContext(ThemeContext);
  const t = theme === 'dark' ? Colors.dark : Colors.light;
  const [allEntries, setAllEntries] = useState<Record<string, JournalEntry>>({});
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [showEditor, setShowEditor] = useState(false);
  const [formSleep, setFormSleep] = useState('');
  const [formMood, setFormMood] = useState(0);
  const [formEnergy, setFormEnergy] = useState(0);
  const [formNotes, setFormNotes] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const entries = await store.getAllJournal();
    const map: Record<string, JournalEntry> = {};
    entries.forEach(e => { map[e.date] = e; });
    setAllEntries(map);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const openEditor = (date: string) => {
    const existing = allEntries[date];
    setSelectedDate(date);
    setFormSleep(existing?.sleepHours?.toString() ?? '');
    setFormMood(existing?.mood ?? 0);
    setFormEnergy(existing?.energy ?? 0);
    setFormNotes(existing?.notes ?? '');
    setShowEditor(true);
  };

  const saveEntry = async () => {
    const entry: JournalEntry = {
      date: selectedDate,
      sleepHours: formSleep ? parseFloat(formSleep) : undefined,
      mood: formMood || undefined,
      energy: formEnergy || undefined,
      notes: formNotes || undefined,
    };
    await store.setJournal(entry);
    setShowEditor(false);
    await load();
  };

  // Calendar
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  // Fill leading empty cells
  const startDow = getDay(monthStart); // 0=Sun
  const leadingEmpty = Array(startDow).fill(null);

  const prevMonth = () => setCurrentMonth(d => new Date(d.getFullYear(), d.getMonth() - 1));
  const nextMonth = () => setCurrentMonth(d => new Date(d.getFullYear(), d.getMonth() + 1));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        <Text style={[styles.title, { color: t.text }]}>Journal</Text>

        {/* Month header */}
        <View style={styles.monthHeader}>
          <TouchableOpacity onPress={prevMonth} style={{ padding: 8 }}>
            <ChevronLeft size={22} color={t.textMuted} />
          </TouchableOpacity>
          <Text style={[styles.monthLabel, { color: t.text }]}>{format(currentMonth, 'MMMM yyyy')}</Text>
          <TouchableOpacity onPress={nextMonth} style={{ padding: 8 }}>
            <ChevronRight size={22} color={t.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Day labels */}
        <View style={styles.dayLabels}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <Text key={d} style={[styles.dayLabel, { color: t.textFaint }]}>{d}</Text>
          ))}
        </View>

        {/* Calendar grid */}
        <View style={styles.calGrid}>
          {leadingEmpty.map((_, i) => (
            <View key={`empty-${i}`} style={styles.dayCell} />
          ))}
          {days.map(day => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const entry = allEntries[dateStr];
            const isToday = dateStr === todayStr();
            const hasEntry = !!entry;
            const moodColor = entry?.mood ? [Colors.error, Colors.warning, Colors.accent, Colors.success, Colors.primary][entry.mood - 1] : null;

            return (
              <TouchableOpacity
                key={dateStr}
                style={[
                  styles.dayCell,
                  {
                    backgroundColor: isToday ? Colors.primary + '22' : 'transparent',
                    borderColor: isToday ? Colors.primary : 'transparent',
                    borderWidth: isToday ? 1 : 0,
                    borderRadius: 8,
                  }
                ]}
                onPress={() => openEditor(dateStr)}
              >
                <Text style={[styles.dayNum, { color: isToday ? Colors.primary : t.text }]}>
                  {format(day, 'd')}
                </Text>
                {hasEntry && (
                  <View style={[styles.dot, { backgroundColor: moodColor ?? Colors.primary }]} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Recent entries */}
        <Text style={[styles.sectionTitle, { color: t.text, marginTop: 16, marginBottom: 10 }]}>Recent</Text>
        {Object.entries(allEntries)
          .sort(([a], [b]) => b.localeCompare(a))
          .slice(0, 10)
          .map(([date, entry]) => (
            <TouchableOpacity
              key={date}
              style={[styles.entryRow, { backgroundColor: t.card, borderColor: t.border }]}
              onPress={() => openEditor(date)}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.entryDate, { color: t.textMuted }]}>{format(new Date(date), 'EEE, MMM d')}</Text>
                <View style={{ flexDirection: 'row', gap: 12, marginTop: 4 }}>
                  {entry.sleepHours && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Moon size={13} color={t.textMuted} />
                      <Text style={{ color: t.text, fontSize: 13 }}>{entry.sleepHours}h</Text>
                    </View>
                  )}
                  {entry.mood && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Smile size={13} color={t.textMuted} />
                      <Text style={{ color: t.text, fontSize: 13 }}>{entry.mood}/5</Text>
                    </View>
                  )}
                  {entry.energy && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Zap size={13} color={t.textMuted} />
                      <Text style={{ color: t.text, fontSize: 13 }}>{entry.energy}/5</Text>
                    </View>
                  )}
                </View>
                {entry.notes && (
                  <Text style={{ color: t.textFaint, fontSize: 12, marginTop: 4 }} numberOfLines={1}>{entry.notes}</Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
      </ScrollView>

      {/* Editor Modal */}
      <Modal visible={showEditor} transparent animationType="slide" onRequestClose={() => setShowEditor(false)}>
        <View style={styles.overlay}>
          <ScrollView style={[styles.modal, { backgroundColor: t.surface, borderColor: t.border }]}>
            <Text style={[styles.modalTitle, { color: t.text }]}>
              {format(new Date(selectedDate), 'EEE, MMM d yyyy')}
            </Text>

            <Text style={[styles.fieldLabel, { color: t.textMuted }]}>Sleep hours</Text>
            <TextInput
              style={[styles.input, { color: t.text, borderColor: t.border, backgroundColor: t.surfaceAlt }]}
              placeholder="7.5"
              placeholderTextColor={t.textFaint}
              keyboardType="decimal-pad"
              value={formSleep}
              onChangeText={setFormSleep}
            />

            <Text style={[styles.fieldLabel, { color: t.textMuted }]}>Mood (1–5)</Text>
            <View style={styles.ratingRow}>
              {[1, 2, 3, 4, 5].map(n => (
                <TouchableOpacity
                  key={n}
                  style={[styles.ratingBtn, { backgroundColor: formMood === n ? Colors.primary : t.surfaceAlt, borderColor: formMood === n ? Colors.primary : t.border }]}
                  onPress={() => setFormMood(n)}
                >
                  <Text style={{ color: formMood === n ? '#fff' : t.textMuted, fontWeight: '700' }}>{n}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.fieldLabel, { color: t.textMuted }]}>Energy (1–5)</Text>
            <View style={styles.ratingRow}>
              {[1, 2, 3, 4, 5].map(n => (
                <TouchableOpacity
                  key={n}
                  style={[styles.ratingBtn, { backgroundColor: formEnergy === n ? Colors.accent : t.surfaceAlt, borderColor: formEnergy === n ? Colors.accent : t.border }]}
                  onPress={() => setFormEnergy(n)}
                >
                  <Text style={{ color: formEnergy === n ? '#fff' : t.textMuted, fontWeight: '700' }}>{n}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.fieldLabel, { color: t.textMuted }]}>Notes</Text>
            <TextInput
              style={[styles.input, styles.notesInput, { color: t.text, borderColor: t.border, backgroundColor: t.surfaceAlt }]}
              placeholder="How was your day?"
              placeholderTextColor={t.textFaint}
              multiline
              value={formNotes}
              onChangeText={setFormNotes}
            />

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 8, marginBottom: 24 }}>
              <TouchableOpacity style={[styles.btn, { backgroundColor: t.border, flex: 1 }]} onPress={() => setShowEditor(false)}>
                <Text style={{ color: t.text, fontWeight: '700' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, { backgroundColor: Colors.primary, flex: 1 }]} onPress={saveEntry}>
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
  title: { fontSize: 28, fontWeight: '800', marginBottom: 14 },
  monthHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  monthLabel: { fontSize: 17, fontWeight: '700' },
  dayLabels: { flexDirection: 'row', marginBottom: 4 },
  dayLabel: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '600' },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', padding: 2 },
  dayNum: { fontSize: 13, fontWeight: '600' },
  dot: { width: 5, height: 5, borderRadius: 3, marginTop: 2 },
  sectionTitle: { fontSize: 15, fontWeight: '700' },
  entryRow: { borderRadius: 10, borderWidth: 1, padding: 12, marginBottom: 8 },
  entryDate: { fontSize: 12, fontWeight: '600' },
  overlay: { flex: 1, backgroundColor: '#0008', justifyContent: 'flex-end' },
  modal: { borderRadius: 20, borderWidth: 1, padding: 20, margin: 10, maxHeight: '90%' },
  modalTitle: { fontSize: 20, fontWeight: '800', marginBottom: 16 },
  fieldLabel: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 15, marginBottom: 12 },
  notesInput: { height: 100, textAlignVertical: 'top' },
  ratingRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  ratingBtn: { flex: 1, padding: 12, borderRadius: 8, borderWidth: 1, alignItems: 'center' },
  btn: { padding: 14, borderRadius: 10, alignItems: 'center' },
});
