import { useEffect, useRef, useState } from 'react';
import { RefreshCw, Send, MapPin } from 'lucide-react';
import { api } from '../api/api';
import { ApiError } from '../api/client';
import { useData } from '../lib/useData';
import { Spinner, Badge } from '../components/ui';
import { statoGenericoColor, dataBreve, ora, oraIso } from '../labels';
import type { RichiestaAssistenza, Messaggio } from '../types';

export default function SupportPage() {
  const [filtro, setFiltro] = useState('');
  const { data, loading, error, reload } = useData(() => api.richieste(filtro || undefined), [filtro]); // OP.07
  const [sel, setSel] = useState<RichiestaAssistenza | null>(null);

  const setStato = async (id: string, stato: string) => {
    try { const r = await api.aggiornaRichiesta(id, { statoRichiesta: stato, idOperatore: 'OP-demo' }); setSel(r); reload(); }
    catch (e) { alert(e instanceof ApiError ? e.message : 'Errore'); }
  };

  return (
    <div className="grid-2">
      <div className="card">
        <div className="between" style={{ marginBottom: 14 }}>
          <div className="card-title" style={{ margin: 0 }}>Richieste di assistenza</div>
          <div className="flex">
            <select className="select" style={{ height: 34, width: 150 }} value={filtro} onChange={(e) => setFiltro(e.target.value)}>
              <option value="">Tutte</option>
              <option value="aperta">Aperte</option>
              <option value="in_gestione">In gestione</option>
              <option value="chiusa">Chiuse</option>
            </select>
            <button className="btn btn-ghost btn-sm" onClick={reload}><RefreshCw size={15} /></button>
          </div>
        </div>
        {error && <p className="error-text">{error}</p>}
        {loading && !data ? <Spinner /> : data && data.length > 0 ? (
          <table className="table">
            <thead><tr><th>Utente</th><th>Problema</th><th>Stato</th></tr></thead>
            <tbody>
              {data.map((r) => (
                <tr key={r.idRichiesta} className="row-hover" onClick={() => setSel(r)}>
                  <td>{r.nome ? `${r.nome} ${r.cognome}` : '—'}{r.posizione ? <MapPin size={13} style={{ marginLeft: 4, verticalAlign: 'middle' }} color="var(--accent)" /> : null}</td>
                  <td className="small" style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.descrizione}</td>
                  <td><Badge text={r.statoRichiesta.replace('_', ' ')} color={statoGenericoColor[r.statoRichiesta] || '#6A7C88'} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <div className="empty">Nessuna richiesta.</div>}
      </div>

      <div className="card">
        <div className="card-title">Conversazione</div>
        {!sel ? <div className="empty">Seleziona una richiesta per rispondere in chat.</div> : (
          <ChatPanel richiesta={sel} onStato={setStato} />
        )}
      </div>
    </div>
  );
}

function ChatPanel({ richiesta, onStato }: { richiesta: RichiestaAssistenza; onStato: (id: string, s: string) => void }) {
  const [msgs, setMsgs] = useState<Messaggio[]>([]);
  const [testo, setTesto] = useState('');
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const load = () => api.messaggi(richiesta.idRichiesta).then(setMsgs).catch(() => {});
  useEffect(() => { load(); const t = setInterval(load, 5000); return () => clearInterval(t); /* eslint-disable-next-line */ }, [richiesta.idRichiesta]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs.length]);

  const invia = async () => {
    const t = testo.trim();
    if (!t) return;
    setTesto(''); setBusy(true);
    try { await api.rispondi(richiesta.idRichiesta, t); await load(); }
    catch (e) { alert(e instanceof ApiError ? e.message : 'Errore'); }
    finally { setBusy(false); }
  };

  return (
    <>
      <div className="between" style={{ marginBottom: 10 }}>
        <div>
          <b>{richiesta.nome ? `${richiesta.nome} ${richiesta.cognome}` : 'Utente'}</b>
          <div className="small">{dataBreve(richiesta.dataInvio)} · {ora(richiesta.oraInvio)}</div>
        </div>
        <Badge text={richiesta.statoRichiesta.replace('_', ' ')} color={statoGenericoColor[richiesta.statoRichiesta] || '#6A7C88'} />
      </div>

      {richiesta.posizione && (
        <a className="small flex" style={{ marginBottom: 10 }} target="_blank" rel="noreferrer"
          href={`https://www.openstreetmap.org/?mlat=${richiesta.posizione.lat}&mlon=${richiesta.posizione.lon}#map=17/${richiesta.posizione.lat}/${richiesta.posizione.lon}`}>
          <MapPin size={14} color="var(--accent)" /> Posizione utente: {richiesta.posizione.lat.toFixed(4)}, {richiesta.posizione.lon.toFixed(4)}
        </a>
      )}

      <div style={{ background: 'var(--surface-alt)', borderRadius: 12, padding: 12, marginBottom: 12 }}>
        <p className="small" style={{ marginTop: 0 }}>Richiesta</p>
        <p style={{ margin: 0 }}>{richiesta.descrizione}</p>
      </div>

      <div className="chat-list">
        {msgs.length === 0 && <p className="small" style={{ textAlign: 'center' }}>Nessun messaggio: scrivi per iniziare.</p>}
        {msgs.map((m) => (
          <div key={m.idMessaggio} className={`bubble ${m.mittente === 'operatore' ? 'op' : 'ut'}`}>
            {m.testo}
            <div className="bubble-time">{oraIso(m.timestamp)}</div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div className="flex" style={{ marginTop: 12 }}>
        <input className="input" placeholder="Scrivi una risposta…" value={testo}
          onChange={(e) => setTesto(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && invia()} />
        <button className="btn" onClick={invia} disabled={busy}><Send size={16} /></button>
      </div>

      <div className="flex" style={{ marginTop: 12 }}>
        <button className="btn btn-soft btn-sm" onClick={() => onStato(richiesta.idRichiesta, 'in_gestione')}>In gestione</button>
        <button className="btn btn-success btn-sm" onClick={() => onStato(richiesta.idRichiesta, 'chiusa')}>Chiudi richiesta</button>
      </div>
    </>
  );
}
