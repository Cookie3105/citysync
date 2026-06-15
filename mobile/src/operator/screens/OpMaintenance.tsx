import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Header } from '../../components/Header';
import { Badge, Button, EmptyState, Segmented } from '../../components/ui';
import { operatorApi } from '../../api/operatorApi';
import { ApiError } from '../../api/client';
import { useData } from '../../lib/useData';
import { colors, spacing, radius, font, shadow } from '../../theme/theme';
import { statoGenericoColor, tipoEmoji, dataBreve } from '../../lib/format';
import type { OpMoreStackParamList } from '../navigation';
import type { MezzoDaManutenere } from '../../models/types';

type Props = NativeStackScreenProps<OpMoreStackParamList, 'Maintenance'>;

export default function OpMaintenance({ navigation }: Props) {
  const [vista, setVista] = useState<'todo' | 'interventi'>('todo');
  const todo = useData(() => operatorApi.mezziDaManutenere(), []);
  const interventi = useData(() => operatorApi.interventi(), []);
  const [target, setTarget] = useState<MezzoDaManutenere | null>(null);

  const aggiorna = async (id: string, stato: string) => {
    try { await operatorApi.aggiornaIntervento(id, { statoManutenzione: stato }); interventi.reload(); todo.reload(); }
    catch (e) { Alert.alert('Errore', e instanceof ApiError ? e.message : 'Errore'); }
  };

  return (
    <View style={styles.root}>
      <Header title="Manutenzione" onBack={() => navigation.goBack()} />
      <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.sm }}>
        <Segmented
          value={vista}
          onChange={setVista}
          options={[{ key: 'todo', label: 'Da manutenere', icon: 'alert' }, { key: 'interventi', label: 'Interventi', icon: 'wrench' }]}
        />
      </View>

      {vista === 'todo' ? (
        <FlatList
          data={todo.data ?? []}
          keyExtractor={(m) => m.idMezzo}
          refreshing={todo.loading}
          onRefresh={todo.reload}
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm }}
          ListEmptyComponent={!todo.loading ? <EmptyState icon="check-circle-outline" title="Nessun mezzo da manutenere" /> : null}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.between}>
                <Text style={font.h3}>{tipoEmoji[item.tipoMezzo]} {item.codiceMezzo}</Text>
                <Button title="Intervento" variant="secondary" icon="plus" onPress={() => setTarget(item)} style={styles.smallBtn} />
              </View>
              <Text style={[font.small, { marginTop: 4 }]}>
                {item.motivo}{item.segnalazioniAperte > 0 ? ` · ${item.segnalazioniAperte} segnalazioni` : ''} · energia {item.livelloEnergia}%
              </Text>
            </View>
          )}
        />
      ) : (
        <FlatList
          data={interventi.data ?? []}
          keyExtractor={(i) => i.idManutenzione}
          refreshing={interventi.loading}
          onRefresh={interventi.reload}
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm }}
          ListEmptyComponent={!interventi.loading ? <EmptyState icon="wrench" title="Nessun intervento" /> : null}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.between}>
                <Text style={font.h3}>{tipoEmoji[item.tipoMezzo]} {item.codiceMezzo}</Text>
                <Badge text={item.statoManutenzione.replace('_', ' ')} color={statoGenericoColor[item.statoManutenzione] || colors.textMuted} />
              </View>
              <Text style={[font.small, { marginTop: 4 }]}>Aperto il {dataBreve(item.dataApertura)}</Text>
              {item.statoManutenzione !== 'chiusa' && (
                <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
                  {item.statoManutenzione === 'aperta' && (
                    <Button title="Avvia" variant="ghost" onPress={() => aggiorna(item.idManutenzione, 'in_corso')} style={styles.smallBtn} />
                  )}
                  <Button title="Chiudi" variant="primary" icon="check" onPress={() => aggiorna(item.idManutenzione, 'chiusa')} style={styles.smallBtn} />
                </View>
              )}
            </View>
          )}
        />
      )}

      {target && (
        <OpenModal
          mezzo={target}
          onClose={() => setTarget(null)}
          onSaved={() => { setTarget(null); interventi.reload(); todo.reload(); setVista('interventi'); }}
        />
      )}
    </View>
  );
}

function OpenModal({ mezzo, onClose, onSaved }: { mezzo: MezzoDaManutenere; onClose: () => void; onSaved: () => void }) {
  const [desc, setDesc] = useState(mezzo.motivo);
  const [busy, setBusy] = useState(false);
  const salva = async () => {
    setBusy(true);
    try { await operatorApi.apriIntervento({ idMezzo: mezzo.idMezzo, descrizione: desc, idOperatore: 'OP-demo' }); onSaved(); }
    catch (e) { Alert.alert('Errore', e instanceof ApiError ? e.message : 'Errore'); }
    finally { setBusy(false); }
  };
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.sheet}>
          <Text style={font.h2}>Intervento · {mezzo.codiceMezzo}</Text>
          <Text style={[font.label, { marginTop: spacing.md, marginBottom: 6 }]}>Descrizione</Text>
          <TextInput style={styles.textarea} value={desc} onChangeText={setDesc} multiline placeholderTextColor={colors.textLight} />
          <Text style={[font.small, { marginTop: spacing.sm }]}>Il mezzo verrà messo "in manutenzione".</Text>
          <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg }}>
            <Button title="Annulla" variant="ghost" onPress={onClose} style={{ flex: 1 }} />
            <Button title="Apri intervento" icon="wrench" onPress={salva} loading={busy} style={{ flex: 1.4 }} />
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  card: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, ...shadow.card },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  smallBtn: { height: 38, paddingHorizontal: 14 },
  overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: spacing.xl, paddingBottom: spacing.xxl },
  textarea: { minHeight: 90, backgroundColor: colors.surfaceAlt, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, fontSize: 15, color: colors.text, textAlignVertical: 'top' },
});
