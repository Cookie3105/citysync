// Componente: Gestione Noleggi.
// Casi d'uso: UT.03 (stima costo), UT.13 (avvio), UT.15 (pausa/ripresa),
//             UT.04 (termine), UT.05 (riepilogo), UT.20 (storico).
const { all, get, run, tx } = require('../../persistence/db');
const {
  genId, today, nowTime, nowIso, badRequest, notFound, conflict,
} = require('../../lib/util');
const { StatoMezzo, StatoNoleggio, StatoPrenotazione, TipoMezzo, Tariffario } = require('../../domain/enums');
const { IServiziMezzo } = require('../../external/serviziMezzo');
const { IPaymentGateway } = require('../../external/paymentGateway');
const { IMapProvider } = require('../../external/mapProvider');
const aree = require('../aree/aree.service');
const mezziSvc = require('../mezzi/mezzi.service');
const pagamentiSvc = require('../pagamenti/pagamenti.service');

// Consumo energetico stimato per minuto, per tipo di mezzo (%).
const CONSUMO_MIN = { bici: 0.3, escooter: 0.5, auto: 0.2 };

// Verifica se l'utente ha una patente caricata (UT.07). Requisito per le auto.
function haPatente(idUtente) {
  return !!get(`SELECT 1 FROM Patente WHERE idUtente = ? LIMIT 1`, idUtente);
}

// --- UT.03: stima preventiva del costo ---------------------------------------
function stimaCosto({ idMezzo, destinazione, durataMin }) {
  const mezzo = mezziSvc.getById(idMezzo);
  if (!mezzo) throw notFound('Mezzo non trovato');
  const tar = Tariffario[mezzo.tipoMezzo];
  let minuti = durataMin ? Number(durataMin) : 15;
  let distanza = null;
  if (destinazione && mezzo.posizione) {
    const p = IMapProvider.stimaPercorso(
      { lat: mezzo.posizione.lat, lon: mezzo.posizione.lon },
      { lat: destinazione.lat, lon: destinazione.lon },
      mezzo.tipoMezzo
    );
    minuti = p.durataMin;
    distanza = p.distanzaMetri;
  }
  const costoMinuti = +(minuti * tar.alMinuto).toFixed(2);
  const totale = +(tar.sblocco + costoMinuti).toFixed(2);
  return {
    idMezzo,
    tipoMezzo: mezzo.tipoMezzo,
    tariffa: tar,
    durataStimataMin: minuti,
    distanzaStimataMetri: distanza,
    dettaglio: { sblocco: tar.sblocco, costoMinuti, alMinuto: tar.alMinuto },
    costoStimato: totale,
  };
}

// --- UT.13: avvio noleggio (con sblocco rapido) ------------------------------
async function avvia({ idUtente, idMezzo, idPrenotazione }) {
  if (!idUtente || !idMezzo) throw badRequest('idUtente e idMezzo obbligatori');

  const mezzo = get(`SELECT * FROM Mezzo WHERE idMezzo = ?`, idMezzo);
  if (!mezzo) throw notFound('Mezzo non trovato');

  // Le auto richiedono la patente caricata (UT.07): senza patente non si noleggia.
  if (mezzo.tipoMezzo === TipoMezzo.AUTO && !haPatente(idUtente)) {
    throw badRequest('Per noleggiare un\'auto devi prima inserire la patente nel tuo profilo.');
  }

  // Un utente può avere un solo noleggio attivo alla volta.
  const giaAttivo = get(
    `SELECT idNoleggio FROM Noleggio WHERE idUtente = ? AND statoNoleggio IN (?, ?) LIMIT 1`,
    idUtente, StatoNoleggio.IN_CORSO, StatoNoleggio.IN_PAUSA);
  if (giaAttivo) throw conflict('Hai già un noleggio in corso: concludilo prima di avviarne un altro');

  // Verifica: mezzo disponibile, oppure prenotato dallo stesso utente (scenario base).
  let prenotazioneAssociata = null;
  if (mezzo.statOperativo === StatoMezzo.PRENOTATO) {
    prenotazioneAssociata = get(
      `SELECT * FROM Prenotazione WHERE idMezzo = ? AND idUtente = ? AND statoPrenotazione = ?
       ORDER BY dataInizio DESC, oraInizio DESC LIMIT 1`,
      idMezzo, idUtente, StatoPrenotazione.ATTIVA
    );
    if (!prenotazioneAssociata) {
      // Scenario alternativo A1: mezzo non disponibile (prenotato da altri).
      throw conflict('Il mezzo è prenotato da un altro utente e non può essere noleggiato');
    }
  } else if (mezzo.statOperativo !== StatoMezzo.DISPONIBILE) {
    // Scenario alternativo A1: mezzo non disponibile.
    throw conflict('Il mezzo non è più disponibile: impossibile avviare il noleggio');
  }

  // Comando di sblocco rapido al dispositivo IoT (smart lock).
  const sblocco = await IServiziMezzo.sblocca(idMezzo);
  if (!sblocco.ok) throw conflict('Sblocco del mezzo non riuscito');

  const stima = stimaCosto({ idMezzo });

  const noleggio = tx(() => {
    const inizio = new Date();
    const id = genId('NOL');
    // Il segmento attivo parte dall'inizio; il tempo accumulato è 0 (UT.15).
    run(`INSERT INTO Noleggio (idNoleggio, dataInizio, oraInizio, statoNoleggio, idUtente, idMezzo, idPrenotazione, inizioTs, secondiAccumulati, ultimaRipresaTs)
         VALUES (?,?,?,?,?,?,?,?,?,?)`,
      id, today(inizio), nowTime(inizio), StatoNoleggio.IN_CORSO, idUtente, idMezzo,
      prenotazioneAssociata ? prenotazioneAssociata.idPrenotazione : null, nowIso(inizio), 0, nowIso(inizio));
    run(`UPDATE Mezzo SET statOperativo = ? WHERE idMezzo = ?`, StatoMezzo.IN_USO, idMezzo);
    if (prenotazioneAssociata) {
      run(`UPDATE Prenotazione SET statoPrenotazione = ? WHERE idPrenotazione = ?`,
        StatoPrenotazione.CONVERTITA, prenotazioneAssociata.idPrenotazione);
    }
    return getById(id);
  });

  return { ...noleggio, stima };
}

