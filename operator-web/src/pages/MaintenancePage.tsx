import { useState } from 'react';
import { RefreshCw, Wrench, Plus } from 'lucide-react';
import { api } from '../api/api';
import { ApiError } from '../api/client';
import { useData } from '../lib/useData';
import { Spinner, Badge, Modal } from '../components/ui';
import { statoGenericoColor, tipoEmoji, dataBreve } from '../labels';
import type { MezzoDaManutenere } from '../types';

export default function MaintenancePage() {
  const daManutenere = useData(() => api.mezziDaManutenere(), []);   // OP.06
  const interventi = useData(() => api.interventi(), []);
  const [target, setTarget] = useState<MezzoDaManutenere | null>(null);

  const aggiornaIntervento = async (id: string, stato: string) => {
    try { await api.aggiornaIntervento(id, { statoManutenzione: stato }); interventi.reload(); daManutenere.reload(); }
    catch (e) { alert(e instanceof ApiError ? e.message : 'Errore'); }
  };

  return (
    <div className="grid-2">
      <div className="card">
        <div className="between" style={{ marginBottom: 14 }}>
          <div className="card-title" style={{ margin: 0 }}><Wrench size={18} /> Mezzi da manutenere</div>
          <button className="btn btn-ghost btn-sm" onClick={() => daManutenere.reload()}><RefreshCw size={15} /></button>
        </div>
        {daManutenere.loading && !daManutenere.data ? <Spinner /> : daManutenere.data && daManutenere.data.length > 0 ? (
          <table className="table">
            <thead><tr><th>Mezzo</th><th>Motivo</th><th></th></tr></thead>
            <tbody>
              {daManutenere.data.map((m) => (
                <tr key={m.idMezzo}>
                  <td>{tipoEmoji[m.tipoMezzo]} <b>{m.codiceMezzo}</b><br /><span className="small">Energia {m.livelloEnergia}%</span></td>
                  <td className="small">{m.motivo}{m.segnalazioniAperte > 0 ? ` (${m.segnalazioniAperte})` : ''}</td>
                  <td><button className="btn btn-soft btn-sm" onClick={() => setTarget(m)}><Plus size={15} /> Intervento</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <div className="empty">Nessun mezzo richiede manutenzione.</div>}
      </div>

      <div className="card">
        <div className="between" style={{ marginBottom: 14 }}>
          <div className="card-title" style={{ margin: 0 }}>Interventi</div>
          <button className="btn btn-ghost btn-sm" onClick={() => interventi.reload()}><RefreshCw size={15} /></button>
        </div>
        {interventi.loading && !interventi.data ? <Spinner /> : interventi.data && interventi.data.length > 0 ? (
          <table className="table">
            <thead><tr><th>Mezzo</th><th>Apertura</th><th>Stato</th><th></th></tr></thead>
            <tbody>
              {interventi.data.map((i) => (
                <tr key={i.idManutenzione}>
                  <td>{tipoEmoji[i.tipoMezzo]} <b>{i.codiceMezzo}</b></td>
                  <td className="small">{dataBreve(i.dataApertura)}</td>
                  <td><Badge text={i.statoManutenzione.replace('_', ' ')} color={statoGenericoColor[i.statoManutenzione] || '#6A7C88'} /></td>
                  <td>
                    {i.statoManutenzione !== 'chiusa' && (
                      <div className="flex">
                        {i.statoManutenzione === 'aperta' && (
                          <button className="btn btn-ghost btn-sm" onClick={() => aggiornaIntervento(i.idManutenzione, 'in_corso')}>Avvia</button>
                        )}
                        <button className="btn btn-success btn-sm" onClick={() => aggiornaIntervento(i.idManutenzione, 'chiusa')}>Chiudi</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <div className="empty">Nessun intervento registrato.</div>}
      </div>

      {target && (
        <OpenInterventoModal
          mezzo={target}
          onClose={() => setTarget(null)}
          onSaved={() => { setTarget(null); interventi.reload(); daManutenere.reload(); }}
        />
      )}
    </div>
  );
}

function OpenInterventoModal({ mezzo, onClose, onSaved }: { mezzo: MezzoDaManutenere; onClose: () => void; onSaved: () => void }) {
  const [desc, setDesc] = useState(mezzo.motivo);
  const [busy, setBusy] = useState(false);
  const salva = async () => {
    setBusy(true);
    try {
      await api.apriIntervento({ idMezzo: mezzo.idMezzo, descrizione: desc, idOperatore: 'OP-demo' });
      onSaved();
    } catch (e) { alert(e instanceof ApiError ? e.message : 'Errore'); } finally { setBusy(false); }
  };
  return (
    <Modal title={`Intervento · ${mezzo.codiceMezzo}`} onClose={onClose}>
      <div className="field">
        <label>Descrizione intervento</label>
        <textarea className="textarea" value={desc} onChange={(e) => setDesc(e.target.value)} />
      </div>
      <p className="small">Il mezzo verrà messo in stato "in manutenzione".</p>
      <div className="flex" style={{ justifyContent: 'flex-end', marginTop: 12 }}>
        <button className="btn btn-ghost" onClick={onClose}>Annulla</button>
        <button className="btn" onClick={salva} disabled={busy}>{busy ? 'Apertura…' : 'Apri intervento'}</button>
      </div>
    </Modal>
  );
}
