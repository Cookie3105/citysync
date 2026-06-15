import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Segmented, Card, Spinner } from '../../components/ui';
import { BarChart, type BarDatum } from '../components/BarChart';
import { useApp } from '../../state/AppContext';
import { adminApi } from '../../api/adminApi';
import { useData } from '../../lib/useData';
import { colors, spacing, radius, font, shadow } from '../../theme/theme';
import { eur, tipoLabel, dataBreve } from '../../lib/format';
import type { TipoMezzo } from '../../models/types';

const TIPO_COLOR: Record<string, string> = { bici: '#23A455', escooter: '#1B7E9C', auto: '#E0992A' };

export default function AdReports() {
  const { amministrazione, logout } = useApp();
  const [vista, setVista] = useState<'mobilita' | 'tratte'>('mobilita');
  const mob = useData(() => adminApi.reportMobilita(), []);     // AP01
  const tratte = useData(() => adminApi.reportTratte(), []);    // AP05

  const loading = vista === 'mobilita' ? mob.loading : tratte.loading;
  const reloadAll = () => { mob.reload(); tratte.reload(); };

  const perTipoData = (rec?: Record<string, number>): BarDatum[] =>
    (['bici', 'escooter', 'auto'] as TipoMezzo[]).map((t) => ({ label: tipoLabel[t], value: rec?.[t] ?? 0, color: TIPO_COLOR[t] }));

  const giorniData = useMemo<BarDatum[]>(() => {
    const pg = mob.data?.perGiorno ?? {};
    return Object.keys(pg).sort().slice(-7).map((d) => ({ label: dataBreve(d).slice(0, 5), value: pg[d] }));
  }, [mob.data]);

  const fasceData = useMemo<BarDatum[]>(() => {
    const f = tratte.data?.fasceOrarie ?? {};
    const sum = (from: number, to: number) => { let s = 0; for (let h = from; h <= to; h++) s += f[String(h).padStart(2, '0')] ?? 0; return s; };
    return [
      { label: 'Notte', value: sum(0, 5) },
      { label: 'Mattina', value: sum(6, 11) },
      { label: 'Pomerig.', value: sum(12, 17) },
      { label: 'Sera', value: sum(18, 23) },
    ];
  }, [tratte.data]);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={font.h2}>Report mobilità</Text>
          <Text style={font.small}>{amministrazione?.nomeComune}</Text>
        </View>
        <TouchableOpacity style={styles.logout} onPress={logout}>
          <MaterialCommunityIcons name="logout" size={20} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.sm }}>
        <Segmented
          value={vista}
          onChange={setVista}
          options={[{ key: 'mobilita', label: 'Mobilità', icon: 'chart-line' }, { key: 'tratte', label: 'Fasce / tratte', icon: 'clock-outline' }]}
        />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingTop: spacing.sm }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={reloadAll} />}
      >
        {vista === 'mobilita' ? (
          mob.loading && !mob.data ? <Spinner /> : (
            <>
              <View style={styles.kpiGrid}>
                <Kpi label="Noleggi totali" value={`${mob.data?.kpi.totaleNoleggi ?? 0}`} icon="counter" color={colors.accent} />
                <Kpi label="Conclusi" value={`${mob.data?.kpi.noleggiConclusi ?? 0}`} icon="check-circle" color={colors.success} />
                <Kpi label="Incasso" value={eur(mob.data?.kpi.incassoTotale)} icon="cash" color={colors.primary} />
                <Kpi label="Durata media" value={`${mob.data?.kpi.durataMediaMin ?? 0}′`} icon="timer-outline" color={colors.warning} />
                <Kpi label="Utilizzo flotta" value={`${mob.data?.kpi.utilizzoFlottaPct ?? 0}%`} icon="bike" color="#8A6FB0" />
                <Kpi label="Mezzi usati" value={`${mob.data?.kpi.mezziUtilizzati ?? 0}/${mob.data?.kpi.mezziTotali ?? 0}`} icon="map-marker" color={colors.danger} />
              </View>

              <Card style={{ marginTop: spacing.lg }}>
                <Text style={styles.cardTitle}>Noleggi per tipologia</Text>
                <BarChart data={perTipoData(mob.data?.perTipo)} />
              </Card>

              <Card style={{ marginTop: spacing.lg }}>
                <Text style={styles.cardTitle}>Noleggi per giorno (ultimi 7)</Text>
                <BarChart data={giorniData.length ? giorniData : [{ label: '—', value: 0 }]} />
              </Card>
            </>
          )
        ) : (
          tratte.loading && !tratte.data ? <Spinner /> : (
            <>
              <Card>
                <Text style={styles.cardTitle}>Utilizzo per fascia oraria</Text>
                <BarChart data={fasceData} />
                <Text style={[font.small, { marginTop: spacing.md }]}>
                  Su {tratte.data?.totale ?? 0} noleggi. NB: in assenza di tracciamento dei percorsi, le "tratte"
                  sono approssimate dalle fasce orarie e dalle tipologie (vedi docs/CHANGES.md).
                </Text>
              </Card>

              <Card style={{ marginTop: spacing.lg }}>
                <Text style={styles.cardTitle}>Mezzi più utilizzati</Text>
                {tratte.data?.topMezzi.length ? tratte.data.topMezzi.map((m) => (
                  <View key={m.codiceMezzo} style={styles.topRow}>
                    <Text style={font.body}>{m.codiceMezzo}</Text>
                    <Text style={font.price}>{m.count} corse</Text>
                  </View>
                )) : <Text style={[font.label, { paddingVertical: spacing.md }]}>Nessun noleggio registrato.</Text>}
              </Card>
            </>
          )
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Kpi({ label, value, icon, color }: { label: string; value: string; icon: keyof typeof MaterialCommunityIcons.glyphMap; color: string }) {
  return (
    <View style={styles.kpi}>
      <View style={[styles.kpiIcon, { backgroundColor: `${color}1A` }]}>
        <MaterialCommunityIcons name={icon} size={18} color={color} />
      </View>
      <Text style={styles.kpiValue}>{value}</Text>
      <Text style={font.small}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  logout: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', ...shadow.card },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  kpi: { width: '31.5%', backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, ...shadow.card, gap: 2 },
  kpiIcon: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  kpiValue: { fontSize: 18, fontWeight: '800', color: colors.text },
  cardTitle: { ...font.h3, marginBottom: spacing.md },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.divider },
});
