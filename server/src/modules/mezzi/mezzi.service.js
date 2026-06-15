// Componente: Gestione Mezzi.
// Casi d'uso: UT.01 (visualizzare mezzi), UT.06 (caratteristiche), UT.12 (energia),
//             OP.14 (registrare mezzo), OP.13 (aggiornare stato mezzo).
const { all, get, run, tx } = require('../../persistence/db');
const { genId, badRequest, notFound, distanzaMetri } = require('../../lib/util');
const { StatoMezzo, TipoMezzo, Tariffario } = require('../../domain/enums');

// Serializza una riga Mezzo (join con la posizione) nel formato esposto via API.
function serializza(row) {
  if (!row) return null;
  let caratteristiche = {};
  try { caratteristiche = row.caratteristicheTecniche ? JSON.parse(row.caratteristicheTecniche) : {}; } catch { /* */ }
  return {
    idMezzo: row.idMezzo,
    tipoMezzo: row.tipoMezzo,
    codiceMezzo: row.codiceMezzo,
    statOperativo: row.statOperativo,
    livelloEnergia: row.livelloEnergia,
    caratteristicheTecniche: caratteristiche,
    posizione: row.idPosizione
      ? { idPosizione: row.idPosizione, lat: row.latitudine, lon: row.longitudine, indirizzo: row.indirizzo }
      : null,
    tariffa: Tariffario[row.tipoMezzo] || null,
  };
}

const SELECT_MEZZO = `
  SELECT m.*, p.latitudine, p.longitudine, p.indirizzo
  FROM Mezzo m LEFT JOIN PosizioneGeografica p ON p.idPosizione = m.idPosizione`;

function getById(idMezzo) {
  return serializza(get(`${SELECT_MEZZO} WHERE m.idMezzo = ?`, idMezzo));
}

function getRawById(idMezzo) {
  return get(`SELECT * FROM Mezzo WHERE idMezzo = ?`, idMezzo);
}

// UT.01 - Visualizzare mezzi disponibili (eventualmente filtrati per vicinanza).
function listaDisponibili({ lat, lon, raggioMetri, tipoMezzo, soloDisponibili = true } = {}) {
  let sql = SELECT_MEZZO;
  const where = [];
  const params = [];
  if (soloDisponibili) where.push(`m.statOperativo = '${StatoMezzo.DISPONIBILE}'`);
  if (tipoMezzo) { where.push('m.tipoMezzo = ?'); params.push(tipoMezzo); }
  if (where.length) sql += ' WHERE ' + where.join(' AND ');
  let mezzi = all(sql, ...params).map(serializza);

  if (lat != null && lon != null) {
    mezzi = mezzi
      .map((m) => ({
        ...m,
        distanzaMetri: m.posizione ? distanzaMetri(lat, lon, m.posizione.lat, m.posizione.lon) : null,
      }))
      .filter((m) => raggioMetri == null || m.distanzaMetri == null || m.distanzaMetri <= raggioMetri)
      .sort((a, b) => (a.distanzaMetri ?? 1e12) - (b.distanzaMetri ?? 1e12));
  }
  return mezzi;
}

// Tutti i mezzi (per operatore / monitoraggio).
function listaTutti() {
  return all(SELECT_MEZZO).map(serializza);
}

// OP.14 - Registrare nuovo mezzo.
function registra({ tipoMezzo, codiceMezzo, livelloEnergia, caratteristicheTecniche, posizione }) {
  if (!Object.values(TipoMezzo).includes(tipoMezzo)) {
    throw badRequest(`tipoMezzo non valido (ammessi: ${Object.values(TipoMezzo).join(', ')})`);
  }
  if (!codiceMezzo) throw badRequest('codiceMezzo obbligatorio');
  const esiste = get(`SELECT idMezzo FROM Mezzo WHERE codiceMezzo = ?`, codiceMezzo);
  if (esiste) throw badRequest(`codiceMezzo "${codiceMezzo}" già presente nel sistema`);

  return tx(() => {
    let idPosizione = null;
    if (posizione && posizione.lat != null && posizione.lon != null) {
      idPosizione = genId('POS');
      run(`INSERT INTO PosizioneGeografica (idPosizione, latitudine, longitudine, indirizzo, comune, provincia, nazione, ISOnazione)
           VALUES (?,?,?,?,?,?,?,?)`,
        idPosizione, posizione.lat, posizione.lon, posizione.indirizzo || null,
        posizione.comune || null, posizione.provincia || null, posizione.nazione || 'Italia', posizione.ISOnazione || 'IT');
    }
    const idMezzo = genId('MZ');
    run(`INSERT INTO Mezzo (idMezzo, tipoMezzo, statOperativo, codiceMezzo, livelloEnergia, caratteristicheTecniche, idPosizione)
         VALUES (?,?,?,?,?,?,?)`,
      idMezzo, tipoMezzo, StatoMezzo.DISPONIBILE, codiceMezzo,
      livelloEnergia ?? 100,
      caratteristicheTecniche ? JSON.stringify(caratteristicheTecniche) : null,
      idPosizione);
    return getById(idMezzo);
  });
}

// OP.13 - Aggiornare stato operativo del mezzo.
function aggiornaStato(idMezzo, nuovoStato) {
  if (!Object.values(StatoMezzo).includes(nuovoStato)) {
    throw badRequest(`stato non valido (ammessi: ${Object.values(StatoMezzo).join(', ')})`);
  }
  const mezzo = getRawById(idMezzo);
  if (!mezzo) throw notFound('Mezzo non trovato');
  run(`UPDATE Mezzo SET statOperativo = ? WHERE idMezzo = ?`, nuovoStato, idMezzo);
  return getById(idMezzo);
}

// Aggiorna la posizione corrente del mezzo (telemetria IoT / fine noleggio).
function aggiornaPosizione(idMezzo, { lat, lon, indirizzo }) {
  const mezzo = getRawById(idMezzo);
  if (!mezzo) throw notFound('Mezzo non trovato');
  if (mezzo.idPosizione) {
    run(`UPDATE PosizioneGeografica SET latitudine = ?, longitudine = ?, indirizzo = COALESCE(?, indirizzo) WHERE idPosizione = ?`,
      lat, lon, indirizzo || null, mezzo.idPosizione);
  } else {
    const idPos = genId('POS');
    run(`INSERT INTO PosizioneGeografica (idPosizione, latitudine, longitudine, indirizzo, comune, provincia, nazione, ISOnazione)
         VALUES (?,?,?,?,?,?,?,?)`, idPos, lat, lon, indirizzo || null, 'Bari', 'BA', 'Italia', 'IT');
    run(`UPDATE Mezzo SET idPosizione = ? WHERE idMezzo = ?`, idPos, idMezzo);
  }
  return getById(idMezzo);
}

module.exports = {
  serializza,
  getById,
  getRawById,
  listaDisponibili,
  listaTutti,
  registra,
  aggiornaStato,
  aggiornaPosizione,
};
