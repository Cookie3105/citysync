import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, FlatList, TouchableOpacity, KeyboardAvoidingView, Platform,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Header } from '../components/Header';
import { useTheme, useT } from '../state/SettingsContext';
import { api } from '../api/api';
import { spacing, radius, type ThemeColors } from '../theme/theme';
import { oraBreve } from '../lib/format';
import type { Messaggio } from '../models/types';
import type { SupportStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<SupportStackParamList, 'Chat'>;

// Risposte automatiche dell'operatore: SIMULAZIONE lato client che sostituisce
// il client web Operatore (OP.07), non ancora realizzato in questo increment.
const RISPOSTE_OP = [
  'Ciao! Sono l\'operatore CitySync, come posso aiutarti?',
  'Grazie per la segnalazione, sto verificando.',
  'Abbiamo preso in carico la tua richiesta, a breve risolviamo.',
];

export default function ChatScreen({ route, navigation }: Props) {
  const { idRichiesta } = route.params;
  const { colors, font } = useTheme();
  const t = useT();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [msgs, setMsgs] = useState<Messaggio[]>([]);
  const [testo, setTesto] = useState('');
  const listRef = useRef<FlatList<Messaggio>>(null);
  const replyCount = useRef(0);

  const load = useCallback(async () => {
    try {
      const m = await api.messaggi(idRichiesta);
      setMsgs(m);
    } catch { /* */ }
  }, [idRichiesta]);

  useEffect(() => {
    load();
    const tmr = setInterval(load, 4000); // polling messaggi
    return () => clearInterval(tmr);
  }, [load]);

  useEffect(() => {
    if (msgs.length) setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  }, [msgs.length]);

  const invia = async () => {
    const txt = testo.trim();
    if (!txt) return;
    setTesto('');
    try {
      await api.inviaMessaggio(idRichiesta, txt, 'utente');
      await load();
      // SIMULAZIONE risposta operatore (placeholder OP.07).
      const reply = RISPOSTE_OP[Math.min(replyCount.current, RISPOSTE_OP.length - 1)];
      replyCount.current += 1;
      setTimeout(async () => {
        try { await api.inviaMessaggio(idRichiesta, reply, 'operatore'); await load(); } catch { /* */ }
      }, 1400);
    } catch { /* */ }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <Header title={route.params.titolo ? t(route.params.titolo) : t('Chat assistenza')} onBack={() => navigation.goBack()} />
      <FlatList
        ref={listRef}
        data={msgs}
        keyExtractor={(m) => m.idMessaggio}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm }}
        ListEmptyComponent={
          <Text style={[font.label, { textAlign: 'center', marginTop: spacing.xl }]}>
            {t('Scrivi un messaggio per iniziare la conversazione.')}
          </Text>
        }
        renderItem={({ item }) => <Bubble m={item} />}
      />
      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder={t('Scrivi un messaggio…')}
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

function Bubble({ m }: { m: Messaggio }) {
  const { colors, font } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const mine = m.mittente === 'utente';
  return (
    <View style={[styles.bubbleWrap, mine ? styles.right : styles.left]}>
      <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleOp]}>
        <Text style={[font.body, { color: mine ? colors.white : colors.text }]}>{m.testo}</Text>
      </View>
      <Text style={styles.time}>{oraBreve(m.timestamp)}</Text>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  bubbleWrap: { maxWidth: '82%' },
  left: { alignSelf: 'flex-start' },
  right: { alignSelf: 'flex-end' },
  bubble: { paddingHorizontal: spacing.md, paddingVertical: 10, borderRadius: 18 },
  bubbleMine: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  bubbleOp: { backgroundColor: colors.surface, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: colors.border },
  time: { fontSize: 10, color: colors.textLight, marginTop: 2, marginHorizontal: 4 },
  inputBar: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.divider, backgroundColor: colors.surface,
  },
  input: {
    flex: 1, backgroundColor: colors.surfaceAlt, borderRadius: radius.pill,
    paddingHorizontal: spacing.lg, height: 46, fontSize: 15, color: colors.text,
  },
  sendBtn: {
    width: 46, height: 46, borderRadius: 23, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
});
