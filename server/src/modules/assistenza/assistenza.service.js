// Componente: Gestione Assistenza e Segnalazioni.
// Casi d'uso: UT.11 (segnalare guasto), OP.03 (gestire segnalazioni),
//             UT.21 (richiedere assistenza), UT.10 (chat), OP.07 (gestire richieste).
const { all, get, run, tx } = require('../../persistence/db');
const { genId, today, nowTime, nowIso, badRequest, notFound } = require('../../lib/util');
const { StatoSegnalazione, StatoRichiesta } = require('../../domain/enums');

// ============================ SEGNALAZIONI GUASTO ============================

// UT.11 - Segnalare guasto.
function creaSegnalazione({ idUtente, idMezzo, descrizione }) {
  if (!idUtente || !idMezzo) throw badRequest('idUtente e idMezzo obbligatori');
  if (!descrizione || descrizione.trim().length < 3) throw badRequest('Descrizione del guasto non valida');
  const mezzo = get(`SELECT idMezzo FROM Mezzo WHERE idMezzo = ?`, idMezzo);
  if (!mezzo) throw notFound('Mezzo non trovato');
  const adesso = new Date();
  const id = genId('SEG');
  run(`INSERT INTO SegnalazioneGuasto (idSegnalazione, dataSegnalazione, oraSegnalazione, statoSegnalazione, descrizione, idUtente, idMezzo)
       VALUES (?,?,?,?,?,?,?)`,
    id, today(adesso), nowTime(adesso), StatoSegnalazione.APERTA, descrizione.trim(), idUtente, idMezzo);
  return getSegnalazione(id);
}

function getSegnalazione(id) {
  return get(
    `SELECT s.*, m.codiceMezzo, m.tipoMezzo, u.nome, u.cognome
     FROM SegnalazioneGuasto s
     JOIN Mezzo m ON m.idMezzo = s.idMezzo
     JOIN Utente u ON u.idUtente = s.idUtente
     WHERE s.idSegnalazione = ?`, id);
}

// OP.03 - elenco segnalazioni (filtrabile per stato).
function listaSegnalazioni(stato) {
  let sql = `SELECT s.*, m.codiceMezzo, m.tipoMezzo, u.nome, u.cognome
             FROM SegnalazioneGuasto s
             JOIN Mezzo m ON m.idMezzo = s.idMezzo
             JOIN Utente u ON u.idUtente = s.idUtente`;
  const params = [];
  if (stato) { sql += ' WHERE s.statoSegnalazione = ?'; params.push(stato); }
  sql += ' ORDER BY s.dataSegnalazione DESC, s.oraSegnalazione DESC';
  return all(sql, ...params);
}

function aggiornaSegnalazione(id, { statoSegnalazione, idOperatore }) {
  const seg = get(`SELECT idSegnalazione FROM SegnalazioneGuasto WHERE idSegnalazione = ?`, id);
  if (!seg) throw notFound('Segnalazione non trovata');
  if (statoSegnalazione && !Object.values(StatoSegnalazione).includes(statoSegnalazione)) {
    throw badRequest('Stato segnalazione non valido');
  }
  run(`UPDATE SegnalazioneGuasto SET statoSegnalazione = COALESCE(?, statoSegnalazione), idOperatore = COALESCE(?, idOperatore) WHERE idSegnalazione = ?`,
    statoSegnalazione || null, idOperatore || null, id);
  return getSegnalazione(id);
}

// ============================ RICHIESTE ASSISTENZA ==========================

// UT.21 - Richiedere assistenza (con posizione, se disponibile).
function creaRichiesta({ idUtente, descrizione, posizione }) {
  if (!idUtente) throw badRequest('idUtente obbligatorio');
  if (!descrizione || descrizione.trim().length < 3) throw badRequest('Descrizione non valida');
  return tx(() => {
    let idPosizione = null;
    if (posizione && posizione.lat != null && posizione.lon != null) {
      idPosizione = genId('POS');
      run(`INSERT INTO PosizioneGeografica (idPosizione, latitudine, longitudine, indirizzo, comune, provincia, nazione, ISOnazione)
           VALUES (?,?,?,?,?,?,?,?)`,
        idPosizione, posizione.lat, posizione.lon, posizione.indirizzo || null, 'Bari', 'BA', 'Italia', 'IT');
    }
    const adesso = new Date();
    const id = genId('RAS');
    run(`INSERT INTO RichiestAssistenza (idRichiesta, descrizione, statoRichiesta, dataInvio, oraInvio, idUtente, idPosizione)
         VALUES (?,?,?,?,?,?,?)`,
      id, descrizione.trim(), StatoRichiesta.APERTA, today(adesso), nowTime(adesso), idUtente, idPosizione);
    return getRichiesta(id);
  });
}

