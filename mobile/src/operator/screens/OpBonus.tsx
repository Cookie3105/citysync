import React from 'react';
import { View, Text, StyleSheet, FlatList, Alert } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Header } from '../../components/Header';
import { Button, Badge, EmptyState } from '../../components/ui';
import { operatorApi } from '../../api/operatorApi';
import { ApiError } from '../../api/client';
import { useData } from '../../lib/useData';
import { colors, spacing, radius, font, shadow } from '../../theme/theme';
import { tipoEmoji, dataBreve, ora } from '../../lib/format';
import type { OpMoreStackParamList } from '../navigation';
import type { BonusEligibile } from '../../models/types';

type Props = NativeStackScreenProps<OpMoreStackParamList, 'Bonus'>;

export default function OpBonus({ navigation }: Props) {
  const { data, loading, reload } = useData(() => operatorApi.bonusEligibili(), []); // OP.08

  const assegna = (b: BonusEligibile) => {
    Alert.alert('Assegna bonus', `Assegnare un bonus parcheggio a ${b.nome} ${b.cognome}?`, [
      { text: 'Annulla', style: 'cancel' },
      {
        text: 'Assegna', onPress: async () => {
          try { await operatorApi.assegnaBonus(b.idUtente, 0.5); Alert.alert('Fatto', 'Bonus assegnato all\'utente.'); reload(); }
          catch (e) { Alert.alert('Errore', e instanceof ApiError ? e.message : 'Errore'); }
        },
      },
    ]);
  };

  return (
    <View style={styles.root}>
      <Header title="Assegna bonus parcheggio" onBack={() => navigation.goBack()} />
      <FlatList
        data={data ?? []}
        keyExtractor={(b) => b.idNoleggio}
        refreshing={loading}
        onRefresh={reload}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm }}
        ListHeaderComponent={
          <Text style={[font.label, { marginBottom: spacing.sm }]}>
            Noleggi conclusi con parcheggio corretto, idonei al bonus.
          </Text>
        }
        ListEmptyComponent={!loading ? <EmptyState icon="parking" title="Nessun noleggio idoneo" subtitle="Servono corse concluse in area consentita" /> : null}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={{ flex: 1 }}>
              <Text style={font.h3}>{item.nome} {item.cognome}</Text>
              <Text style={font.small}>{tipoEmoji[item.tipoMezzo]} {item.codiceMezzo} · {dataBreve(item.dataFine)} {ora(item.oraFine)}</Text>
              {item.bonusGiaAssegnati > 0 && (
                <View style={{ marginTop: 4 }}><Badge text={`${item.bonusGiaAssegnati} bonus già assegnati`} color={colors.textMuted} /></View>
              )}
            </View>
            <Button title="Assegna" variant="secondary" icon="gift" onPress={() => assegna(item)} style={{ height: 40, paddingHorizontal: 16 }} />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, ...shadow.card },
});
