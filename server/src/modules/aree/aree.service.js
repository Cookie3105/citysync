// Componente: Gestione Aree e Percorsi.
// Fornisce la verifica del parcheggio (area consentita) usata da UT.04 e OP.04,
// e la lettura delle aree per la mappa. Aree modellate come cerchi (centro+raggio).
const { all, get, run, tx } = require('../../persistence/db');
const { genId, distanzaMetri, badRequest, notFound } = require('../../lib/util');

const SELECT_AREA = `
  SELECT a.*, p.latitudine, p.longitudine, p.indirizzo
  FROM AreaLimitata a LEFT JOIN PosizioneGeografica p ON p.idPosizione = a.idPosizione
  WHERE a.statoArea = 'attiva'`;

function serializza(row) {
  return {
    idArea: row.idArea,
    nomeArea: row.nomeArea,
    tipoLimitazione: row.tipoLimitazione,
    descrizione: row.descrizione,
    statoArea: row.statoArea,
    raggioMetri: row.raggioMetri,
    centro: row.latitudine != null ? { lat: row.latitudine, lon: row.longitudine } : null,
  };
}

function listaAree() {
  return all(SELECT_AREA).map(serializza);
}

function areeConsentiteParcheggio() {
  return all(`${SELECT_AREA} AND a.tipoLimitazione = 'consentita_parcheggio'`).map(serializza);
}

// verificaParcheggioCorretto: la posizione rientra in almeno un'area consentita?
// Se nel sistema non esistono aree di parcheggio consentite, non si applica vincolo.
function verificaParcheggio(lat, lon) {
  const aree = areeConsentiteParcheggio();
  if (aree.length === 0) return { corretto: true, area: null, vincoloApplicato: false };
  for (const a of aree) {
    if (!a.centro) continue;
    const d = distanzaMetri(lat, lon, a.centro.lat, a.centro.lon);
    if (d <= (a.raggioMetri || 200)) {
      return { corretto: true, area: a, distanzaMetri: d, vincoloApplicato: true };
    }
  }
  return { corretto: false, area: null, vincoloApplicato: true };
}

// Stazioni di ricarica (per mappa / percorsi).
function listaStazioni() {
  return all(
    `SELECT s.*, p.latitudine, p.longitudine, p.indirizzo
     FROM StazioneRicarica s LEFT JOIN PosizioneGeografica p ON p.idPosizione = s.idPosizione`
  ).map((r) => ({
    idStazione: r.idStazione,
    disponibilita: r.disponibilita,
    tipoConnettore: r.tipoConnettore,
    posizione: r.latitudine != null ? { lat: r.latitudine, lon: r.longitudine, indirizzo: r.indirizzo } : null,
  }));
}

// Inserisce una PosizioneGeografica e ne restituisce l'id.
function insertPosizione({ lat, lon, indirizzo }) {
  const id = genId('POS');
  run(`INSERT INTO PosizioneGeografica (idPosizione, latitudine, longitudine, indirizzo, comune, provincia, nazione, ISOnazione)
       VALUES (?,?,?,?,?,?,?,?)`, id, lat, lon, indirizzo || null, 'Bari', 'BA', 'Italia', 'IT');
  return id;
}

// AP06 - Definire zona limitata. Scenario A1: zona non valida.
function creaAreaLimitata({ nomeArea, tipoLimitazione, descrizione, posizione, raggioMetri, idAmministrazione }) {
  if (!nomeArea) throw badRequest('nomeArea obbligatorio');
  if (!posizione || posizione.lat == null || posizione.lon == null) throw badRequest('Zona non valida: posizione mancante');
  const tipo = tipoLimitazione || 'vietata';
  return tx(() => {
    const idPos = insertPosizione(posizione);
    const id = genId('ARE');
    run(`INSERT INTO AreaLimitata (idArea, nomeArea, tipoLimitazione, descrizione, statoArea, idAmministrazione, idPosizione, raggioMetri)
         VALUES (?,?,?,?,?,?,?,?)`,
      id, nomeArea, tipo, descrizione || null, 'attiva', idAmministrazione || 'AM-demo', idPos, raggioMetri || 200);
    const row = get(
      `SELECT a.*, p.latitudine, p.longitudine, p.indirizzo
       FROM AreaLimitata a LEFT JOIN PosizioneGeografica p ON p.idPosizione = a.idPosizione
       WHERE a.idArea = ?`, id);
    return serializza(row);
  });
}

