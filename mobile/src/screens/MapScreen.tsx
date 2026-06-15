import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Platform, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import AppMap, { AppMapHandle } from '../components/AppMap';
import { Button, Segmented, Badge, EnergyBar, RoundButton } from '../components/ui';
import { useApp } from '../state/AppContext';
import { useTheme, useT } from '../state/SettingsContext';
import { useLocation } from '../lib/useLocation';
import { api } from '../api/api';
import { ApiError } from '../api/client';
import { DEFAULT_REGION } from '../api/config';
import { spacing, radius, shadow, energyColor, type ThemeColors } from '../theme/theme';
import { eur, tipoLabel, tipoSubtitle, tipoIcon, distanzaLabel, tempoAPiedi } from '../lib/format';
import type { Mezzo, StimaCosto, AreaLimitata, Prenotazione } from '../models/types';
import type { HomeStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<HomeStackParamList, 'Map'>;
type Ordine = 'consigliato' | 'veloce' | 'economico';
type Tr = (key: string, params?: Record<string, string | number>) => string;
const SCREEN_H = Dimensions.get('window').height;

export default function MapScreen({ navigation }: Props) {
  const { user, activeNoleggio, setActiveNoleggio, refreshActiveNoleggio, refreshUser } = useApp();
  const { colors, font } = useTheme();
  const t = useT();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { center } = useLocation();
  const mapRef = useRef<AppMapHandle>(null);
  const centeredRef = useRef(false);

  const [mezzi, setMezzi] = useState<Mezzo[]>([]);
  const [aree, setAree] = useState<AreaLimitata[]>([]);
  const [loading, setLoading] = useState(true);
  const [ordine, setOrdine] = useState<Ordine>('consigliato');
  const [selected, setSelected] = useState<Mezzo | null>(null);
  const [stima, setStima] = useState<StimaCosto | null>(null);
  const [azione, setAzione] = useState(false);
  const [multiMode, setMultiMode] = useState(false);
  const [selezionati, setSelezionati] = useState<string[]>([]);
  const [prenotazioni, setPrenotazioni] = useState<Prenotazione[]>([]);
  // Bottom sheet comprimibile: collassato -> mappa più visibile.
  const [collapsed, setCollapsed] = useState(false);

  // Carica la flotta condivisa (TUTTI i mezzi disponibili, senza filtro per raggio:
  // così ogni dispositivo vede lo stesso stato persistito sul server). `silent`
  // evita lo spinner durante l'auto-refresh.
  const load = useCallback(async (silent = false) => {
    if (!user) return;
    if (!silent) setLoading(true);
    try {
      const [m, a, pren] = await Promise.all([
        api.mezziVicini(center.lat, center.lon), // nessun raggio -> intera flotta
        api.aree(),
        api.prenotazioniUtente(user.idUtente),
      ]);
      setMezzi(m);
      setAree(a);
      setPrenotazioni(pren.filter((p) => p.statoPrenotazione === 'attiva'));
      // Al primo caricamento centra la mappa sulla flotta (così è sempre visibile).
      if (!centeredRef.current) {
        const conPos = m.filter((x) => x.posizione);
        if (conPos.length) {
          const lat = conPos.reduce((s, x) => s + x.posizione!.lat, 0) / conPos.length;
          const lon = conPos.reduce((s, x) => s + x.posizione!.lon, 0) / conPos.length;
          mapRef.current?.animateTo(lat, lon);
          centeredRef.current = true;
        }
      }
    } catch {
      /* mostrato come stato vuoto */
    } finally {
      if (!silent) setLoading(false);
    }
  }, [user?.idUtente, center.lat, center.lon]);

  // Aggiornamento dal vivo: ricarica in background ogni 8s mentre la schermata è
  // attiva, così le modifiche fatte da altri client/ruoli compaiono in tempo reale.
  useFocusEffect(
    useCallback(() => {
      load();
      refreshActiveNoleggio();
      refreshUser(); // verifica che l'account sia ancora attivo
      const tmr = setInterval(() => { load(true); refreshActiveNoleggio(); }, 8000);
      return () => clearInterval(tmr);
    }, [load, refreshActiveNoleggio, refreshUser])
  );

  const mezziOrdinati = useMemo(() => {
    const arr = [...mezzi];
    if (ordine === 'economico') {
      arr.sort((a, b) => (a.tariffa?.alMinuto ?? 9) - (b.tariffa?.alMinuto ?? 9) || (a.distanzaMetri ?? 1e9) - (b.distanzaMetri ?? 1e9));
    } else {
      // consigliato / veloce: per vicinanza (poi energia per "consigliato")
      arr.sort((a, b) => (a.distanzaMetri ?? 1e9) - (b.distanzaMetri ?? 1e9));
      if (ordine === 'consigliato') arr.sort((a, b) => b.livelloEnergia - a.livelloEnergia || (a.distanzaMetri ?? 1e9) - (b.distanzaMetri ?? 1e9));
    }
    return arr;
  }, [mezzi, ordine]);

  const seleziona = useCallback(async (m: Mezzo) => {
    setSelected(m);
    setCollapsed(false); // espandi il sheet per mostrare il dettaglio del mezzo
    setStima(null);
    if (m.posizione) mapRef.current?.animateTo(m.posizione.lat, m.posizione.lon);
    try {
      const s = await api.stima(m.idMezzo);
      setStima(s);
    } catch {
      /* la stima è opzionale */
    }
  }, []);

  const prenota = async () => {
    if (!selected || !user) return;
    setAzione(true);
    try {
      await api.prenota(user.idUtente, selected.idMezzo);
      Alert.alert(t('Prenotazione confermata'), t('{v} riservato per te per 15 minuti.', { v: `${tipoLabel[selected.tipoMezzo]} ${selected.codiceMezzo}` }));
      setSelected(null);
      await load();
    } catch (e) {
      Alert.alert(t('Errore'), e instanceof ApiError ? e.message : t('Prenotazione non riuscita'));
    } finally {
      setAzione(false);
    }
  };

  const avvia = async () => {
    if (!selected || !user) return;
    setAzione(true);
    try {
      const nol = await api.avviaNoleggio(user.idUtente, selected.idMezzo);
      setActiveNoleggio(nol);
      setSelected(null);
      navigation.navigate('Ride', { idNoleggio: nol.idNoleggio });
    } catch (e) {
      Alert.alert(t('Impossibile avviare'), e instanceof ApiError ? e.message : t('Riprova'));
    } finally {
      setAzione(false);
    }
  };

  // UT.16 - prenotazione multipla
  const toggleMulti = (id: string) =>
    setSelezionati((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const prenotaMulti = async () => {
    if (!user || selezionati.length === 0) return;
    setAzione(true);
    try {
      const esiti = await api.prenotaMultipla(user.idUtente, selezionati);
      const ok = esiti.filter((e) => e.ok).length;
      Alert.alert(t('Prenotazione multipla'), t('{ok}/{tot} mezzi prenotati.', { ok, tot: esiti.length }));
      setMultiMode(false);
      setSelezionati([]);
      await load();
    } catch (e) {
      Alert.alert(t('Errore'), e instanceof ApiError ? e.message : t('Riprova'));
    } finally {
      setAzione(false);
    }
  };

  // Avvia il noleggio sul mezzo prenotato (dal banner prenotazione).
  const avviaDaPrenotazione = async (pr: Prenotazione) => {
    if (!user) return;
    setAzione(true);
    try {
      const nol = await api.avviaNoleggio(user.idUtente, pr.idMezzo, pr.idPrenotazione);
      setActiveNoleggio(nol);
      navigation.navigate('Ride', { idNoleggio: nol.idNoleggio });
    } catch (e) {
      Alert.alert(t('Impossibile avviare'), e instanceof ApiError ? e.message : t('Riprova'));
    } finally {
      setAzione(false);
    }
  };

  const annullaPrenotazione = async (pr: Prenotazione) => {
    try { await api.annullaPrenotazione(pr.idPrenotazione); await load(); }
    catch (e) { Alert.alert(t('Errore'), e instanceof ApiError ? e.message : t('Riprova')); }
  };

  return (
    <View style={styles.root}>
      <AppMap
        ref={mapRef}
        region={{ ...DEFAULT_REGION, latitude: center.lat, longitude: center.lon }}
        mezzi={mezzi}
        aree={aree}
        selectedId={selected?.idMezzo}
        userLocation={center}
        onSelectMezzo={(m) => (multiMode ? toggleMulti(m.idMezzo) : seleziona(m))}
      />

      {/* Top bar */}
      <SafeAreaView edges={['top']} style={styles.topbar} pointerEvents="box-none">
        <View style={styles.brandPill}>
          <MaterialCommunityIcons name="map-marker-path" size={18} color={colors.primary} />
          <Text style={styles.brandText}>CitySync</Text>
        </View>
        <View style={{ gap: 10 }}>
          <RoundButton icon="refresh" onPress={() => { centeredRef.current = false; load(); }} />
          <RoundButton icon="crosshairs-gps" onPress={() => mapRef.current?.animateTo(center.lat, center.lon)} />
        </View>
      </SafeAreaView>

      {/* Bottom sheet comprimibile */}
      <View style={[styles.sheet, collapsed && styles.sheetCollapsed]}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setCollapsed((c) => !c)}
          style={styles.sheetHeader}
        >
          <View style={styles.sheetGrip} />
          {collapsed && <Text style={styles.sheetHint}>{selected ? t('Mostra dettaglio') : t('Mostra elenco mezzi')}</Text>}
          <View style={styles.sheetToggle}>
            <MaterialCommunityIcons
              name={collapsed ? 'chevron-up' : 'chevron-down'}
              size={24}
              color={colors.primary}
            />
          </View>
        </TouchableOpacity>

        {!collapsed && (selected ? (
          <DetailPanel
            mezzo={selected}
            stima={stima}
            azione={azione}
            onClose={() => setSelected(null)}
            onPrenota={prenota}
            onAvvia={avvia}
            onSegnala={() => navigation.navigate('ReportFault', { idMezzo: selected.idMezzo, codiceMezzo: selected.codiceMezzo })}
          />
        ) : (<>
          {/* Banner corsa in corso */}
          {activeNoleggio && (
            <TouchableOpacity
              style={styles.activeBanner}
              activeOpacity={0.9}
              onPress={() => navigation.navigate('Ride', { idNoleggio: activeNoleggio.idNoleggio })}
            >
              <MaterialCommunityIcons name="record-circle" size={18} color={colors.white} />
              <Text style={styles.activeText}>
                {t('Corsa in corso')} · {tipoLabel[activeNoleggio.tipoMezzo]} {activeNoleggio.codiceMezzo}
              </Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color={colors.white} />
            </TouchableOpacity>
          )}

          {/* Banner prenotazioni attive (UT.02 -> avvio noleggio) */}
          {!activeNoleggio && prenotazioni.map((pr) => (
            <View key={pr.idPrenotazione} style={styles.prenBanner}>
              <MaterialCommunityIcons name="bookmark-check" size={20} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.prenTitle}>{t('Prenotato')} · {pr.tipoMezzo ? tipoLabel[pr.tipoMezzo] : ''} {pr.codiceMezzo}</Text>
                <Text style={font.small}>{t('Riservato per te')}</Text>
              </View>
              <TouchableOpacity style={styles.prenAnnulla} onPress={() => annullaPrenotazione(pr)}>
                <Text style={styles.prenAnnullaText}>{t('Annulla')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.prenAvvia} onPress={() => avviaDaPrenotazione(pr)} disabled={azione}>
                <MaterialCommunityIcons name="lock-open-variant" size={15} color={colors.white} />
                <Text style={styles.prenAvviaText}>{t('Avvia')}</Text>
              </TouchableOpacity>
            </View>
          ))}

          <ListPanel
            loading={loading}
            ordine={ordine}
            setOrdine={setOrdine}
            mezzi={mezziOrdinati}
            onSelect={seleziona}
            multiMode={multiMode}
            selezionati={selezionati}
            onToggleMulti={toggleMulti}
            onToggleMode={() => { setMultiMode((v) => !v); setSelezionati([]); }}
            onPianifica={() => navigation.navigate('Route')}
            onPrenotaMulti={prenotaMulti}
            azione={azione}
          />
        </>))}
      </View>
    </View>
  );
}

// ---------- Pannello elenco mezzi ----------
function ListPanel({
  loading, ordine, setOrdine, mezzi, onSelect,
  multiMode, selezionati, onToggleMulti, onToggleMode, onPianifica, onPrenotaMulti, azione,
}: {
  loading: boolean; ordine: Ordine; setOrdine: (o: Ordine) => void; mezzi: Mezzo[]; onSelect: (m: Mezzo) => void;
  multiMode: boolean; selezionati: string[]; onToggleMulti: (id: string) => void;
  onToggleMode: () => void; onPianifica: () => void; onPrenotaMulti: () => void; azione: boolean;
}) {
  const { colors, font } = useTheme();
  const t = useT();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View>
      <View style={styles.listHead}>
        <Text style={font.h2}>{multiMode ? t('Seleziona i mezzi') : t('Scegli un mezzo')}</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity style={styles.actionPill} onPress={onPianifica}>
            <MaterialCommunityIcons name="map-marker-path" size={16} color={colors.primary} />
            <Text style={styles.actionText}>{t('Percorso')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionPill, multiMode && { backgroundColor: colors.primary }]} onPress={onToggleMode}>
            <MaterialCommunityIcons name="checkbox-multiple-marked-outline" size={16} color={multiMode ? colors.white : colors.primary} />
            <Text style={[styles.actionText, multiMode && { color: colors.white }]}>{t('Multi')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {!multiMode && (
        <Segmented
          value={ordine}
          onChange={setOrdine}
          options={[
            { key: 'consigliato', label: t('Consigliato'), icon: 'star' },
            { key: 'veloce', label: t('Più vicino'), icon: 'flash' },
            { key: 'economico', label: t('Economico'), icon: 'tag' },
          ]}
        />
      )}

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.xl }} />
      ) : mezzi.length === 0 ? (
        <Text style={[font.label, { textAlign: 'center', marginVertical: spacing.xl }]}>
          {t('Nessun mezzo disponibile nelle vicinanze')}
        </Text>
      ) : (
        <ScrollView style={{ marginTop: spacing.md, maxHeight: SCREEN_H * 0.38 }} showsVerticalScrollIndicator={false}>
          {mezzi.map((m) => (
            <VehicleRow
              key={m.idMezzo}
              mezzo={m}
              multiMode={multiMode}
              selected={selezionati.includes(m.idMezzo)}
              onPress={() => (multiMode ? onToggleMulti(m.idMezzo) : onSelect(m))}
            />
          ))}
          <View style={{ height: spacing.md }} />
        </ScrollView>
      )}

      {multiMode && (
        <Button
          title={selezionati.length ? t('Prenota {n} mezzi', { n: selezionati.length }) : t('Seleziona almeno un mezzo')}
          icon="bookmark-multiple-outline"
          onPress={onPrenotaMulti}
          loading={azione}
          disabled={selezionati.length === 0}
          style={{ marginTop: spacing.sm }}
        />
      )}
    </View>
  );
}

