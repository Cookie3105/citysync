import React, { useCallback, useState } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Header } from '../../components/Header';
import { Badge, EmptyState } from '../../components/ui';
import { operatorApi } from '../../api/operatorApi';
import { ApiError } from '../../api/client';
import { colors, spacing, radius, font, shadow } from '../../theme/theme';
import type { OpMoreStackParamList } from '../navigation';
import type { UtenteAccount } from '../../models/types';

type Props = NativeStackScreenProps<OpMoreStackParamList, 'Accounts'>;

const statoColor: Record<string, string> = { attivo: colors.success, sospeso: colors.warning, bloccato: colors.danger };

export default function OpAccounts({ navigation }: Props) {
  const [q, setQ] = useState('');
  const [utenti, setUtenti] = useState<UtenteAccount[]>([]);
  const [loading, setLoading] = useState(false);

  const cerca = useCallback((query: string) => {
    setLoading(true);
    operatorApi.cercaUtenti(query || undefined).then(setUtenti).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useFocusEffect(useCallback(() => { cerca(q); /* eslint-disable-next-line */ }, []));

  const cambiaStato = (u: UtenteAccount, stato: string) => {
    const azione = stato === 'attivo' ? 'Riattivare' : stato === 'sospeso' ? 'Sospendere' : 'Bloccare';
    Alert.alert(`${azione} account`, `${azione} l'account di ${u.nome} ${u.cognome}?`, [
      { text: 'Annulla', style: 'cancel' },
      {
        text: azione, style: stato === 'attivo' ? 'default' : 'destructive', onPress: async () => {
          try { await operatorApi.aggiornaStatoAccount(u.idUtente, stato); cerca(q); }
          catch (e) { Alert.alert('Errore', e instanceof ApiError ? e.message : 'Errore'); }
        },
      },
    ]);
  };

  return (
    <View style={styles.root}>
      <Header title="Gestione account" onBack={() => navigation.goBack()} />
      <View style={styles.searchBar}>
        <MaterialCommunityIcons name="magnify" size={20} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Cerca per nome o email…"
          placeholderTextColor={colors.textLight}
          value={q}
          onChangeText={setQ}
          onSubmitEditing={() => cerca(q)}
          autoCapitalize="none"
          returnKeyType="search"
        />
      </View>
      <FlatList
        data={utenti}
        keyExtractor={(u) => u.idUtente}
        refreshing={loading}
        onRefresh={() => cerca(q)}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm }}
        ListEmptyComponent={!loading ? <EmptyState icon="account-search" title="Nessun utente" /> : null}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.between}>
              <Text style={font.h3}>{item.nome} {item.cognome}</Text>
              <Badge text={item.statoAccount} color={statoColor[item.statoAccount] || colors.textMuted} />
            </View>
            <Text style={font.small}>{item.email}{item.telefono ? ` · ${item.telefono}` : ''}</Text>
            <View style={styles.actions}>
              {item.statoAccount !== 'attivo' && (
                <TouchableOpacity style={[styles.btn, { borderColor: colors.success }]} onPress={() => cambiaStato(item, 'attivo')}>
                  <Text style={[styles.btnText, { color: colors.success }]}>Riattiva</Text>
                </TouchableOpacity>
              )}
              {item.statoAccount !== 'sospeso' && (
                <TouchableOpacity style={[styles.btn, { borderColor: colors.warning }]} onPress={() => cambiaStato(item, 'sospeso')}>
                  <Text style={[styles.btnText, { color: colors.warning }]}>Sospendi</Text>
                </TouchableOpacity>
              )}
              {item.statoAccount !== 'bloccato' && (
                <TouchableOpacity style={[styles.btn, { borderColor: colors.danger }]} onPress={() => cambiaStato(item, 'bloccato')}>
                  <Text style={[styles.btnText, { color: colors.danger }]}>Blocca</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: spacing.lg, marginBottom: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, height: 48 },
  searchInput: { flex: 1, fontSize: 15, color: colors.text },
  card: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, ...shadow.card },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  btn: { borderWidth: 1, borderRadius: radius.sm, paddingHorizontal: 12, paddingVertical: 7 },
  btnText: { fontSize: 13, fontWeight: '700' },
});
