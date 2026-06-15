import React, { useCallback, useMemo, useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Header } from '../components/Header';
import { Card, Button, Segmented } from '../components/ui';
import { useApp } from '../state/AppContext';
import { useTheme, useT } from '../state/SettingsContext';
import { api } from '../api/api';
import { ApiError } from '../api/client';
import { confirmAction } from '../lib/confirm';
import { spacing, radius, shadow, type ThemeColors } from '../theme/theme';
import type { MetodoPagamento } from '../models/types';
import type { ProfileStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<ProfileStackParamList, 'Payment'>;
type Tipo = 'carta' | 'paypal';

export default function PaymentScreen({ navigation }: Props) {
  const { user } = useApp();
  const { colors, font } = useTheme();
  const t = useT();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [metodi, setMetodi] = useState<MetodoPagamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [tipo, setTipo] = useState<Tipo>('carta');
  const [intestatario, setIntestatario] = useState('');
  const [numero, setNumero] = useState('');
  const [scadenza, setScadenza] = useState('');
  const [cvv, setCvv] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try { setMetodi(await api.metodi(user.idUtente)); } catch { /* */ } finally { setLoading(false); }
  }, [user]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const salva = async () => {
    if (!user) return;
    setBusy(true);
    try {
      await api.salvaMetodo({
        idUtente: user.idUtente, tipoMetodo: tipo, intestatario,
        ...(tipo === 'carta' ? { numero, scadenza, cvv } : {}),
      });
      setIntestatario(''); setNumero(''); setScadenza(''); setCvv('');
      await load();
      Alert.alert(t('Salvato'), t('Metodo di pagamento registrato.'));
    } catch (e) {
      // Scenario A1 (dati non validi): messaggio del gateway.
      Alert.alert(t('Dati non validi'), e instanceof ApiError ? e.message : t('Verifica i dati inseriti'));
    } finally {
      setBusy(false);
    }
  };

  const rimuovi = (id: string) => {
    if (!user) return;
    confirmAction(t('Rimuovere il metodo?'), '', async () => {
      await api.rimuoviMetodo(user.idUtente, id); load();
    }, { confirmLabel: t('Rimuovi'), destructive: true });
  };

  return (
    <View style={styles.root}>
      <Header title={t('Metodo di pagamento')} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ padding: spacing.lg }} keyboardShouldPersistTaps="handled">
        {loading ? (
          <ActivityIndicator color={colors.primary} />
        ) : metodi.length === 0 ? (
          <Text style={[font.label, { marginBottom: spacing.lg }]}>{t('Nessun metodo registrato.')}</Text>
        ) : (
          metodi.map((m) => (
            <View key={m.idMetodo} style={styles.method}>
              <MaterialCommunityIcons
                name={m.tipoMetodo === 'paypal' ? 'wallet' : 'credit-card'} size={26} color={colors.primary} />
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={font.h3}>{m.tipoMetodo === 'paypal' ? 'PayPal' : t('Carta')} · {m.intestatario}</Text>
                <Text style={font.small}>{m.scadenza ? t('Scad. {v}', { v: m.scadenza }) + ' · ' : ''}{m.statoMetodo}</Text>
              </View>
              <TouchableOpacity onPress={() => rimuovi(m.idMetodo)} hitSlop={8}>
                <MaterialCommunityIcons name="trash-can-outline" size={22} color={colors.danger} />
              </TouchableOpacity>
            </View>
          ))
        )}

        <Card style={{ marginTop: spacing.lg }}>
          <Text style={[font.h3, { marginBottom: spacing.md }]}>{t('Aggiungi metodo')}</Text>
          <Segmented
            value={tipo}
            onChange={setTipo}
            options={[{ key: 'carta', label: t('Carta'), icon: 'credit-card' }, { key: 'paypal', label: 'PayPal', icon: 'wallet' }]}
          />
          <Field placeholder={t('Intestatario')} value={intestatario} onChangeText={setIntestatario} style={{ marginTop: spacing.md }} />
          {tipo === 'carta' && (
            <>
              <Field placeholder={t('Numero carta')} value={numero} onChangeText={setNumero} keyboardType="number-pad" />
              <View style={{ flexDirection: 'row', gap: spacing.md }}>
                <Field placeholder="MM/YY" value={scadenza} onChangeText={setScadenza} style={{ flex: 1 }} />
                <Field placeholder="CVV" value={cvv} onChangeText={setCvv} keyboardType="number-pad" secureTextEntry style={{ flex: 1 }} />
              </View>
            </>
          )}
          <Button title={t('Salva metodo')} icon="content-save" onPress={salva} loading={busy} style={{ marginTop: spacing.sm }} />
          <Text style={styles.note}>{t('Pagamenti gestiti tramite gateway esterno (IPaymentGateway).')}</Text>
        </Card>
      </ScrollView>
    </View>
  );
}

// Componente a livello di modulo (identità stabile): se fosse definito dentro
// PaymentScreen verrebbe ricreato a ogni render, facendo perdere il focus al campo.
function Field(props: React.ComponentProps<typeof TextInput>) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { style, ...rest } = props;
  return <TextInput style={[styles.input, style]} placeholderTextColor={colors.textLight} {...rest} />;
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  method: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm, ...shadow.card,
  },
  input: {
    backgroundColor: colors.surfaceAlt, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: spacing.md, height: 50, fontSize: 15, color: colors.text, marginBottom: spacing.md,
  },
  note: { fontSize: 11, color: colors.textLight, textAlign: 'center', marginTop: spacing.md },
});
