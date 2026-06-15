import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './auth';
import { Layout, type PageKey } from './components/Layout';
import { api } from './api/api';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import FleetPage from './pages/FleetPage';
import ReservationsPage from './pages/ReservationsPage';
import FaultsPage from './pages/FaultsPage';
import MaintenancePage from './pages/MaintenancePage';
import SupportPage from './pages/SupportPage';
import ParkingPage from './pages/ParkingPage';

export default function App() {
  return (
    <AuthProvider>
      <Root />
    </AuthProvider>
  );
}

function Root() {
  const { operatore, logout } = useAuth();
  const [page, setPage] = useState<PageKey>('dashboard');
  const [badges, setBadges] = useState<Partial<Record<PageKey, number>>>({});

  // Conteggi per i badge della sidebar (segnalazioni/richieste aperte).
  useEffect(() => {
    if (!operatore) return;
    let alive = true;
    const refresh = async () => {
      try {
        const [seg, ric] = await Promise.all([api.segnalazioni('aperta'), api.richieste('aperta')]);
        if (alive) setBadges({ segnalazioni: seg.length || undefined, assistenza: ric.length || undefined });
      } catch { /* ignore */ }
    };
    refresh();
    const t = setInterval(refresh, 20000);
    return () => { alive = false; clearInterval(t); };
  }, [operatore, page]);

  if (!operatore) return <LoginPage />;

  return (
    <Layout page={page} onNavigate={setPage} operatore={operatore} onLogout={logout} badges={badges}>
      {page === 'dashboard' && <DashboardPage />}
      {page === 'flotta' && <FleetPage />}
      {page === 'prenotazioni' && <ReservationsPage />}
      {page === 'segnalazioni' && <FaultsPage />}
      {page === 'manutenzione' && <MaintenancePage />}
      {page === 'assistenza' && <SupportPage />}
      {page === 'parcheggi' && <ParkingPage />}
    </Layout>
  );
}
