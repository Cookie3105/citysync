import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Alert, ScrollView, Switch } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Header } from '../../components/Header';
import { Button, Badge, EmptyState } from '../../components/ui';
import { adminApi } from '../../api/adminApi';
import { ApiError } from '../../api/client';
import { useData } from '../../lib/useData';
import { colors, spacing, radius, font, shadow } from '../../theme/theme';
import { valoreIncentivo } from '../../lib/format';
import type { Incentivo } from '../../models/types';

const statoColor: Record<string, string> = { attivo: colors.success, scaduto: colors.warning, disattivato: colors.textMuted };

export default function AdIncentives() {
  const { data, loading, reload } = useData(() => adminApi.incentivi(), []); // AP07
  const [addOpen, setAddOpen] = useState(false);

  const toggle = async (i: Incentivo) => {
    try { await adminApi.aggiornaIncentivo(i.idIncentivo, { statoIncentivo: i.statoIncentivo === 'attivo' ? 'disattivato' : 'attivo' }); reload(); }
    catch (e) { Alert.alert('Errore', e instanceof ApiError ? e.message : 'Errore'); }
  };

  return (
    <View style={styles.root}>
      <Header
        title="Incentivi e bonus"
        right={
          <TouchableOpacity style={styles.addBtn} onPress={() => setAddOpen(true)}>
            <MaterialCommunityIcons name="plus" size={22} color={colors.white} />
          </TouchableOpacity>
        }
      />
      <FlatList
        data={data ?? []}
        keyExtractor={(i) => i.idIncentivo}
        refreshing={loading}
        onRefresh={reload}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm }}
        ListEmptyComponent={!loading ? <EmptyState icon="gift-outline" title="Nessun incentivo" subtitle="Crea il primo bonus per la mobilità" /> : null}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.iconBox}>
              <MaterialCommunityIcons name="gift" size={22} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={font.h3}>{item.tipoIncentivo}</Text>
              <Text style={font.small}>{item.descrizione || '—'}</Text>
              <Text style={[font.label, { marginTop: 2 }]}>Valore: {valoreIncentivo(item.valore, item.unitaValore)}</Text>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 8 }}>
              <Badge text={item.statoIncentivo} color={statoColor[item.statoIncentivo] || colors.textMuted} />
              <Switch value={item.statoIncentivo === 'attivo'} onValueChange={() => toggle(item)} trackColor={{ true: colors.primary }} />
            </View>
          </View>
        )}
      />
      {addOpen && <AddIncentiveModal onClose={() => setAddOpen(false)} onSaved={() => { setAddOpen(false); reload(); }} />}
    </View>
  );
}

function AddIncentiveModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [tipo, setTipo] = useState('');
  const [valore, setValore] = useState('');
  const [descrizione, setDescrizione] = useState('');
  // false = sconto diretto in € ; true = sconto in percentuale (%).
  const [percentuale, setPercentuale] = useState(false);
  const [busy, setBusy] = useState(false);

  const salva = async () => {
    if (!tipo.trim()) { Alert.alert('Manca il tipo', 'Indica il tipo di incentivo.'); return; }
    setBusy(true);
    try {
      await adminApi.creaIncentivo({
        tipoIncentivo: tipo.trim(),
        valore: Number(valore) || 0,
        unitaValore: percentuale ? 'percentuale' : 'euro',
        descrizione,
      });
      onSaved();
    } catch (e) { Alert.alert('Errore', e instanceof ApiError ? e.message : 'Errore'); }
    finally { setBusy(false); }
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={[font.h2, { marginBottom: spacing.md }]}>Nuovo incentivo</Text>
            <Text style={styles.lab}>Tipo incentivo</Text>
            <TextInput style={styles.input} value={tipo} onChangeText={setTipo} placeholder="es. bonus_parcheggio" placeholderTextColor={colors.textLight} />

            {/* Pulsante: spento = sconto in €, acceso = sconto in % */}
            <View style={styles.unitRow}>
              <Text style={styles.lab}>Tipo di valore</Text>
              <TouchableOpacity
                style={[styles.unitToggle, percentuale && styles.unitToggleOn]}
                onPress={() => setPercentuale((v) => !v)}
                activeOpacity={0.85}
              >
                <Text style={[styles.unitText, !percentuale && styles.unitTextActive]}>€ Sconto</Text>
                <Text style={[styles.unitText, percentuale && styles.unitTextActive]}>% Percentuale</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.lab}>{percentuale ? 'Valore (%)' : 'Valore (€)'}</Text>
            <View style={styles.valueRow}>
              <Text style={styles.unitBadge}>{percentuale ? '%' : '€'}</Text>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={valore}
                onChangeText={setValore}
                keyboardType="numbers-and-punctuation"
                placeholder={percentuale ? 'es. 20' : 'es. 0.50'}
                placeholderTextColor={colors.textLight}
              />
            </View>
            <Text style={styles.lab}>Descrizione</Text>
            <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top', paddingTop: 10 }]} value={descrizione} onChangeText={setDescrizione} multiline placeholderTextColor={colors.textLight} />
            <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg }}>
              <Button title="Annulla" variant="ghost" onPress={onClose} style={{ flex: 1 }} />
              <Button title="Crea incentivo" icon="content-save" onPress={salva} loading={busy} style={{ flex: 1.4 }} />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, ...shadow.card },
  iconBox: { width: 46, height: 46, borderRadius: 13, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  modal: { backgroundColor: colors.surface, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: spacing.xl, maxHeight: '88%' },
  lab: { ...font.label, marginTop: spacing.md, marginBottom: 6 },
  input: { backgroundColor: colors.surfaceAlt, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, height: 48, fontSize: 15, color: colors.text },
  unitRow: { marginTop: spacing.xs },
  unitToggle: { flexDirection: 'row', backgroundColor: colors.surfaceAlt, borderRadius: radius.pill, padding: 4, borderWidth: 1, borderColor: colors.border },
  unitToggleOn: {},
  unitText: { flex: 1, textAlign: 'center', paddingVertical: 8, borderRadius: radius.pill, fontSize: 13, fontWeight: '700', color: colors.textMuted },
  unitTextActive: { backgroundColor: colors.primary, color: colors.white, overflow: 'hidden' },
  valueRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  unitBadge: { width: 40, height: 48, textAlign: 'center', textAlignVertical: 'center', lineHeight: 48, fontSize: 20, fontWeight: '800', color: colors.primary, backgroundColor: colors.primarySoft, borderRadius: radius.md, overflow: 'hidden' },
});
