import React, { createContext, useContext, useEffect, useMemo, useState, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightColors, darkColors, makeFont, type ThemeColors } from '../theme/theme';
import { translate, type Lingua } from '../lib/i18n';
import { useApp } from './AppContext';

export type Tema = 'chiaro' | 'scuro';

interface SettingsState {
  tema: Tema;
  lingua: Lingua;
  ready: boolean;
  setTema: (t: Tema) => void;
  setLingua: (l: Lingua) => void;
}

const STORAGE_KEY = 'citysync.settings';

const Ctx = createContext<SettingsState | undefined>(undefined);

// Font precalcolati per tema (identità stabile -> niente re-render inutili).
const lightFont = makeFont(lightColors);
const darkFont = makeFont(darkColors);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [tema, setTemaState] = useState<Tema>('chiaro');
  const [lingua, setLinguaState] = useState<Lingua>('it');
  const [ready, setReady] = useState(false);

  // Ref sempre aggiornati: permettono di salvare entrambe le preferenze insieme.
  const temaRef = useRef(tema); temaRef.current = tema;
  const linguaRef = useRef(lingua); linguaRef.current = lingua;

  // Carica le preferenze salvate sul dispositivo all'avvio.
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const saved = JSON.parse(raw);
          if (saved.tema === 'chiaro' || saved.tema === 'scuro') setTemaState(saved.tema);
          if (saved.lingua === 'it' || saved.lingua === 'en') setLinguaState(saved.lingua);
        }
      } catch { /* preferenze non disponibili -> default */ }
      finally { setReady(true); }
    })();
  }, []);

  const persist = useCallback((next: { tema: Tema; lingua: Lingua }) => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => { /* ignora */ });
  }, []);

  const setTema = useCallback((t: Tema) => {
    setTemaState(t);
    persist({ tema: t, lingua: linguaRef.current });
  }, [persist]);

  const setLingua = useCallback((l: Lingua) => {
    setLinguaState(l);
    persist({ tema: temaRef.current, lingua: l });
  }, [persist]);

  const value = useMemo<SettingsState>(() => ({ tema, lingua, ready, setTema, setLingua }), [tema, lingua, ready, setTema, setLingua]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSettings() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useSettings deve essere usato dentro <SettingsProvider>');
  return ctx;
}

// Tema attivo. Il dark mode si applica solo all'esperienza Utente (e alla schermata
// di login): per Operatore/Amministrazione si resta sempre in tema chiaro.
export function useTheme(): { colors: ThemeColors; font: ReturnType<typeof makeFont>; isDark: boolean } {
  const { tema } = useSettings();
  const { ruolo } = useApp();
  const contestoUtente = ruolo === 'utente' || ruolo === null;
  const isDark = tema === 'scuro' && contestoUtente;
  return useMemo(() => ({
    colors: isDark ? darkColors : lightColors,
    font: isDark ? darkFont : lightFont,
    isDark,
  }), [isDark]);
}

// Funzione di traduzione legata alla lingua corrente (IUI.02).
export function useT() {
  const { lingua } = useSettings();
  return useCallback((key: string, params?: Record<string, string | number>) => translate(lingua, key, params), [lingua]);
}
