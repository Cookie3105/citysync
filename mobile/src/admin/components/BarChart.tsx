import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, font } from '../../theme/theme';

export interface BarDatum {
  label: string;
  value: number;
  color?: string;
}

// Grafico a barre orizzontali (senza dipendenze esterne).
export function BarChart({ data, unit = '' }: { data: BarDatum[]; unit?: string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  if (data.every((d) => d.value === 0)) {
    return <Text style={[font.label, { textAlign: 'center', paddingVertical: spacing.lg }]}>Nessun dato disponibile</Text>;
  }
  return (
    <View style={{ gap: 10 }}>
      {data.map((d) => (
        <View key={d.label} style={styles.row}>
          <Text style={styles.label} numberOfLines={1}>{d.label}</Text>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${Math.max(3, (d.value / max) * 100)}%`, backgroundColor: d.color || colors.accent }]} />
          </View>
          <Text style={styles.value}>{d.value}{unit}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { width: 64, fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  track: { flex: 1, height: 14, borderRadius: 7, backgroundColor: colors.surfaceAlt, overflow: 'hidden' },
  fill: { height: 14, borderRadius: 7 },
  value: { width: 42, textAlign: 'right', fontSize: 12, fontWeight: '700', color: colors.text },
});
