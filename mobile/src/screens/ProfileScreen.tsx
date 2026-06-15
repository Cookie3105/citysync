import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Header } from '../components/Header';
import { Card, Button } from '../components/ui';
import { useApp } from '../state/AppContext';
import { useTheme, useT } from '../state/SettingsContext';
import { api } from '../api/api';
import { spacing, radius, shadow, type ThemeColors } from '../theme/theme';
import { eur } from '../lib/format';
import type { Portafoglio } from '../models/types';
import type { ProfileStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<ProfileStackParamList, 'Profile'>;

export default function ProfileScreen({ navigation }: Props) {
  const { user, logout } = useApp();
  const { colors, font } = useTheme();
  const t = useT();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [wallet, setWallet] = useState<Portafoglio | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    try { setWallet(await api.portafoglio(user.idUtente)); } catch { /* */ }
  }, [user]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (!user) return null;

  return (
    <View style={styles.root}>
      <Header title={t('Profilo')} />
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        <Card style={{ alignItems: 'center' }}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user.nome[0]}{user.cognome[0]}</Text>
          </View>
          <Text style={[font.h2, { marginTop: spacing.md }]}>{user.nome} {user.cognome}</Text>
          <Text style={font.label}>{user.email}</Text>
          {user.telefono ? <Text style={font.small}>{user.telefono}</Text> : null}
        </Card>

        <TouchableOpacity style={styles.walletCard} activeOpacity={0.9} onPress={() => navigation.navigate('Wallet')}>
          <View>
            <Text style={[font.label, { color: '#CFE3E9' }]}>{t('Portafoglio digitale')}</Text>
            <Text style={styles.walletAmount}>{eur(wallet?.saldo ?? 0)}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <MaterialCommunityIcons name="wallet" size={32} color={'#CFE3E9'} />
            <Text style={{ color: '#CFE3E9', fontSize: 12, fontWeight: '700', marginTop: 4 }}>{t('Ricarica ›')}</Text>
          </View>
        </TouchableOpacity>

        <View style={{ marginTop: spacing.lg }}>
          <MenuItem colors={colors} font={font} icon="account-edit-outline" label={t('Modifica profilo')} onPress={() => navigation.navigate('EditProfile')} />
          <MenuItem colors={colors} font={font} icon="card-account-details-outline" label={t('Patente di guida')} onPress={() => navigation.navigate('Patente')} />
          <MenuItem colors={colors} font={font} icon="credit-card-outline" label={t('Metodo di pagamento')} onPress={() => navigation.navigate('Payment')} />
          <MenuItem colors={colors} font={font} icon="gift-outline" label={t('Promozioni e bonus')} onPress={() => navigation.navigate('Promotions')} />
          <MenuItem colors={colors} font={font} icon="translate" label={t('Lingua e tema')} onPress={() => navigation.navigate('Settings')} />
        </View>

        <Button title={t('Esci')} variant="outline" icon="logout" onPress={logout} style={{ marginTop: spacing.xl }} />
        <Text style={styles.version}>CitySync v2.0 · Bit &amp; Polpette</Text>
      </ScrollView>
    </View>
  );
}

function MenuItem({
  colors, font, icon, label, onPress, badge,
}: {
  colors: ThemeColors;
  font: Record<string, any>;
  icon: keyof typeof MaterialCommunityIcons.glyphMap; label: string; onPress?: () => void; badge?: string;
}) {
  const styles = makeStyles(colors);
  return (
    <TouchableOpacity style={styles.menuItem} activeOpacity={0.8} onPress={onPress} disabled={!onPress}>
      <MaterialCommunityIcons name={icon} size={22} color={colors.primary} />
      <Text style={[font.body, { flex: 1, marginLeft: spacing.md }]}>{label}</Text>
      {badge ? <Text style={styles.badge}>{badge}</Text> : <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textLight} />}
    </TouchableOpacity>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  avatar: {
    width: 76, height: 76, borderRadius: 38, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: colors.white, fontSize: 26, fontWeight: '800' },
  walletCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.primary, borderRadius: radius.lg, padding: spacing.lg, marginTop: spacing.lg, ...shadow.card,
  },
  walletAmount: { color: colors.white, fontSize: 28, fontWeight: '800', marginTop: 4 },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm, ...shadow.card,
  },
  badge: {
    fontSize: 11, fontWeight: '700', color: colors.textMuted,
    backgroundColor: colors.surfaceAlt, paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.pill, overflow: 'hidden',
  },
  version: { textAlign: 'center', color: colors.textLight, fontSize: 12, marginTop: spacing.xl },
});
