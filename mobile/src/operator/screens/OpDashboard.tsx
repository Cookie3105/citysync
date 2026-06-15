import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import AppMap from '../../components/AppMap';
import { Segmented, EnergyBar, Badge, Button } from '../../components/ui';
import { useApp } from '../../state/AppContext';
import { operatorApi } from '../../api/operatorApi';
import { useData } from '../../lib/useData';
import { DEFAULT_REGION } from '../../api/config';
import { colors, spacing, radius, font, shadow, energyColor } from '../../theme/theme';
import { statoMezzoColor, statoMezzoLabel, tipoEmoji } from '../../lib/format';
import type { Mezzo, StatoMezzo } from '../../models/types';

export default function OpDashboard() {
  const { operatore, logout } = useApp();
  const flotta = useData(() => operatorApi.flotta(), []);     // OP.01
  const batteria = useData(() => operatorApi.batteria(), []); // OP.12
  const [vista, setVista] = useState<'mappa' | 'batteria'>('mappa');

  // Aggiornamento dal vivo: la flotta riflette le azioni degli utenti in tempo reale.
  useEffect(() => {
    const t = setInterval(() => { flotta.reload(); batteria.reload(); }, 8000);
    return () => clearInterval(t);
  }, [flotta.reload, batteria.reload]);

  const f = flotta.data;
  const center = useMemo(() => {
    const conPos = f?.mezzi.find((m) => m.posizione);
    return conPos?.posizione
      ? { latitude: conPos.posizione.lat, longitude: conPos.posizione.lon }
      : { latitude: DEFAULT_REGION.latitude, longitude: DEFAULT_REGION.longitude };
  }, [f]);

  const stats = [
    { label: 'Totali', value: f?.totale ?? 0, color: colors.accent, icon: 'bike' },
    { label: 'Disponibili', value: f?.perStato['disponibile'] ?? 0, color: colors.success, icon: 'check-circle' },
    { label: 'In uso', value: f?.perStato['in_uso'] ?? 0, color: colors.warning, icon: 'pulse' },
    { label: 'Manut.', value: (f?.perStato['in_manutenzione'] ?? 0) + (f?.perStato['fuori_servizio'] ?? 0), color: '#8A6FB0', icon: 'wrench' },
    { label: 'Batt. critica', value: batteria.data?.critici ?? 0, color: colors.danger, icon: 'battery-alert' },
  ] as const;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={font.h2}>Dashboard</Text>
          <Text style={font.small}>{operatore?.ragioneSociale}</Text>
        </View>
        <TouchableOpacity style={styles.logout} onPress={logout}>
          <MaterialCommunityIcons name="logout" size={20} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsRow} contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.sm }}>
        {stats.map((s) => (
          <View key={s.label} style={styles.stat}>
            <View style={[styles.statIcon, { backgroundColor: `${s.color}1A` }]}>
              <MaterialCommunityIcons name={s.icon as any} size={18} color={s.color} />
            </View>
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={font.small}>{s.label}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.sm }}>
        <Segmented
          value={vista}
          onChange={setVista}
          options={[
            { key: 'mappa', label: 'Mappa flotta', icon: 'map' },
            { key: 'batteria', label: 'Batteria', icon: 'battery-70' },
          ]}
        />
      </View>

      {vista === 'mappa' ? (
        <View style={styles.mapWrap}>
          {f && (
            <AppMap
              region={center}
              mezzi={f.mezzi}
              markerColor={(m) => statoMezzoColor[m.statOperativo]}
            />
          )}
          <View style={styles.legend}>
            {(['disponibile', 'in_uso', 'in_manutenzione', 'fuori_servizio'] as StatoMezzo[]).map((s) => (
              <View key={s} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: statoMezzoColor[s] }]} />
                <Text style={styles.legendText}>{statoMezzoLabel[s]}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : (
        <FlatList
          style={{ flex: 1 }}
          data={batteria.data?.mezzi ?? []}
          keyExtractor={(m) => m.idMezzo}
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm }}
          ListHeaderComponent={
            <Text style={[font.label, { marginBottom: spacing.sm }]}>
              Soglia critica: {batteria.data?.sogliaCritica ?? 20}% · {batteria.data?.critici ?? 0} mezzi sotto soglia
            </Text>
          }
          renderItem={({ item }) => (
            <View style={[styles.battRow, item.critico && { borderColor: colors.danger, borderWidth: 1 }]}>
              <Text style={{ fontSize: 18 }}>{tipoEmoji[item.tipoMezzo]}</Text>
              <View style={{ flex: 1 }}>
                <Text style={font.h3}>{item.codiceMezzo}</Text>
                <Text style={font.small}>{statoMezzoLabel[item.statOperativo]}</Text>
              </View>
              <EnergyBar level={item.livelloEnergia} color={energyColor(item.livelloEnergia)} width={70} />
              <Text style={[font.body, { color: energyColor(item.livelloEnergia), width: 42, textAlign: 'right' }]}>{item.livelloEnergia}%</Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
  },
  logout: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', ...shadow.card },
  statsRow: { maxHeight: 96, flexGrow: 0 },
  stat: { width: 96, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, ...shadow.card, gap: 2 },
  statIcon: { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  statValue: { fontSize: 22, fontWeight: '800', color: colors.text },
  mapWrap: { flex: 1, marginHorizontal: spacing.lg, marginBottom: spacing.lg, borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  legend: {
    position: 'absolute', left: spacing.sm, bottom: spacing.sm, right: spacing.sm,
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
    backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: radius.sm, padding: 8,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 9, height: 9, borderRadius: 5 },
  legendText: { fontSize: 11, color: colors.text, fontWeight: '600' },
  battRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, ...shadow.card,
  },
});
