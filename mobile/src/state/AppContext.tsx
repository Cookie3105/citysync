import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { api } from '../api/api';
import { operatorApi } from '../api/operatorApi';
import { adminApi } from '../api/adminApi';
import type { Utente, Operatore, Amministrazione, Noleggio } from '../models/types';

export type Ruolo = 'utente' | 'operatore' | 'amministrazione';

interface AppState {
  ruolo: Ruolo | null;
  user: Utente | null;
  operatore: Operatore | null;
  amministrazione: Amministrazione | null;
  activeNoleggio: Noleggio | null;
  loginUtente: (email: string, password: string) => Promise<void>;
  registerUtente: (dati: { nome: string; cognome: string; email: string; telefono?: string; password: string }) => Promise<void>;
  loginOperatore: (email: string, password: string) => Promise<void>;
  loginAmministrazione: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setActiveNoleggio: (n: Noleggio | null) => void;
  refreshActiveNoleggio: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const Ctx = createContext<AppState | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ruolo, setRuolo] = useState<Ruolo | null>(null);
  const [user, setUser] = useState<Utente | null>(null);
  const [operatore, setOperatore] = useState<Operatore | null>(null);
  const [amministrazione, setAmministrazione] = useState<Amministrazione | null>(null);
  const [activeNoleggio, setActiveNoleggio] = useState<Noleggio | null>(null);

  // Riferimento sempre aggiornato all'utente, così le funzioni di refresh possono
  // restare stabili (deps vuote) senza ricrearsi a ogni cambio di `user`. Questo
  // evita il loop di re-render che faceva "scattare" il bottom sheet della mappa.
  const userRef = useRef<Utente | null>(null);
  userRef.current = user;

  const loginUtente = useCallback(async (email: string, password: string) => {
    const u = await api.login(email, password);
    setUser(u);
    setOperatore(null);
    setAmministrazione(null);
    setRuolo('utente');
  }, []);

  const registerUtente = useCallback(async (dati: { nome: string; cognome: string; email: string; telefono?: string; password: string }) => {
    const u = await api.register(dati);
    setUser(u);
    setOperatore(null);
    setAmministrazione(null);
    setRuolo('utente');
  }, []);

  const loginOperatore = useCallback(async (email: string, password: string) => {
    const o = await operatorApi.login(email, password);
    setOperatore(o);
    setUser(null);
    setAmministrazione(null);
    setRuolo('operatore');
  }, []);

  const loginAmministrazione = useCallback(async (email: string, password: string) => {
    const a = await adminApi.login(email, password);
    setAmministrazione(a);
    setUser(null);
    setOperatore(null);
    setRuolo('amministrazione');
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setOperatore(null);
    setAmministrazione(null);
    setRuolo(null);
    setActiveNoleggio(null);
  }, []);

  const refreshActiveNoleggio = useCallback(async () => {
    const u = userRef.current;
    if (!u) return;
    try {
      const n = await api.noleggioAttivo(u.idUtente);
      // Aggiorna solo se cambia davvero qualcosa (evita churn d'identità inutile).
      setActiveNoleggio((prev) => {
        const same = (!prev && !n)
          || (!!prev && !!n && prev.idNoleggio === n.idNoleggio && prev.statoNoleggio === n.statoNoleggio);
        return same ? prev : n;
      });
    } catch {
      /* ignora errori di rete transitori */
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const u = userRef.current;
    if (!u) return;
    try {
      const fresh = await api.getProfilo(u.idUtente);
      // Se l'operatore ha sospeso/bloccato l'account, esci dalla sessione.
      if (fresh.statoAccount !== 'attivo') { logout(); return; }
      // Sostituisce l'oggetto solo se i dati sono effettivamente cambiati: così
      // `user` non cambia identità a ogni refresh e non innesca loop di render.
      setUser((prev) => {
        const same = !!prev && prev.idUtente === fresh.idUtente && prev.nome === fresh.nome
          && prev.cognome === fresh.cognome && prev.email === fresh.email
          && prev.telefono === fresh.telefono && prev.statoAccount === fresh.statoAccount;
        return same ? prev : fresh;
      });
    } catch { /* errori di rete transitori ignorati */ }
  }, [logout]);

  // Recupera un eventuale noleggio attivo dopo il login utente (UT.20 / persistenza corsa).
  useEffect(() => {
    if (user) refreshActiveNoleggio();
  }, [user, refreshActiveNoleggio]);

  return (
    <Ctx.Provider
      value={{
        ruolo, user, operatore, amministrazione, activeNoleggio,
        loginUtente, registerUtente, loginOperatore, loginAmministrazione, logout, setActiveNoleggio, refreshActiveNoleggio, refreshUser,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useApp deve essere usato dentro <AppProvider>');
  return ctx;
}
