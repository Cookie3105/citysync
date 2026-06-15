import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import AppMap, { AppMapHandle } from '../components/AppMap';
import { Header } from '../components/Header';
import { Segmented, Badge } from '../components/ui';
import { useTheme, useT } from '../state/SettingsContext';
import { useLocation } from '../lib/useLocation';
import { api } from '../api/api';
import { DEFAULT_REGION } from '../api/config';
import { spacing, radius, shadow, type ThemeColors } from '../theme/theme';
import { distanzaLabel } from '../lib/format';
import type { AreaLimitata, Percorso, TipoMezzo } from '../models/types';
import type { HomeStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<HomeStackParamList, 'Route'>;

export default function RouteScreen({ navigation }: Props) {
  const { colors, font } = useTheme();
  const t = useT();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { center } = useLocation();
  const mapRef = useRef<AppMapHandle>(null);
  const [aree, setAree] = useState<AreaLimitata[]>([]);
  const [tipo, setTipo] = useState<TipoMezzo>('bici');
  const [arrivo, setArrivo] = useState<{ lat: number; lon: number } | null>(null);
  const [percorso, setPercorso] = useState<Percorso | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { api.aree().then(setAree).catch(() => {}); }, []);

  const calcola = useCallback(async (dest: { lat: number; lon: number }, tm: TipoMezzo) => {
    setLoading(true);
    try {
      const p = await api.calcolaPercorso({ lat: center.lat, lon: center.lon }, dest, tm);
      setPercorso(p);
    } catch { setPercorso(null); } finally { setLoading(false); }
  }, [center.lat, center.lon]);

  const onMapPress = (lat: number, lon: number) => {
    const dest = { lat, lon };
    setArrivo(dest);
    calcola(dest, tipo);
  };

  const cambiaTipo = (tm: TipoMezzo) => { setTipo(tm); if (arrivo) calcola(arrivo, tm); };

  const stazioniLatLon = (percorso?.stazioniRicaricaCompatibili ?? [])
    .filter((s) => s.posizione)
    .map((s) => ({ lat: s.posizione!.lat, lon: s.posizione!.lon }));

  return (
    <View style={styles.root}>
      <AppMap
        ref={mapRef}
        region={{ ...DEFAULT_REGION, latitude: center.lat, longitude: center.lon }}
        mezzi={[]}
        aree={aree}
        userLocation={center}
        onMapPress={onMapPress}
        polyline={percorso?.polyline}
        stazioni={stazioniLatLon}
        puntoArrivo={arrivo}
      />

      <SafeAreaView edges={['top']} style={styles.headerWrap} pointerEvents="box-none">
        <Header title={t('Percorso consigliato')} onBack={() => navigation.goBack()} />
      </SafeAreaView>

      <View style={styles.panel}>
        <Segmented
          value={tipo}
          onChange={cambiaTipo}
          options={[
            { key: 'bici', label: t('Bici'), icon: 'bicycle' },
            { key: 'escooter', label: t('Scooter'), icon: 'scooter' },
            { key: 'auto', label: t('Auto'), icon: 'car' },
          ]}
        />

        {!arrivo ? (
          <View style={styles.hint}>
            <MaterialCommunityIcons name="gesture-tap" size={20} color={colors.accent} />
            <Text style={[font.label, { flex: 1 }]}>{t('Tocca la mappa per scegliere la destinazione')}</Text>
          </View>
        ) : loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.lg }} />
        ) : percorso ? (
          <ScrollView style={{ maxHeight: 220 }} showsVerticalScrollIndicator={false}>
            <View style={styles.row}>
              <Stat icon="map-marker-distance" label={t('Distanza')} value={distanzaLabel(percorso.distanzaMetri)} />
              <Stat icon="clock-outline" label={t('Durata')} value={`${percorso.durataMin} ${t('min')}`} />
              <View style={{ justifyContent: 'center' }}>
                <Badge text={percorso.consigliato ? t('Consigliato') : t('Con avvisi')} color={percorso.consigliato ? colors.success : colors.warning} />
              </View>
            </View>

            {percorso.avvisi.length > 0 && (
              <View style={styles.avvisi}>
                {percorso.avvisi.map((a, i) => (
                  <View key={i} style={styles.avvisoRow}>
                    <MaterialCommunityIcons name="alert" size={15} color={colors.warning} />
                    <Text style={[font.small, { color: colors.text, flex: 1 }]}>{a}</Text>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.stazRow}>
              <MaterialCommunityIcons name="ev-station" size={18} color={colors.success} />
              <Text style={font.label}>
                {t('{n} stazioni di ricarica lungo il percorso', { n: percorso.stazioniRicaricaCompatibili.length })}
              </Text>
            </View>
            <Text style={[font.small, { marginTop: 4 }]} numberOfLines={1}>
              {t('Da: {da} → A: {a}', { da: percorso.partenza.indirizzo ?? '', a: percorso.arrivo.indirizzo ?? '' })}
            </Text>
          </ScrollView>
        ) : (
          <Text style={[font.label, { marginVertical: spacing.lg }]}>{t('Impossibile calcolare il percorso.')}</Text>
        )}
      </View>
    </View>
  );
}

function Stat({ icon, label, value }: { icon: keyof typeof MaterialCommunityIcons.glyphMap; label: string; value: string }) {
  const { colors, font } = useTheme();
  return (
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
        <MaterialCommunityIcons name={icon} size={16} color={colors.accent} />
        <Text style={font.label}>{label}</Text>
      </View>
      <Text style={[font.h3, { marginTop: 2 }]}>{value}</Text>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  headerWrap: { position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: 'transparent' },
  panel: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: spacing.lg, paddingBottom: spacing.xl, ...shadow.sheet,
  },
  hint: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: spacing.lg, paddingVertical: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md, gap: spacing.sm },
  avvisi: { marginTop: spacing.md, backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: spacing.md, gap: 6 },
  avvisoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stazRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: spacing.md },
});
