// Componente: Gestione Aree e Percorsi (parte percorsi).
// Casi d'uso: UT.08 (percorso consigliato considerando aree/criticità),
//             UT.17 (stazioni di ricarica lungo il percorso), UT.18 (aree limitate).
const { genId, run, badRequest, distanzaMetri } = require('../../lib/util');
const { IMapProvider } = require('../../external/mapProvider');
const aree = require('../aree/aree.service');

// Distanza (approssimata) di un punto dal segmento partenza-arrivo: minimo tra
// gli estremi e il punto medio (sufficiente per evidenziare aree/criticità vicine).
function vicinoAlPercorso(p, a, b, soglia) {
  const mid = { lat: (a.lat + b.lat) / 2, lon: (a.lon + b.lon) / 2 };
  const d = Math.min(
    distanzaMetri(p.lat, p.lon, a.lat, a.lon),
    distanzaMetri(p.lat, p.lon, b.lat, b.lon),
    distanzaMetri(p.lat, p.lon, mid.lat, mid.lon)
  );
  return d <= soglia;
}

// UT.08 - calcolaPercorso() + verificaAreeLimitate() + individuaStazioniRicarica()
async function calcola({ partenza, arrivo, tipoMezzo = 'bici', salva = false }) {
  if (!partenza || !arrivo || partenza.lat == null || arrivo.lat == null) {
    throw badRequest('Partenza e arrivo (lat/lon) obbligatori');
  }
  const stima = IMapProvider.stimaPercorso(partenza, arrivo, tipoMezzo);

  // UT.18 - aree limitate (non di parcheggio) attraversate dal percorso.
  const areeLimitate = aree.listaAree()
    .filter((a) => a.tipoLimitazione !== 'consentita_parcheggio' && a.centro)
    .filter((a) => vicinoAlPercorso(a.centro, partenza, arrivo, (a.raggioMetri || 200) + 30));

  // Criticità urbane (cantieri) lungo il percorso.
  const zoneCritiche = aree.listaZoneCritiche()
    .filter((z) => z.centro && vicinoAlPercorso(z.centro, partenza, arrivo, 180));

  // UT.17 - stazioni di ricarica compatibili lungo il percorso.
  const stazioni = aree.listaStazioni()
    .filter((s) => s.posizione && vicinoAlPercorso({ lat: s.posizione.lat, lon: s.posizione.lon }, partenza, arrivo, 450));

  const [indPartenza, indArrivo] = await Promise.all([
    IMapProvider.reverseGeocode(partenza.lat, partenza.lon),
    IMapProvider.reverseGeocode(arrivo.lat, arrivo.lon),
  ]);

  const percorso = {
    partenza: { lat: partenza.lat, lon: partenza.lon, indirizzo: indPartenza },
    arrivo: { lat: arrivo.lat, lon: arrivo.lon, indirizzo: indArrivo },
    tipoMezzo,
    distanzaMetri: stima.distanzaMetri,
    durataMin: stima.durataMin,
    polyline: [{ lat: partenza.lat, lon: partenza.lon }, { lat: arrivo.lat, lon: arrivo.lon }],
    areeLimitateAttraversate: areeLimitate,
    zoneCriticheAttraversate: zoneCritiche,
    stazioniRicaricaCompatibili: stazioni,
    consigliato: areeLimitate.length === 0,
    avvisi: [
      ...areeLimitate.map((a) => `Attraversa l'area limitata "${a.nomeArea}"`),
      ...zoneCritiche.map((z) => `Criticità lungo il percorso: ${z.tipoCriticita}`),
    ],
  };

  if (salva) {
    const id = genId('PER');
    run(`INSERT INTO Percorso (idPercorso, puntoPartenza, puntoArrivo, distanzaStimata, durataStimata, statoPercorso)
         VALUES (?,?,?,?,?,?)`,
      id, indPartenza, indArrivo, stima.distanzaMetri, stima.durataMin,
      percorso.consigliato ? 'consigliato' : 'non_consigliato');
    percorso.idPercorso = id;
  }

  return percorso;
}

module.exports = { calcola };
