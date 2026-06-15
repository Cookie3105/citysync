import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Header } from '../components/Header';
import { EmptyState, Badge } from '../components/ui';
import { useApp } from '../state/AppContext';
import { useTheme, useT } from '../state/SettingsContext';
import { api } from '../api/api';
import { spacing, radius, shadow, type ThemeColors } from '../theme/theme';
import { valoreIncentivo } from '../lib/format';
import type { Incentivo } from '../models/types';

type Props = NativeStackScreenProps<any, any>;

export default function PromotionsScreen({ navigation }: Props) {
  const { user } = useApp();
  const { colors, font } = useTheme();
  const t = useT();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [items, setItems] = useState<Incentivo[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    if (!user) return;
    setLoading(true);
    api.incentiviUtente(user.idUtente).then(setItems).catch(() => {}).finally(() => setLoading(false));
  }, [user]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <View style={styles.root}>
      <Header title={t('Promozioni e bonus')} onBack={() => navigation.goBack()} />
      <FlatList
        data={items}
        keyExtractor={(i) => i.idIncentivo}
        refreshing={loading}
        onRefresh={load}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm }}
        ListEmptyComponent={!loading ? <EmptyState icon="gift-outline" title={t('Nessuna promozione')} subtitle={t('Qui vedrai bonus e convenzioni attive')} /> : null}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.icon}><MaterialCommunityIcons name="gift" size={24} color={colors.primary} /></View>
            <View style={{ flex: 1 }}>
              <Text style={font.h3}>{item.tipoIncentivo}</Text>
              <Text style={font.small}>{item.descrizione || '—'}</Text>
              <Text style={[font.label, { marginTop: 2 }]}>{t('Valore: {v}', { v: valoreIncentivo(item.valore, item.unitaValore) })}</Text>
            </View>
            <Badge text={item.idUtente ? t('Tuo') : t('Promo')} color={item.idUtente ? colors.success : colors.accent} />
          </View>
        )}
      />
    </View>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, ...shadow.card },
  icon: { width: 46, height: 46, borderRadius: 13, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
});
