import { Bike, CircleCheck, Activity, Wrench, BatteryWarning, RefreshCw } from 'lucide-react';
import { api } from '../api/api';
import { useData } from '../lib/useData';
import { StatCard, Spinner, EnergyBar, Badge } from '../components/ui';
import { FleetMap } from '../components/FleetMap';
import { statoMezzoColor, statoMezzoLabel, tipoEmoji } from '../labels';
import type { StatoMezzo } from '../types';

export default function DashboardPage() {
  const flotta = useData(() => api.flotta(), []);          // OP.01
  const batteria = useData(() => api.batteria(), []);      // OP.12

  if (flotta.loading && !flotta.data) return <Spinner />;
  if (flotta.error) return <div className="card error-text">{flotta.error}</div>;

  const f = flotta.data!;
  const disp = f.perStato['disponibile'] || 0;
  const inUso = f.perStato['in_uso'] || 0;
  const manut = (f.perStato['in_manutenzione'] || 0) + (f.perStato['fuori_servizio'] || 0);
  const critici = batteria.data?.critici ?? 0;

  return (
    <>
      <div className="stats">
        <StatCard icon={<Bike size={20} />} color="#1B7E9C" label="Mezzi totali" value={f.totale} />
        <StatCard icon={<CircleCheck size={20} />} color="#23A455" label="Disponibili" value={disp} />
        <StatCard icon={<Activity size={20} />} color="#E0992A" label="In uso" value={inUso} />
        <StatCard icon={<Wrench size={20} />} color="#8A6FB0" label="Manutenzione" value={manut} />
        <StatCard icon={<BatteryWarning size={20} />} color="#E04848" label="Batteria critica" value={critici} />
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="between" style={{ marginBottom: 14 }}>
            <div className="card-title" style={{ margin: 0 }}>Distribuzione flotta sul territorio</div>
            <button className="btn btn-ghost btn-sm" onClick={() => { flotta.reload(); batteria.reload(); }}>
              <RefreshCw size={15} /> Aggiorna
            </button>
          </div>
          <FleetMap mezzi={f.mezzi} />
          <div className="flex" style={{ flexWrap: 'wrap', gap: 12, marginTop: 14 }}>
            {(Object.keys(statoMezzoLabel) as StatoMezzo[]).map((s) =>
              f.perStato[s] ? (
                <Badge key={s} text={`${statoMezzoLabel[s]}: ${f.perStato[s]}`} color={statoMezzoColor[s]} />
              ) : null
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-title"><BatteryWarning size={18} /> Livelli batteria (OP.12)</div>
          {batteria.loading && !batteria.data ? (
            <Spinner />
          ) : (
            <table className="table">
              <thead><tr><th>Mezzo</th><th>Stato</th><th>Energia</th></tr></thead>
              <tbody>
                {batteria.data?.mezzi.slice(0, 10).map((m) => (
                  <tr key={m.idMezzo} className={m.critico ? 'alert' : ''}>
                    <td>{tipoEmoji[m.tipoMezzo]} <b>{m.codiceMezzo}</b></td>
                    <td><span className="small">{statoMezzoLabel[m.statOperativo]}</span></td>
                    <td><EnergyBar level={m.livelloEnergia} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <p className="small" style={{ marginTop: 10 }}>
            Soglia critica: {batteria.data?.sogliaCritica ?? 20}% · evidenziati i mezzi sotto soglia.
          </p>
        </div>
      </div>
    </>
  );
}
