import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';

interface MacroBarProps {
  label: string;
  current: number;
  target: number;
  color: string;
  unit?: string;
  theme?: 'dark' | 'light';
}

export function MacroBar({
  label,
  current,
  target,
  color,
  unit = 'g',
  theme = 'dark',
}: MacroBarProps) {
  const t = theme === 'dark' ? Colors.dark : Colors.light;
  const pct = target > 0 ? Math.min((current / target) * 100, 100) : 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.label, { color: t.textMuted }]}>{label}</Text>
        <Text style={[styles.value, { color: t.text }]}>
          {current.toFixed(0)}/{target}{unit}
        </Text>
      </View>
      <View style={[styles.track, { backgroundColor: t.border }]}>
        <View
          style={[
            styles.fill,
            { width: `${pct}%` as any, backgroundColor: color },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
  },
  value: {
    fontSize: 13,
    fontWeight: '600',
  },
  track: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: 6,
    borderRadius: 3,
  },
});
