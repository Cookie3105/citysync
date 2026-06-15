// Libreria di componenti UI riutilizzabili (estetica "rider").
// Theme-aware: i colori/font seguono il tema attivo (chiaro/scuro) via useTheme().
import React, { useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ActivityIndicator, StyleSheet,
  ViewStyle, TextStyle, StyleProp,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { spacing, radius, shadow, type ThemeColors } from '../theme/theme';
import { useTheme } from '../state/SettingsContext';

// ---- Card ----
export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return <View style={[styles.card, style]}>{children}</View>;
}

// ---- Button ----
type BtnVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
export function Button({
  title, onPress, variant = 'primary', icon, loading, disabled, style,
}: {
  title: string;
  onPress?: () => void;
  variant?: BtnVariant;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const v = btnVariants(colors)[variant];
  const isDisabled = disabled || loading;
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={isDisabled}
      style={[styles.btn, { backgroundColor: v.bg, borderColor: v.border }, isDisabled && { opacity: 0.5 }, style]}
    >
      {loading ? (
        <ActivityIndicator color={v.fg} />
      ) : (
        <View style={styles.btnRow}>
          {icon && <MaterialCommunityIcons name={icon} size={19} color={v.fg} style={{ marginRight: 8 }} />}
          <Text style={[styles.btnText, { color: v.fg }]}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const btnVariants = (colors: ThemeColors): Record<BtnVariant, { bg: string; fg: string; border: string }> => ({
  primary: { bg: colors.primary, fg: colors.white, border: colors.primary },
  secondary: { bg: colors.primarySoft, fg: colors.primary, border: colors.primarySoft },
  outline: { bg: 'transparent', fg: colors.primary, border: colors.primary },
  danger: { bg: colors.danger, fg: colors.white, border: colors.danger },
  ghost: { bg: 'transparent', fg: colors.textMuted, border: 'transparent' },
});

// ---- Pill / Segmented tabs (Recommended / Faster / Cheaper) ----
export function Segmented<T extends string>({
  options, value, onChange,
}: {
  options: { key: T; label: string; icon?: keyof typeof MaterialCommunityIcons.glyphMap }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.segmented}>
      {options.map((o) => {
        const active = o.key === value;
        return (
          <TouchableOpacity
            key={o.key}
            activeOpacity={0.8}
            onPress={() => onChange(o.key)}
            style={[styles.segItem, active && styles.segItemActive]}
          >
            {o.icon && (
              <MaterialCommunityIcons
                name={o.icon}
                size={15}
                color={active ? colors.white : colors.textMuted}
                style={{ marginRight: 5 }}
              />
            )}
            <Text style={[styles.segText, active && { color: colors.white }]}>{o.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ---- Badge ----
export function Badge({ text, color, tint }: { text: string; color?: string; tint?: string }) {
  const { colors } = useTheme();
  const col = color || colors.accent;
  return (
    <View style={[styles0.badge, { backgroundColor: tint || `${col}1A` }]}>
      <Text style={[styles0.badgeText, { color: col }]}>{text}</Text>
    </View>
  );
}

// ---- EnergyBar (livello batteria/carburante UT.12) ----
export function EnergyBar({ level, color, width = 56 }: { level: number; color: string; width?: number }) {
  const { colors } = useTheme();
  return (
    <View style={[styles0.energyTrack, { width, backgroundColor: colors.border }]}>
      <View style={[styles0.energyFill, { width: `${Math.max(4, Math.min(100, level))}%`, backgroundColor: color }]} />
    </View>
  );
}

// ---- Round icon button (back / locate) ----
export function RoundButton({
  icon, onPress, bg, fg, size = 42,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  onPress?: () => void;
  bg?: string;
  fg?: string;
  size?: number;
}) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles0.round, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg || colors.surface }, shadow.card]}
    >
      <MaterialCommunityIcons name={icon} size={size * 0.5} color={fg || colors.text} />
    </TouchableOpacity>
  );
}

// ---- Sheet handle ----
export function SheetHandle() {
  const { colors } = useTheme();
  return <View style={styles0.handleWrap}><View style={[styles0.handle, { backgroundColor: colors.border }]} /></View>;
}

// ---- Row (label + value) ----
export function Row({ label, value, valueStyle }: { label: string; value: string; valueStyle?: StyleProp<TextStyle> }) {
  const { font } = useTheme();
  return (
    <View style={styles0.row}>
      <Text style={font.label}>{label}</Text>
      <Text style={[font.body, valueStyle]}>{value}</Text>
    </View>
  );
}

// ---- Spinner ----
export function Spinner() {
  const { colors } = useTheme();
  return <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.xl }} />;
}

// ---- Empty state ----
export function EmptyState({ icon, title, subtitle }: { icon: keyof typeof MaterialCommunityIcons.glyphMap; title: string; subtitle?: string }) {
  const { colors, font } = useTheme();
  return (
    <View style={styles0.empty}>
      <MaterialCommunityIcons name={icon} size={48} color={colors.textLight} />
      <Text style={[font.h3, { marginTop: spacing.md }]}>{title}</Text>
      {subtitle && <Text style={[font.label, { textAlign: 'center', marginTop: 4 }]}>{subtitle}</Text>}
    </View>
  );
}

// Stili che dipendono dalla palette (ricreati al cambio tema).
const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadow.card,
  },
  btn: {
    height: 54,
    borderRadius: radius.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  btnRow: { flexDirection: 'row', alignItems: 'center' },
  btnText: { fontSize: 16, fontWeight: '700' },
  segmented: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    padding: 4,
  },
  segItem: {
    flex: 1,
    flexDirection: 'row',
    height: 38,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segItemActive: { backgroundColor: colors.primary },
  segText: { fontSize: 13, fontWeight: '700', color: colors.textMuted },
});

// Stili indipendenti dalla palette (i colori variabili sono passati inline).
const styles0 = StyleSheet.create({
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, alignSelf: 'flex-start' },
  badgeText: { fontSize: 12, fontWeight: '700' },
  energyTrack: { height: 7, borderRadius: 4, overflow: 'hidden' },
  energyFill: { height: 7, borderRadius: 4 },
  round: { alignItems: 'center', justifyContent: 'center' },
  handleWrap: { alignItems: 'center', paddingVertical: spacing.sm },
  handle: { width: 44, height: 5, borderRadius: 3 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  empty: { alignItems: 'center', justifyContent: 'center', padding: spacing.xxl },
});
