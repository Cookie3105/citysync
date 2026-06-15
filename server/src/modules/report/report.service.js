// Componente: Gestione Report (lato Amministrazione Comunale).
// Casi d'uso: AP01 (report mobilità), AP05 (tratte/fasce orarie), AP03 (stato mezzi).
// I report sono calcolati live a partire dai dati operativi (noleggi, mezzi).
const { all, get } = require('../../persistence/db');

// AP01 - elenco dei report disponibili (Report.recuperaReportDisponibili).
function reportDisponibili() {
  return [
    { tipo: 'mobilita', titolo: 'Report mobilità', descrizione: 'KPI su noleggi, utilizzo flotta e incassi' },
    { tipo: 'tratte', titolo: 'Pattern di utilizzo', descrizione: 'Fasce orarie e tipologie più frequenti (AP05)' },
    { tipo: 'stato-mezzi', titolo: 'Stato dei mezzi', descrizione: 'Distribuzione operativa della flotta (AP03)' },
  ];
}

// AP01 - Report mobilità (aggregati su noleggi e flotta).
function reportMobilita() {
  const noleggi = all(`SELECT n.*, m.tipoMezzo FROM Noleggio n JOIN Mezzo m ON m.idMezzo = n.idMezzo`);
  const conclusi = noleggi.filter((n) => n.statoNoleggio === 'concluso');

  const perTipo = {};
  for (const n of noleggi) perTipo[n.tipoMezzo] = (perTipo[n.tipoMezzo] || 0) + 1;

  const incasso = conclusi.reduce((s, n) => s + (n.costoFinale || 0), 0);

  const durate = conclusi.map((n) => {
    const a = n.inizioTs ? new Date(n.inizioTs) : new Date(`${n.dataInizio}T${n.oraInizio}`);
    const b = n.fineTs ? new Date(n.fineTs) : a;
    return Math.max(0, (b.getTime() - a.getTime()) / 60000);
  });
  const durataMedia = durate.length ? Math.round(durate.reduce((s, x) => s + x, 0) / durate.length) : 0;

  const mezziTot = get(`SELECT COUNT(*) AS c FROM Mezzo`).c;
  const mezziUsati = new Set(noleggi.map((n) => n.idMezzo)).size;

  const perGiorno = {};
  for (const n of noleggi) perGiorno[n.dataInizio] = (perGiorno[n.dataInizio] || 0) + 1;

  return {
    tipo: 'mobilita',
    generatoIl: new Date().toISOString(),
    kpi: {
      totaleNoleggi: noleggi.length,
      noleggiConclusi: conclusi.length,
      incassoTotale: +incasso.toFixed(2),
      durataMediaMin: durataMedia,
      mezziTotali: mezziTot,
      mezziUtilizzati: mezziUsati,
      utilizzoFlottaPct: mezziTot ? Math.round((mezziUsati / mezziTot) * 100) : 0,
    },
    perTipo,
    perGiorno,
  };
}

// AP05 - Pattern di utilizzo: fasce orarie e tipologie più frequenti.
// NB: la documentazione parla di "tratte/strade percorse": non essendo tracciati
// i percorsi puntuali, si approssima con le fasce orarie e le tipologie di mezzo.
function reportTratte() {
  const noleggi = all(
    `SELECT n.oraInizio, n.statoNoleggio, m.tipoMezzo, m.codiceMezzo, n.idMezzo
     FROM Noleggio n JOIN Mezzo m ON m.idMezzo = n.idMezzo`);

  const fasceOrarie = {};
  for (let h = 0; h < 24; h++) fasceOrarie[String(h).padStart(2, '0')] = 0;
  for (const n of noleggi) {
    const h = (n.oraInizio || '00').slice(0, 2);
    if (fasceOrarie[h] != null) fasceOrarie[h] += 1;
  }

  const perTipo = {};
  for (const n of noleggi) perTipo[n.tipoMezzo] = (perTipo[n.tipoMezzo] || 0) + 1;

  const usoMezzo = {};
  for (const n of noleggi) usoMezzo[n.codiceMezzo] = (usoMezzo[n.codiceMezzo] || 0) + 1;
  const topMezzi = Object.entries(usoMezzo)
    .map(([codiceMezzo, count]) => ({ codiceMezzo, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return { tipo: 'tratte', generatoIl: new Date().toISOString(), totale: noleggi.length, fasceOrarie, perTipo, topMezzi };
}

// AP03 - Analizzare stato mezzi.
function statoMezzi() {
  const mezzi = all(`
    SELECT m.idMezzo, m.codiceMezzo, m.tipoMezzo, m.statOperativo, m.livelloEnergia,
           p.latitudine, p.longitudine
    FROM Mezzo m LEFT JOIN PosizioneGeografica p ON p.idPosizione = m.idPosizione`);

  const perStato = {};
  const perTipo = {};
  for (const m of mezzi) {
    perStato[m.statOperativo] = (perStato[m.statOperativo] || 0) + 1;
    perTipo[m.tipoMezzo] = (perTipo[m.tipoMezzo] || 0) + 1;
  }
  return {
    totale: mezzi.length,
    perStato,
    perTipo,
    mezzi: mezzi.map((m) => ({
      idMezzo: m.idMezzo, codiceMezzo: m.codiceMezzo, tipoMezzo: m.tipoMezzo,
      statOperativo: m.statOperativo, livelloEnergia: m.livelloEnergia,
      posizione: m.latitudine != null ? { lat: m.latitudine, lon: m.longitudine } : null,
    })),
  };
}

module.exports = { reportDisponibili, reportMobilita, reportTratte, statoMezzi };
