import React, { useMemo, useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp, type Ruolo } from '../state/AppContext';
import { useTheme, useT } from '../state/SettingsContext';
import { Button, Segmented } from '../components/ui';
import { ApiError } from '../api/client';
import { spacing, radius, shadow, type ThemeColors } from '../theme/theme';

const CRED: Record<Ruolo, { email: string; password: string }> = {
  utente: { email: 'mario.rossi@example.com', password: 'password' },
  operatore: { email: 'operatore@citysync.it', password: 'password' },
  amministrazione: { email: 'admin@comune.bari.it', password: 'password' },
};

const META: Record<Ruolo, { titolo: string; sottotitolo: string; btn: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }> = {
  utente: { titolo: 'Accedi', sottotitolo: 'Entra per trovare i mezzi vicino a te', btn: 'Accedi', icon: 'login' },
  operatore: { titolo: 'Accesso Operatore', sottotitolo: 'Console di gestione della flotta', btn: 'Entra nella console', icon: 'shield-account' },
  amministrazione: { titolo: 'Accesso Comune', sottotitolo: 'Report e gestione della mobilità urbana', btn: 'Entra', icon: 'city' },
};

export default function LoginScreen() {
  const { loginUtente, registerUtente, loginOperatore, loginAmministrazione } = useApp();
  const { colors, font } = useTheme();
  const t = useT();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [ruolo, setRuolo] = useState<Ruolo>('utente');
  const [email, setEmail] = useState(CRED.utente.email);
  const [password, setPassword] = useState(CRED.utente.password);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Campi registrazione
  const [reg, setReg] = useState({ nome: '', cognome: '', email: '', telefono: '', password: '' });
  const setR = (k: keyof typeof reg) => (v: string) => setReg((s) => ({ ...s, [k]: v }));

  const cambiaRuolo = (r: Ruolo) => {
    setRuolo(r);
    setError(null);
    setEmail(CRED[r].email);
    setPassword(CRED[r].password);
  };

  const onLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      if (ruolo === 'operatore') await loginOperatore(email.trim(), password);
      else if (ruolo === 'amministrazione') await loginAmministrazione(email.trim(), password);
      else await loginUtente(email.trim(), password);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t('Accesso non riuscito'));
    } finally {
      setLoading(false);
    }
  };

  const onRegister = async () => {
    setError(null);
    setLoading(true);
    try {
      await registerUtente({
        nome: reg.nome, cognome: reg.cognome, email: reg.email.trim(),
        telefono: reg.telefono || undefined, password: reg.password,
      });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t('Registrazione non riuscita'));
    } finally {
      setLoading(false);
    }
  };

  const meta = META[ruolo];

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.brand}>
            <View style={styles.logo}>
              <MaterialCommunityIcons name="map-marker-path" size={34} color={colors.white} />
            </View>
            <Text style={styles.brandName}>CitySync</Text>
            <Text style={styles.brandTag}>Smart Mobility · Bit &amp; Polpette</Text>
          </View>

          <View style={styles.card}>
            {mode === 'login' ? (
              <>
                <Segmented
                  value={ruolo}
                  onChange={cambiaRuolo}
                  options={[
                    { key: 'utente', label: t('Utente') },
                    { key: 'operatore', label: t('Operatore') },
                    { key: 'amministrazione', label: t('Comune') },
                  ]}
                />

                <Text style={[font.h2, { marginTop: spacing.lg }]}>{t(meta.titolo)}</Text>
                <Text style={[font.label, { marginTop: 4, marginBottom: spacing.lg }]}>{t(meta.sottotitolo)}</Text>

                <Field icon="email-outline" placeholder={t('Email')} value={email} onChangeText={setEmail}
                  keyboardType="email-address" autoCapitalize="none" />
                <Field icon="lock-outline" placeholder={t('Password')} value={password} onChangeText={setPassword}
                  secureTextEntry />

                {error && <Text style={styles.error}>{error}</Text>}

                <Button title={t(meta.btn)} onPress={onLogin} loading={loading} icon={meta.icon} style={{ marginTop: spacing.md }} />

                {ruolo === 'utente' && (
                  <TouchableOpacity onPress={() => { setMode('register'); setError(null); }} style={styles.link}>
                    <Text style={styles.linkText}>{t('Non hai un account?')} <Text style={styles.linkStrong}>{t('Registrati')}</Text></Text>
                  </TouchableOpacity>
                )}
                <Text style={styles.demo}>{t('Demo: {v} / password', { v: CRED[ruolo].email })}</Text>
              </>
            ) : (
              <>
                <Text style={font.h2}>{t('Crea account')}</Text>
                <Text style={[font.label, { marginTop: 4, marginBottom: spacing.lg }]}>{t('Registrati come utente CitySync')}</Text>

                <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                  <View style={{ flex: 1 }}><Field icon="account-outline" placeholder={t('Nome')} value={reg.nome} onChangeText={setR('nome')} /></View>
                  <View style={{ flex: 1 }}><Field icon="account-outline" placeholder={t('Cognome')} value={reg.cognome} onChangeText={setR('cognome')} /></View>
                </View>
                <Field icon="email-outline" placeholder={t('Email')} value={reg.email} onChangeText={setR('email')} keyboardType="email-address" autoCapitalize="none" />
                <Field icon="phone-outline" placeholder={t('Telefono (opzionale)')} value={reg.telefono} onChangeText={setR('telefono')} keyboardType="phone-pad" />
                <Field icon="lock-outline" placeholder={t('Password')} value={reg.password} onChangeText={setR('password')} secureTextEntry />

                {error && <Text style={styles.error}>{error}</Text>}

                <Button title={t('Crea account')} onPress={onRegister} loading={loading} icon="account-plus" style={{ marginTop: spacing.md }} />

                <TouchableOpacity onPress={() => { setMode('login'); setError(null); }} style={styles.link}>
                  <Text style={styles.linkText}>{t('Hai già un account?')} <Text style={styles.linkStrong}>{t('Accedi')}</Text></Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// A livello di modulo (identità stabile): evita il remount del TextInput a ogni
// render, che farebbe perdere il focus durante la digitazione.
function Field(props: React.ComponentProps<typeof TextInput> & { icon: keyof typeof MaterialCommunityIcons.glyphMap }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { icon, ...rest } = props;
  return (
    <View style={styles.field}>
      <MaterialCommunityIcons name={icon} size={20} color={colors.textMuted} />
      <TextInput style={styles.input} placeholderTextColor={colors.textLight} {...rest} />
    </View>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.primary },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: spacing.xl },
  brand: { alignItems: 'center', marginBottom: spacing.xxl },
  logo: {
    width: 72, height: 72, borderRadius: 22, backgroundColor: colors.primaryDark,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md,
  },
  brandName: { fontSize: 30, fontWeight: '800', color: colors.white, letterSpacing: -0.5 },
  brandTag: { fontSize: 13, color: '#BcD7DF', marginTop: 4 },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.xl, ...shadow.card },
  field: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.surfaceAlt, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: spacing.md, height: 52, marginBottom: spacing.md,
  },
  input: { flex: 1, fontSize: 15, color: colors.text },
  error: { color: colors.danger, fontWeight: '600', fontSize: 13, marginBottom: spacing.sm },
  link: { marginTop: spacing.lg, alignItems: 'center' },
  linkText: { color: colors.textMuted, fontSize: 14 },
  linkStrong: { color: colors.primary, fontWeight: '700' },
  demo: { textAlign: 'center', color: colors.textLight, fontSize: 12, marginTop: spacing.md },
});
