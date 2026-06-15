// EntitaMobility - enumerazioni del dominio (sez. 2.4 / Glossario "Stato operativo del mezzo").

const StatoMezzo = Object.freeze({
  DISPONIBILE: 'disponibile',
  PRENOTATO: 'prenotato',
  IN_USO: 'in_uso',
  IN_MANUTENZIONE: 'in_manutenzione',
  FUORI_SERVIZIO: 'fuori_servizio',
  BLOCCATO: 'bloccato',
});

const StatoNoleggio = Object.freeze({
  IN_CORSO: 'in_corso',
  IN_PAUSA: 'in_pausa',
  CONCLUSO: 'concluso',
  ANNULLATO: 'annullato',
});

const StatoPrenotazione = Object.freeze({
  ATTIVA: 'attiva',
  SCADUTA: 'scaduta',
  ANNULLATA: 'annullata',
  CONVERTITA: 'convertita',
});

const StatoSegnalazione = Object.freeze({
  APERTA: 'aperta',
  IN_GESTIONE: 'in_gestione',
  CHIUSA: 'chiusa',
});

const StatoRichiesta = Object.freeze({
  APERTA: 'aperta',
  IN_GESTIONE: 'in_gestione',
  CHIUSA: 'chiusa',
});

const StatoManutenzione = Object.freeze({
  APERTA: 'aperta',
  IN_CORSO: 'in_corso',
  CHIUSA: 'chiusa',
});

const TipoMezzo = Object.freeze({
  BICI: 'bici',
  ESCOOTER: 'escooter',
  AUTO: 'auto',
});

// Tariffario per tipo di mezzo: sblocco una tantum + costo al minuto (EUR).
// Usato da GestioneNoleggi.calcolaCosto() e dalla stima preventiva (UT.03).
const Tariffario = Object.freeze({
  bici: { sblocco: 1.0, alMinuto: 0.20, label: 'Bici' },
  escooter: { sblocco: 1.0, alMinuto: 0.25, label: 'E-Scooter' },
  auto: { sblocco: 2.0, alMinuto: 0.40, label: 'Auto' },
});

const PRENOTAZIONE_DURATA_MIN = 15;          // durata standard di una prenotazione
const PRENOTAZIONE_SOGLIA_ANOMALIA_MIN = 20; // OP.11: oltre questa soglia -> anomalia

module.exports = {
  StatoMezzo,
  StatoNoleggio,
  StatoPrenotazione,
  StatoSegnalazione,
  StatoRichiesta,
  StatoManutenzione,
  TipoMezzo,
  Tariffario,
  PRENOTAZIONE_DURATA_MIN,
  PRENOTAZIONE_SOGLIA_ANOMALIA_MIN,
};
