// Popolamento del database con dati dimostrativi (flotta, attori, aree).
// Uso:  npm run seed         -> popola se vuoto
//       npm run reset        -> svuota e ripopola
const { db, initSchema, get, run, DB_PATH } = require('./db');
const { genId } = require('../lib/util');

const RESET = process.argv.includes('--reset');

// Centro di riferimento: Bari (IT). I mezzi sono distribuiti nei dintorni.
const CENTRO = { lat: 41.1187, lon: 16.8719 };

function jitter(base, meters) {
  // ~ converte metri in gradi (approssimazione locale).
  const dLat = (Math.random() - 0.5) * (meters / 111320) * 2;
  const dLon = (Math.random() - 0.5) * (meters / (111320 * Math.cos((base.lat * Math.PI) / 180))) * 2;
  return { lat: base.lat + dLat, lon: base.lon + dLon };
}

function insertPosizione({ lat, lon, indirizzo }) {
  const id = genId('POS');
  run(
    `INSERT INTO PosizioneGeografica (idPosizione, latitudine, longitudine, indirizzo, comune, provincia, nazione, ISOnazione)
     VALUES (?,?,?,?,?,?,?,?)`,
    id, lat, lon, indirizzo || null, 'Bari', 'BA', 'Italia', 'IT'
  );
  return id;
}

function resetAll() {
  const tables = [
    'Messaggio', 'Percorso_StazioneRicarica', 'Percorso_ZonaCritica', 'Percorso_AreaLimitata',
    'Report', 'Manutenzione', 'SegnalazioneGuasto', 'RichiestAssistenza', 'Incentivo',
    'Pagamento', 'Noleggio', 'Prenotazione', 'StazioneRicarica', 'ZonaCritica', 'AreaLimitata',
    'Percorso', 'Mezzo', 'PortafoglioDigitale', 'MetodoPagamento', 'Patente',
    'PosizioneGeografica', 'AmministrazioneComunale', 'Operatore', 'Utente',
  ];
  db.exec('PRAGMA foreign_keys = OFF;');
  for (const t of tables) db.exec(`DELETE FROM ${t};`);
  db.exec('PRAGMA foreign_keys = ON;');
}

