import { useState } from 'react';
import { RefreshCw, Wrench } from 'lucide-react';
import { api } from '../api/api';
import { ApiError } from '../api/client';
import { useData } from '../lib/useData';
import { Spinner, Badge } from '../components/ui';
import { statoGenericoColor, tipoEmoji, dataBreve, ora } from '../labels';
import type { Segnalazione } from '../types';

export default function FaultsPage() {
  const [filtro, setFiltro] = useState('');
  const { data, loading, error, reload } = useData(() => api.segnalazioni(filtro || undefined), [filtro]);
  const [sel, setSel] = useState<Segnalazione | null>(null);

  const aggiorna = async (id: string, stato: string) => {
    try {
      const s = await api.aggiornaSegnalazione(id, { statoSegnalazione: stato, idOperatore: 'OP-demo' });
      setSel(s); reload();
    } catch (e) { alert(e instanceof ApiError ? e.message : 'Errore'); }
  };

  const creaIntervento = async (s: Segnalazione) => {
    try {
      await api.apriIntervento({
        idMezzo: s.idMezzo,
        descrizione: `Da segnalazione: ${s.descrizione}`,
        idOperatore: 'OP-demo',
        idSegnalazione: s.idSegnalazione,
      });
      await api.aggiornaSegnalazione(s.idSegnalazione, { statoSegnalazione: 'in_gestione', idOperatore: 'OP-demo' });
      alert('Intervento di manutenzione aperto e mezzo messo in manutenzione.');
      reload();
      setSel({ ...s, statoSegnalazione: 'in_gestione' });
    } catch (e) { alert(e instanceof ApiError ? e.message : 'Errore'); }
  };

  return (
    <div className="grid-2">
      <div className="card">
        <div className="between" style={{ marginBottom: 14 }}>
          <div className="card-title" style={{ margin: 0 }}>Segnalazioni</div>
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
            <thead><tr><th>Mezzo</th><th>Descrizione</th><th>Stato</th></tr></thead>
            <tbody>
              {data.map((s) => (
                <tr key={s.idSegnalazione} className="row-hover" onClick={() => setSel(s)}>
                  <td>{tipoEmoji[s.tipoMezzo]} <b>{s.codiceMezzo}</b></td>
                  <td className="small" style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.descrizione}</td>
                  <td><Badge text={s.statoSegnalazione.replace('_', ' ')} color={statoGenericoColor[s.statoSegnalazione] || '#6A7C88'} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <div className="empty">Nessuna segnalazione.</div>}
      </div>

      <div className="card">
        <div className="card-title">Dettaglio segnalazione</div>
        {!sel ? (
          <div className="empty">Seleziona una segnalazione dall'elenco.</div>
        ) : (
          <>
            <p className="small">Mezzo</p>
            <p style={{ fontWeight: 700, marginTop: 2 }}>{tipoEmoji[sel.tipoMezzo]} {sel.codiceMezzo}</p>
            <p className="small" style={{ marginTop: 12 }}>Inviata da</p>
            <p style={{ marginTop: 2 }}>{sel.nome ? `${sel.nome} ${sel.cognome}` : '—'} · {dataBreve(sel.dataSegnalazione)} {ora(sel.oraSegnalazione)}</p>
            <p className="small" style={{ marginTop: 12 }}>Descrizione</p>
            <p style={{ marginTop: 2, lineHeight: 1.5 }}>{sel.descrizione}</p>
            <div style={{ margin: '14px 0' }}>
              <Badge text={sel.statoSegnalazione.replace('_', ' ')} color={statoGenericoColor[sel.statoSegnalazione] || '#6A7C88'} />
            </div>

            <div className="flex" style={{ flexWrap: 'wrap' }}>
              <button className="btn btn-soft btn-sm" onClick={() => aggiorna(sel.idSegnalazione, 'in_gestione')}>Prendi in carico</button>
              <button className="btn btn-success btn-sm" onClick={() => aggiorna(sel.idSegnalazione, 'chiusa')}>Chiudi segnalazione</button>
            </div>
            <button className="btn btn-outline btn-sm" style={{ marginTop: 10 }} onClick={() => creaIntervento(sel)}>
              <Wrench size={15} /> Crea intervento di manutenzione
            </button>
            <p className="small" style={{ marginTop: 10 }}>
              "Crea intervento" realizza l'inclusione <i>Gestire manutenzione mezzi</i> (OP.06) prevista dal caso d'uso OP.03.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
