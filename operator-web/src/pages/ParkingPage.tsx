import { RefreshCw, ParkingSquare, MapPin, CircleCheck, CircleX } from 'lucide-react';
import { api } from '../api/api';
import { useData } from '../lib/useData';
import { Spinner, Badge } from '../components/ui';
import { tipoEmoji, dataBreve, ora } from '../labels';

export default function ParkingPage() {
  const parcheggio = useData(() => api.verificaParcheggio(), []);          // OP.04
  const posizioni = useData(() => api.posizioniFineNoleggio(), []);        // OP.05

  const nonConformi = parcheggio.data?.filter((p) => p.corretto === false).length ?? 0;

  return (
    <>
      <div className="card">
        <div className="between" style={{ marginBottom: 14 }}>
          <div className="card-title" style={{ margin: 0 }}>
            <ParkingSquare size={18} /> Verifica parcheggio mezzi
            {nonConformi > 0 && <span style={{ marginLeft: 10 }}><Badge text={`${nonConformi} non conformi`} color="#E04848" /></span>}
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => parcheggio.reload()}><RefreshCw size={15} /> Aggiorna</button>
        </div>
        {parcheggio.loading && !parcheggio.data ? <Spinner /> : (
          <table className="table">
            <thead><tr><th>Mezzo</th><th>Esito</th><th>Area</th><th>Posizione</th></tr></thead>
            <tbody>
              {parcheggio.data?.map((p) => (
                <tr key={p.idMezzo} className={p.corretto === false ? 'alert' : ''}>
                  <td>{p.tipoMezzo ? tipoEmoji[p.tipoMezzo] : ''} <b>{p.codiceMezzo}</b></td>
                  <td>
                    {p.corretto === null ? (
                      <span className="small">Posizione non disponibile</span>
                    ) : p.corretto ? (
                      <span className="flex" style={{ color: 'var(--success)', fontWeight: 700, fontSize: 13 }}><CircleCheck size={15} /> Conforme</span>
                    ) : (
                      <span className="flex" style={{ color: 'var(--danger)', fontWeight: 700, fontSize: 13 }}><CircleX size={15} /> Non conforme</span>
                    )}
                  </td>
                  <td className="small">{p.area || '—'}</td>
                  <td className="small">{p.posizione ? `${p.posizione.lat.toFixed(4)}, ${p.posizione.lon.toFixed(4)}` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <div className="between" style={{ marginBottom: 14 }}>
          <div className="card-title" style={{ margin: 0 }}><MapPin size={18} /> Posizione mezzi a fine noleggio (OP.05)</div>
          <button className="btn btn-ghost btn-sm" onClick={() => posizioni.reload()}><RefreshCw size={15} /> Aggiorna</button>
        </div>
        {posizioni.loading && !posizioni.data ? <Spinner /> : posizioni.data && posizioni.data.length > 0 ? (
          <table className="table">
            <thead><tr><th>Mezzo</th><th>Fine noleggio</th><th>Posizione finale</th><th></th></tr></thead>
            <tbody>
              {posizioni.data.map((p) => (
                <tr key={p.idNoleggio}>
                  <td>{tipoEmoji[p.tipoMezzo]} <b>{p.codiceMezzo}</b></td>
                  <td className="small">{dataBreve(p.dataFine)} · {ora(p.oraFine)}</td>
                  <td className="small">{p.posizioneFinale ? `${p.posizioneFinale.lat.toFixed(4)}, ${p.posizioneFinale.lon.toFixed(4)}` : '—'}</td>
                  <td>
                    {p.posizioneFinale && (
                      <a className="btn btn-ghost btn-sm" target="_blank" rel="noreferrer"
                        href={`https://www.openstreetmap.org/?mlat=${p.posizioneFinale.lat}&mlon=${p.posizioneFinale.lon}#map=17/${p.posizioneFinale.lat}/${p.posizioneFinale.lon}`}>
                        <MapPin size={14} /> Mappa
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <div className="empty">Nessun noleggio concluso da mostrare.</div>}
      </div>
    </>
  );
}
