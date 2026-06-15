import Constants from 'expo-constants';

// Deriva l'host del Server dall'host del dev-server Expo: in questo modo l'app
// in esecuzione su un telefono reale (Expo Go) raggiunge il PC tramite il suo
// IP di rete locale, senza configurazioni manuali.
// Override esplicito possibile con la variabile EXPO_PUBLIC_API_URL.
function deriveHost(): string {
  const override = process.env.EXPO_PUBLIC_API_URL;
  if (override) return override.replace(/\/$/, '');

  // Alcuni campi legacy non sono nei tipi di expo-constants: accesso via `any`.
  const c = Constants as any;
  const hostUri: string | undefined =
    Constants.expoConfig?.hostUri ||
    c.manifest?.debuggerHost ||
    c.manifest2?.extra?.expoGo?.debuggerHost;

  if (typeof hostUri === 'string' && hostUri.length > 0) {
    const host = hostUri.split(':')[0];
    return `http://${host}:4000`;
  }
  return 'http://localhost:4000';
}

export const SERVER_BASE = deriveHost();
export const API_BASE = `${SERVER_BASE}/api`;

// Centro di default (Bari) usato quando la posizione utente non è disponibile.
export const DEFAULT_REGION = {
  latitude: 41.1187,
  longitude: 16.8719,
  latitudeDelta: 0.04,
  longitudeDelta: 0.04,
};
