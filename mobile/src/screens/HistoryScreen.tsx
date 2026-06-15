import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Header } from '../components/Header';
import { Badge, EmptyState } from '../components/ui';
import { useApp } from '../state/AppContext';
import { useTheme, useT } from '../state/SettingsContext';
import { api } from '../api/api';
import { spacing, radius, shadow, type ThemeColors } from '../theme/theme';
import { eur, tipoLabel, tipoIcon, dataBreve } from '../lib/format';
import type { StoricoItem } from '../models/types';
import type { HistoryStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<HistoryStackParamList, 'History'>;

export default function HistoryScreen({ navigation }: Props) {
  const { user } = useApp();
  const { colors, font } = useTheme();
  const t = useT();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const statoColor: Record<string, string> = {
    concluso: colors.success, in_corso: colors.accent, in_pausa: colors.warning, annullato: colors.danger,
  };
  const [items, setItems] = useState<StoricoItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      setItems(await api.storico(user.idUtente));
    } catch { /* */ } finally { setLoading(false); }
  }, [user]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const totale = items.filter((i) => i.costoFinale != null).reduce((s, i) => s + (i.costoFinale || 0), 0);

  return (
    <View style={styles.root}>
      <Header title={t('Storico noleggi')} />
      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xxl }} />
      ) : items.length === 0 ? (
        <EmptyState icon="history" title={t('Nessun noleggio')} subtitle={t('Le tue corse appariranno qui')} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.idNoleggio}
          contentContainerStyle={{ padding: spacing.lg }}
          ListHeaderComponent={
            <View style={styles.totalCard}>
              <Text style={font.label}>{t('Totale speso ({n} corse)', { n: items.length })}</Text>
              <Text style={[font.h1, { color: colors.primary }]}>{eur(totale)}</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.item}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('Summary', { idNoleggio: item.idNoleggio })}
            >
              <View style={styles.icon}>
                <MaterialCommunityIcons name={tipoIcon[item.tipoMezzo] as any} size={24} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={font.h3}>{tipoLabel[item.tipoMezzo]} · {item.codiceMezzo}</Text>
                <Text style={font.small}>{dataBreve(item.dataInizio)} · {item.oraInizio?.slice(0, 5)}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <Text style={font.price}>{eur(item.costoFinale)}</Text>
                <Badge text={t(item.statoNoleggio.replace('_', ' '))} color={statoColor[item.statoNoleggio] || colors.textMuted} />
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  totalCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.lg, ...shadow.card },
  item: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm, ...shadow.card,
  },
  icon: {
    width: 46, height: 46, borderRadius: 13, backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center', marginRight: spacing.md,
  },
});
