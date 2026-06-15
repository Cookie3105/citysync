import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, FlatList, TouchableOpacity, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Header } from '../../components/Header';
import { operatorApi } from '../../api/operatorApi';
import { ApiError } from '../../api/client';
import { colors, spacing, radius, font } from '../../theme/theme';
import { oraBreve } from '../../lib/format';
import type { Messaggio } from '../../models/types';
import type { OpSupportStackParamList } from '../navigation';

type Props = NativeStackScreenProps<OpSupportStackParamList, 'Chat'>;

export default function OpChat({ route, navigation }: Props) {
  const { idRichiesta } = route.params;
  const [msgs, setMsgs] = useState<Messaggio[]>([]);
  const [testo, setTesto] = useState('');
  const listRef = useRef<FlatList<Messaggio>>(null);

  const load = useCallback(() => {
    operatorApi.messaggi(idRichiesta).then(setMsgs).catch(() => {});
  }, [idRichiesta]);

  useEffect(() => {
    load();
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    if (msgs.length) setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  }, [msgs.length]);

  const invia = async () => {
    const t = testo.trim();
    if (!t) return;
    setTesto('');
    try { await operatorApi.rispondi(idRichiesta, t); load(); }
    catch (e) { Alert.alert('Errore', e instanceof ApiError ? e.message : 'Invio non riuscito'); }
  };

  const setStato = async (stato: string) => {
    try { await operatorApi.aggiornaRichiesta(idRichiesta, { statoRichiesta: stato, idOperatore: 'OP-demo' }); Alert.alert('Aggiornato', `Richiesta ${stato.replace('_', ' ')}.`); }
    catch (e) { Alert.alert('Errore', e instanceof ApiError ? e.message : 'Errore'); }
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Header
        title={route.params.titolo || 'Chat'}
        onBack={() => navigation.goBack()}
        right={
          <TouchableOpacity onPress={() => setStato('chiusa')} hitSlop={8}>
            <MaterialCommunityIcons name="check-circle-outline" size={22} color={colors.success} />
          </TouchableOpacity>
        }
      />
      <View style={styles.statoBar}>
        <TouchableOpacity style={styles.statoBtn} onPress={() => setStato('in_gestione')}>
          <Text style={styles.statoBtnText}>Segna in gestione</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.statoBtn, { borderColor: colors.success }]} onPress={() => setStato('chiusa')}>
          <Text style={[styles.statoBtnText, { color: colors.success }]}>Chiudi richiesta</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={listRef}
        data={msgs}
        keyExtractor={(m) => m.idMessaggio}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm }}
        ListEmptyComponent={<Text style={[font.label, { textAlign: 'center', marginTop: spacing.xl }]}>Nessun messaggio. Scrivi per rispondere all'utente.</Text>}
        renderItem={({ item }) => {
          const mine = item.mittente === 'operatore';
          return (
            <View style={[styles.bubbleWrap, mine ? styles.right : styles.left]}>
              <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleUt]}>
                <Text style={[font.body, { color: mine ? colors.white : colors.text }]}>{item.testo}</Text>
              </View>
              <Text style={styles.time}>{item.mittente === 'utente' ? 'Utente · ' : ''}{oraBreve(item.timestamp)}</Text>
            </View>
          );
        }}
      />

      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder="Scrivi una risposta…"
          placeholderTextColor={colors.textLight}
          value={testo}
          onChangeText={setTesto}
          onSubmitEditing={invia}
          returnKeyType="send"
        />
        <TouchableOpacity style={styles.sendBtn} onPress={invia}>
          <MaterialCommunityIcons name="send" size={20} color={colors.white} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  statoBar: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  statoBtn: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, paddingVertical: 8, alignItems: 'center' },
  statoBtnText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  bubbleWrap: { maxWidth: '82%' },
  left: { alignSelf: 'flex-start' },
  right: { alignSelf: 'flex-end' },
  bubble: { paddingHorizontal: spacing.md, paddingVertical: 10, borderRadius: 18 },
  bubbleMine: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  bubbleUt: { backgroundColor: colors.surface, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: colors.border },
  time: { fontSize: 10, color: colors.textLight, marginTop: 2, marginHorizontal: 4 },
  inputBar: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.divider, backgroundColor: colors.surface },
  input: { flex: 1, backgroundColor: colors.surfaceAlt, borderRadius: radius.pill, paddingHorizontal: spacing.lg, height: 46, fontSize: 15, color: colors.text },
  sendBtn: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
});
