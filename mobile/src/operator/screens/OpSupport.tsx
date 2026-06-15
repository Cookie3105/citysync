import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Header } from '../../components/Header';
import { Badge, EmptyState, Segmented } from '../../components/ui';
import { operatorApi } from '../../api/operatorApi';
import { useData } from '../../lib/useData';
import { colors, spacing, radius, font, shadow } from '../../theme/theme';
import { statoGenericoColor, dataBreve, ora } from '../../lib/format';
import type { OpSupportStackParamList } from '../navigation';

type Props = NativeStackScreenProps<OpSupportStackParamList, 'Support'>;
type Filtro = 'aperta' | 'tutte' | 'chiusa';

export default function OpSupport({ navigation }: Props) {
  const [filtro, setFiltro] = useState<Filtro>('aperta');
  const { data, loading, reload } = useData(
    () => operatorApi.richieste(filtro === 'tutte' ? undefined : filtro), [filtro]);

  return (
    <View style={styles.root}>
      <Header title="Richieste assistenza" />
      <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.sm }}>
        <Segmented
          value={filtro}
          onChange={setFiltro}
          options={[{ key: 'aperta', label: 'Aperte' }, { key: 'tutte', label: 'Tutte' }, { key: 'chiusa', label: 'Chiuse' }]}
        />
      </View>
      <FlatList
        data={data ?? []}
        keyExtractor={(r) => r.idRichiesta}
        refreshing={loading}
        onRefresh={reload}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm }}
        ListEmptyComponent={!loading ? <EmptyState icon="lifebuoy" title="Nessuna richiesta" /> : null}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Chat', { idRichiesta: item.idRichiesta, titolo: item.nome ? `${item.nome} ${item.cognome}` : 'Assistenza' })}
          >
            <View style={styles.between}>
              <Text style={font.h3}>
                {item.nome ? `${item.nome} ${item.cognome}` : 'Utente'}
                {item.posizione ? <Text> <MaterialCommunityIcons name="map-marker" size={13} color={colors.accent} /></Text> : null}
              </Text>
              <Badge text={item.statoRichiesta.replace('_', ' ')} color={statoGenericoColor[item.statoRichiesta] || colors.textMuted} />
            </View>
            <Text style={[font.body, { marginTop: 4 }]} numberOfLines={2}>{item.descrizione}</Text>
            <Text style={[font.small, { marginTop: 4 }]}>{dataBreve(item.dataInvio)} {ora(item.oraInvio)}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  card: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, ...shadow.card },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