function VehicleRow({ mezzo, onPress, multiMode, selected }: { mezzo: Mezzo; onPress: () => void; multiMode?: boolean; selected?: boolean }) {
  const { colors, font } = useTheme();
  const t = useT();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <TouchableOpacity style={[styles.row, selected && styles.rowSelected]} activeOpacity={0.85} onPress={onPress}>
      <View style={styles.rowIcon}>
        <MaterialCommunityIcons name={tipoIcon[mezzo.tipoMezzo] as any} size={26} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={font.h3}>{tipoLabel[mezzo.tipoMezzo]}</Text>
        <View style={styles.rowMeta}>
          <MaterialCommunityIcons name="walk" size={13} color={colors.textLight} />
          <Text style={styles.metaText}>{tempoAPiedi(mezzo.distanzaMetri)} · {distanzaLabel(mezzo.distanzaMetri)}</Text>
          <MaterialCommunityIcons name="battery" size={13} color={energyColor(mezzo.livelloEnergia)} style={{ marginLeft: 8 }} />
          <Text style={[styles.metaText, { color: energyColor(mezzo.livelloEnergia) }]}>{mezzo.livelloEnergia}%</Text>
        </View>
      </View>
      {multiMode ? (
        <MaterialCommunityIcons
          name={selected ? 'check-circle' : 'checkbox-blank-circle-outline'}
          size={26}
          color={selected ? colors.primary : colors.textLight}
        />
      ) : (
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={font.price}>{eur(mezzo.tariffa?.alMinuto)}</Text>
          <Text style={font.small}>{t('al minuto')}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ---------- Pannello dettaglio mezzo ----------
function DetailPanel({
  mezzo, stima, azione, onClose, onPrenota, onAvvia, onSegnala,
}: {
  mezzo: Mezzo; stima: StimaCosto | null; azione: boolean;
  onClose: () => void; onPrenota: () => void; onAvvia: () => void; onSegnala: () => void;
}) {
  const { colors, font } = useTheme();
  const t = useT();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: SCREEN_H * 0.52 }}>
      <View style={styles.detailHeader}>
        <View style={styles.rowIcon}>
          <MaterialCommunityIcons name={tipoIcon[mezzo.tipoMezzo] as any} size={28} color={colors.primary} />
        </View>
        <View style={{ flex: 1, marginLeft: spacing.md }}>
          <Text style={font.h2}>{tipoLabel[mezzo.tipoMezzo]}</Text>
          <Text style={font.label}>{tipoSubtitle[mezzo.tipoMezzo]} · {mezzo.codiceMezzo}</Text>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <MaterialCommunityIcons name="close" size={20} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Energia (UT.12) + distanza */}
      <View style={styles.energyCard}>
        <View style={{ flex: 1 }}>
          <Text style={font.label}>{t('Autonomia residua')}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 8 }}>
            <EnergyBar level={mezzo.livelloEnergia} color={energyColor(mezzo.livelloEnergia)} width={120} />
            <Text style={[font.h3, { color: energyColor(mezzo.livelloEnergia) }]}>{mezzo.livelloEnergia}%</Text>
          </View>
        </View>
        <Badge text={distanzaLabel(mezzo.distanzaMetri) || t('nelle vicinanze')} color={colors.accent} />
      </View>

      {/* Caratteristiche tecniche (UT.06) */}
      <Text style={[font.h3, { marginTop: spacing.lg, marginBottom: spacing.sm }]}>{t('Caratteristiche')}</Text>
      <View style={styles.specGrid}>
        {renderSpecs(mezzo, t).map((s) => (
          <View key={s.label} style={styles.spec}>
            <MaterialCommunityIcons name={s.icon as any} size={18} color={colors.accent} />
            <Text style={styles.specValue}>{s.value}</Text>
            <Text style={font.small}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Stima costo (UT.03) */}
      <View style={styles.estimate}>
        <View>
          <Text style={font.label}>{t('Stima corsa (~{n} min)', { n: stima?.durataStimataMin ?? 15 })}</Text>
          <Text style={font.small}>
            {t('Sblocco')} {eur(mezzo.tariffa?.sblocco)} + {eur(mezzo.tariffa?.alMinuto)}/{t('min')}
          </Text>
        </View>
        <Text style={[font.h2, { color: colors.primary }]}>
          {stima ? eur(stima.costoStimato) : '…'}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg }}>
        <Button title={t('Prenota')} variant="outline" icon="bookmark-outline" onPress={onPrenota} loading={azione} style={{ flex: 1 }} />
        <Button title={t('Avvia noleggio')} icon="lock-open-variant" onPress={onAvvia} loading={azione} style={{ flex: 1.3 }} />
      </View>

      <TouchableOpacity onPress={onSegnala} style={styles.reportLink}>
        <MaterialCommunityIcons name="alert-circle-outline" size={16} color={colors.textMuted} />
        <Text style={styles.reportText}>{t('Segnala un guasto su questo mezzo')}</Text>
      </TouchableOpacity>
      <View style={{ height: spacing.md }} />
    </ScrollView>
  );
}

