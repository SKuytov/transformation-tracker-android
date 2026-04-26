import React, { useContext, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Trophy, ChevronDown, ChevronUp, Dumbbell } from 'lucide-react-native';
import { ThemeContext } from '../theme/ThemeContext';
import { Colors } from '../theme/colors';
import { PHASES, WORKOUT_TEMPLATES } from '../data/seed';

export function ProgramScreen() {
  const { theme } = useContext(ThemeContext);
  const t = theme === 'dark' ? Colors.dark : Colors.light;
  const [expandedPhase, setExpandedPhase] = useState<string | null>('foundation');
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <Trophy size={22} color={Colors.primary} />
          <Text style={[styles.title, { color: t.text }]}>Training Program</Text>
        </View>
        <Text style={[styles.subtitle, { color: t.textMuted }]}>
          130 → 80 kg · 52 weeks · 5 phases
        </Text>

        {/* Phases */}
        <Text style={[styles.sectionTitle, { color: t.text, marginTop: 16, marginBottom: 10 }]}>Phases</Text>
        {PHASES.map(phase => {
          const isExpanded = expandedPhase === phase.key;
          const phaseColor = (Colors.phases as any)[phase.key];

          return (
            <View key={phase.key} style={[styles.phaseCard, { backgroundColor: t.card, borderColor: phaseColor + '44' }]}>
              <TouchableOpacity
                style={styles.phaseHeader}
                onPress={() => setExpandedPhase(isExpanded ? null : phase.key)}
              >
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={[styles.phaseDot, { backgroundColor: phaseColor }]} />
                    <Text style={[styles.phaseName, { color: t.text }]}>{phase.name}</Text>
                  </View>
                  <Text style={[styles.phaseWeeks, { color: t.textMuted }]}>
                    {phase.weeksLabel} · {phase.weightTarget}
                  </Text>
                </View>
                {isExpanded
                  ? <ChevronUp size={18} color={t.textMuted} />
                  : <ChevronDown size={18} color={t.textMuted} />}
              </TouchableOpacity>

              {isExpanded && (
                <View style={{ paddingTop: 12, borderTopWidth: 1, borderTopColor: t.border, marginTop: 10 }}>
                  <Text style={[styles.phaseWhy, { color: t.textMuted }]}>{phase.why}</Text>

                  <View style={styles.macroRow}>
                    {[
                      { label: 'Kcal', value: `${phase.kcal}`, color: Colors.kcal },
                      { label: 'Protein', value: `${phase.protein}g`, color: Colors.protein },
                      { label: 'Carbs', value: `${phase.carbs}g`, color: Colors.carbs },
                      { label: 'Fat', value: `${phase.fat}g`, color: Colors.fat },
                    ].map(m => (
                      <View key={m.label} style={[styles.macroChip, { backgroundColor: m.color + '22' }]}>
                        <Text style={{ color: m.color, fontWeight: '700', fontSize: 14 }}>{m.value}</Text>
                        <Text style={{ color: t.textFaint, fontSize: 11 }}>{m.label}</Text>
                      </View>
                    ))}
                  </View>

                  <View style={[styles.infoRow, { backgroundColor: t.surfaceAlt }]}>
                    <Text style={[styles.infoLabel, { color: t.textMuted }]}>Split</Text>
                    <Text style={[styles.infoVal, { color: t.text }]}>{phase.splitName}</Text>
                  </View>
                  <View style={[styles.infoRow, { backgroundColor: t.surfaceAlt }]}>
                    <Text style={[styles.infoLabel, { color: t.textMuted }]}>Cardio</Text>
                    <Text style={[styles.infoVal, { color: t.text }]}>{phase.cardio}</Text>
                  </View>
                  <View style={[styles.infoRow, { backgroundColor: t.surfaceAlt }]}>
                    <Text style={[styles.infoLabel, { color: t.textMuted }]}>Steps</Text>
                    <Text style={[styles.infoVal, { color: t.text }]}>{phase.steps.toLocaleString()}/day</Text>
                  </View>
                  {phase.notes && (
                    <View style={[styles.infoRow, { backgroundColor: Colors.warning + '11' }]}>
                      <Text style={[styles.infoLabel, { color: t.textMuted }]}>Note</Text>
                      <Text style={[styles.infoVal, { color: Colors.warning }]}>{phase.notes}</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          );
        })}

        {/* Weekly Schedule */}
        <Text style={[styles.sectionTitle, { color: t.text, marginTop: 16, marginBottom: 10 }]}>Weekly Schedule</Text>
        {WORKOUT_TEMPLATES.map(template => {
          const isExpanded = expandedDay === template.id;
          const typeColor = template.type === 'gym' ? Colors.primary : template.type === 'home' ? Colors.accent : Colors.success;

          return (
            <View key={template.id} style={[styles.dayCard, { backgroundColor: t.card, borderColor: t.border }]}>
              <TouchableOpacity
                style={styles.dayHeader}
                onPress={() => setExpandedDay(isExpanded ? null : template.id)}
              >
                <View style={[styles.dayBadge, { backgroundColor: typeColor + '22' }]}>
                  <Text style={{ color: typeColor, fontWeight: '700', fontSize: 13 }}>{template.shortDay}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.dayName, { color: t.text }]}>{template.name}</Text>
                  <Text style={[styles.dayType, { color: t.textMuted }]}>
                    {template.type.toUpperCase()} · {template.exercises.length} exercises
                  </Text>
                </View>
                {isExpanded ? <ChevronUp size={16} color={t.textMuted} /> : <ChevronDown size={16} color={t.textMuted} />}
              </TouchableOpacity>

              {isExpanded && (
                <View style={{ paddingTop: 10, borderTopWidth: 1, borderTopColor: t.border, marginTop: 10 }}>
                  {template.exercises.map(ex => (
                    <View key={ex.id} style={styles.exRow}>
                      <Dumbbell size={14} color={t.textFaint} />
                      <Text style={[styles.exName, { color: t.text }]}>{ex.name}</Text>
                      <Text style={[styles.exSets, { color: t.textMuted }]}>{ex.sets}×{ex.reps}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 26, fontWeight: '800' },
  subtitle: { fontSize: 14, marginBottom: 4 },
  sectionTitle: { fontSize: 15, fontWeight: '700' },
  phaseCard: { borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 10 },
  phaseHeader: { flexDirection: 'row', alignItems: 'center' },
  phaseDot: { width: 10, height: 10, borderRadius: 5 },
  phaseName: { fontSize: 16, fontWeight: '700' },
  phaseWeeks: { fontSize: 13, marginTop: 2 },
  phaseWhy: { fontSize: 13, lineHeight: 20, marginBottom: 12 },
  macroRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  macroChip: { flex: 1, borderRadius: 8, padding: 8, alignItems: 'center' },
  infoRow: { borderRadius: 8, padding: 10, marginBottom: 6, flexDirection: 'row', gap: 8 },
  infoLabel: { fontSize: 12, fontWeight: '600', width: 52 },
  infoVal: { fontSize: 13, flex: 1 },
  dayCard: { borderRadius: 10, borderWidth: 1, padding: 14, marginBottom: 8 },
  dayHeader: { flexDirection: 'row', alignItems: 'center' },
  dayBadge: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  dayName: { fontSize: 14, fontWeight: '700' },
  dayType: { fontSize: 12, marginTop: 2 },
  exRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 5 },
  exName: { flex: 1, fontSize: 13 },
  exSets: { fontSize: 13 },
});
