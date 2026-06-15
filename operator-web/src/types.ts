// Tipi del dominio lato client Operatore (coerenti con il diagramma delle classi).
export type TipoMezzo = 'bici' | 'escooter' | 'auto';
export type StatoMezzo =
  | 'disponibile' | 'prenotato' | 'in_uso' | 'in_manutenzione' | 'fuori_servizio' | 'bloccato';

export interface Posizione { lat: number; lon: number; indirizzo?: string | null }

export interface Operatore {
  idOperatore: string;
  ragioneSociale: string;
  email: string;
  personaFisica?: string;
}

export interface Mezzo {
  idMezzo: string;
  tipoMezzo: TipoMezzo;
  codiceMezzo: string;
  statOperativo: StatoMezzo;
  livelloEnergia: number;
  caratteristicheTecniche: Record<string, string | number>;
  posizione: Posizione | null;
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

export interface Prenotazione {
  idPrenotazione: string; statoPrenotazione: string;
  dataInizio: string; oraInizio: string; dataFine?: string; oraFine?: string;
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

export interface RichiestaAssistenza {
  idRichiesta: string; descrizione: string; statoRichiesta: string;
  dataInvio: string; oraInvio: string; nome?: string; cognome?: string; posizione: Posizione | null;
}
export interface Messaggio { idMessaggio: string; mittente: 'utente' | 'operatore'; testo: string; timestamp: string }

export interface ParcheggioItem {
  idMezzo: string; codiceMezzo: string; tipoMezzo?: TipoMezzo; statOperativo?: StatoMezzo;
  posizioneDisponibile: boolean; posizione?: Posizione; corretto: boolean | null; area: string | null;
}
export interface PosizioneFine {
  idNoleggio: string; idMezzo: string; codiceMezzo: string; tipoMezzo: TipoMezzo;
  dataFine: string; oraFine: string; posizioneFinale: Posizione | null;
}
