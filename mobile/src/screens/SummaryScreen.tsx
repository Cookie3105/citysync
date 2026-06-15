import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Button, Card, Row, Badge } from '../components/ui';
import { useTheme, useT } from '../state/SettingsContext';
import { api } from '../api/api';
import { spacing, radius, type ThemeColors } from '../theme/theme';
import { eur, tipoLabel, oraBreve } from '../lib/format';
import type { RiepilogoNoleggio } from '../models/types';
import type { HomeStackParamList } from '../navigation/types';

// Compatibile sia con HomeStack che HistoryStack (entrambi hanno 'Summary').
type Props = NativeStackScreenProps<HomeStackParamList, 'Summary'>;

export default function SummaryScreen({ route, navigation }: Props) {
  const { idNoleggio } = route.params;
  const { colors, font } = useTheme();
  const t = useT();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [r, setR] = useState<RiepilogoNoleggio | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.riepilogo(idNoleggio).then(setR).catch(() => {}).finally(() => setLoading(false));
  }, [idNoleggio]);

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </SafeAreaView>
    );
  }
  if (!r) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={font.label}>{t('Riepilogo non disponibile')}</Text>
        <Button title={t('Indietro')} variant="outline" onPress={() => navigation.goBack()} style={{ marginTop: spacing.lg }} />
      </SafeAreaView>
    );
  }

  const concluso = r.statoNoleggio === 'concluso';
  const pagato = r.pagamento?.stato === 'completato';

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        <View style={styles.hero}>
          <View style={styles.check}>
            <MaterialCommunityIcons name={concluso ? 'check' : 'information'} size={34} color={colors.white} />
          </View>
          <Text style={[font.h1, { marginTop: spacing.md }]}>
            {concluso ? t('Corsa conclusa') : t('Riepilogo corsa')}
          </Text>
          <Text style={font.label}>{tipoLabel[r.tipoMezzo]} · {r.codiceMezzo}</Text>
        </View>

        <Card>
          <Text style={[font.h3, { marginBottom: spacing.sm }]}>{t('Dettaglio costo')}</Text>
          <Row label={t('Sblocco')} value={eur(r.dettaglioCosto.sblocco)} />
          <Row label={t('Tempo ({n} min × {p})', { n: r.durataMinuti, p: eur(r.dettaglioCosto.alMinuto) })} value={eur(r.dettaglioCosto.costoMinuti)} />
          <View style={styles.total}>
            <Text style={font.h3}>{t('Totale')}</Text>
            <Text style={[font.h1, { color: colors.primary }]}>{eur(r.costoFinale)}</Text>
          </View>
        </Card>

        <Card style={{ marginTop: spacing.lg }}>
          <Text style={[font.h3, { marginBottom: spacing.sm }]}>{t('Corsa')}</Text>
          <Row label={t('Inizio')} value={oraBreve(r.inizio)} />
          <Row label={t('Fine')} value={oraBreve(r.fine)} />
          <Row label={t('Durata')} value={`${r.durataMinuti} ${t('min')}`} />
          {r.posizioneFinaleMezzo && (
            <Row label={t('Posizione finale')} value={r.posizioneFinaleMezzo.indirizzo
              ? truncate(r.posizioneFinaleMezzo.indirizzo)
              : `${r.posizioneFinaleMezzo.lat.toFixed(4)}, ${r.posizioneFinaleMezzo.lon.toFixed(4)}`} />
          )}
        </Card>

        <Card style={{ marginTop: spacing.lg }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={font.h3}>{t('Pagamento')}</Text>
              <Text style={font.small}>{r.pagamento?.tipo ?? '—'}</Text>
            </View>
            <Badge text={pagato ? t('Completato') : t(r.pagamento?.stato ?? 'In attesa')}
              color={pagato ? colors.success : colors.warning} />
          </View>
        </Card>

        <Button title={t('Torna alla mappa')} icon="map" onPress={() => navigation.goBack()} style={{ marginTop: spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function truncate(s: string, n = 32) {
  return s.length > n ? s.slice(0, n) + '…' : s;
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  hero: { alignItems: 'center', marginBottom: spacing.xl },
  check: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: colors.success,
    alignItems: 'center', justifyContent: 'center',
  },
  total: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.divider,
  },
});
