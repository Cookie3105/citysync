// Componente: Gestione Pagamenti ed Incentivi (lato Amministrazione Comunale).
// Caso d'uso: AP07 (gestire incentivi) — Incentivo.recuperaIncentiviPresenti/crea/aggiorna.
const { all, get, run } = require('../../persistence/db');
const { genId, badRequest, notFound } = require('../../lib/util');

// Normalizza l'unità del valore: 'percentuale' oppure 'euro' (default).
function normalizzaUnita(u) {
  return u === 'percentuale' || u === '%' ? 'percentuale' : 'euro';
}

// recuperaIncentiviPresenti()
function lista() {
  return all(`SELECT idIncentivo, tipoIncentivo, valore, unitaValore, statoIncentivo, descrizione, idAmministrazione
              FROM Incentivo ORDER BY rowid DESC`);
}

function getById(id) {
  return get(`SELECT idIncentivo, tipoIncentivo, valore, unitaValore, statoIncentivo, descrizione, idAmministrazione FROM Incentivo WHERE idIncentivo = ?`, id);
}

// creaIncentivo()
function crea({ tipoIncentivo, valore, unitaValore, descrizione, idAmministrazione }) {
  if (!tipoIncentivo) throw badRequest('tipoIncentivo obbligatorio');
  if (!(Number(valore) >= 0)) throw badRequest('valore non valido');
  const id = genId('INC');
  run(`INSERT INTO Incentivo (idIncentivo, tipoIncentivo, valore, unitaValore, statoIncentivo, descrizione, idAmministrazione)
       VALUES (?,?,?,?,?,?,?)`,
    id, tipoIncentivo, Number(valore), normalizzaUnita(unitaValore), 'attivo', descrizione || null, idAmministrazione || 'AM-demo');
  return getById(id);
}

// aggiornaStato() / modifica
function aggiorna(id, { tipoIncentivo, valore, unitaValore, statoIncentivo, descrizione }) {
  const inc = getById(id);
  if (!inc) throw notFound('Incentivo non trovato');
  if (statoIncentivo && !['attivo', 'scaduto', 'disattivato'].includes(statoIncentivo)) {
    throw badRequest('Stato incentivo non valido');
  }
  run(`UPDATE Incentivo SET tipoIncentivo = COALESCE(?, tipoIncentivo), valore = COALESCE(?, valore),
       unitaValore = COALESCE(?, unitaValore), statoIncentivo = COALESCE(?, statoIncentivo), descrizione = COALESCE(?, descrizione) WHERE idIncentivo = ?`,
    tipoIncentivo || null, valore != null ? Number(valore) : null,
    unitaValore != null ? normalizzaUnita(unitaValore) : null, statoIncentivo || null, descrizione || null, id);
  return getById(id);
}

// UT.09 - visualizzaIncentivo(): incentivi attivi dell'utente + promozioni generali.
function incentiviUtente(idUtente) {
  return all(
    `SELECT idIncentivo, tipoIncentivo, valore, unitaValore, statoIncentivo, descrizione, idUtente
     FROM Incentivo WHERE statoIncentivo = 'attivo' AND (idUtente = ? OR idUtente IS NULL)
     ORDER BY (idUtente IS NULL), rowid DESC`, idUtente);
}

// OP.08 - assegna un bonus a un Utente (es. parcheggio corretto a fine corsa).
function assegna({ idUtente, tipoIncentivo, valore, unitaValore, descrizione, idAmministrazione }) {
  if (!idUtente) throw badRequest('idUtente obbligatorio');
  const id = genId('INC');
  run(`INSERT INTO Incentivo (idIncentivo, tipoIncentivo, valore, unitaValore, statoIncentivo, descrizione, idUtente, idAmministrazione)
       VALUES (?,?,?,?,?,?,?,?)`,
    id, tipoIncentivo || 'bonus_parcheggio', Number(valore) || 0.5, normalizzaUnita(unitaValore), 'attivo',
    descrizione || 'Bonus per parcheggio corretto', idUtente, idAmministrazione || null);
  return getById(id);
}

module.exports = { lista, getById, crea, aggiorna, incentiviUtente, assegna };
