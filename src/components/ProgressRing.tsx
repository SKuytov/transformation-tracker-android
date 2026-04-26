import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Colors } from '../theme/colors';

interface ProgressRingProps {
  size?: number;
  strokeWidth?: number;
  progress: number; // 0-1
  color?: string;
  label?: string;
  sublabel?: string;
  theme?: 'dark' | 'light';
}

export function ProgressRing({
  size = 100,
  strokeWidth = 8,
  progress,
  color = Colors.primary,
  label,
  sublabel,
  theme = 'dark',
}: ProgressRingProps) {
  const t = theme === 'dark' ? Colors.dark : Colors.light;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - Math.min(Math.max(progress, 0), 1));

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={t.border}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {label ? (
        <View style={{ alignItems: 'center' }}>
          <Text style={{ color: t.text, fontWeight: '700', fontSize: size * 0.18 }}>{label}</Text>
          {sublabel ? (
            <Text style={{ color: t.textMuted, fontSize: size * 0.11, marginTop: 2 }}>{sublabel}</Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