function renderSpecs(m: Mezzo, t: Tr) {
  const c = m.caratteristicheTecniche || {};
  const specs: { label: string; value: string; icon: string }[] = [];
  if (c.velocitaMax) specs.push({ label: t('Vel. max'), value: `${c.velocitaMax} km/h`, icon: 'speedometer' });
  if (c.autonomiaKm) specs.push({ label: t('Autonomia'), value: `${c.autonomiaKm} km`, icon: 'map-marker-distance' });
  if (c.posti) specs.push({ label: t('Posti'), value: `${c.posti}`, icon: 'seat' });
  if (c.peso) specs.push({ label: t('Peso'), value: `${c.peso} kg`, icon: 'weight' });
  if (c.cambio) specs.push({ label: t('Cambio'), value: `${c.cambio}`, icon: 'cog' });
  if (c.marca) specs.push({ label: t('Modello'), value: `${c.marca}`, icon: 'tag-outline' });
  return specs;
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  topbar: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: spacing.lg, paddingTop: spacing.sm,
  },
  brandPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.surface, paddingHorizontal: 14, height: 42, borderRadius: radius.pill,
    ...shadow.card,
  },
  brandText: { fontSize: 16, fontWeight: '800', color: colors.primary },
  activeBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.accent, paddingHorizontal: spacing.lg, height: 48, borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  activeText: { flex: 1, color: colors.white, fontWeight: '700' },
  prenBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.primarySoft, borderRadius: radius.md,
    paddingLeft: spacing.md, paddingRight: spacing.xs, paddingVertical: spacing.xs, marginBottom: spacing.md,
  },
  prenTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  prenAnnulla: { paddingHorizontal: 8, paddingVertical: 8 },
  prenAnnullaText: { color: colors.textMuted, fontWeight: '700', fontSize: 13 },
  prenAvvia: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.primary, borderRadius: radius.sm, paddingHorizontal: 12, paddingVertical: 9,
  },
  prenAvviaText: { color: colors.white, fontWeight: '700', fontSize: 13 },
  sheet: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 26, borderTopRightRadius: 26,
    paddingHorizontal: spacing.lg, paddingBottom: Platform.OS === 'ios' ? spacing.xl : spacing.lg,
    maxHeight: '62%',
    ...shadow.sheet,
  },
  sheetCollapsed: { maxHeight: undefined },
  sheetHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingTop: spacing.sm, paddingBottom: spacing.sm, minHeight: 40,
  },
  sheetGrip: { width: 44, height: 5, borderRadius: 3, backgroundColor: colors.border },
  sheetHint: { marginLeft: spacing.md, fontSize: 14, fontWeight: '700', color: colors.textMuted },
  sheetToggle: {
    position: 'absolute', right: 0, top: 2,
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
  },
  listHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  actionPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: colors.surfaceAlt, borderRadius: radius.pill,
    paddingHorizontal: 12, height: 34, borderWidth: 1, borderColor: colors.border,
  },
  actionText: { fontSize: 13, fontWeight: '700', color: colors.primary },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.divider,
  },
  rowSelected: { backgroundColor: colors.primarySoft, borderRadius: radius.md, paddingHorizontal: spacing.sm, borderBottomWidth: 0 },
  rowIcon: {
    width: 50, height: 50, borderRadius: 14, backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center', marginRight: spacing.md,
  },
  rowMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  metaText: { fontSize: 12, color: colors.textMuted, marginLeft: 3, fontWeight: '500' },
  detailHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  closeBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  energyCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: spacing.md,
  },
  specGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  spec: {
    width: '31%', backgroundColor: colors.surfaceAlt, borderRadius: radius.md,
    padding: spacing.md, alignItems: 'flex-start', gap: 4,
  },
  specValue: { fontSize: 14, fontWeight: '700', color: colors.text },
  estimate: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: spacing.lg, padding: spacing.md, borderRadius: radius.md,
    borderWidth: 1.5, borderColor: colors.primarySoft, backgroundColor: colors.surfaceAlt,
  },
  reportLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: spacing.lg },
  reportText: { fontSize: 13, color: colors.textMuted, fontWeight: '600' },
});
