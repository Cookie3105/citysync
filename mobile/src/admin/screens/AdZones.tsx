import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Alert, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Header } from '../../components/Header';
import { Segmented, Button, Badge, Spinner } from '../../components/ui';
import AppMap from '../../components/AppMap';
import { adminApi } from '../../api/adminApi';
import { ApiError } from '../../api/client';
import { confirmAction } from '../../lib/confirm';
import { useData } from '../../lib/useData';
import { DEFAULT_REGION } from '../../api/config';
import { colors, spacing, radius, font, shadow } from '../../theme/theme';
import { dataBreve } from '../../lib/format';
import type { AreaLimitata, ZonaCritica } from '../../models/types';

type LatLon = { lat: number; lon: number };

export default function AdZones() {
  const aree = useData(() => adminApi.aree(), []);
  const zone = useData(() => adminApi.zoneCritiche(), []);
  const [vista, setVista] = useState<'mappa' | 'elenco'>('mappa');
  const [addOpen, setAddOpen] = useState(false);
  // Punto pre-selezionato toccando la mappa principale (apre il modal su quel punto).
  const [puntoIniziale, setPuntoIniziale] = useState<LatLon | null>(null);

  // Aree + zone critiche unite per la mappa (le criticità come cerchi rossi).
  const areeMappa = useMemo<AreaLimitata[]>(() => [
    ...(aree.data ?? []),
    ...(zone.data ?? []).map((z) => ({
      idArea: z.idZonaCritica, nomeArea: z.tipoCriticita, tipoLimitazione: 'criticita',
      descrizione: z.descrizione, raggioMetri: 150, centro: z.centro,
    })),
  ], [aree.data, zone.data]);

  const reloadAll = () => { aree.reload(); zone.reload(); };
  const limitate = (aree.data ?? []).filter((a) => a.tipoLimitazione !== 'consentita_parcheggio');

  const apriAggiunta = (punto?: LatLon | null) => { setPuntoIniziale(punto ?? null); setAddOpen(true); };

  const eliminaArea = (a: AreaLimitata) => {
    confirmAction('Elimina zona', `Eliminare l'area "${a.nomeArea}"?`, async () => {
      try { await adminApi.eliminaAreaLimitata(a.idArea); reloadAll(); }
      catch (e) { Alert.alert('Errore', e instanceof ApiError ? e.message : 'Eliminazione non riuscita'); }
    }, { confirmLabel: 'Elimina', destructive: true });
  };

  const eliminaCriticita = (z: ZonaCritica) => {
    confirmAction('Elimina criticità', `Eliminare la criticità "${z.tipoCriticita}"?`, async () => {
      try { await adminApi.eliminaZonaCritica(z.idZonaCritica); reloadAll(); }
      catch (e) { Alert.alert('Errore', e instanceof ApiError ? e.message : 'Eliminazione non riuscita'); }
    }, { confirmLabel: 'Elimina', destructive: true });
  };

  return (
    <View style={styles.root}>
      <Header
        title="Zone e criticità"
        right={
          <TouchableOpacity style={styles.addBtn} onPress={() => apriAggiunta(null)}>
            <MaterialCommunityIcons name="plus" size={22} color={colors.white} />
          </TouchableOpacity>
        }
      />
      <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.sm }}>
        <Segmented
          value={vista}
          onChange={setVista}
          options={[{ key: 'mappa', label: 'Mappa', icon: 'map' }, { key: 'elenco', label: 'Elenco', icon: 'format-list-bulleted' }]}
        />
      </View>

      {vista === 'mappa' ? (
        <View style={styles.mapWrap}>
          <AppMap region={DEFAULT_REGION} mezzi={[]} aree={areeMappa} onMapPress={(lat, lon) => apriAggiunta({ lat, lon })} />
          <View style={styles.tapHint} pointerEvents="none">
            <MaterialCommunityIcons name="gesture-tap" size={14} color={colors.white} />
            <Text style={styles.tapHintText}>Tocca la mappa per aggiungere una zona</Text>
          </View>
          <View style={styles.legend}>
            <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: colors.danger }]} /><Text style={styles.legendText}>Limitata / criticità</Text></View>
            <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: colors.success }]} /><Text style={styles.legendText}>Parcheggio consentito</Text></View>
          </View>
        </View>
      ) : (aree.loading || zone.loading) && !aree.data ? <Spinner /> : (
        <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
          <Text style={styles.sec}>Zone limitate ({limitate.length})</Text>
          {limitate.map((a) => (
            <View key={a.idArea} style={styles.item}>
              <MaterialCommunityIcons name="sign-caution" size={22} color={colors.danger} />
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={font.h3}>{a.nomeArea}</Text>
                <Text style={font.small}>{a.descrizione || '—'}</Text>
              </View>
              <Badge text={a.tipoLimitazione} color={colors.danger} />
              <TouchableOpacity style={styles.delBtn} onPress={() => eliminaArea(a)}>
                <MaterialCommunityIcons name="trash-can-outline" size={20} color={colors.danger} />
              </TouchableOpacity>
            </View>
          ))}

          <Text style={[styles.sec, { marginTop: spacing.lg }]}>Criticità urbane ({zone.data?.length ?? 0})</Text>
          {(zone.data ?? []).map((z) => (
            <View key={z.idZonaCritica} style={styles.item}>
              <MaterialCommunityIcons name="alert-octagon" size={22} color={colors.warning} />
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={font.h3}>{z.tipoCriticita}</Text>
                <Text style={font.small}>{z.descrizione || '—'}{z.dataInizio ? ` · dal ${dataBreve(z.dataInizio)}` : ''}</Text>
              </View>
              <TouchableOpacity style={styles.delBtn} onPress={() => eliminaCriticita(z)}>
                <MaterialCommunityIcons name="trash-can-outline" size={20} color={colors.danger} />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      {addOpen && (
        <AddZoneModal
          initialPoint={puntoIniziale}
          onClose={() => { setAddOpen(false); setPuntoIniziale(null); }}
          onSaved={() => { setAddOpen(false); setPuntoIniziale(null); reloadAll(); }}
        />
      )}
    </View>
  );
}

function AddZoneModal({ initialPoint, onClose, onSaved }: { initialPoint?: LatLon | null; onClose: () => void; onSaved: () => void }) {
  const [tipo, setTipo] = useState<'limitata' | 'criticita'>('limitata');
  const [nome, setNome] = useState('');
  const [sottotipo, setSottotipo] = useState('vietata');
  const [descrizione, setDescrizione] = useState('');
  const [raggio, setRaggio] = useState('200');
  // Posizione scelta toccando la mappa (niente più coordinate da digitare).
  const [punto, setPunto] = useState<LatLon | null>(initialPoint ?? null);
  const [busy, setBusy] = useState(false);

  const raggioPreview = tipo === 'limitata' ? (Number(raggio) || 200) : 150;

  // Cerchio di anteprima della zona sul punto selezionato.
  const previewAree = useMemo<AreaLimitata[]>(() => (punto ? [{
    idArea: 'preview', nomeArea: 'Anteprima',
    tipoLimitazione: tipo === 'limitata' ? sottotipo : 'criticita',
    raggioMetri: raggioPreview, centro: punto,
  }] : []), [punto, tipo, sottotipo, raggioPreview]);

  const salva = async () => {
    if (!punto) { Alert.alert('Posizione mancante', 'Tocca la mappa per indicare dove si trova la zona.'); return; }
    if (tipo === 'limitata' && !nome.trim()) { Alert.alert('Nome mancante', 'Indica il nome della zona limitata.'); return; }
    setBusy(true);
    try {
      const posizione = { lat: punto.lat, lon: punto.lon };
      if (tipo === 'limitata') {
        await adminApi.creaAreaLimitata({ nomeArea: nome.trim(), tipoLimitazione: sottotipo, descrizione, posizione, raggioMetri: Number(raggio) || 200 });
      } else {
        await adminApi.creaZonaCritica({ tipoCriticita: sottotipo, descrizione, posizione, dataInizio: new Date().toISOString().slice(0, 10) });
      }
      onSaved();
    } catch (e) { Alert.alert('Errore', e instanceof ApiError ? e.message : 'Operazione non riuscita'); }
    finally { setBusy(false); }
  };

  const sottotipoOpts = tipo === 'limitata'
    ? [{ key: 'vietata', label: 'Vietata' }, { key: 'ztl', label: 'ZTL' }]
    : [{ key: 'cantiere', label: 'Cantiere' }, { key: 'manutenzione', label: 'Manut.' }, { key: 'ostacolo', label: 'Ostacolo' }];

  const regioneIniziale = punto
    ? { ...DEFAULT_REGION, latitude: punto.lat, longitude: punto.lon }
    : DEFAULT_REGION;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={[font.h2, { marginBottom: spacing.md }]}>Nuova zona</Text>
            <Segmented
              value={tipo}
              onChange={(t) => { setTipo(t); setSottotipo(t === 'limitata' ? 'vietata' : 'cantiere'); }}
              options={[{ key: 'limitata', label: 'Zona limitata (AP06)' }, { key: 'criticita', label: 'Criticità (AP04)' }]}
            />

            {tipo === 'limitata' && (
              <>
                <Lab>Nome area</Lab>
                <TextInput style={styles.input} value={nome} onChangeText={setNome} placeholder="es. ZTL Murat" placeholderTextColor={colors.textLight} />
              </>
            )}

            <Lab>Tipo</Lab>
            <Segmented value={sottotipo} onChange={setSottotipo} options={sottotipoOpts} />

            <Lab>Descrizione</Lab>
            <TextInput style={[styles.input, { height: 70, textAlignVertical: 'top', paddingTop: 10 }]} value={descrizione} onChangeText={setDescrizione} multiline placeholderTextColor={colors.textLight} />

            <Lab>Posizione — tocca la mappa</Lab>
            <View style={styles.pickMap}>
              <AppMap
                region={regioneIniziale}
                mezzi={[]}
                aree={previewAree}
                puntoArrivo={punto}
                onMapPress={(lat, lon) => setPunto({ lat, lon })}
              />
            </View>
            <Text style={[font.small, { marginTop: 6 }]}>
              {punto
                ? `Punto selezionato: ${punto.lat.toFixed(5)}, ${punto.lon.toFixed(5)}`
                : 'Nessun punto selezionato: tocca la mappa per posizionare la zona.'}
            </Text>

            {tipo === 'limitata' && (
              <>
                <Lab>Raggio (m)</Lab>
                <TextInput style={styles.input} value={raggio} onChangeText={setRaggio} keyboardType="number-pad" />
              </>
            )}

            <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg }}>
              <Button title="Annulla" variant="ghost" onPress={onClose} style={{ flex: 1 }} />
              <Button title="Registra" icon="content-save" onPress={salva} loading={busy} style={{ flex: 1.4 }} />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const Lab = ({ children }: { children: React.ReactNode }) => (
  <Text style={[font.label, { marginTop: spacing.md, marginBottom: 6 }]}>{children}</Text>
);

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  mapWrap: { flex: 1, marginHorizontal: spacing.lg, marginBottom: spacing.lg, borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  tapHint: { position: 'absolute', top: spacing.sm, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(14,79,99,0.92)', borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6 },
  tapHintText: { fontSize: 12, color: colors.white, fontWeight: '700' },
  legend: { position: 'absolute', left: spacing.sm, bottom: spacing.sm, flexDirection: 'row', gap: 12, backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: radius.sm, padding: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 9, height: 9, borderRadius: 5 },
  legendText: { fontSize: 11, color: colors.text, fontWeight: '600' },
  sec: { ...font.label, textTransform: 'uppercase', marginBottom: spacing.sm, fontWeight: '700' },
  item: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm, ...shadow.card },
  delBtn: { marginLeft: spacing.sm, width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceAlt },
  pickMap: { height: 220, borderRadius: radius.md, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceAlt },
  overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  modal: { backgroundColor: colors.surface, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: spacing.xl, maxHeight: '90%' },
  input: { backgroundColor: colors.surfaceAlt, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, height: 48, fontSize: 15, color: colors.text },
});
