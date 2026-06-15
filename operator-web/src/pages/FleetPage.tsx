import { useState } from 'react';
import { Plus, Lock, RefreshCw } from 'lucide-react';
import { api } from '../api/api';
import { ApiError } from '../api/client';
import { useData } from '../lib/useData';
import { Spinner, EnergyBar, Modal } from '../components/ui';
import { statoMezzoColor, statoMezzoLabel, tipoEmoji, tipoLabel } from '../labels';
import type { StatoMezzo, TipoMezzo } from '../types';

const STATI: StatoMezzo[] = ['disponibile', 'prenotato', 'in_uso', 'in_manutenzione', 'fuori_servizio', 'bloccato'];

export default function FleetPage() {
  const { data, loading, error, reload } = useData(() => api.tuttiMezzi(), []);
  const [showAdd, setShowAdd] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const cambiaStato = async (id: string, stato: string) => {
    try { await api.aggiornaStatoMezzo(id, stato); reload(); } // OP.13
    catch (e) { alert(e instanceof ApiError ? e.message : 'Errore'); }
  };

  const blocca = async (id: string, codice: string) => {
    if (!confirm(`Bloccare da remoto il mezzo ${codice}?`)) return;
    try { await api.bloccoRemoto(id); setMsg(`Comando di blocco inviato a ${codice}.`); reload(); } // OP.10
    catch (e) { alert(e instanceof ApiError ? e.message : 'Blocco non riuscito'); }
  };

  return (
    <div className="card">
      <div className="between" style={{ marginBottom: 16 }}>
        <div className="card-title" style={{ margin: 0 }}>Flotta ({data?.length ?? 0} mezzi)</div>
        <div className="flex">
          <button className="btn btn-ghost btn-sm" onClick={reload}><RefreshCw size={15} /> Aggiorna</button>
          <button className="btn btn-sm" onClick={() => setShowAdd(true)}><Plus size={16} /> Registra mezzo</button>
        </div>
      </div>

      {msg && <p className="small" style={{ color: 'var(--success)', marginBottom: 10 }}>{msg}</p>}
      {error && <p className="error-text">{error}</p>}
      {loading && !data ? (
        <Spinner />
      ) : (
        <table className="table">
          <thead>
            <tr><th>Codice</th><th>Tipo</th><th>Energia</th><th>Posizione</th><th>Stato (OP.13)</th><th></th></tr>
          </thead>
          <tbody>
            {data?.map((m) => (
              <tr key={m.idMezzo}>
                <td className="mono">{m.codiceMezzo}</td>
                <td>{tipoEmoji[m.tipoMezzo]} {tipoLabel[m.tipoMezzo]}</td>
                <td><EnergyBar level={m.livelloEnergia} /></td>
                <td className="small">{m.posizione ? `${m.posizione.lat.toFixed(4)}, ${m.posizione.lon.toFixed(4)}` : '—'}</td>
                <td>
                  <select
                    className="select"
                    style={{ height: 34, width: 168, borderLeft: `4px solid ${statoMezzoColor[m.statOperativo]}` }}
                    value={m.statOperativo}
                    onChange={(e) => cambiaStato(m.idMezzo, e.target.value)}
                  >
                    {STATI.map((s) => <option key={s} value={s}>{statoMezzoLabel[s]}</option>)}
                  </select>
                </td>
                <td>
                  <button
                    className="btn btn-ghost btn-sm"
                    disabled={m.statOperativo === 'in_uso'}
                    onClick={() => blocca(m.idMezzo, m.codiceMezzo)}
                    title="Blocca da remoto (OP.10)"
                  >
                    <Lock size={15} /> Blocca
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showAdd && <AddMezzoModal onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); reload(); }} />}
    </div>
  );
}

// OP.14 - Registrare nuovo mezzo
function AddMezzoModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [tipo, setTipo] = useState<TipoMezzo>('bici');
  const [codice, setCodice] = useState('');
  const [energia, setEnergia] = useState('100');
  const [marca, setMarca] = useState('');
  const [lat, setLat] = useState('41.1187');
  const [lon, setLon] = useState('16.8719');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const salva = async () => {
    setErr(null); setBusy(true);
    try {
      await api.registraMezzo({
        tipoMezzo: tipo,
        codiceMezzo: codice.trim(),
        livelloEnergia: Number(energia),
        caratteristicheTecniche: marca ? { marca } : {},
        posizione: { lat: Number(lat), lon: Number(lon) },
      });
      onSaved();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : 'Registrazione non riuscita');
    } finally { setBusy(false); }
  };

  return (
    <Modal title="Registra nuovo mezzo" onClose={onClose}>
      <div className="field">
        <label>Tipo di mezzo</label>
        <select className="select" value={tipo} onChange={(e) => setTipo(e.target.value as TipoMezzo)}>
          <option value="bici">Bici</option>
          <option value="escooter">E-Scooter</option>
          <option value="auto">Auto</option>
        </select>
      </div>
      <div className="field"><label>Codice mezzo</label>
        <input className="input" value={codice} onChange={(e) => setCodice(e.target.value)} placeholder="es. BK-010" /></div>
      <div className="field"><label>Marca / modello</label>
        <input className="input" value={marca} onChange={(e) => setMarca(e.target.value)} placeholder="es. CitySync e-Bike" /></div>
      <div className="row-fields">
        <div className="field"><label>Energia %</label>
          <input className="input" value={energia} onChange={(e) => setEnergia(e.target.value)} type="number" /></div>
        <div className="field"><label>Latitudine</label>
          <input className="input" value={lat} onChange={(e) => setLat(e.target.value)} /></div>
        <div className="field"><label>Longitudine</label>
          <input className="input" value={lon} onChange={(e) => setLon(e.target.value)} /></div>
      </div>
      {err && <p className="error-text">{err}</p>}
      <div className="flex" style={{ justifyContent: 'flex-end', marginTop: 8 }}>
        <button className="btn btn-ghost" onClick={onClose}>Annulla</button>
        <button className="btn" onClick={salva} disabled={busy}>{busy ? 'Salvataggio…' : 'Registra'}</button>
      </div>
    </Modal>
  );
}
