import React, { useContext, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Switch, Alert, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Settings, Sun, Moon, Bell, User, Trash2, RefreshCw } from 'lucide-react-native';
import { ThemeContext } from '../theme/ThemeContext';
import { Colors } from '../theme/colors';
import { store } from '../data/store';
import { scheduleAllNotifications, cancelAllNotifications } from '../notifications/scheduler';
import type { UserSettings, PhaseKey } from '../data/types';

const PHASE_KEYS: { key: PhaseKey; label: string }[] = [
  { key: 'foundation', label: 'Phase 1: Foundation' },
  { key: 'acceleration', label: 'Phase 2: Acceleration' },
  { key: 'grind', label: 'Phase 3: Grind' },
  { key: 'reveal', label: 'Phase 4: Reveal' },
  { key: 'final-cut', label: 'Phase 5: Final Cut' },
];

export function SettingsScreen() {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const t = theme === 'dark' ? Colors.dark : Colors.light;
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form fields
  const [startWeight, setStartWeight] = useState('');
  const [goalWeight, setGoalWeight] = useState('');
  const [height, setHeight] = useState('');
  const [age, setAge] = useState('');
  const [weighInTime, setWeighInTime] = useState('');
  const [workoutTime, setWorkoutTime] = useState('');
  const [mealReminders, setMealReminders] = useState(true);

  const load = useCallback(async () => {
    const s = await store.getSettings();
    setSettings(s);
    setStartWeight(s.startWeightKg.toString());
    setGoalWeight(s.goalWeightKg.toString());
    setHeight(s.heightCm.toString());
    setAge(s.age.toString());
    setWeighInTime(s.notifications.weighInTime);
    setWorkoutTime(s.notifications.workoutTime);
    setMealReminders(s.notifications.mealReminders);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const save = async () => {
    setSaving(true);
    try {
      const patch: Partial<UserSettings> = {
        startWeightKg: parseFloat(startWeight) || settings!.startWeightKg,
        goalWeightKg: parseFloat(goalWeight) || settings!.goalWeightKg,
        heightCm: parseFloat(height) || settings!.heightCm,
        age: parseInt(age) || settings!.age,
        notifications: {
          weighInTime,
          workoutTime,
          mealReminders,
        },
      };
      const updated = await store.updateSettings(patch);
      setSettings(updated);
      // Reschedule notifications with new times
      await cancelAllNotifications();
      await scheduleAllNotifications(updated);
      Alert.alert('Saved', 'Settings saved and notifications rescheduled.');
    } catch (e) {
      Alert.alert('Error', String(e));
    } finally {
      setSaving(false);
    }
  };

  const setPhaseOverride = async (key: PhaseKey | null) => {
    const updated = await store.updateSettings({ phaseOverride: key });
    setSettings(updated);
  };

  const resetAll = () => {
    Alert.alert(
      'Reset All Data',
      'This will permanently delete ALL your data: weight, workouts, meals, photos, measurements, journal. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'DELETE EVERYTHING', style: 'destructive', onPress: async () => {
            await store.resetAll();
            await cancelAllNotifications();
            await load();
            Alert.alert('Reset complete', 'All data has been deleted.');
          }
        },
      ]
    );
  };

  const rescheduleNotifications = async () => {
    if (!settings) return;
    try {
      await cancelAllNotifications();
      await scheduleAllNotifications(settings);
      Alert.alert('Done', 'Notifications rescheduled. Check your notification settings if you don\'t see them.');
    } catch (e) {
      Alert.alert('Error', String(e));
    }
  };

  if (!settings) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: t.bg, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: t.textMuted }}>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        <Text style={[styles.title, { color: t.text }]}>Settings</Text>

        {/* Theme toggle */}
        <SectionHeader title="Appearance" icon={theme === 'dark' ? Moon : Sun} color={Colors.primary} t={t} />
        <View style={[styles.row, { backgroundColor: t.card, borderColor: t.border }]}>
          <Text style={[styles.rowLabel, { color: t.text }]}>Dark Mode</Text>
          <Switch
            value={theme === 'dark'}
            onValueChange={toggleTheme}
            trackColor={{ false: t.border, true: Colors.primary }}
            thumbColor="#fff"
          />
        </View>

        {/* Body stats */}
        <SectionHeader title="Body Stats" icon={User} color={Colors.accent} t={t} />
        {[
          { label: 'Start Weight (kg)', value: startWeight, onChange: setStartWeight },
          { label: 'Goal Weight (kg)', value: goalWeight, onChange: setGoalWeight },
          { label: 'Height (cm)', value: height, onChange: setHeight },
          { label: 'Age', value: age, onChange: setAge },
        ].map(({ label, value, onChange }) => (
          <View key={label} style={[styles.inputRow, { backgroundColor: t.card, borderColor: t.border }]}>
            <Text style={[styles.inputLabel, { color: t.textMuted }]}>{label}</Text>
            <TextInput
              style={[styles.inputField, { color: t.text }]}
              value={value}
              onChangeText={onChange}
              keyboardType="decimal-pad"
              placeholderTextColor={t.textFaint}
            />
          </View>
        ))}

        {/* Notifications */}
        <SectionHeader title="Notifications" icon={Bell} color={Colors.success} t={t} />
        {[
          { label: 'Weigh-in Time', value: weighInTime, onChange: setWeighInTime, hint: 'HH:mm, e.g. 04:00' },
          { label: 'Post-Workout Time', value: workoutTime, onChange: setWorkoutTime, hint: 'HH:mm, e.g. 04:50' },
        ].map(({ label, value, onChange, hint }) => (
          <View key={label} style={[styles.inputRow, { backgroundColor: t.card, borderColor: t.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.inputLabel, { color: t.textMuted }]}>{label}</Text>
              <Text style={[styles.hint, { color: t.textFaint }]}>{hint}</Text>
            </View>
            <TextInput
              style={[styles.inputField, { color: t.text, width: 80, textAlign: 'right' }]}
              value={value}
              onChangeText={onChange}
              placeholderTextColor={t.textFaint}
              placeholder="HH:mm"
            />
          </View>
        ))}
        <View style={[styles.row, { backgroundColor: t.card, borderColor: t.border }]}>
          <Text style={[styles.rowLabel, { color: t.text }]}>Meal Reminders</Text>
          <Switch
            value={mealReminders}
            onValueChange={setMealReminders}
            trackColor={{ false: t.border, true: Colors.success }}
            thumbColor="#fff"
          />
        </View>

        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: Colors.success + '22', borderColor: Colors.success + '44', borderWidth: 1 }]}
          onPress={rescheduleNotifications}
        >
          <Bell size={18} color={Colors.success} />
          <Text style={{ color: Colors.success, fontWeight: '700' }}>Reschedule Notifications Now</Text>
        </TouchableOpacity>

        {/* Phase override */}
        <SectionHeader title="Phase Override" icon={RefreshCw} color={Colors.warning} t={t} />
        <Text style={{ color: t.textMuted, fontSize: 13, marginBottom: 8 }}>
          Force the app to show a specific phase regardless of date. Leave unset for automatic.
        </Text>
        <TouchableOpacity
          style={[styles.phaseBtn, { backgroundColor: !settings.phaseOverride ? Colors.primary + '22' : t.surfaceAlt, borderColor: !settings.phaseOverride ? Colors.primary : t.border }]}
          onPress={() => setPhaseOverride(null)}
        >
          <Text style={{ color: !settings.phaseOverride ? Colors.primary : t.textMuted, fontWeight: '700' }}>Auto (by date)</Text>
        </TouchableOpacity>
        {PHASE_KEYS.map(({ key, label }) => (
          <TouchableOpacity
            key={key}
            style={[styles.phaseBtn, { backgroundColor: settings.phaseOverride === key ? (Colors.phases as any)[key] + '22' : t.surfaceAlt, borderColor: settings.phaseOverride === key ? (Colors.phases as any)[key] : t.border }]}
            onPress={() => setPhaseOverride(key)}
          >
            <Text style={{ color: settings.phaseOverride === key ? (Colors.phases as any)[key] : t.textMuted, fontWeight: '700' }}>{label}</Text>
          </TouchableOpacity>
        ))}

        {/* Save button */}
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: Colors.primary, opacity: saving ? 0.7 : 1 }]}
          onPress={save}
          disabled={saving}
        >
          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>{saving ? 'Saving...' : 'Save Settings'}</Text>
        </TouchableOpacity>

        {/* Danger zone */}
        <SectionHeader title="Danger Zone" icon={Trash2} color={Colors.error} t={t} />
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: Colors.error + '11', borderColor: Colors.error + '33', borderWidth: 1 }]}
          onPress={resetAll}
        >
          <Trash2 size={18} color={Colors.error} />
          <Text style={{ color: Colors.error, fontWeight: '700' }}>Reset All Data</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionHeader({ title, icon: Icon, color, t }: { title: string; icon: any; color: string; t: any }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 18, marginBottom: 8 }}>
      <Icon size={16} color={color} />
      <Text style={{ color: t.textMuted, fontWeight: '700', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '800', marginBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 8 },
  rowLabel: { fontSize: 15, fontWeight: '600' },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 8 },
  inputLabel: { fontSize: 14, fontWeight: '600', flex: 1 },
  inputField: { fontSize: 15, fontWeight: '700', minWidth: 80, textAlign: 'right' },
  hint: { fontSize: 11, marginTop: 2 },
  phaseBtn: { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 8 },
  saveBtn: { padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 20, marginBottom: 10 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 14, borderRadius: 12, marginBottom: 10 },
});
