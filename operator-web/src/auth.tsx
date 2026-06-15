import { createContext, useContext, useState, type ReactNode } from 'react';
import { api } from './api/api';
import type { Operatore } from './types';

interface AuthState {
  operatore: Operatore | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const Ctx = createContext<AuthState | undefined>(undefined);
const KEY = 'citysync.operatore';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [operatore, setOperatore] = useState<Operatore | null>(() => {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Operatore) : null;
  });

  const login = async (email: string, password: string) => {
    const op = await api.login(email, password);
    localStorage.setItem(KEY, JSON.stringify(op));
    setOperatore(op);
  };

  const logout = () => {
    localStorage.removeItem(KEY);
    setOperatore(null);
  };

  return <Ctx.Provider value={{ operatore, login, logout }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth fuori da <AuthProvider>');
  return ctx;
}
