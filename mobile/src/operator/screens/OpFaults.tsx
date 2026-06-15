import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, Alert } from 'react-native';
import { Header } from '../../components/Header';
import { Badge, Button, EmptyState, Segmented } from '../../components/ui';
import { operatorApi } from '../../api/operatorApi';
import { ApiError } from '../../api/client';
import { useData } from '../../lib/useData';
import { colors, spacing, radius, font, shadow } from '../../theme/theme';
import { statoGenericoColor, tipoEmoji, dataBreve, ora } from '../../lib/format';
import type { Segnalazione } from '../../models/types';

type Filtro = 'aperta' | 'tutte' | 'chiusa';

export default function OpFaults() {
  const [filtro, setFiltro] = useState<Filtro>('aperta');
  const { data, loading, reload } = useData(
    () => operatorApi.segnalazioni(filtro === 'tutte' ? undefined : filtro), [filtro]);
  const [sel, setSel] = useState<Segnalazione | null>(null);

  const aggiorna = async (stato: string) => {
    if (!sel) return;
    try { await operatorApi.aggiornaSegnalazione(sel.idSegnalazione, { statoSegnalazione: stato, idOperatore: 'OP-demo' }); setSel(null); reload(); }
    catch (e) { Alert.alert('Errore', e instanceof ApiError ? e.message : 'Errore'); }
  };

  const creaIntervento = async () => {
    if (!sel) return;
    try {
      await operatorApi.apriIntervento({ idMezzo: sel.idMezzo, descrizione: `Da segnalazione: ${sel.descrizione}`, idOperatore: 'OP-demo', idSegnalazione: sel.idSegnalazione });
      await operatorApi.aggiornaSegnalazione(sel.idSegnalazione, { statoSegnalazione: 'in_gestione', idOperatore: 'OP-demo' });
      Alert.alert('Fatto', 'Intervento di manutenzione aperto e mezzo messo in manutenzione.');
      setSel(null); reload();
    } catch (e) { Alert.alert('Errore', e instanceof ApiError ? e.message : 'Errore'); }
  };

  return (
    <View style={styles.root}>
      <Header title="Segnalazioni guasto" />
      <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.sm }}>
        <Segmented
          value={filtro}
          onChange={setFiltro}
          options={[{ key: 'aperta', label: 'Aperte' }, { key: 'tutte', label: 'Tutte' }, { key: 'chiusa', label: 'Chiuse' }]}
        />
      </View>

      <FlatList
        data={data ?? []}
        keyExtractor={(s) => s.idSegnalazione}
        refreshing={loading}
        onRefresh={reload}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm }}
        ListEmptyComponent={!loading ? <EmptyState icon="check-circle-outline" title="Nessuna segnalazione" /> : null}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => setSel(item)} activeOpacity={0.85}>
            <View style={styles.between}>
              <Text style={font.h3}>{tipoEmoji[item.tipoMezzo]} {item.codiceMezzo}</Text>
              <Badge text={item.statoSegnalazione.replace('_', ' ')} color={statoGenericoColor[item.statoSegnalazione] || colors.textMuted} />
            </View>
            <Text style={[font.body, { marginTop: 4 }]} numberOfLines={2}>{item.descrizione}</Text>
            <Text style={[font.small, { marginTop: 4 }]}>
              {item.nome ? `${item.nome} ${item.cognome} · ` : ''}{dataBreve(item.dataSegnalazione)} {ora(item.oraSegnalazione)}
            </Text>
          </TouchableOpacity>
        )}
      />

      <Modal visible={!!sel} transparent animationType="slide" onRequestClose={() => setSel(null)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setSel(null)}>
          <TouchableOpacity activeOpacity={1} style={styles.sheet}>
            {sel && (
              <>
                <Text style={font.h2}>{tipoEmoji[sel.tipoMezzo]} {sel.codiceMezzo}</Text>
                <Text style={[font.small, { marginTop: 2 }]}>
                  {sel.nome ? `${sel.nome} ${sel.cognome} · ` : ''}{dataBreve(sel.dataSegnalazione)} {ora(sel.oraSegnalazione)}
                </Text>
                <View style={{ marginVertical: spacing.md }}>
                  <Badge text={sel.statoSegnalazione.replace('_', ' ')} color={statoGenericoColor[sel.statoSegnalazione] || colors.textMuted} />
                </View>
                <Text style={font.label}>Descrizione</Text>
                <Text style={[font.body, { marginTop: 4, lineHeight: 21 }]}>{sel.descrizione}</Text>

                <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg }}>
                  <Button title="In gestione" variant="secondary" onPress={() => aggiorna('in_gestione')} style={{ flex: 1 }} />
                  <Button title="Chiudi" variant="primary" icon="check" onPress={() => aggiorna('chiusa')} style={{ flex: 1 }} />
                </View>
                <Button title="Crea intervento di manutenzione" variant="outline" icon="wrench" onPress={creaIntervento} style={{ marginTop: spacing.md }} />
                <Text style={[font.small, { marginTop: spacing.sm, textAlign: 'center' }]}>
                  Realizza l'inclusione "Gestire manutenzione mezzi" (OP.06).
                </Text>
              </>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  card: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, ...shadow.card },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: spacing.xl, paddingBottom: spacing.xxl },
});