// Secondi di tempo *attivo* trascorsi (esclude i periodi di pausa).
function secondiAttivi(nol, riferimento = Date.now()) {
  const base = nol.secondiAccumulati || 0;
  if (nol.statoNoleggio === StatoNoleggio.IN_CORSO && nol.ultimaRipresaTs) {
    const delta = Math.floor((riferimento - new Date(nol.ultimaRipresaTs).getTime()) / 1000);
    return base + Math.max(0, delta);
  }
  return base;
}

// --- UT.15: pausa / ripresa --------------------------------------------------
async function mettiInPausa(idNoleggio) {
  const nol = getRaw(idNoleggio);
  if (!nol) throw notFound('Noleggio non trovato');
  if (nol.statoNoleggio !== StatoNoleggio.IN_CORSO) {
    throw conflict('Il noleggio non è in corso: impossibile metterlo in pausa');
  }
  await IServiziMezzo.blocca(nol.idMezzo);
  // Si "congela" il cronometro: il tempo del segmento attivo va in accumulato e
  // si azzera il riferimento, così durante la pausa il tempo non avanza più.
  const accumulato = secondiAttivi(nol);
  run(`UPDATE Noleggio SET statoNoleggio = ?, secondiAccumulati = ?, ultimaRipresaTs = NULL WHERE idNoleggio = ?`,
    StatoNoleggio.IN_PAUSA, accumulato, idNoleggio);
  return getById(idNoleggio);
}

async function riprendi(idNoleggio) {
  const nol = getRaw(idNoleggio);
  if (!nol) throw notFound('Noleggio non trovato');
  if (nol.statoNoleggio !== StatoNoleggio.IN_PAUSA) {
    throw conflict('Il noleggio non è in pausa');
  }
  await IServiziMezzo.sblocca(nol.idMezzo);
  // Riparte un nuovo segmento attivo da adesso.
  run(`UPDATE Noleggio SET statoNoleggio = ?, ultimaRipresaTs = ? WHERE idNoleggio = ?`,
    StatoNoleggio.IN_CORSO, nowIso(), idNoleggio);
  return getById(idNoleggio);
}

