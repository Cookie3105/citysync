// API per i casi d'uso dell'Operatore (OP.*), integrate nell'app.
// Usano lo STESSO API Server dell'utente (nessun servizio esterno).
import { http } from './client';
import type {
  Operatore, Mezzo, FlottaResponse, BatteriaResponse, PrenotazioneOp, Segnalazione,
  MezzoDaManutenere, Intervento, RichiestaAssistenzaOp, Messaggio, ParcheggioItem, PosizioneFine,
  BonusEligibile, UtenteAccount, Incentivo,
} from '../models/types';

export const operatorApi = {
  // Auth
  login: (email: string, password: string) =>
    http.post<Operatore>('/auth/operatore/login', { email, password }),

  // Flotta / mezzi
  flotta: () => http.get<FlottaResponse>('/monitoraggio/flotta'),                       // OP.01
  batteria: () => http.get<BatteriaResponse>('/monitoraggio/batteria'),                 // OP.12
  tuttiMezzi: () => http.get<Mezzo[]>('/mezzi?tutti=true'),
  registraMezzo: (b: Record<string, unknown>) => http.post<Mezzo>('/mezzi', b),         // OP.14
  aggiornaStatoMezzo: (id: string, statOperativo: string) =>                            // OP.13
    http.patch<Mezzo>(`/mezzi/${id}/stato`, { statOperativo }),
  bloccoRemoto: (idMezzo: string, forza = false) =>
    http.post<Mezzo>('/monitoraggio/blocco-remoto', { idMezzo, forza }), // OP.10

  // Prenotazioni
  prenotazioniAttive: () => http.get<PrenotazioneOp[]>('/prenotazioni?attive=true'),    // OP.11

  // Segnalazioni
  segnalazioni: (stato?: string) =>                                                     // OP.03
    http.get<Segnalazione[]>(`/assistenza/segnalazioni${stato ? `?stato=${stato}` : ''}`),
  aggiornaSegnalazione: (id: string, b: Record<string, unknown>) =>
    http.patch<Segnalazione>(`/assistenza/segnalazioni/${id}`, b),

  // Manutenzione
  mezziDaManutenere: () => http.get<MezzoDaManutenere[]>('/manutenzione/da-manutenere'), // OP.06
  interventi: (stato?: string) => http.get<Intervento[]>(`/manutenzione${stato ? `?stato=${stato}` : ''}`),
  apriIntervento: (b: Record<string, unknown>) => http.post<Intervento>('/manutenzione', b),
  aggiornaIntervento: (id: string, b: Record<string, unknown>) => http.patch<Intervento>(`/manutenzione/${id}`, b),

  // Assistenza
  richieste: (stato?: string) =>                                                        // OP.07
    http.get<RichiestaAssistenzaOp[]>(`/assistenza/richieste${stato ? `?stato=${stato}` : ''}`),
  aggiornaRichiesta: (id: string, b: Record<string, unknown>) =>
    http.patch<RichiestaAssistenzaOp>(`/assistenza/richieste/${id}`, b),
  messaggi: (idRichiesta: string) => http.get<Messaggio[]>(`/assistenza/richieste/${idRichiesta}/messaggi`),
  rispondi: (idRichiesta: string, testo: string) =>
    http.post<Messaggio>(`/assistenza/richieste/${idRichiesta}/messaggi`, { mittente: 'operatore', testo }),

  // Parcheggio / posizioni
  verificaParcheggio: () => http.get<ParcheggioItem[]>('/monitoraggio/parcheggio'),     // OP.04
  posizioniFineNoleggio: () => http.get<PosizioneFine[]>('/monitoraggio/posizioni-fine-noleggio'), // OP.05

  // OP.08 - Assegnare bonus
  bonusEligibili: () => http.get<BonusEligibile[]>('/monitoraggio/bonus-eligibili'),
  assegnaBonus: (idUtente: string, valore = 0.5) =>
    http.post<Incentivo>('/incentivi/assegna', { idUtente, tipoIncentivo: 'bonus_parcheggio', valore }),

  // OP.09 - Sospendere/bloccare account utente
  cercaUtenti: (q?: string) => http.get<UtenteAccount[]>(`/auth/utenti${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  aggiornaStatoAccount: (idUtente: string, statoAccount: string) =>
    http.patch<UtenteAccount>(`/auth/utenti/${idUtente}/stato`, { statoAccount }),
};