function seed() {
  initSchema();

  const giaPopolato = get(`SELECT idUtente FROM Utente WHERE idUtente = 'UT-demo'`);
  if (giaPopolato && !RESET) {
    console.log('DB già popolato. Usa "npm run reset" per ripopolare.');
    return;
  }
  if (RESET) resetAll();

  // --- Attori -----------------------------------------------------------------
  run(`INSERT INTO Utente (idUtente, nome, cognome, email, telefono, password, statoAccount)
       VALUES (?,?,?,?,?,?,?)`,
    'UT-demo', 'Mario', 'Rossi', 'mario.rossi@example.com', '+39 333 1234567', 'password', 'attivo');

  run(`INSERT INTO PortafoglioDigitale (idPortafoglio, saldo, idUtente) VALUES (?,?,?)`,
    genId('PRT'), 25.0, 'UT-demo');

  run(`INSERT INTO MetodoPagamento (idMetodo, tipoMetodo, intestatario, scadenza, statoMetodo, idUtente)
       VALUES (?,?,?,?,?,?)`,
    genId('MET'), 'carta', 'Mario Rossi', '12/27', 'attivo', 'UT-demo');

  run(`INSERT INTO Operatore (idOperatore, ragioneSociale, partitaIVA, codiceFiscale, personaFisica, email, password, codiceSDI)
       VALUES (?,?,?,?,?,?,?,?)`,
    'OP-demo', 'Bit & Polpette S.r.l.', '01234567890', '01234567890', 'Luca Bianchi',
    'operatore@citysync.it', 'password', 'ABCDEFG');

  run(`INSERT INTO AmministrazioneComunale (idAmministrazione, nomeComune, email, password)
       VALUES (?,?,?,?)`,
    'AM-demo', 'Comune di Bari', 'admin@comune.bari.it', 'password');

  // --- Aree -------------------------------------------------------------------
  const posAreaParcheggio = insertPosizione({ ...CENTRO, indirizzo: 'Centro città' });
  run(`INSERT INTO AreaLimitata (idArea, nomeArea, tipoLimitazione, descrizione, statoArea, idAmministrazione, idPosizione, raggioMetri)
       VALUES (?,?,?,?,?,?,?,?)`,
    genId('ARE'), 'Area parcheggio Centro', 'consentita_parcheggio',
    'Area consentita per il termine del noleggio', 'attiva', 'AM-demo', posAreaParcheggio, 1800);

  const posZtl = insertPosizione({ lat: 41.1255, lon: 16.8702, indirizzo: 'Quartiere Murat' });
  run(`INSERT INTO AreaLimitata (idArea, nomeArea, tipoLimitazione, descrizione, statoArea, idAmministrazione, idPosizione, raggioMetri)
       VALUES (?,?,?,?,?,?,?,?)`,
    genId('ARE'), 'ZTL Murat', 'vietata', 'Zona a traffico limitato', 'attiva', 'AM-demo', posZtl, 250);

  const posStazione = insertPosizione({ lat: 41.1205, lon: 16.8690, indirizzo: 'Stazione ricarica Centro' });
  run(`INSERT INTO StazioneRicarica (idStazione, disponibilita, tipoConnettore, idPosizione)
       VALUES (?,?,?,?)`,
    genId('STZ'), 'disponibile', 'Type2', posStazione);

  // --- Incentivi e criticità urbane (Amministrazione Comunale) ----------------
  run(`INSERT INTO Incentivo (idIncentivo, tipoIncentivo, valore, statoIncentivo, descrizione, idAmministrazione)
       VALUES (?,?,?,?,?,?)`,
    genId('INC'), 'bonus_parcheggio', 0.5, 'attivo',
    'Bonus per il parcheggio nelle aree consentite a fine corsa', 'AM-demo');

  const posCantiere = insertPosizione({ lat: 41.1240, lon: 16.8680, indirizzo: 'Via Sparano' });
  run(`INSERT INTO ZonaCritica (idZonaCritica, tipoCriticita, descrizione, dataInizio, dataFine, idPosizione, idAmministrazione)
       VALUES (?,?,?,?,?,?,?)`,
    genId('ZON'), 'cantiere', 'Lavori stradali in corso', new Date().toISOString().slice(0, 10), null, posCantiere, 'AM-demo');

  // --- Flotta -----------------------------------------------------------------
  const flotta = [
    { tipo: 'bici', codice: 'BK-001', energia: 92, car: { marca: 'CitySync e-Bike', velocitaMax: 25, autonomiaKm: 60, peso: 22, cambio: 'automatico' } },
    { tipo: 'bici', codice: 'BK-002', energia: 64, car: { marca: 'CitySync e-Bike', velocitaMax: 25, autonomiaKm: 60, peso: 22, cambio: 'automatico' } },
    { tipo: 'escooter', codice: 'ES-001', energia: 78, car: { marca: 'CitySync Scoot', velocitaMax: 20, autonomiaKm: 35, peso: 14 } },
    { tipo: 'escooter', codice: 'ES-002', energia: 45, car: { marca: 'CitySync Scoot', velocitaMax: 20, autonomiaKm: 35, peso: 14 } },
    { tipo: 'escooter', codice: 'ES-003', energia: 18, car: { marca: 'CitySync Scoot', velocitaMax: 20, autonomiaKm: 35, peso: 14 } },
    { tipo: 'auto', codice: 'CR-001', energia: 88, car: { marca: 'Fiat 500e', velocitaMax: 135, autonomiaKm: 320, posti: 4, cambio: 'automatico', alimentazione: 'elettrica' } },
    { tipo: 'auto', codice: 'CR-002', energia: 53, car: { marca: 'Renault Zoe', velocitaMax: 140, autonomiaKm: 300, posti: 5, cambio: 'automatico', alimentazione: 'elettrica' } },
    { tipo: 'bici', codice: 'BK-003', energia: 100, car: { marca: 'CitySync e-Bike', velocitaMax: 25, autonomiaKm: 60, peso: 22, cambio: 'automatico' } },
  ];

  for (const m of flotta) {
    const p = jitter(CENTRO, 1200);
    const idPos = insertPosizione({ lat: p.lat, lon: p.lon });
    run(`INSERT INTO Mezzo (idMezzo, tipoMezzo, statOperativo, codiceMezzo, livelloEnergia, caratteristicheTecniche, idPosizione)
         VALUES (?,?,?,?,?,?,?)`,
      genId('MZ'), m.tipo, 'disponibile', m.codice, m.energia, JSON.stringify(m.car), idPos);
  }

  // Un mezzo già fuori servizio (per il modulo manutenzione / monitoraggio).
  const idPosKO = insertPosizione({ ...jitter(CENTRO, 1500) });
  run(`INSERT INTO Mezzo (idMezzo, tipoMezzo, statOperativo, codiceMezzo, livelloEnergia, caratteristicheTecniche, idPosizione)
       VALUES (?,?,?,?,?,?,?)`,
    genId('MZ'), 'escooter', 'fuori_servizio', 'ES-004', 9,
    JSON.stringify({ marca: 'CitySync Scoot', velocitaMax: 20, autonomiaKm: 35, peso: 14 }), idPosKO);

  console.log('Seed completato.');
  console.log('  DB:', DB_PATH);
  console.log('  Utente demo:  mario.rossi@example.com / password');
  console.log('  Operatore:    operatore@citysync.it / password');
  console.log('  Mezzi inseriti:', flotta.length + 1);
}

seed();
