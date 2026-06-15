// Tema CitySync - palette "rider" (petrol/teal), cfr. IUI.01/IUI.03.
// Due palette (chiara/scura) con le STESSE chiavi: il tema attivo è fornito
// dal SettingsContext tramite useTheme(); `colors`/`font` statici (chiari) restano
// per i ruoli Operatore/Amministrazione (non temati) e per retro-compatibilità.
import { TextStyle } from 'react-native';

export const lightColors = {
  primary: '#0E4F63',       // petrol/teal scuro (bottoni, header)
  primaryDark: '#0A3C4D',
  primarySoft: '#E4EEF1',   // sfondo chip selezionati chiari
  accent: '#1B7E9C',        // teal acceso (pin, evidenze)

  background: '#F2F5F7',
  surface: '#FFFFFF',
  surfaceAlt: '#F7F9FB',

  text: '#13212B',
  textMuted: '#6A7C88',
  textLight: '#9AA9B4',

  border: '#E6ECF0',
  divider: '#EFF3F6',

  success: '#23A455',
  warning: '#E0992A',
  danger: '#E04848',

  white: '#FFFFFF',
  overlay: 'rgba(13,33,43,0.45)',
};

export type ThemeColors = typeof lightColors;

// Palette scura coerente (IUI.03). Stesse chiavi della palette chiara.
export const darkColors: ThemeColors = {
  primary: '#2F9EBF',       // teal più luminoso, leggibile su fondo scuro
  primaryDark: '#1E6D85',
  primarySoft: '#16323C',   // chip selezionati su fondo scuro
  accent: '#49B7D8',

  background: '#0E171C',
  surface: '#15222A',
  surfaceAlt: '#1C2C35',

  text: '#EAF1F4',
  textMuted: '#9DB1BC',
  textLight: '#6E828D',

  border: '#27373F',
  divider: '#1F2E36',

  success: '#37B26B',
  warning: '#E0A23F',
  danger: '#E86A6A',

  white: '#FFFFFF',
  overlay: 'rgba(0,0,0,0.6)',
};

// Palette chiara come default statico (Operatore/Amministrazione e file non temati).
export const colors = lightColors;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 10,
  md: 16,
  lg: 22,
  pill: 999,
};

export const shadow = {
  card: {
    shadowColor: '#0E2A36',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  sheet: {
    shadowColor: '#0E2A36',
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: -4 },
    elevation: 12,
  },
};

// Costruisce i font tipografici a partire da una palette (così il colore del
// testo segue il tema attivo).
export function makeFont(c: ThemeColors): Record<string, TextStyle> {
  return {
    h1: { fontSize: 26, fontWeight: '800', color: c.text, letterSpacing: -0.3 },
    h2: { fontSize: 20, fontWeight: '800', color: c.text, letterSpacing: -0.2 },
    h3: { fontSize: 17, fontWeight: '700', color: c.text },
    body: { fontSize: 15, fontWeight: '500', color: c.text },
    label: { fontSize: 13, fontWeight: '600', color: c.textMuted },
    small: { fontSize: 12, fontWeight: '500', color: c.textLight },
    price: { fontSize: 16, fontWeight: '800', color: c.text },
  };
}

// Font statici (palette chiara) per retro-compatibilità.
export const font = makeFont(lightColors);

// Colore di un livello di energia (batteria/carburante).
export function energyColor(level: number) {
  if (level >= 50) return colors.success;
  if (level >= 20) return colors.warning;
  return colors.danger;
}
