import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Alert, ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Header } from '../../components/Header';
import { Button, Badge, EnergyBar, Segmented } from '../../components/ui';
import { operatorApi } from '../../api/operatorApi';
import { ApiError } from '../../api/client';
import { confirmAction } from '../../lib/confirm';
import { useData } from '../../lib/useData';
import { colors, spacing, radius, font, shadow, energyColor } from '../../theme/theme';
import { statoMezzoColor, statoMezzoLabel, tipoEmoji, tipoLabel } from '../../lib/format';
import type { Mezzo, StatoMezzo, TipoMezzo } from '../../models/types';

const STATI: StatoMezzo[] = ['disponibile', 'prenotato', 'in_uso', 'in_manutenzione', 'fuori_servizio', 'bloccato'];

export default function OpFleet() {
  const { data, loading, reload } = useData(() => operatorApi.tuttiMezzi(), []);
  const [addOpen, setAddOpen] = useState(false);
  const [statoTarget, setStatoTarget] = useState<Mezzo | null>(null);

  const cambiaStato = async (m: Mezzo, stato: StatoMezzo) => {
    setStatoTarget(null);
    try { await operatorApi.aggiornaStatoMezzo(m.idMezzo, stato); reload(); }
    catch (e) { Alert.alert('Errore', e instanceof ApiError ? e.message : 'Operazione non riuscita'); }
  };

  const blocca = (m: Mezzo) => {
    const inUso = m.statOperativo === 'in_uso';
    confirmAction(
      'Blocco remoto',
      inUso
        ? `Il mezzo ${m.codiceMezzo} è in uso: il blocco forzato interromperà la corsa in corso. Procedere?`
        : `Bloccare da remoto il mezzo ${m.codiceMezzo}?`,
      async () => {
        try { await operatorApi.bloccoRemoto(m.idMezzo, inUso); reload(); }
        catch (e) { Alert.alert('Errore', e instanceof ApiError ? e.message : 'Blocco non riuscito'); }
      },
      { confirmLabel: inUso ? 'Blocca comunque' : 'Blocca', destructive: true },
    );
  };

  const sblocca = (m: Mezzo) => {
    confirmAction(
      'Sblocca mezzo',
      `Rendere di nuovo disponibile il mezzo ${m.codiceMezzo}?`,
      async () => {
        try { await operatorApi.aggiornaStatoMezzo(m.idMezzo, 'disponibile'); reload(); }
        catch (e) { Alert.alert('Errore', e instanceof ApiError ? e.message : 'Operazione non riuscita'); }
      },
      { confirmLabel: 'Sblocca' },
    );
  };

  return (
    <View style={styles.root}>
      <Header
        title={`Flotta${data ? ` (${data.length})` : ''}`}
        right={
          <TouchableOpacity style={styles.addBtn} onPress={() => setAddOpen(true)}>
            <MaterialCommunityIcons name="plus" size={22} color={colors.white} />
          </TouchableOpacity>
        }
      />
      <FlatList
        data={data ?? []}
        keyExtractor={(m) => m.idMezzo}
        refreshing={loading}
        onRefresh={reload}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm }}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={{ fontSize: 22 }}>{tipoEmoji[item.tipoMezzo]}</Text>
            <View style={{ flex: 1 }}>
              <Text style={font.h3}>{item.codiceMezzo}</Text>
              <Text style={font.small}>{tipoLabel[item.tipoMezzo]}</Text>
              <View style={{ marginTop: 4 }}><EnergyBar level={item.livelloEnergia} color={energyColor(item.livelloEnergia)} width={80} /></View>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 8 }}>
              <TouchableOpacity onPress={() => setStatoTarget(item)}>
                <Badge text={statoMezzoLabel[item.statOperativo]} color={statoMezzoColor[item.statOperativo]} />
              </TouchableOpacity>
              {item.statOperativo === 'bloccato' ? (
                <TouchableOpacity style={[styles.blockBtn, { borderColor: colors.success }]} onPress={() => sblocca(item)}>
                  <MaterialCommunityIcons name="lock-open-variant" size={15} color={colors.success} />
                  <Text style={[styles.blockText, { color: colors.success }]}>Sblocca</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.blockBtn} onPress={() => blocca(item)}>
                  <MaterialCommunityIcons name="lock" size={15} color={colors.danger} />
                  <Text style={styles.blockText}>Blocca</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      />

      {/* Modal cambio stato (OP.13) */}
      <Modal visible={!!statoTarget} transparent animationType="fade" onRequestClose={() => setStatoTarget(null)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setStatoTarget(null)}>
          <View style={styles.sheet}>
            <Text style={[font.h3, { marginBottom: spacing.md }]}>Stato di {statoTarget?.codiceMezzo}</Text>
            {STATI.map((s) => (
              <TouchableOpacity key={s} style={styles.statoOpt} onPress={() => statoTarget && cambiaStato(statoTarget, s)}>
                <View style={[styles.legendDot, { backgroundColor: statoMezzoColor[s] }]} />
                <Text style={font.body}>{statoMezzoLabel[s]}</Text>
                {statoTarget?.statOperativo === s && <MaterialCommunityIcons name="check" size={18} color={colors.primary} style={{ marginLeft: 'auto' }} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {addOpen && <AddMezzoModal onClose={() => setAddOpen(false)} onSaved={() => { setAddOpen(false); reload(); }} />}
    </View>
  );
}

function AddMezzoModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [tipo, setTipo] = useState<TipoMezzo>('bici');
  const [codice, setCodice] = useState('');
  const [marca, setMarca] = useState('');
  const [energia, setEnergia] = useState('100');
  const [lat, setLat] = useState('41.1187');
  const [lon, setLon] = useState('16.8719');
  const [busy, setBusy] = useState(false);

  const salva = async () => {
    setBusy(true);
    try {
      await operatorApi.registraMezzo({
        tipoMezzo: tipo, codiceMezzo: codice.trim(), livelloEnergia: Number(energia),
        caratteristicheTecniche: marca ? { marca } : {}, posizione: { lat: Number(lat), lon: Number(lon) },
      });
      onSaved();
    } catch (e) { Alert.alert('Errore', e instanceof ApiError ? e.message : 'Registrazione non riuscita'); }
    finally { setBusy(false); }
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={[font.h2, { marginBottom: spacing.md }]}>Registra nuovo mezzo</Text>
            <Segmented
              value={tipo}
              onChange={setTipo}
              options={[
                { key: 'bici', label: 'Bici', icon: 'bicycle' },
                { key: 'escooter', label: 'Scooter', icon: 'scooter' },
                { key: 'auto', label: 'Auto', icon: 'car' },
              ]}
            />
            <Lab>Codice mezzo</Lab>
            <TextInput style={styles.input} value={codice} onChangeText={setCodice} placeholder="es. BK-010" placeholderTextColor={colors.textLight} />
            <Lab>Marca / modello</Lab>
            <TextInput style={styles.input} value={marca} onChangeText={setMarca} placeholder="es. CitySync e-Bike" placeholderTextColor={colors.textLight} />
            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <View style={{ flex: 1 }}><Lab>Energia %</Lab><TextInput style={styles.input} value={energia} onChangeText={setEnergia} keyboardType="number-pad" /></View>
              <View style={{ flex: 1 }}><Lab>Lat</Lab><TextInput style={styles.input} value={lat} onChangeText={setLat} keyboardType="numbers-and-punctuation" /></View>
              <View style={{ flex: 1 }}><Lab>Lon</Lab><TextInput style={styles.input} value={lon} onChangeText={setLon} keyboardType="numbers-and-punctuation" /></View>
            </View>
            <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.md }}>
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
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, ...shadow.card },
  blockBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, paddingHorizontal: 8, paddingVertical: 5 },
  blockText: { fontSize: 12, fontWeight: '700', color: colors.danger },
  overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: spacing.xl, paddingBottom: spacing.xxl },
  statoOpt: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.divider },
  legendDot: { width: 11, height: 11, borderRadius: 6 },
  modal: { backgroundColor: colors.surface, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: spacing.xl, maxHeight: '88%' },
  input: { backgroundColor: colors.surfaceAlt, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, height: 48, fontSize: 15, color: colors.text },
});
