// Componente: Gestione Manutenzione.
// Caso d'uso: OP.06 (gestire manutenzione mezzi) + visualizzaMezziDaManutenere.
const { all, get, run, tx } = require('../../persistence/db');
const { genId, today, badRequest, notFound } = require('../../lib/util');
const { StatoMezzo, StatoManutenzione } = require('../../domain/enums');

const SOGLIA_ENERGIA_BASSA = 15;

// visualizzaMezziDaManutenere(): mezzi fuori servizio/in manutenzione,
// con segnalazioni aperte o con livello di energia critico.
function mezziDaManutenere() {
  // Un mezzo è "da manutenere" se è fuori servizio, ha energia critica o ha
  // segnalazioni aperte, MA solo finché non esiste già un intervento aperto su
  // di esso: appena si apre l'intervento, il mezzo esce dalla lista (OP.06).
  const righe = all(`
    SELECT m.idMezzo, m.tipoMezzo, m.codiceMezzo, m.statOperativo, m.livelloEnergia,
           p.latitudine, p.longitudine,
           (SELECT COUNT(*) FROM SegnalazioneGuasto s WHERE s.idMezzo = m.idMezzo AND s.statoSegnalazione != 'chiusa') AS segnalazioniAperte
    FROM Mezzo m LEFT JOIN PosizioneGeografica p ON p.idPosizione = m.idPosizione
    WHERE (
            m.statOperativo = 'fuori_servizio'
         OR m.livelloEnergia < ${SOGLIA_ENERGIA_BASSA}
         OR EXISTS (SELECT 1 FROM SegnalazioneGuasto s WHERE s.idMezzo = m.idMezzo AND s.statoSegnalazione != 'chiusa')
          )
      AND NOT EXISTS (
            SELECT 1 FROM Manutenzione mn WHERE mn.idMezzo = m.idMezzo AND mn.statoManutenzione != 'chiusa'
          )
    ORDER BY m.livelloEnergia ASC`);
  return righe.map((m) => ({
    idMezzo: m.idMezzo,
    tipoMezzo: m.tipoMezzo,
    codiceMezzo: m.codiceMezzo,
    statOperativo: m.statOperativo,
    livelloEnergia: m.livelloEnergia,
    segnalazioniAperte: m.segnalazioniAperte,
    posizione: m.latitudine != null ? { lat: m.latitudine, lon: m.longitudine } : null,
    motivo: motivoManutenzione(m),
  }));
}

function motivoManutenzione(m) {
  if (m.segnalazioniAperte > 0) return 'Segnalazioni di guasto aperte';
  if (m.statOperativo === 'fuori_servizio') return 'Mezzo fuori servizio';
  if (m.statOperativo === 'in_manutenzione') return 'Intervento in corso';
  if (m.livelloEnergia < SOGLIA_ENERGIA_BASSA) return 'Energia critica';
  return 'Da verificare';
}

function listaInterventi(stato) {
  let sql = `SELECT mn.*, m.codiceMezzo, m.tipoMezzo
             FROM Manutenzione mn JOIN Mezzo m ON m.idMezzo = mn.idMezzo`;
  const params = [];
  if (stato) { sql += ' WHERE mn.statoManutenzione = ?'; params.push(stato); }
  sql += ' ORDER BY mn.dataApertura DESC';
  return all(sql, ...params);
}

// OP.06 - apre un intervento di manutenzione (registra o aggiorna) e mette il
// mezzo in manutenzione. Può derivare da una segnalazione (idSegnalazione).
function apriIntervento({ idMezzo, descrizione, idOperatore, idSegnalazione }) {
  if (!idMezzo) throw badRequest('idMezzo obbligatorio');
  const mezzo = get(`SELECT idMezzo FROM Mezzo WHERE idMezzo = ?`, idMezzo);
  if (!mezzo) throw notFound('Mezzo non trovato');
  return tx(() => {
    const id = genId('MAN');
    run(`INSERT INTO Manutenzione (idManutenzione, statoManutenzione, descrizione, dataApertura, idMezzo, idOperatore, idSegnalazione)
         VALUES (?,?,?,?,?,?,?)`,
      id, StatoManutenzione.APERTA, descrizione || null, today(), idMezzo,
      idOperatore || 'OP-demo', idSegnalazione || null);
    run(`UPDATE Mezzo SET statOperativo = ? WHERE idMezzo = ?`, StatoMezzo.IN_MANUTENZIONE, idMezzo);
    // Le segnalazioni aperte del mezzo passano "in gestione" (intervento avviato).
    run(`UPDATE SegnalazioneGuasto SET statoSegnalazione = 'in_gestione', idOperatore = COALESCE(idOperatore, ?)
         WHERE idMezzo = ? AND statoSegnalazione = 'aperta'`, idOperatore || 'OP-demo', idMezzo);
    return getIntervento(id);
  });
}

function aggiornaIntervento(id, { statoManutenzione, descrizione }) {
  const mn = get(`SELECT * FROM Manutenzione WHERE idManutenzione = ?`, id);
  if (!mn) throw notFound('Intervento non trovato');
  if (statoManutenzione && !Object.values(StatoManutenzione).includes(statoManutenzione)) {
    throw badRequest('Stato manutenzione non valido');
  }
  return tx(() => {
    const chiuso = statoManutenzione === StatoManutenzione.CHIUSA;
    run(`UPDATE Manutenzione SET statoManutenzione = COALESCE(?, statoManutenzione), descrizione = COALESCE(?, descrizione), dataChiusura = ? WHERE idManutenzione = ?`,
      statoManutenzione || null, descrizione || null, chiuso ? today() : mn.dataChiusura, id);
    // Alla chiusura, il mezzo torna disponibile e le sue segnalazioni si chiudono.
    if (chiuso) {
      run(`UPDATE Mezzo SET statOperativo = ? WHERE idMezzo = ?`, StatoMezzo.DISPONIBILE, mn.idMezzo);
      run(`UPDATE SegnalazioneGuasto SET statoSegnalazione = 'chiusa'
           WHERE idMezzo = ? AND statoSegnalazione != 'chiusa'`, mn.idMezzo);
    }
    return getIntervento(id);
  });
}

function getIntervento(id) {
  return get(
    `SELECT mn.*, m.codiceMezzo, m.tipoMezzo FROM Manutenzione mn JOIN Mezzo m ON m.idMezzo = mn.idMezzo WHERE mn.idManutenzione = ?`, id);
}

module.exports = { mezziDaManutenere, listaInterventi, apriIntervento, aggiornaIntervento, getIntervento };
