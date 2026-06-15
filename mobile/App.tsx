import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppProvider, useApp } from './src/state/AppContext';
import { SettingsProvider, useTheme } from './src/state/SettingsContext';
import RootNavigator from './src/navigation';
import OperatorNavigator from './src/operator/navigation';
import AdminNavigator from './src/admin/navigation';
import LoginScreen from './src/screens/LoginScreen';
import { colors } from './src/theme/theme';

function Gate() {
  const { ruolo } = useApp();
  if (ruolo === 'operatore') return <OperatorNavigator />;
  if (ruolo === 'amministrazione') return <AdminNavigator />;
  if (ruolo === 'utente') return <RootNavigator />;
  return <LoginScreen />;
}

// Radice "interna": vive dentro i provider, così il tema di navigazione e la
// status bar seguono la palette attiva (chiara/scura).
function Root() {
  const { colors: c, isDark } = useTheme();
  const navTheme = {
    ...DefaultTheme,
    dark: isDark,
    colors: {
      ...DefaultTheme.colors,
      background: c.background,
      card: c.surface,
      text: c.text,
      border: c.border,
      primary: c.primary,
    },
  };
  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Gate />
    </NavigationContainer>
  );
}

export default function App() {
  // Pre-carica il font delle icone: senza questo, nelle build di produzione (APK)
  // i glifi MaterialCommunityIcons possono non comparire.
  const [fontsLoaded, fontError] = useFonts(MaterialCommunityIcons.font);

  // NON blocchiamo l'app a tempo indeterminato sul caricamento del font: in alcune
  // build APK la promise può fallire o non risolversi, lasciando l'utente bloccato
  // sullo spinner bianco. Procediamo appena il font è pronto OPPURE in errore, e
  // comunque dopo un breve timeout di sicurezza (@expo/vector-icons ricarica il font
  // on-demand al primo uso di un'icona, quindi l'app resta usabile in ogni caso).
  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), 3000);
    return () => clearTimeout(t);
  }, []);

  if (!fontsLoaded && !fontError && !timedOut) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AppProvider>
        <SettingsProvider>
          <Root />
        </SettingsProvider>
      </AppProvider>
    </SafeAreaProvider>
  );
}
