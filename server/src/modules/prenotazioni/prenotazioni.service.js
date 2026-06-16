// Componente: Gestione Prenotazioni.
// Casi d'uso: UT.02 (prenotare mezzo), OP.11 (controllare prenotazioni).
const { all, get, run, tx } = require('../../persistence/db');
const { genId, today, nowTime, nowIso, badRequest, notFound, conflict } = require('../../lib/util');
const {
  StatoMezzo, StatoPrenotazione, TipoMezzo, PRENOTAZIONE_DURATA_MIN, PRENOTAZIONE_SOGLIA_ANOMALIA_MIN,
} = require('../../domain/enums');

// Verifica se l'utente ha una patente caricata (UT.07). Requisito per le auto.
function haPatente(idUtente) {
  return !!get(`SELECT 1 FROM Patente WHERE idUtente = ? LIMIT 1`, idUtente);
}

// UT.02 - Prenotare mezzo.
function crea({ idUtente, idMezzo }) {
  if (!idUtente || !idMezzo) throw badRequest('idUtente e idMezzo obbligatori');
  return tx(() => {
    const mezzo = get(`SELECT * FROM Mezzo WHERE idMezzo = ?`, idMezzo);
    if (!mezzo) throw notFound('Mezzo non trovato');
    // Le auto richiedono la patente caricata (UT.07): senza patente non si prenota.
    if (mezzo.tipoMezzo === TipoMezzo.AUTO && !haPatente(idUtente)) {
      throw badRequest('Per prenotare un\'auto devi prima inserire la patente nel tuo profilo.');
    }
    // verificaDisponibilita()
    if (mezzo.statOperativo !== StatoMezzo.DISPONIBILE) {
      throw conflict('Il mezzo non è disponibile per la prenotazione');
    }
    const inizio = new Date();
    const fine = new Date(inizio.getTime() + PRENOTAZIONE_DURATA_MIN * 60000);
    const id = genId('PRE');
    run(`INSERT INTO Prenotazione (idPrenotazione, dataInizio, oraInizio, dataFine, oraFine, statoPrenotazione, idUtente, idMezzo)
         VALUES (?,?,?,?,?,?,?,?)`,
      id, today(inizio), nowTime(inizio), today(fine), nowTime(fine), StatoPrenotazione.ATTIVA, idUtente, idMezzo);
    // aggiorna stato del mezzo
    run(`UPDATE Mezzo SET statOperativo = ? WHERE idMezzo = ?`, StatoMezzo.PRENOTATO, idMezzo);
    return getById(id);
  });
}

function getById(idPrenotazione) {
  const row = get(
    `SELECT pr.*, m.codiceMezzo, m.tipoMezzo
     FROM Prenotazione pr JOIN Mezzo m ON m.idMezzo = pr.idMezzo
     WHERE pr.idPrenotazione = ?`, idPrenotazione);
  return row || null;
}

// Annulla una prenotazione attiva e rilascia il mezzo.
function annulla(idPrenotazione) {
  return tx(() => {
    const pr = get(`SELECT * FROM Prenotazione WHERE idPrenotazione = ?`, idPrenotazione);
    if (!pr) throw notFound('Prenotazione non trovata');
    if (pr.statoPrenotazione !== StatoPrenotazione.ATTIVA) {
      throw conflict('La prenotazione non è attiva');
    }
    run(`UPDATE Prenotazione SET statoPrenotazione = ? WHERE idPrenotazione = ?`,
      StatoPrenotazione.ANNULLATA, idPrenotazione);
    run(`UPDATE Mezzo SET statOperativo = ? WHERE idMezzo = ?`, StatoMezzo.DISPONIBILE, pr.idMezzo);
    return getById(idPrenotazione);
  });
}

function prenotazioniUtente(idUtente) {
  return all(
    `SELECT pr.*, m.codiceMezzo, m.tipoMezzo
     FROM Prenotazione pr JOIN Mezzo m ON m.idMezzo = pr.idMezzo
     WHERE pr.idUtente = ? ORDER BY pr.dataInizio DESC, pr.oraInizio DESC`, idUtente);
}

// OP.11 - Controllare prenotazioni: elenca le prenotazioni attive evidenziando
// quelle prolungate oltre soglia (anomalia: mezzo bloccato senza avvio noleggio).
function listaAttiveConAnomalie() {
  const righe = all(
    `SELECT pr.*, m.codiceMezzo, m.tipoMezzo, u.nome, u.cognome
     FROM Prenotazione pr
     JOIN Mezzo m ON m.idMezzo = pr.idMezzo
     JOIN Utente u ON u.idUtente = pr.idUtente
     WHERE pr.statoPrenotazione = ?
     ORDER BY pr.dataInizio ASC, pr.oraInizio ASC`, StatoPrenotazione.ATTIVA);

  const oraCorrente = Date.now();
  return righe.map((pr) => {
    const inizioTs = new Date(`${pr.dataInizio}T${pr.oraInizio}`).getTime();
    const durataMin = Math.max(0, Math.round((oraCorrente - inizioTs) / 60000));
    return {
      ...pr,
      durataMinuti: durataMin,
      anomalia: durataMin > PRENOTAZIONE_SOGLIA_ANOMALIA_MIN,
      sogliaAnomaliaMin: PRENOTAZIONE_SOGLIA_ANOMALIA_MIN,
    };
  });
}

// UT.16 - Prenotazione multipla: prenota più mezzi dallo stesso account.
function creaMultipla({ idUtente, idMezzi }) {
  if (!idUtente || !Array.isArray(idMezzi) || idMezzi.length === 0) {
    throw badRequest('idUtente e idMezzi (array) obbligatori');
  }
  return idMezzi.map((idMezzo) => {
    try {
      return { idMezzo, ok: true, prenotazione: crea({ idUtente, idMezzo }) };
    } catch (e) {
      return { idMezzo, ok: false, errore: e.message };
    }
  });
}

module.exports = { crea, creaMultipla, getById, annulla, prenotazioniUtente, listaAttiveConAnomalie };
