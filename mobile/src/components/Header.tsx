import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { spacing, type ThemeColors } from '../theme/theme';
import { useTheme } from '../state/SettingsContext';

export function Header({
  title, onBack, right,
}: {
  title: string;
  onBack?: () => void;
  right?: React.ReactNode;
}) {
  const { colors, font } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <View style={styles.bar}>
        {onBack ? (
          <TouchableOpacity onPress={onBack} style={styles.back} hitSlop={10}>
            <MaterialCommunityIcons name="chevron-left" size={26} color={colors.text} />
          </TouchableOpacity>
        ) : (
          <View style={styles.back} />
        )}
        <Text style={[font.h2, styles.title]} numberOfLines={1}>{title}</Text>
        <View style={styles.right}>{right}</View>
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  safe: { backgroundColor: colors.background },
  bar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.md, height: 52,
  },
  back: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, textAlign: 'left', marginLeft: spacing.xs },
  right: { minWidth: 40, alignItems: 'flex-end' },
});
