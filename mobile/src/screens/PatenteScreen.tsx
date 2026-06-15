import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Header } from '../components/Header';
import { Button, Card, Badge } from '../components/ui';
import { useApp } from '../state/AppContext';
import { useTheme, useT } from '../state/SettingsContext';
import { api } from '../api/api';
import { ApiError } from '../api/client';
import { spacing, radius, type ThemeColors } from '../theme/theme';
import { dataBreve } from '../lib/format';
import type { Patente } from '../models/types';
import type { ProfileStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<ProfileStackParamList, 'Patente'>;

export default function PatenteScreen({ navigation }: Props) {
  const { user } = useApp();
  const { colors, font } = useTheme();
  const t = useT();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const statoColor: Record<string, string> = { verificata: colors.success, in_attesa: colors.warning, rifiutata: colors.danger };
  const [pat, setPat] = useState<Patente | null>(null);
  const [numero, setNumero] = useState('');
  const [categoria, setCategoria] = useState('B');
  const [scadenza, setScadenza] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    if (!user) return;
    api.getPatente(user.idUtente).then((p) => {
      setPat(p);
      if (p) { setNumero(p.numeroPatente); setCategoria(p.categoria || 'B'); setScadenza(p.dataScadenza || ''); }
    }).catch(() => {});
  }, [user]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const salva = async () => {
    if (!user) return;
    if (numero.trim().length < 5) { Alert.alert(t('Numero non valido'), t('Inserisci un numero patente valido.')); return; }
    setBusy(true);
    try {
      const p = await api.salvaPatente(user.idUtente, { numeroPatente: numero.trim(), categoria, dataScadenza: scadenza || undefined });
      setPat(p);
      Alert.alert(t('Patente caricata'), t('Stato verifica: {v}.', { v: t(p.statoVerifica.replace('_', ' ')) }));
    } catch (e) {
      Alert.alert(t('Errore'), e instanceof ApiError ? e.message : t('Caricamento non riuscito'));
    } finally { setBusy(false); }
  };

  return (
    <View style={styles.root}>
      <Header title={t('Patente di guida')} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ padding: spacing.lg }} keyboardShouldPersistTaps="handled">
        {pat && (
          <Card style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg }}>
            <MaterialCommunityIcons name="card-account-details" size={28} color={colors.primary} />
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={font.h3}>{pat.numeroPatente} · cat. {pat.categoria}</Text>
              <Text style={font.small}>{pat.dataScadenza ? t('Scade il {v}', { v: dataBreve(pat.dataScadenza) }) : t('Senza scadenza')}</Text>
            </View>
            <Badge text={t(pat.statoVerifica.replace('_', ' '))} color={statoColor[pat.statoVerifica] || colors.textMuted} />
          </Card>
        )}

        <Text style={[font.h3, { marginBottom: spacing.sm }]}>{pat ? t('Aggiorna patente') : t('Carica la patente')}</Text>
        <Lab>{t('Numero patente')}</Lab>
        <TextInput style={styles.input} value={numero} onChangeText={setNumero} placeholder="es. BA1234567" placeholderTextColor={colors.textLight} autoCapitalize="characters" />
        <Lab>{t('Categoria')}</Lab>
        <TextInput style={styles.input} value={categoria} onChangeText={setCategoria} placeholder="es. B" placeholderTextColor={colors.textLight} autoCapitalize="characters" />
        <Lab>{t('Data di scadenza (AAAA-MM-GG)')}</Lab>
        <TextInput style={styles.input} value={scadenza} onChangeText={setScadenza} placeholder="2030-05-01" placeholderTextColor={colors.textLight} />

        <Button title={pat ? t('Aggiorna patente') : t('Carica patente')} icon="upload" onPress={salva} loading={busy} style={{ marginTop: spacing.xl }} />
        <Text style={[font.small, { marginTop: spacing.md }]}>
          {t('La verifica è simulata: una patente con scadenza futura risulta "verificata".')}
        </Text>
      </ScrollView>
    </View>
  );
}

function Lab({ children }: { children: React.ReactNode }) {
  const { font } = useTheme();
  return <Text style={[font.label, { marginTop: spacing.md, marginBottom: 6 }]}>{children}</Text>;
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  input: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, height: 50, fontSize: 15, color: colors.text },
});
