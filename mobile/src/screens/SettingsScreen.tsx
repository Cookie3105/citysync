import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Header } from '../components/Header';
import { useSettings, useTheme, useT } from '../state/SettingsContext';
import { spacing, radius, shadow, type ThemeColors } from '../theme/theme';
import type { ProfileStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<ProfileStackParamList, 'Settings'>;

export default function SettingsScreen({ navigation }: Props) {
  const { lingua, tema, setLingua, setTema } = useSettings();
  const { colors, font } = useTheme();
  const t = useT();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.root}>
      <Header title={t('Lingua e tema')} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        {/* Lingua (IUI.02) */}
        <Text style={styles.sectionTitle}>{t('Lingua')}</Text>
        <Text style={[font.small, { marginBottom: spacing.sm }]}>{t('Scegli la lingua dell’app')}</Text>
        <View style={styles.group}>
          <OptionRow
            colors={colors} font={font}
            icon="flag-variant-outline" label={t('Italiano')} hint="Italiano"
            selected={lingua === 'it'} onPress={() => setLingua('it')}
          />
          <View style={styles.sep} />
          <OptionRow
            colors={colors} font={font}
            icon="flag-variant-outline" label={t('Inglese')} hint="English"
            selected={lingua === 'en'} onPress={() => setLingua('en')}
          />
        </View>

        {/* Tema / Aspetto (IUI.03) */}
        <Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>{t('Aspetto')}</Text>
        <Text style={[font.small, { marginBottom: spacing.sm }]}>{t('Scegli l’aspetto dell’app')}</Text>
        <View style={styles.group}>
          <OptionRow
            colors={colors} font={font}
            icon="white-balance-sunny" label={t('Chiaro')}
            selected={tema === 'chiaro'} onPress={() => setTema('chiaro')}
          />
          <View style={styles.sep} />
          <OptionRow
            colors={colors} font={font}
            icon="weather-night" label={t('Scuro')}
            selected={tema === 'scuro'} onPress={() => setTema('scuro')}
          />
        </View>

        {/* Anteprima */}
        <Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>{t('Anteprima')}</Text>
        <View style={styles.preview}>
          <View style={styles.previewIcon}>
            <MaterialCommunityIcons name="map-marker-radius" size={22} color={colors.white} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={font.h3}>CitySync</Text>
            <Text style={font.small}>{t('Mostra elenco mezzi')}</Text>
          </View>
          <View style={styles.previewPill}>
            <Text style={styles.previewPillText}>{t('Avvia')}</Text>
          </View>
        </View>

        <Text style={[font.small, { textAlign: 'center', marginTop: spacing.xl }]}>
          {t('Le preferenze vengono salvate sul dispositivo.')}
        </Text>
      </ScrollView>
    </View>
  );
}

function OptionRow({
  colors, font, icon, label, hint, selected, onPress,
}: {
  colors: ThemeColors;
  font: Record<string, any>;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  hint?: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={localRow.row} activeOpacity={0.8} onPress={onPress}>
      <View style={[localRow.iconBox, { backgroundColor: selected ? colors.primary : colors.surfaceAlt }]}>
        <MaterialCommunityIcons name={icon} size={20} color={selected ? colors.white : colors.textMuted} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={font.body}>{label}</Text>
        {hint ? <Text style={font.small}>{hint}</Text> : null}
      </View>
      <MaterialCommunityIcons
        name={selected ? 'check-circle' : 'checkbox-blank-circle-outline'}
        size={24}
        color={selected ? colors.primary : colors.textLight}
      />
    </TouchableOpacity>
  );
}

const localRow = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  iconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  group: { backgroundColor: colors.surface, borderRadius: radius.md, paddingHorizontal: spacing.md, ...shadow.card },
  sep: { height: 1, backgroundColor: colors.divider },
  preview: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, ...shadow.card },
  previewIcon: { width: 44, height: 44, borderRadius: 13, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  previewPill: { backgroundColor: colors.primarySoft, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 8 },
  previewPillText: { color: colors.primary, fontWeight: '800', fontSize: 13 },
});