// AP06 - Elimina una zona limitata (e la sua posizione associata).
function eliminaAreaLimitata(idArea) {
  const area = get(`SELECT idArea, idPosizione FROM AreaLimitata WHERE idArea = ?`, idArea);
  if (!area) throw notFound('Area non trovata');
  return tx(() => {
    run(`DELETE FROM Percorso_AreaLimitata WHERE idArea = ?`, idArea);
    run(`DELETE FROM AreaLimitata WHERE idArea = ?`, idArea);
    if (area.idPosizione) run(`DELETE FROM PosizioneGeografica WHERE idPosizione = ?`, area.idPosizione);
    return { eliminato: true, idArea };
  });
}

// Lettura zone critiche (cantieri/criticità urbane) per la mappa.
function listaZoneCritiche() {
  return all(
    `SELECT z.*, p.latitudine, p.longitudine, p.indirizzo
     FROM ZonaCritica z LEFT JOIN PosizioneGeografica p ON p.idPosizione = z.idPosizione
     ORDER BY z.dataInizio DESC`
  ).map((z) => ({
    idZonaCritica: z.idZonaCritica,
    tipoCriticita: z.tipoCriticita,
    descrizione: z.descrizione,
    dataInizio: z.dataInizio,
    dataFine: z.dataFine,
    centro: z.latitudine != null ? { lat: z.latitudine, lon: z.longitudine } : null,
  }));
}

// AP04 - Segnalare criticità urbane (cantieri, manutenzioni…).
function creaZonaCritica({ tipoCriticita, descrizione, dataInizio, dataFine, posizione, idAmministrazione }) {
  if (!tipoCriticita) throw badRequest('tipoCriticita obbligatorio');
  if (!posizione || posizione.lat == null || posizione.lon == null) throw badRequest('Posizione della criticità mancante');
  return tx(() => {
    const idPos = insertPosizione(posizione);
    const id = genId('ZON');
    run(`INSERT INTO ZonaCritica (idZonaCritica, tipoCriticita, descrizione, dataInizio, dataFine, idPosizione, idAmministrazione)
         VALUES (?,?,?,?,?,?,?)`,
      id, tipoCriticita, descrizione || null, dataInizio || null, dataFine || null, idPos, idAmministrazione || 'AM-demo');
    return get(`SELECT * FROM ZonaCritica WHERE idZonaCritica = ?`, id);
  });
}

// AP04 - Elimina una criticità urbana (e la sua posizione associata).
function eliminaZonaCritica(idZonaCritica) {
  const zona = get(`SELECT idZonaCritica, idPosizione FROM ZonaCritica WHERE idZonaCritica = ?`, idZonaCritica);
  if (!zona) throw notFound('Criticità non trovata');
  return tx(() => {
    run(`DELETE FROM Percorso_ZonaCritica WHERE idZonaCritica = ?`, idZonaCritica);
    run(`DELETE FROM ZonaCritica WHERE idZonaCritica = ?`, idZonaCritica);
    if (zona.idPosizione) run(`DELETE FROM PosizioneGeografica WHERE idPosizione = ?`, zona.idPosizione);
    return { eliminato: true, idZonaCritica };
  });
}

module.exports = {
  listaAree, areeConsentiteParcheggio, verificaParcheggio, listaStazioni,
  creaAreaLimitata, eliminaAreaLimitata, listaZoneCritiche, creaZonaCritica, eliminaZonaCritica,
};
