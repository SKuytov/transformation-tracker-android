import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '../theme/colors';

interface StatCardProps {
  label: string;
  value: string;
  sublabel?: string;
  accent?: boolean;
  color?: string;
  style?: ViewStyle;
  theme?: 'dark' | 'light';
}

export function StatCard({
  label,
  value,
  sublabel,
  accent,
  color,
  style,
  theme = 'dark',
}: StatCardProps) {
  const t = theme === 'dark' ? Colors.dark : Colors.light;
  const valueColor = color ?? (accent ? Colors.accent : Colors.primary);

  return (
    <View style={[styles.card, { backgroundColor: t.card, borderColor: t.border }, style]}>
      <Text style={[styles.label, { color: t.textMuted }]}>{label}</Text>
      <Text style={[styles.value, { color: valueColor }]}>{value}</Text>
      {sublabel ? (
        <Text style={[styles.sublabel, { color: t.textFaint }]}>{sublabel}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
    flex: 1,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  value: {
    fontSize: 22,
    fontWeight: '700',
  },
  sublabel: {
    fontSize: 11,
    marginTop: 2,
  },
});