function getRichiesta(id) {
  const r = get(
    `SELECT r.*, u.nome, u.cognome, p.latitudine, p.longitudine, p.indirizzo
     FROM RichiestAssistenza r
     JOIN Utente u ON u.idUtente = r.idUtente
     LEFT JOIN PosizioneGeografica p ON p.idPosizione = r.idPosizione
     WHERE r.idRichiesta = ?`, id);
  if (!r) return null;
  return {
    ...r,
    posizione: r.latitudine != null ? { lat: r.latitudine, lon: r.longitudine, indirizzo: r.indirizzo } : null,
  };
}

// OP.07 - elenco richieste assistenza (filtrabile per stato) o per utente.
function listaRichieste({ stato, idUtente } = {}) {
  let sql = `SELECT r.*, u.nome, u.cognome, p.latitudine, p.longitudine, p.indirizzo
             FROM RichiestAssistenza r
             JOIN Utente u ON u.idUtente = r.idUtente
             LEFT JOIN PosizioneGeografica p ON p.idPosizione = r.idPosizione`;
  const where = [];
  const params = [];
  if (stato) { where.push('r.statoRichiesta = ?'); params.push(stato); }
  if (idUtente) { where.push('r.idUtente = ?'); params.push(idUtente); }
  if (where.length) sql += ' WHERE ' + where.join(' AND ');
  sql += ' ORDER BY r.dataInvio DESC, r.oraInvio DESC';
  return all(sql, ...params).map((r) => ({
    ...r,
    posizione: r.latitudine != null ? { lat: r.latitudine, lon: r.longitudine, indirizzo: r.indirizzo } : null,
  }));
}

function aggiornaRichiesta(id, { statoRichiesta, idOperatore }) {
  const r = get(`SELECT idRichiesta FROM RichiestAssistenza WHERE idRichiesta = ?`, id);
  if (!r) throw notFound('Richiesta non trovata');
  if (statoRichiesta && !Object.values(StatoRichiesta).includes(statoRichiesta)) {
    throw badRequest('Stato richiesta non valido');
  }
  run(`UPDATE RichiestAssistenza SET statoRichiesta = COALESCE(?, statoRichiesta), idOperatore = COALESCE(?, idOperatore) WHERE idRichiesta = ?`,
    statoRichiesta || null, idOperatore || null, id);
  return getRichiesta(id);
}

// ============================ CHAT (UT.10) ==================================
// [EXT] Entità Messaggio non presente nel modello logico: estensione per la chat.

function getMessaggi(idRichiesta) {
  const r = get(`SELECT idRichiesta FROM RichiestAssistenza WHERE idRichiesta = ?`, idRichiesta);
  if (!r) throw notFound('Richiesta non trovata');
  return all(`SELECT idMessaggio, mittente, testo, timestamp FROM Messaggio WHERE idRichiesta = ? ORDER BY timestamp ASC`, idRichiesta);
}

function inviaMessaggio(idRichiesta, { mittente, testo }) {
  const r = get(`SELECT idRichiesta, statoRichiesta FROM RichiestAssistenza WHERE idRichiesta = ?`, idRichiesta);
  if (!r) throw notFound('Richiesta non trovata');
  if (!['utente', 'operatore'].includes(mittente)) throw badRequest('mittente non valido');
  if (!testo || !testo.trim()) throw badRequest('testo del messaggio mancante');
  const id = genId('MSG');
  run(`INSERT INTO Messaggio (idMessaggio, idRichiesta, mittente, testo, timestamp) VALUES (?,?,?,?,?)`,
    id, idRichiesta, mittente, testo.trim(), nowIso());
  // L'invio di un messaggio porta la richiesta "in gestione".
  if (r.statoRichiesta === StatoRichiesta.APERTA) {
    run(`UPDATE RichiestAssistenza SET statoRichiesta = ? WHERE idRichiesta = ?`, StatoRichiesta.IN_GESTIONE, idRichiesta);
  }
  return get(`SELECT idMessaggio, mittente, testo, timestamp FROM Messaggio WHERE idMessaggio = ?`, id);
}

module.exports = {
  creaSegnalazione, getSegnalazione, listaSegnalazioni, aggiornaSegnalazione,
  creaRichiesta, getRichiesta, listaRichieste, aggiornaRichiesta,
  getMessaggi, inviaMessaggio,
};
