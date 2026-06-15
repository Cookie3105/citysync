import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Header } from '../../components/Header';
import { EmptyState, Segmented } from '../../components/ui';
import { operatorApi } from '../../api/operatorApi';
import { useData } from '../../lib/useData';
import { colors, spacing, radius, font, shadow } from '../../theme/theme';
import { tipoEmoji, dataBreve, ora } from '../../lib/format';
import type { OpMoreStackParamList } from '../navigation';

type Props = NativeStackScreenProps<OpMoreStackParamList, 'Parking'>;

export default function OpParking({ navigation }: Props) {
  const [vista, setVista] = useState<'verifica' | 'fine'>('verifica');
  const parcheggio = useData(() => operatorApi.verificaParcheggio(), []);       // OP.04
  const fine = useData(() => operatorApi.posizioniFineNoleggio(), []);          // OP.05

  return (
    <View style={styles.root}>
      <Header title="Parcheggi e posizioni" onBack={() => navigation.goBack()} />
      <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.sm }}>
        <Segmented
          value={vista}
          onChange={setVista}
          options={[{ key: 'verifica', label: 'Verifica (OP.04)', icon: 'parking' }, { key: 'fine', label: 'Fine noleggio (OP.05)', icon: 'map-marker-check' }]}
        />
      </View>

      {vista === 'verifica' ? (
        <FlatList
          data={parcheggio.data ?? []}
          keyExtractor={(p) => p.idMezzo}
          refreshing={parcheggio.loading}
          onRefresh={parcheggio.reload}
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm }}
          renderItem={({ item }) => (
            <View style={[styles.card, item.corretto === false && { borderColor: colors.danger, borderWidth: 1 }]}>
              <View style={styles.between}>
                <Text style={font.h3}>{item.tipoMezzo ? tipoEmoji[item.tipoMezzo] : ''} {item.codiceMezzo}</Text>
                {item.corretto === null ? (
                  <Text style={font.small}>Posizione n/d</Text>
                ) : item.corretto ? (
                  <View style={styles.flex}><MaterialCommunityIcons name="check-circle" size={16} color={colors.success} /><Text style={[styles.tag, { color: colors.success }]}>Conforme</Text></View>
                ) : (
                  <View style={styles.flex}><MaterialCommunityIcons name="close-circle" size={16} color={colors.danger} /><Text style={[styles.tag, { color: colors.danger }]}>Non conforme</Text></View>
                )}
              </View>
              <Text style={[font.small, { marginTop: 4 }]}>
                {item.area ? `Area: ${item.area} · ` : ''}{item.posizione ? `${item.posizione.lat.toFixed(4)}, ${item.posizione.lon.toFixed(4)}` : ''}
              </Text>
            </View>
          )}
        />
      ) : (
        <FlatList
          data={fine.data ?? []}
          keyExtractor={(p) => p.idNoleggio}
          refreshing={fine.loading}
          onRefresh={fine.reload}
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm }}
          ListEmptyComponent={!fine.loading ? <EmptyState icon="map-marker-off" title="Nessun noleggio concluso" /> : null}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.between}>
                <Text style={font.h3}>{tipoEmoji[item.tipoMezzo]} {item.codiceMezzo}</Text>
                <Text style={font.small}>{dataBreve(item.dataFine)} {ora(item.oraFine)}</Text>
              </View>
              <Text style={[font.small, { marginTop: 4 }]}>
                {item.posizioneFinale ? `Posizione finale: ${item.posizioneFinale.lat.toFixed(4)}, ${item.posizioneFinale.lon.toFixed(4)}` : 'Posizione non disponibile'}
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  card: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, ...shadow.card },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  flex: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  tag: { fontSize: 12, fontWeight: '700' },
});
