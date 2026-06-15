import { RefreshCw, TriangleAlert } from 'lucide-react';
import { api } from '../api/api';
import { useData } from '../lib/useData';
import { Spinner, Badge } from '../components/ui';
import { tipoEmoji, tipoLabel, ora, dataBreve } from '../labels';

export default function ReservationsPage() {
  const { data, loading, error, reload } = useData(() => api.prenotazioniAttive(), []); // OP.11
  const anomalie = data?.filter((p) => p.anomalia).length ?? 0;

  return (
    <div className="card">
      <div className="between" style={{ marginBottom: 16 }}>
        <div className="card-title" style={{ margin: 0 }}>
          Prenotazioni attive ({data?.length ?? 0})
          {anomalie > 0 && (
            <span style={{ marginLeft: 10 }}>
              <Badge text={`${anomalie} anomalie`} color="#E04848" />
            </span>
          )}
        </div>
        <button className="btn btn-ghost btn-sm" onClick={reload}><RefreshCw size={15} /> Aggiorna</button>
      </div>

      {error && <p className="error-text">{error}</p>}
      {loading && !data ? (
        <Spinner />
      ) : data && data.length > 0 ? (
        <table className="table">
          <thead>
            <tr><th>Mezzo</th><th>Utente</th><th>Inizio</th><th>Durata</th><th>Stato</th></tr>
          </thead>
          <tbody>
            {data.map((p) => (
              <tr key={p.idPrenotazione} className={p.anomalia ? 'alert' : ''}>
                <td>{tipoEmoji[p.tipoMezzo]} <b>{p.codiceMezzo}</b> <span className="small">{tipoLabel[p.tipoMezzo]}</span></td>
                <td>{p.nome ? `${p.nome} ${p.cognome}` : '—'}</td>
                <td className="small">{dataBreve(p.dataInizio)} · {ora(p.oraInizio)}</td>
                <td className="mono">{p.durataMinuti} min</td>
                <td>
                  {p.anomalia ? (
                    <span className="flex" style={{ color: 'var(--danger)', fontWeight: 700, fontSize: 13 }}>
                      <TriangleAlert size={15} /> Bloccata &gt; {p.sogliaAnomaliaMin}′
                    </span>
                  ) : (
                    <Badge text="Regolare" color="#23A455" />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="empty">Nessuna prenotazione attiva al momento.</div>
      )}
      <p className="small" style={{ marginTop: 12 }}>
        Le prenotazioni che superano la soglia senza avvio del noleggio sono evidenziate come anomalie (mezzo bloccato troppo a lungo).
      </p>
    </div>
  );
}
