import type { ReactNode } from 'react';
import {
  LayoutDashboard, Bike, CalendarClock, AlertTriangle, Wrench, LifeBuoy,
  ParkingSquare, LogOut, MapPin,
} from 'lucide-react';
import type { Operatore } from '../types';

export type PageKey =
  | 'dashboard' | 'flotta' | 'prenotazioni' | 'segnalazioni'
  | 'manutenzione' | 'assistenza' | 'parcheggi';

const NAV: { key: PageKey; label: string; icon: ReactNode; uc: string }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={19} />, uc: 'OP.01 · OP.12' },
  { key: 'flotta', label: 'Flotta', icon: <Bike size={19} />, uc: 'OP.14 · OP.13 · OP.10' },
  { key: 'prenotazioni', label: 'Prenotazioni', icon: <CalendarClock size={19} />, uc: 'OP.11' },
  { key: 'segnalazioni', label: 'Segnalazioni', icon: <AlertTriangle size={19} />, uc: 'OP.03' },
  { key: 'manutenzione', label: 'Manutenzione', icon: <Wrench size={19} />, uc: 'OP.06' },
  { key: 'assistenza', label: 'Assistenza', icon: <LifeBuoy size={19} />, uc: 'OP.07' },
  { key: 'parcheggi', label: 'Parcheggi', icon: <ParkingSquare size={19} />, uc: 'OP.04 · OP.05' },
];

const titoli: Record<PageKey, string> = {
  dashboard: 'Monitoraggio flotta',
  flotta: 'Gestione flotta',
  prenotazioni: 'Controllo prenotazioni',
  segnalazioni: 'Segnalazioni di guasto',
  manutenzione: 'Gestione manutenzione',
  assistenza: 'Richieste di assistenza',
  parcheggi: 'Parcheggi e posizioni',
};

interface Props {
  page: PageKey;
  onNavigate: (p: PageKey) => void;
  operatore: Operatore;
  onLogout: () => void;
  badges?: Partial<Record<PageKey, number>>;
  children: ReactNode;
}

export function Layout({ page, onNavigate, operatore, onLogout, badges = {}, children }: Props) {
  const initials = (operatore.personaFisica || operatore.ragioneSociale || 'OP')
    .split(' ').map((s) => s[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-logo"><MapPin size={20} color="#fff" /></div>
          <div>
            <div className="brand-name">CitySync</div>
            <div className="brand-sub">Operatore</div>
          </div>
        </div>
        <nav className="nav">
          {NAV.map((n) => (
            <button
              key={n.key}
              className={`nav-item ${page === n.key ? 'active' : ''}`}
              onClick={() => onNavigate(n.key)}
              title={n.uc}
            >
              {n.icon}
              <span>{n.label}</span>
              {badges[n.key] ? <span className="nav-badge">{badges[n.key]}</span> : null}
            </button>
          ))}
        </nav>
        <div className="sidebar-foot">CitySync v2.0 · Sprint 2<br />Bit &amp; Polpette</div>
      </aside>

      <div className="main">
        <header className="topbar">
          <h1>{titoli[page]}</h1>
          <div className="spacer" />
          <div className="op-chip">
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{operatore.ragioneSociale}</div>
              <div className="small">{operatore.email}</div>
            </div>
            <div className="op-avatar">{initials}</div>
            <button className="icon-btn" onClick={onLogout} title="Esci"><LogOut size={18} /></button>
          </div>
        </header>
        <main className="content">{children}</main>
      </div>
    </div>
  );
}
