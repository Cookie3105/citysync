import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Button, Card, EnergyBar } from '../components/ui';
import { useApp } from '../state/AppContext';
import { useTheme, useT } from '../state/SettingsContext';
import { useLocation } from '../lib/useLocation';
import { api } from '../api/api';
import { ApiError } from '../api/client';
import { spacing, radius, energyColor, type ThemeColors } from '../theme/theme';
import { eur, tipoLabel, tipoIcon } from '../lib/format';
import { confirmAction } from '../lib/confirm';
import type { Noleggio } from '../models/types';
import type { HomeStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<HomeStackParamList, 'Ride'>;

export default function RideScreen({ navigation }: Props) {
  const { user, setActiveNoleggio } = useApp();
  const { colors, font } = useTheme();
  const t = useT();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { center } = useLocation();
  const [nol, setNol] = useState<Noleggio | null>(null);
  const [now, setNow] = useState(Date.now());
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) return;
    try {
      const n = await api.noleggioAttivo(user.idUtente);
      setNol(n);
      if (!n) navigation.goBack();
    } catch { /* */ }
  }, [user, navigation]);

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  // Clock dal vivo (aggiorna durata e costo in tempo reale).
  useEffect(() => {
    const tmr = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tmr);
  }, []);

  const inPausa = nol?.statoNoleggio === 'in_pausa';
  // Tempo attivo: secondi accumulati + (solo se in corso) il segmento corrente.
  // In pausa il cronometro resta fermo perché `running` è false (UT.15).
  const baseSec = nol?.secondiAccumulati ?? 0;
  const running = nol?.statoNoleggio === 'in_corso' && !!nol?.ultimaRipresaTs;
  const elapsedSec = baseSec + (running
    ? Math.max(0, Math.floor((now - new Date(nol!.ultimaRipresaTs!).getTime()) / 1000))
    : 0);
  const minuti = Math.max(1, Math.ceil(elapsedSec / 60));
  const costo = nol ? +(nol.tariffa.sblocco + minuti * nol.tariffa.alMinuto).toFixed(2) : 0;

  const togglePausa = async () => {
    if (!nol) return;
    setBusy(true);
    try {
      const n = inPausa ? await api.riprendiNoleggio(nol.idNoleggio) : await api.pausaNoleggio(nol.idNoleggio);
      setNol(n);
      setActiveNoleggio(n);
    } catch (e) {
      Alert.alert(t('Errore'), e instanceof ApiError ? e.message : t('Operazione non riuscita'));
    } finally {
      setBusy(false);
    }
  };

  const termina = () => {
    if (!nol || busy) return;
    confirmAction(
      t('Terminare la corsa?'),
      t('Il mezzo verrà bloccato e riceverai il riepilogo del costo.'),
      async () => {
        setBusy(true);
        try {
          const r = await api.terminaNoleggio(nol.idNoleggio, { lat: center.lat, lon: center.lon });
          setActiveNoleggio(null);
          navigation.replace('Summary', { idNoleggio: r.idNoleggio });
        } catch (e) {
          Alert.alert(t('Errore'), e instanceof ApiError ? e.message : t('Operazione non riuscita'));
        } finally {
          setBusy(false);
        }
      },
      { confirmLabel: t('Termina'), destructive: true },
    );
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={font.h2}>{t('Corsa in corso')}</Text>
        <View style={[styles.statusDot, { backgroundColor: inPausa ? colors.warning : colors.success }]} />
        <Text style={[font.label, { color: inPausa ? colors.warning : colors.success }]}>
          {inPausa ? t('In pausa') : t('Attiva')}
        </Text>
      </View>

      {nol && (
        <>
          <Card style={{ alignItems: 'center', marginBottom: spacing.lg }}>
            <View style={styles.bigIcon}>
              <MaterialCommunityIcons name={tipoIcon[nol.tipoMezzo] as any} size={40} color={colors.primary} />
            </View>
            <Text style={[font.h3, { marginTop: spacing.md }]}>
              {tipoLabel[nol.tipoMezzo]} · {nol.codiceMezzo}
            </Text>

            <Text style={styles.timer}>{formatTime(elapsedSec)}</Text>
            <Text style={font.label}>{t('durata corsa')}</Text>

            <View style={styles.costRow}>
              <Text style={font.label}>{t('Costo attuale')}</Text>
              <Text style={[font.h2, { color: colors.primary }]}>{eur(costo)}</Text>
            </View>
            <Text style={font.small}>
              {t('Sblocco')} {eur(nol.tariffa.sblocco)} + {eur(nol.tariffa.alMinuto)}/{t('min')} · {minuti} {t('min')}
            </Text>

            {nol.livelloEnergia != null && (
              <View style={styles.energyRow}>
                <MaterialCommunityIcons name="battery" size={16} color={energyColor(nol.livelloEnergia)} />
                <EnergyBar level={nol.livelloEnergia} color={energyColor(nol.livelloEnergia)} width={120} />
                <Text style={[font.label, { color: energyColor(nol.livelloEnergia) }]}>{nol.livelloEnergia}%</Text>
              </View>
            )}
          </Card>

          <View style={{ gap: spacing.md, marginTop: 'auto' }}>
            <Button
              title={inPausa ? t('Riprendi la corsa') : t('Metti in pausa')}
              variant={inPausa ? 'primary' : 'secondary'}
              icon={inPausa ? 'play' : 'pause'}
              onPress={togglePausa}
              loading={busy}
            />
            <Button title={t('Termina noleggio')} variant="danger" icon="flag-checkered" onPress={termina} disabled={busy} />
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

function formatTime(sec: number) {
  const m = Math.floor(sec / 60).toString().padStart(2, '0');
  const s = (sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.lg },
  statusDot: { width: 9, height: 9, borderRadius: 5, marginLeft: 'auto' },
  bigIcon: {
    width: 80, height: 80, borderRadius: 24, backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center',
  },
  timer: { fontSize: 52, fontWeight: '800', color: colors.text, letterSpacing: 1, marginTop: spacing.lg },
  costRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    width: '100%', marginTop: spacing.lg, paddingTop: spacing.lg,
    borderTopWidth: 1, borderTopColor: colors.divider,
  },
  energyRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: spacing.md },
});
