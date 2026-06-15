// Modelli del dominio (rispecchiano il Diagramma delle Classi, sez. 2.4).

export type TipoMezzo = 'bici' | 'escooter' | 'auto';

export type StatoMezzo =
  | 'disponibile' | 'prenotato' | 'in_uso'
  | 'in_manutenzione' | 'fuori_servizio' | 'bloccato';

export type StatoNoleggio = 'in_corso' | 'in_pausa' | 'concluso' | 'annullato';
export type StatoPrenotazione = 'attiva' | 'scaduta' | 'annullata' | 'convertita';

export interface Posizione {
  idPosizione?: string;
  lat: number;
  lon: number;
  indirizzo?: string | null;
}

export interface Tariffa {
  sblocco: number;
  alMinuto: number;
  label: string;
}

export interface Mezzo {
  idMezzo: string;
  tipoMezzo: TipoMezzo;
  codiceMezzo: string;
  statOperativo: StatoMezzo;
  livelloEnergia: number;
  caratteristicheTecniche: Record<string, string | number>;
  posizione: Posizione | null;
  tariffa: Tariffa | null;
  distanzaMetri?: number | null;
}

export interface Utente {
  idUtente: string;
  nome: string;
  cognome: string;
  email: string;
  telefono?: string;
  statoAccount: string;
}

export interface Prenotazione {
  idPrenotazione: string;
  statoPrenotazione: StatoPrenotazione;
  dataInizio: string;
  oraInizio: string;
  dataFine?: string;
  oraFine?: string;
  idMezzo: string;
  codiceMezzo?: string;
  tipoMezzo?: TipoMezzo;
}

export interface StimaCosto {
  idMezzo: string;
  tipoMezzo: TipoMezzo;
  tariffa: Tariffa;
  durataStimataMin: number;
  distanzaStimataMetri: number | null;
  dettaglio: { sblocco: number; costoMinuti: number; alMinuto: number };
  costoStimato: number;
}

export interface Noleggio {
  idNoleggio: string;
  statoNoleggio: StatoNoleggio;
  idMezzo: string;
  tipoMezzo: TipoMezzo;
  codiceMezzo: string;
  livelloEnergia?: number;
  inizio: string | null;
  fine: string | null;
  durataMinuti: number;
  // Tempo attivo accumulato (esclude le pause) + inizio del segmento attivo
  // corrente: il client calcola il cronometro "dal vivo" da questi due campi.
  secondiAccumulati?: number;
  ultimaRipresaTs?: string | null;
  costoFinale: number | null;
  tariffa: Tariffa;
  stima?: StimaCosto;
}

export interface RiepilogoNoleggio {
  idNoleggio: string;
  statoNoleggio: StatoNoleggio;
  idMezzo: string;
  tipoMezzo: TipoMezzo;
  codiceMezzo: string;
  inizio: string | null;
  fine: string | null;
  durataMinuti: number;
  tariffa: Tariffa;
  dettaglioCosto: { sblocco: number; costoMinuti: number; alMinuto: number };
  costoFinale: number | null;
  pagamento: { idPagamento: string; importo: number; stato: string; tipo: string } | null;
  posizioneFinaleMezzo: Posizione | null;
}

export interface StoricoItem {
  idNoleggio: string;
  statoNoleggio: StatoNoleggio;
  tipoMezzo: TipoMezzo;
  codiceMezzo: string;
  dataInizio: string;
  oraInizio: string;
  dataFine?: string;
  oraFine?: string;
  costoFinale: number | null;
}

export interface MetodoPagamento {
  idMetodo: string;
  tipoMetodo: string;
  intestatario: string;
  scadenza?: string;
  statoMetodo: string;
}

export interface Portafoglio {
  idPortafoglio: string;
  saldo: number;
}

export interface AreaLimitata {
  idArea: string;
  nomeArea: string;
  tipoLimitazione: string;
  descrizione?: string;
  raggioMetri: number;
  centro: { lat: number; lon: number } | null;
}

export interface RichiestaAssistenza {
  idRichiesta: string;
  descrizione: string;
  statoRichiesta: string;
  dataInvio: string;
  oraInvio: string;
  posizione: Posizione | null;
}

export interface Messaggio {
  idMessaggio: string;
  mittente: 'utente' | 'operatore';
  testo: string;
  timestamp: string;
}

// ===== Operatore (client integrato nell'app) =====

export interface Operatore {
  idOperatore: string;
  ragioneSociale: string;
  email: string;
  personaFisica?: string;
  partitaIVA?: string;
  codiceFiscale?: string;
  codiceSDI?: string;
}

export interface FlottaResponse {
  totale: number;
  perStato: Record<string, number>;
  perTipo: Record<string, number>;
  mezzi: Mezzo[];
}

export interface BatteriaMezzo {
  idMezzo: string; codiceMezzo: string; tipoMezzo: TipoMezzo;
  statOperativo: StatoMezzo; livelloEnergia: number; critico: boolean; posizione: Posizione | null;
}
export interface BatteriaResponse { sogliaCritica: number; critici: number; mezzi: BatteriaMezzo[] }

