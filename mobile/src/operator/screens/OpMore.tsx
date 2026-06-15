import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Header } from '../../components/Header';
import { Button } from '../../components/ui';
import { useApp } from '../../state/AppContext';
import { colors, spacing, radius, font, shadow } from '../../theme/theme';
import type { OpMoreStackParamList } from '../navigation';

type Props = NativeStackScreenProps<OpMoreStackParamList, 'More'>;

const voci: { key: keyof OpMoreStackParamList; label: string; sub: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }[] = [
  { key: 'Reservations', label: 'Controllo prenotazioni', sub: 'OP.11 · anomalie e durate', icon: 'calendar-clock' },
  { key: 'Maintenance', label: 'Gestione manutenzione', sub: 'OP.06 · interventi e mezzi da manutenere', icon: 'wrench' },
  { key: 'Parking', label: 'Parcheggi e posizioni', sub: 'OP.04 · OP.05 · verifica e fine noleggio', icon: 'parking' },
  { key: 'Bonus', label: 'Assegna bonus', sub: 'OP.08 · bonus per parcheggio corretto', icon: 'gift' },
  { key: 'Accounts', label: 'Gestione account', sub: 'OP.09 · sospendi o blocca utenti', icon: 'account-cog' },
];

export default function OpMore({ navigation }: Props) {
  const { operatore, logout } = useApp();
  return (
    <View style={styles.root}>
      <Header title="Altro" />
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        <View style={styles.opCard}>
          <View style={styles.avatar}>
            <MaterialCommunityIcons name="shield-account" size={26} color={colors.white} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={font.h3}>{operatore?.ragioneSociale}</Text>
            <Text style={font.small}>{operatore?.email}</Text>
          </View>
        </View>

        {voci.map((v) => (
          <TouchableOpacity key={v.key} style={styles.item} activeOpacity={0.85} onPress={() => navigation.navigate(v.key as any)}>
            <View style={styles.itemIcon}><MaterialCommunityIcons name={v.icon} size={22} color={colors.primary} /></View>
            <View style={{ flex: 1 }}>
              <Text style={font.h3}>{v.label}</Text>
              <Text style={font.small}>{v.sub}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textLight} />
          </TouchableOpacity>
        ))}

        <Button title="Esci" variant="outline" icon="logout" onPress={logout} style={{ marginTop: spacing.xl }} />
        <Text style={styles.version}>CitySync v2.0 · Console Operatore</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  opCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.lg, ...shadow.card },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  item: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm, ...shadow.card },
  itemIcon: { width: 46, height: 46, borderRadius: 13, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  version: { textAlign: 'center', color: colors.textLight, fontSize: 12, marginTop: spacing.xl },
});
