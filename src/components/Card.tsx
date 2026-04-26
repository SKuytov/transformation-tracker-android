import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '../theme/colors';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  theme?: 'dark' | 'light';
}

export function Card({ children, style, theme = 'dark' }: CardProps) {
  const t = theme === 'dark' ? Colors.dark : Colors.light;
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: t.card, borderColor: t.border },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
});