// --- UT.04: termine noleggio (+ OP.04 verifica parcheggio, UT.05 riepilogo) ---
async function termina(idNoleggio, { lat, lon, indirizzo } = {}) {
  const nol = getRaw(idNoleggio);
  if (!nol) throw notFound('Noleggio non trovato');
  if (![StatoNoleggio.IN_CORSO, StatoNoleggio.IN_PAUSA].includes(nol.statoNoleggio)) {
    throw conflict('Il noleggio non è attivo');
  }

  const fine = new Date();
  // Durata fatturabile = solo tempo attivo (le pause non si pagano, UT.15).
  const secAttivi = secondiAttivi(nol, fine.getTime());
  const durataMin = Math.max(1, Math.ceil(secAttivi / 60));

  const mezzo = get(`SELECT * FROM Mezzo WHERE idMezzo = ?`, nol.idMezzo);
  const tar = Tariffario[mezzo.tipoMezzo];
  const costoMinuti = +(durataMin * tar.alMinuto).toFixed(2);
  const costoFinale = +(tar.sblocco + costoMinuti).toFixed(2);

  // Posizione finale: se non fornita, si usa la posizione attuale del mezzo.
  let posFinale = { lat, lon };
  if (lat == null || lon == null) {
    const mezzoSer = mezziSvc.getById(nol.idMezzo);
    posFinale = mezzoSer.posizione ? { lat: mezzoSer.posizione.lat, lon: mezzoSer.posizione.lon } : { lat: null, lon: null };
  }
  // Verifica area consentita (UT.04 punto 3 / OP.04). Non bloccante: l'esito è
  // riportato nel riepilogo e usato dall'operatore (OP.04/OP.08).
  const parcheggio = (posFinale.lat != null)
    ? aree.verificaParcheggio(posFinale.lat, posFinale.lon)
    : { corretto: true, area: null, vincoloApplicato: false };

  tx(() => {
    // Si fissa il tempo attivo finale e si chiude il segmento corrente.
    run(`UPDATE Noleggio SET statoNoleggio = ?, dataFine = ?, oraFine = ?, fineTs = ?, costoFinale = ?, secondiAccumulati = ?, ultimaRipresaTs = NULL WHERE idNoleggio = ?`,
      StatoNoleggio.CONCLUSO, today(fine), nowTime(fine), nowIso(fine), costoFinale, secAttivi, idNoleggio);

    // Stato mezzo -> disponibile e aggiornamento posizione finale (OP.05).
    run(`UPDATE Mezzo SET statOperativo = ? WHERE idMezzo = ?`, StatoMezzo.DISPONIBILE, nol.idMezzo);
    if (posFinale.lat != null && mezzo.idPosizione) {
      run(`UPDATE PosizioneGeografica SET latitudine = ?, longitudine = ?, indirizzo = COALESCE(?, indirizzo) WHERE idPosizione = ?`,
        posFinale.lat, posFinale.lon, indirizzo || null, mezzo.idPosizione);
    }
    // Consumo energia.
    const consumo = Math.round(durataMin * (CONSUMO_MIN[mezzo.tipoMezzo] || 0.3));
    const nuovaEnergia = Math.max(0, mezzo.livelloEnergia - consumo);
    run(`UPDATE Mezzo SET livelloEnergia = ? WHERE idMezzo = ?`, nuovaEnergia, nol.idMezzo);
  });

  // Addebito tramite gateway (placeholder) e registrazione pagamento.
  await registraPagamento(nol.idUtente, idNoleggio, costoFinale);

  return riepilogo(idNoleggio);
}

// Crea il pagamento associato al noleggio (usa IPaymentGateway) e scala il saldo
// del portafoglio digitale, che è il borsellino prepagato con cui si pagano le
// corse (la ricarica avviene via carta/PayPal nel modulo Pagamenti, UT.19).
async function registraPagamento(idUtente, idNoleggio, importo) {
  const metodo = get(`SELECT * FROM MetodoPagamento WHERE idUtente = ? AND statoMetodo = 'attivo' LIMIT 1`, idUtente);
  const port = pagamentiSvc.getPortafoglio(idUtente); // crea il portafoglio se assente
  const esito = await IPaymentGateway.eseguiAddebito({ importo });
  const adesso = new Date();

  tx(() => {
    if (esito.ok) {
      // Addebito sul portafoglio (può andare a saldo negativo = importo dovuto).
      const nuovoSaldo = +(port.saldo - importo).toFixed(2);
      run(`UPDATE PortafoglioDigitale SET saldo = ? WHERE idUtente = ?`, nuovoSaldo, idUtente);
    }
    run(`INSERT INTO Pagamento (idPagamento, importo, dataPagamento, oraPagamento, statoPagamento, tipoPagamento, idUtente, idMetodo, idNoleggio)
         VALUES (?,?,?,?,?,?,?,?,?)`,
      genId('PAG'), importo, today(adesso), nowTime(adesso),
      esito.ok ? 'completato' : 'rifiutato',
      'portafoglio',
      idUtente, metodo ? metodo.idMetodo : null, idNoleggio);
  });
}

