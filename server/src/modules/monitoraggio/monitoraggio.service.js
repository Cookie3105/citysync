// Componente: Monitoraggio e Controllo.
// Casi d'uso: OP.01 (monitorare flotta), OP.04 (verificare parcheggio),
//             OP.05 (posizione fine noleggio), OP.10 (blocco remoto),
//             OP.12 (monitorare batteria flotta).
const { all, get, run } = require('../../persistence/db');
const { notFound, conflict, badRequest } = require('../../lib/util');
const { StatoMezzo } = require('../../domain/enums');
const { IServiziMezzo } = require('../../external/serviziMezzo');
const aree = require('../aree/aree.service');
const mezziSvc = require('../mezzi/mezzi.service');

const SOGLIA_ENERGIA_BASSA = 20;

// OP.01 - Monitorare flotta: distribuzione e stato dei mezzi sul territorio.
function flotta() {
  const mezzi = mezziSvc.listaTutti();
  const perStato = {};
  const perTipo = {};
  for (const m of mezzi) {
    perStato[m.statOperativo] = (perStato[m.statOperativo] || 0) + 1;
    perTipo[m.tipoMezzo] = (perTipo[m.tipoMezzo] || 0) + 1;
  }
  return { totale: mezzi.length, perStato, perTipo, mezzi };
}

// OP.12 - Monitorare livelli di batteria della flotta elettrica.
function livelliBatteria() {
  const mezzi = mezziSvc.listaTutti();
  const conLivello = mezzi
    .map((m) => ({
      idMezzo: m.idMezzo,
      codiceMezzo: m.codiceMezzo,
      tipoMezzo: m.tipoMezzo,
      statOperativo: m.statOperativo,
      livelloEnergia: m.livelloEnergia,
      critico: m.livelloEnergia < SOGLIA_ENERGIA_BASSA,
      posizione: m.posizione,
    }))
    .sort((a, b) => a.livelloEnergia - b.livelloEnergia);
  return {
    sogliaCritica: SOGLIA_ENERGIA_BASSA,
    critici: conLivello.filter((m) => m.critico).length,
    mezzi: conLivello,
  };
}

// OP.04 - Verificare parcheggio dei mezzi (confronto con aree consentite).
function verificaParcheggioFlotta() {
  const mezzi = mezziSvc.listaTutti();
  return mezzi.map((m) => {
    if (!m.posizione) {
      // Scenario alternativo A1: posizione non disponibile.
      return { idMezzo: m.idMezzo, codiceMezzo: m.codiceMezzo, posizioneDisponibile: false, corretto: null };
    }
    const esito = aree.verificaParcheggio(m.posizione.lat, m.posizione.lon);
    return {
      idMezzo: m.idMezzo,
      codiceMezzo: m.codiceMezzo,
      tipoMezzo: m.tipoMezzo,
      statOperativo: m.statOperativo,
      posizioneDisponibile: true,
      posizione: m.posizione,
      corretto: esito.corretto,
      area: esito.area ? esito.area.nomeArea : null,
    };
  });
}

// OP.05 - Posizione del mezzo al termine di ogni noleggio.
function posizioniFineNoleggio() {
  const righe = all(`
    SELECT n.idNoleggio, n.dataFine, n.oraFine, n.idMezzo, m.codiceMezzo, m.tipoMezzo,
           p.latitudine, p.longitudine, p.indirizzo
    FROM Noleggio n
    JOIN Mezzo m ON m.idMezzo = n.idMezzo
    LEFT JOIN PosizioneGeografica p ON p.idPosizione = m.idPosizione
    WHERE n.statoNoleggio = 'concluso'
    ORDER BY n.fineTs DESC`);
  return righe.map((r) => ({
    idNoleggio: r.idNoleggio,
    idMezzo: r.idMezzo,
    codiceMezzo: r.codiceMezzo,
    tipoMezzo: r.tipoMezzo,
    dataFine: r.dataFine,
    oraFine: r.oraFine,
    posizioneFinale: r.latitudine != null ? { lat: r.latitudine, lon: r.longitudine, indirizzo: r.indirizzo } : null,
  }));
}

// OP.10 - Bloccare mezzo da remoto (include Aggiornare stato mezzo OP.13).
// Se il mezzo è in uso e si richiede il blocco forzato, la corsa attiva viene
// prima conclusa (con relativo addebito) e poi il mezzo viene bloccato.
async function bloccaRemoto(idMezzo, { forza = false } = {}) {
  const mezzo = get(`SELECT * FROM Mezzo WHERE idMezzo = ?`, idMezzo);
  if (!mezzo) throw notFound('Mezzo non trovato');

  if (mezzo.statOperativo === StatoMezzo.IN_USO) {
    if (!forza) {
      throw conflict('Il mezzo è in uso: usa il blocco forzato per interrompere la corsa');
    }
    // Blocco forzato: termina la corsa attiva del mezzo (OP.10 scenario forzato).
    const noleggiSvc = require('../noleggi/noleggi.service');
    const attivo = get(
      `SELECT idNoleggio FROM Noleggio WHERE idMezzo = ? AND statoNoleggio IN ('in_corso','in_pausa') ORDER BY inizioTs DESC LIMIT 1`,
      idMezzo);
    if (attivo) await noleggiSvc.termina(attivo.idNoleggio, {});
  }

  // Comando di blocco al dispositivo IoT (scenario A2: blocco non riuscito).
  const esito = await IServiziMezzo.blocca(idMezzo);
  if (!esito.ok) throw conflict('Blocco remoto non riuscito');
  run(`UPDATE Mezzo SET statOperativo = ? WHERE idMezzo = ?`, StatoMezzo.BLOCCATO, idMezzo);
  return mezziSvc.getById(idMezzo);
}

// OP.08 - noleggi conclusi con parcheggio corretto, idonei all'assegnazione del bonus.
function noleggiBonusEligibili() {
  const righe = all(`
    SELECT n.idNoleggio, n.idUtente, n.dataFine, n.oraFine, m.codiceMezzo, m.tipoMezzo,
           u.nome, u.cognome, p.latitudine, p.longitudine,
           (SELECT COUNT(*) FROM Incentivo i WHERE i.idUtente = n.idUtente AND i.tipoIncentivo = 'bonus_parcheggio') AS bonusUtente
    FROM Noleggio n
    JOIN Mezzo m ON m.idMezzo = n.idMezzo
    JOIN Utente u ON u.idUtente = n.idUtente
    LEFT JOIN PosizioneGeografica p ON p.idPosizione = m.idPosizione
    WHERE n.statoNoleggio = 'concluso'
    ORDER BY n.fineTs DESC`);
  return righe
    .map((r) => {
      const esito = r.latitudine != null ? aree.verificaParcheggio(r.latitudine, r.longitudine) : { corretto: null };
      return {
        idNoleggio: r.idNoleggio, idUtente: r.idUtente, codiceMezzo: r.codiceMezzo, tipoMezzo: r.tipoMezzo,
        nome: r.nome, cognome: r.cognome, dataFine: r.dataFine, oraFine: r.oraFine,
        parcheggioCorretto: esito.corretto, bonusGiaAssegnati: r.bonusUtente,
      };
    })
    .filter((r) => r.parcheggioCorretto === true);
}

module.exports = {
  flotta, livelliBatteria, verificaParcheggioFlotta, posizioniFineNoleggio,
  bloccaRemoto, noleggiBonusEligibili,
};
