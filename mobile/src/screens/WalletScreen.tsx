import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Header } from '../components/Header';
import { Button, Badge } from '../components/ui';
import { useApp } from '../state/AppContext';
import { useTheme, useT } from '../state/SettingsContext';
import { api } from '../api/api';
import { ApiError } from '../api/client';
import { spacing, radius, shadow, type ThemeColors } from '../theme/theme';
import { eur, dataBreve, ora } from '../lib/format';
import type { Portafoglio } from '../models/types';

type Props = NativeStackScreenProps<any, any>;

const TAGLI = [5, 10, 20, 50];

export default function WalletScreen({ navigation }: Props) {
  const { user } = useApp();
  const { colors, font } = useTheme();
  const t = useT();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [wallet, setWallet] = useState<Portafoglio | null>(null);
  const [storico, setStorico] = useState<{ idPagamento: string; importo: number; statoPagamento: string; tipoPagamento: string; dataPagamento: string; oraPagamento: string }[]>([]);
  const [importo, setImporto] = useState('10');
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    if (!user) return;
    api.portafoglio(user.idUtente).then(setWallet).catch(() => {});
    api.storicoPagamenti(user.idUtente).then(setStorico as any).catch(() => {});
  }, [user]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const ricarica = async () => {
    if (!user) return;
    const imp = Number(importo);
    if (!(imp > 0)) { Alert.alert(t('Importo non valido'), t('Inserisci un importo maggiore di zero.')); return; }
    setBusy(true);
    try {
      const r = await api.ricaricaPortafoglio(user.idUtente, imp);
      setWallet({ idPortafoglio: r.idPortafoglio, saldo: r.saldo });
      Alert.alert(t('Ricarica effettuata'), t('Nuovo saldo: {v}.', { v: eur(r.saldo) }));
      load();
    } catch (e) {
      Alert.alert(t('Errore'), e instanceof ApiError ? e.message : t('Ricarica non riuscita'));
    } finally { setBusy(false); }
  };

  return (
    <View style={styles.root}>
      <Header title={t('Portafoglio digitale')} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ padding: spacing.lg }} keyboardShouldPersistTaps="handled">
        <View style={styles.balanceCard}>
          <View>
            <Text style={[font.label, { color: '#CFE3E9' }]}>{t('Saldo disponibile')}</Text>
            <Text style={styles.balance}>{eur(wallet?.saldo ?? 0)}</Text>
          </View>
          <MaterialCommunityIcons name="wallet" size={40} color="#CFE3E9" />
        </View>

        <Text style={[font.h3, { marginTop: spacing.xl, marginBottom: spacing.sm }]}>{t('Ricarica')}</Text>
        <View style={styles.tagli}>
          {TAGLI.map((tg) => (
            <TouchableOpacity key={tg} style={[styles.taglio, Number(importo) === tg && styles.taglioActive]} onPress={() => setImporto(String(tg))}>
              <Text style={[styles.taglioText, Number(importo) === tg && { color: colors.white }]}>€ {tg}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TextInput style={styles.input} value={importo} onChangeText={setImporto} keyboardType="numbers-and-punctuation" placeholder={t('Importo')} placeholderTextColor={colors.textLight} />
        <Button title={`${t('Ricarica')} ${eur(Number(importo) || 0)}`} icon="credit-card-plus-outline" onPress={ricarica} loading={busy} style={{ marginTop: spacing.md }} />
        <Text style={[font.small, { marginTop: spacing.sm }]}>{t('Pagamento gestito tramite gateway esterno (IPaymentGateway).')}</Text>

        <Text style={[font.h3, { marginTop: spacing.xl, marginBottom: spacing.sm }]}>{t('Storico pagamenti')}</Text>
        {storico.length === 0 ? (
          <Text style={font.label}>{t('Nessun pagamento registrato.')}</Text>
        ) : storico.map((p) => (
          <View key={p.idPagamento} style={styles.payRow}>
            <View style={{ flex: 1 }}>
              <Text style={font.body}>{p.tipoPagamento}</Text>
              <Text style={font.small}>{dataBreve(p.dataPagamento)} · {ora(p.oraPagamento)}</Text>
            </View>
            <Text style={font.price}>{eur(p.importo)}</Text>
            <Badge text={t(p.statoPagamento)} color={p.statoPagamento === 'completato' ? colors.success : colors.warning} />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  balanceCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.primary, borderRadius: radius.lg, padding: spacing.lg, ...shadow.card },
  balance: { color: colors.white, fontSize: 32, fontWeight: '800', marginTop: 4 },
  tagli: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  taglio: { flex: 1, height: 48, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  taglioActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  taglioText: { fontWeight: '700', color: colors.text },
  input: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, height: 50, fontSize: 15, color: colors.text },
  payRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm, ...shadow.card },
});
