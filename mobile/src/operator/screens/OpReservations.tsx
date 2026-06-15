import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Header } from '../../components/Header';
import { Badge, EmptyState } from '../../components/ui';
import { operatorApi } from '../../api/operatorApi';
import { useData } from '../../lib/useData';
import { colors, spacing, radius, font, shadow } from '../../theme/theme';
import { tipoEmoji, tipoLabel, dataBreve, ora } from '../../lib/format';
import type { OpMoreStackParamList } from '../navigation';

type Props = NativeStackScreenProps<OpMoreStackParamList, 'Reservations'>;

export default function OpReservations({ navigation }: Props) {
  const { data, loading, reload } = useData(() => operatorApi.prenotazioniAttive(), []); // OP.11
  const anomalie = data?.filter((p) => p.anomalia).length ?? 0;

  return (
    <View style={styles.root}>
      <Header title="Prenotazioni attive" onBack={() => navigation.goBack()} />
      {anomalie > 0 && (
        <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.sm }}>
          <Badge text={`${anomalie} anomalie (mezzo bloccato troppo a lungo)`} color={colors.danger} />
        </View>
      )}
      <FlatList
        data={data ?? []}
        keyExtractor={(p) => p.idPrenotazione}
        refreshing={loading}
        onRefresh={reload}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm }}
        ListEmptyComponent={!loading ? <EmptyState icon="calendar-check" title="Nessuna prenotazione attiva" /> : null}
        renderItem={({ item }) => (
          <View style={[styles.card, item.anomalia && { borderColor: colors.danger, borderWidth: 1 }]}>
            <View style={styles.between}>
              <Text style={font.h3}>{tipoEmoji[item.tipoMezzo]} {item.codiceMezzo}</Text>
              {item.anomalia ? (
                <View style={styles.flex}>
                  <MaterialCommunityIcons name="alert" size={15} color={colors.danger} />
                  <Text style={{ color: colors.danger, fontWeight: '700', fontSize: 12 }}>&gt; {item.sogliaAnomaliaMin}′</Text>
                </View>
              ) : <Badge text="Regolare" color={colors.success} />}
            </View>
            <Text style={[font.small, { marginTop: 4 }]}>
              {item.nome ? `${item.nome} ${item.cognome} · ` : ''}{tipoLabel[item.tipoMezzo]} · dalle {ora(item.oraInizio)} ({dataBreve(item.dataInizio)})
            </Text>
            <Text style={[font.label, { marginTop: 4 }]}>Durata: {item.durataMinuti} min</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  card: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, ...shadow.card },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  flex: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