// --- UT.05: riepilogo del noleggio -------------------------------------------
function riepilogo(idNoleggio) {
  const nol = get(
    `SELECT n.*, m.tipoMezzo, m.codiceMezzo, m.livelloEnergia
     FROM Noleggio n JOIN Mezzo m ON m.idMezzo = n.idMezzo
     WHERE n.idNoleggio = ?`, idNoleggio);
  if (!nol) throw notFound('Noleggio non trovato');

  const tar = Tariffario[nol.tipoMezzo];
  // Durata = tempo attivo (le pause sono escluse anche nel riepilogo).
  const durataMin = Math.max(1, Math.ceil(secondiAttivi(nol) / 60));
  const pagamento = get(`SELECT * FROM Pagamento WHERE idNoleggio = ? ORDER BY rowid DESC LIMIT 1`, idNoleggio);
  const mezzoPos = mezziSvc.getById(nol.idMezzo).posizione;

  return {
    idNoleggio: nol.idNoleggio,
    statoNoleggio: nol.statoNoleggio,
    idMezzo: nol.idMezzo,
    tipoMezzo: nol.tipoMezzo,
    codiceMezzo: nol.codiceMezzo,
    inizio: nol.inizioTs,
    fine: nol.fineTs,
    durataMinuti: durataMin,
    tariffa: tar,
    dettaglioCosto: {
      sblocco: tar.sblocco,
      costoMinuti: +(durataMin * tar.alMinuto).toFixed(2),
      alMinuto: tar.alMinuto,
    },
    costoFinale: nol.costoFinale,
    pagamento: pagamento
      ? { idPagamento: pagamento.idPagamento, importo: pagamento.importo, stato: pagamento.statoPagamento, tipo: pagamento.tipoPagamento }
      : null,
    posizioneFinaleMezzo: mezzoPos,
  };
}

// --- UT.20: storico noleggi (recuperaNoleggiUtente) --------------------------
function storicoUtente(idUtente) {
  const righe = all(
    `SELECT n.*, m.tipoMezzo, m.codiceMezzo
     FROM Noleggio n JOIN Mezzo m ON m.idMezzo = n.idMezzo
     WHERE n.idUtente = ?
     ORDER BY COALESCE(n.fineTs, n.inizioTs) DESC`, idUtente);
  return righe.map((n) => ({
    idNoleggio: n.idNoleggio,
    statoNoleggio: n.statoNoleggio,
    tipoMezzo: n.tipoMezzo,
    codiceMezzo: n.codiceMezzo,
    dataInizio: n.dataInizio,
    oraInizio: n.oraInizio,
    dataFine: n.dataFine,
    oraFine: n.oraFine,
    costoFinale: n.costoFinale,
  }));
}

// Noleggio attivo (in corso o in pausa) dell'utente, se presente.
function noleggioAttivo(idUtente) {
  const n = get(
    `SELECT idNoleggio FROM Noleggio WHERE idUtente = ? AND statoNoleggio IN (?, ?)
     ORDER BY inizioTs DESC LIMIT 1`, idUtente, StatoNoleggio.IN_CORSO, StatoNoleggio.IN_PAUSA);
  return n ? getById(n.idNoleggio) : null;
}

function getRaw(idNoleggio) {
  return get(`SELECT * FROM Noleggio WHERE idNoleggio = ?`, idNoleggio);
}

function getById(idNoleggio) {
  const n = get(
    `SELECT n.*, m.tipoMezzo, m.codiceMezzo, m.livelloEnergia
     FROM Noleggio n JOIN Mezzo m ON m.idMezzo = n.idMezzo WHERE n.idNoleggio = ?`, idNoleggio);
  if (!n) return null;
  const secAttivi = secondiAttivi(n);
  return {
    idNoleggio: n.idNoleggio,
    statoNoleggio: n.statoNoleggio,
    idMezzo: n.idMezzo,
    tipoMezzo: n.tipoMezzo,
    codiceMezzo: n.codiceMezzo,
    livelloEnergia: n.livelloEnergia,
    idUtente: n.idUtente,
    idPrenotazione: n.idPrenotazione,
    inizio: n.inizioTs,
    fine: n.fineTs,
    durataMinuti: Math.max(0, Math.round(secAttivi / 60)),
    // Campi per il cronometro "dal vivo" lato client (UT.15): il client somma
    // secondiAccumulati + (now - ultimaRipresaTs) solo se in corso.
    secondiAccumulati: n.secondiAccumulati || 0,
    ultimaRipresaTs: n.ultimaRipresaTs || null,
    costoFinale: n.costoFinale,
    tariffa: Tariffario[n.tipoMezzo],
  };
}

module.exports = {
  stimaCosto, avvia, mettiInPausa, riprendi, termina,
  riepilogo, storicoUtente, noleggioAttivo, getById,
};
