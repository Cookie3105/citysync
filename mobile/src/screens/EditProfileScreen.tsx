import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Alert } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Header } from '../components/Header';
import { Button } from '../components/ui';
import { useApp } from '../state/AppContext';
import { useTheme, useT } from '../state/SettingsContext';
import { api } from '../api/api';
import { ApiError } from '../api/client';
import { spacing, radius, type ThemeColors } from '../theme/theme';
import type { ProfileStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<ProfileStackParamList, 'EditProfile'>;

export default function EditProfileScreen({ navigation }: Props) {
  const { user, refreshUser } = useApp();
  const { colors, font } = useTheme();
  const t = useT();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [nome, setNome] = useState(user?.nome ?? '');
  const [cognome, setCognome] = useState(user?.cognome ?? '');
  const [telefono, setTelefono] = useState(user?.telefono ?? '');
  const [busy, setBusy] = useState(false);

  const salva = async () => {
    if (!user) return;
    setBusy(true);
    try {
      await api.aggiornaProfilo(user.idUtente, { nome, cognome, telefono });
      await refreshUser();
      Alert.alert(t('Salvato'), t('Profilo aggiornato.'), [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (e) {
      Alert.alert(t('Errore'), e instanceof ApiError ? e.message : t('Salvataggio non riuscito'));
    } finally { setBusy(false); }
  };

  return (
    <View style={styles.root}>
      <Header title={t('Modifica profilo')} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ padding: spacing.lg }} keyboardShouldPersistTaps="handled">
        <Lab>{t('Nome')}</Lab>
        <TextInput style={styles.input} value={nome} onChangeText={setNome} placeholderTextColor={colors.textLight} />
        <Lab>{t('Cognome')}</Lab>
        <TextInput style={styles.input} value={cognome} onChangeText={setCognome} placeholderTextColor={colors.textLight} />
        <Lab>{t('Telefono')}</Lab>
        <TextInput style={styles.input} value={telefono} onChangeText={setTelefono} keyboardType="phone-pad" placeholderTextColor={colors.textLight} />
        <Text style={[font.small, { marginTop: spacing.md }]}>{t('Email: {v} (non modificabile)', { v: user?.email ?? '' })}</Text>
        <Button title={t('Salva modifiche')} icon="content-save" onPress={salva} loading={busy} style={{ marginTop: spacing.xl }} />
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
