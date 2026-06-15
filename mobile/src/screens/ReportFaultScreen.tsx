import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, ScrollView } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Header } from '../components/Header';
import { Button, Card } from '../components/ui';
import { useApp } from '../state/AppContext';
import { useTheme, useT } from '../state/SettingsContext';
import { api } from '../api/api';
import { ApiError } from '../api/client';
import { spacing, radius, type ThemeColors } from '../theme/theme';
import type { HomeStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<HomeStackParamList, 'ReportFault'>;

const SUGGERIMENTI = ['Freni difettosi', 'Batteria non carica', 'Pneumatico a terra', 'Display non funziona', 'Danno alla carrozzeria'];

export default function ReportFaultScreen({ route, navigation }: Props) {
  const { idMezzo, codiceMezzo } = route.params;
  const { user } = useApp();
  const { colors, font } = useTheme();
  const t = useT();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [desc, setDesc] = useState('');
  const [busy, setBusy] = useState(false);

  const invia = async () => {
    if (!user) return;
    if (desc.trim().length < 3) {
      Alert.alert(t('Descrizione mancante'), t('Descrivi brevemente il guasto.'));
      return;
    }
    setBusy(true);
    try {
      await api.segnalaGuasto(user.idUtente, idMezzo, desc.trim());
      Alert.alert(t('Segnalazione inviata'), t('Grazie! L\'operatore prenderà in carico il guasto.'), [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert(t('Errore'), e instanceof ApiError ? e.message : t('Invio non riuscito'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.root}>
      <Header title={t('Segnala guasto')} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ padding: spacing.lg }} keyboardShouldPersistTaps="handled">
        <Card style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
          <MaterialCommunityIcons name="alert-circle-outline" size={26} color={colors.warning} />
          <View>
            <Text style={font.h3}>{t('Mezzo {v}', { v: codiceMezzo })}</Text>
            <Text style={font.label}>{t('Descrivi il problema riscontrato')}</Text>
          </View>
        </Card>

        <Text style={[font.label, { marginBottom: spacing.sm }]}>{t('Descrizione del guasto')}</Text>
        <TextInput
          style={styles.textarea}
          placeholder={t('Es. il freno posteriore non risponde…')}
          placeholderTextColor={colors.textLight}
          value={desc}
          onChangeText={setDesc}
          multiline
        />

        <View style={styles.chips}>
          {SUGGERIMENTI.map((s) => (
            <Text key={s} style={styles.chip} onPress={() => setDesc(t(s))}>{t(s)}</Text>
          ))}
        </View>

        <Button title={t('Invia segnalazione')} icon="send" onPress={invia} loading={busy} style={{ marginTop: spacing.xl }} />
      </ScrollView>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  textarea: {
    minHeight: 120, backgroundColor: colors.surface, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, padding: spacing.md,
    fontSize: 15, color: colors.text, textAlignVertical: 'top',
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  chip: {
    backgroundColor: colors.primarySoft, color: colors.primary, fontWeight: '600', fontSize: 13,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.pill, overflow: 'hidden',
  },
});
