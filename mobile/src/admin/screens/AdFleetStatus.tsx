import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Header } from '../../components/Header';
import { Segmented, Card, Spinner } from '../../components/ui';
import { BarChart, type BarDatum } from '../components/BarChart';
import AppMap from '../../components/AppMap';
import { adminApi } from '../../api/adminApi';
import { useData } from '../../lib/useData';
import { DEFAULT_REGION } from '../../api/config';
import { colors, spacing, radius, font } from '../../theme/theme';
import { statoMezzoColor, statoMezzoLabel, tipoLabel } from '../../lib/format';
import type { Mezzo, StatoMezzo, TipoMezzo } from '../../models/types';

const TIPO_COLOR: Record<string, string> = { bici: '#23A455', escooter: '#1B7E9C', auto: '#E0992A' };

export default function AdFleetStatus() {
  const { data, loading, reload } = useData(() => adminApi.statoMezzi(), []); // AP03
  const [vista, setVista] = useState<'riepilogo' | 'mappa'>('riepilogo');

  const statoData: BarDatum[] = (['disponibile', 'in_uso', 'prenotato', 'in_manutenzione', 'fuori_servizio', 'bloccato'] as StatoMezzo[])
    .map((s) => ({ label: statoMezzoLabel[s], value: data?.perStato[s] ?? 0, color: statoMezzoColor[s] }))
    .filter((d) => d.value > 0);

  const tipoData: BarDatum[] = (['bici', 'escooter', 'auto'] as TipoMezzo[])
    .map((t) => ({ label: tipoLabel[t], value: data?.perTipo[t] ?? 0, color: TIPO_COLOR[t] }));

  // AdMezzo -> Mezzo (per la mappa).
  const mezziMappa = useMemo<Mezzo[]>(() => (data?.mezzi ?? []).map((m) => ({
    ...m, caratteristicheTecniche: {}, tariffa: null,
  })), [data]);

  const center = mezziMappa.find((m) => m.posizione)?.posizione;

  return (
    <View style={styles.root}>
      <Header title="Stato dei mezzi" />
      <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.sm }}>
        <Segmented
          value={vista}
          onChange={setVista}
          options={[{ key: 'riepilogo', label: 'Riepilogo', icon: 'chart-bar' }, { key: 'mappa', label: 'Mappa', icon: 'map' }]}
        />
      </View>

      {loading && !data ? <Spinner /> : vista === 'riepilogo' ? (
        <View style={{ padding: spacing.lg, paddingTop: spacing.sm }}>
          <Card>
            <Text style={styles.title}>Distribuzione per stato ({data?.totale ?? 0} mezzi)</Text>
            <BarChart data={statoData.length ? statoData : [{ label: '—', value: 0 }]} />
          </Card>
          <Card style={{ marginTop: spacing.lg }}>
            <Text style={styles.title}>Per tipologia</Text>
            <BarChart data={tipoData} />
          </Card>
        </View>
      ) : (
        <View style={styles.mapWrap}>
          <AppMap
            region={center ? { latitude: center.lat, longitude: center.lon } : DEFAULT_REGION}
            mezzi={mezziMappa}
            markerColor={(m) => statoMezzoColor[m.statOperativo]}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  title: { ...font.h3, marginBottom: spacing.md },
  mapWrap: { flex: 1, marginHorizontal: spacing.lg, marginBottom: spacing.lg, borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
});