export interface PrenotazioneOp {
  idPrenotazione: string; statoPrenotazione: string;
  dataInizio: string; oraInizio: string;
  codiceMezzo: string; tipoMezzo: TipoMezzo; nome?: string; cognome?: string;
  durataMinuti: number; anomalia: boolean; sogliaAnomaliaMin: number;
}

export interface Segnalazione {
  idSegnalazione: string; descrizione: string; statoSegnalazione: string;
  dataSegnalazione: string; oraSegnalazione: string;
  codiceMezzo: string; tipoMezzo: TipoMezzo; idMezzo: string; nome?: string; cognome?: string;
}

export interface MezzoDaManutenere {
  idMezzo: string; codiceMezzo: string; tipoMezzo: TipoMezzo;
  statOperativo: StatoMezzo; livelloEnergia: number; segnalazioniAperte: number; motivo: string;
}
export interface Intervento {
  idManutenzione: string; statoManutenzione: string; descrizione?: string;
  dataApertura: string; dataChiusura?: string; codiceMezzo: string; tipoMezzo: TipoMezzo; idMezzo: string;
}

export interface RichiestaAssistenzaOp {
  idRichiesta: string; descrizione: string; statoRichiesta: string;
  dataInvio: string; oraInvio: string; nome?: string; cognome?: string; posizione: Posizione | null;
}

export interface ParcheggioItem {
  idMezzo: string; codiceMezzo: string; tipoMezzo?: TipoMezzo; statOperativo?: StatoMezzo;
  posizioneDisponibile: boolean; posizione?: Posizione; corretto: boolean | null; area: string | null;
}
export interface PosizioneFine {
  idNoleggio: string; idMezzo: string; codiceMezzo: string; tipoMezzo: TipoMezzo;
  dataFine: string; oraFine: string; posizioneFinale: Posizione | null;
}

// ===== Amministrazione Comunale (client integrato nell'app) =====

export interface Amministrazione {
  idAmministrazione: string;
  nomeComune: string;
  email: string;
}

export interface ReportInfo { tipo: string; titolo: string; descrizione: string }

export interface ReportMobilita {
  tipo: string;
  generatoIl: string;
  kpi: {
    totaleNoleggi: number; noleggiConclusi: number; incassoTotale: number; durataMediaMin: number;
    mezziTotali: number; mezziUtilizzati: number; utilizzoFlottaPct: number;
  };
  perTipo: Record<string, number>;
  perGiorno: Record<string, number>;
}

export interface ReportTratte {
  tipo: string;
  generatoIl: string;
  totale: number;
  fasceOrarie: Record<string, number>;
  perTipo: Record<string, number>;
  topMezzi: { codiceMezzo: string; count: number }[];
}

export interface AdMezzo {
  idMezzo: string; codiceMezzo: string; tipoMezzo: TipoMezzo;
  statOperativo: StatoMezzo; livelloEnergia: number; posizione: Posizione | null;
}
export interface StatoMezziResponse {
  totale: number; perStato: Record<string, number>; perTipo: Record<string, number>; mezzi: AdMezzo[];
}

export interface ZonaCritica {
  idZonaCritica: string; tipoCriticita: string; descrizione?: string;
  dataInizio?: string; dataFine?: string; centro: { lat: number; lon: number } | null;
}

export interface Incentivo {
  idIncentivo: string; tipoIncentivo: string; valore: number;
  unitaValore?: 'euro' | 'percentuale';
  statoIncentivo: string; descrizione?: string; idAmministrazione?: string; idUtente?: string | null;
}

// ===== Sprint 3 =====

export interface Patente {
  idPatente: string; numeroPatente: string; categoria?: string;
  dataScadenza?: string; statoVerifica: string;
}

export interface PercorsoStazione { lat: number; lon: number; indirizzo?: string }
export interface Percorso {
  idPercorso?: string;
  partenza: { lat: number; lon: number; indirizzo?: string };
  arrivo: { lat: number; lon: number; indirizzo?: string };
  tipoMezzo: string;
  distanzaMetri: number;
  durataMin: number;
  polyline: { lat: number; lon: number }[];
  areeLimitateAttraversate: AreaLimitata[];
  zoneCriticheAttraversate: ZonaCritica[];
  stazioniRicaricaCompatibili: { idStazione: string; tipoConnettore?: string; posizione: Posizione | null }[];
  consigliato: boolean;
  avvisi: string[];
}

export interface PrenotazioneMultiplaEsito {
  idMezzo: string; ok: boolean; prenotazione?: Prenotazione; errore?: string;
}

export interface BonusEligibile {
  idNoleggio: string; idUtente: string; codiceMezzo: string; tipoMezzo: TipoMezzo;
  nome?: string; cognome?: string; dataFine: string; oraFine: string;
  parcheggioCorretto: boolean | null; bonusGiaAssegnati: number;
}

export interface UtenteAccount {
  idUtente: string; nome: string; cognome: string; email: string;
  telefono?: string; statoAccount: string;
}
