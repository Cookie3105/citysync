import React, { useCallback, useMemo, useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Header } from '../components/Header';
import { Button, Card, Badge } from '../components/ui';
import { useApp } from '../state/AppContext';
import { useTheme, useT } from '../state/SettingsContext';
import { useLocation } from '../lib/useLocation';
import { api } from '../api/api';
import { ApiError } from '../api/client';
import { spacing, radius, shadow, type ThemeColors } from '../theme/theme';
import { dataBreve } from '../lib/format';
import type { RichiestaAssistenza } from '../models/types';
import type { SupportStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<SupportStackParamList, 'Support'>;

export default function SupportScreen({ navigation }: Props) {
  const { user } = useApp();
  const { colors, font } = useTheme();
  const t = useT();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const statoColor: Record<string, string> = {
    aperta: colors.accent, in_gestione: colors.warning, chiusa: colors.success,
  };
  const { coords } = useLocation();
  const [desc, setDesc] = useState('');
  const [inviaPos, setInviaPos] = useState(true);
  const [busy, setBusy] = useState(false);
  const [richieste, setRichieste] = useState<RichiestaAssistenza[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      setRichieste(await api.richiesteUtente(user.idUtente));
    } catch { /* */ } finally { setLoading(false); }
  }, [user]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const invia = async () => {
    if (!user) return;
    if (desc.trim().length < 3) { Alert.alert(t('Descrizione mancante'), t('Descrivi il problema.')); return; }
    setBusy(true);
    try {
      const pos = inviaPos && coords ? { lat: coords.lat, lon: coords.lon } : undefined;
      const r = await api.richiediAssistenza(user.idUtente, desc.trim(), pos);
      setDesc('');
      await load();
      navigation.navigate('Chat', { idRichiesta: r.idRichiesta, titolo: 'Assistenza' });
    } catch (e) {
      Alert.alert(t('Errore'), e instanceof ApiError ? e.message : t('Invio non riuscito'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.root}>
      <Header title={t('Assistenza')} />
      <ScrollView contentContainerStyle={{ padding: spacing.lg }} keyboardShouldPersistTaps="handled">
        <Card>
          <Text style={font.h3}>{t('Nuova richiesta')}</Text>
          <Text style={[font.label, { marginTop: 4, marginBottom: spacing.md }]}>
            {t('Raccontaci il problema, ti risponderemo in chat')}
          </Text>
          <TextInput
            style={styles.textarea}
            placeholder={t('Descrivi il problema…')}
            placeholderTextColor={colors.textLight}
            value={desc}
            onChangeText={setDesc}
            multiline
          />
          <View style={styles.posRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
              <MaterialCommunityIcons name="crosshairs-gps" size={18} color={colors.accent} />
              <Text style={font.label}>{t('Invia la mia posizione')} {coords ? '' : t('(non disponibile)')}</Text>
            </View>
            <Switch
              value={inviaPos && !!coords}
              onValueChange={setInviaPos}
              disabled={!coords}
              trackColor={{ true: colors.primary }}
            />
          </View>
          <Button title={t('Invia e apri chat')} icon="message-text" onPress={invia} loading={busy} style={{ marginTop: spacing.md }} />
        </Card>

        <Text style={[font.h3, { marginTop: spacing.xl, marginBottom: spacing.sm }]}>{t('Le tue richieste')}</Text>
        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} />
        ) : richieste.length === 0 ? (
          <Text style={[font.label, { marginTop: spacing.sm }]}>{t('Nessuna richiesta inviata.')}</Text>
        ) : (
          richieste.map((r) => (
            <TouchableOpacity
              key={r.idRichiesta}
              style={styles.reqItem}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('Chat', { idRichiesta: r.idRichiesta, titolo: 'Assistenza' })}
            >
              <MaterialCommunityIcons name="lifebuoy" size={22} color={colors.primary} />
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={font.body} numberOfLines={1}>{r.descrizione}</Text>
                <Text style={font.small}>{dataBreve(r.dataInvio)} · {r.oraInvio?.slice(0, 5)}{r.posizione ? ' · 📍' : ''}</Text>
              </View>
              <Badge text={t(r.statoRichiesta.replace('_', ' '))} color={statoColor[r.statoRichiesta] || colors.textMuted} />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  textarea: {
    minHeight: 90, backgroundColor: colors.surfaceAlt, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, padding: spacing.md,
    fontSize: 15, color: colors.text, textAlignVertical: 'top',
  },
  posRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md },
  reqItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm, ...shadow.card,
  },
});
