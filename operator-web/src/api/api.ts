// Funzioni API per i casi d'uso dell'Operatore (Sprint 2).
import { http } from './client';
import type {
  Operatore, Mezzo, FlottaResponse, BatteriaResponse, Prenotazione, Segnalazione,
  MezzoDaManutenere, Intervento, RichiestaAssistenza, Messaggio, ParcheggioItem, PosizioneFine,
} from '../types';

export const api = {
  // Auth
  login: (email: string, password: string) =>
    http.post<Operatore>('/auth/operatore/login', { email, password }),

  // Mezzi / Flotta
  flotta: () => http.get<FlottaResponse>('/monitoraggio/flotta'),                     // OP.01
  batteria: () => http.get<BatteriaResponse>('/monitoraggio/batteria'),               // OP.12
  tuttiMezzi: () => http.get<Mezzo[]>('/mezzi?tutti=true'),
  registraMezzo: (b: Record<string, unknown>) => http.post<Mezzo>('/mezzi', b),       // OP.14
  aggiornaStatoMezzo: (id: string, statOperativo: string) =>                          // OP.13
    http.patch<Mezzo>(`/mezzi/${id}/stato`, { statOperativo }),
  bloccoRemoto: (idMezzo: string) =>                                                  // OP.10
    http.post<Mezzo>('/monitoraggio/blocco-remoto', { idMezzo }),

  // Prenotazioni
  prenotazioniAttive: () => http.get<Prenotazione[]>('/prenotazioni?attive=true'),    // OP.11

  // Segnalazioni
  segnalazioni: (stato?: string) =>                                                   // OP.03
    http.get<Segnalazione[]>(`/assistenza/segnalazioni${stato ? `?stato=${stato}` : ''}`),
  aggiornaSegnalazione: (id: string, b: Record<string, unknown>) =>
    http.patch<Segnalazione>(`/assistenza/segnalazioni/${id}`, b),

  // Manutenzione
  mezziDaManutenere: () => http.get<MezzoDaManutenere[]>('/manutenzione/da-manutenere'), // OP.06
  interventi: (stato?: string) => http.get<Intervento[]>(`/manutenzione${stato ? `?stato=${stato}` : ''}`),
  apriIntervento: (b: Record<string, unknown>) => http.post<Intervento>('/manutenzione', b),
  aggiornaIntervento: (id: string, b: Record<string, unknown>) =>
    http.patch<Intervento>(`/manutenzione/${id}`, b),

  // Assistenza
  richieste: (stato?: string) =>                                                      // OP.07
    http.get<RichiestaAssistenza[]>(`/assistenza/richieste${stato ? `?stato=${stato}` : ''}`),
  aggiornaRichiesta: (id: string, b: Record<string, unknown>) =>
    http.patch<RichiestaAssistenza>(`/assistenza/richieste/${id}`, b),
  messaggi: (idRichiesta: string) => http.get<Messaggio[]>(`/assistenza/richieste/${idRichiesta}/messaggi`),
  rispondi: (idRichiesta: string, testo: string) =>
    http.post<Messaggio>(`/assistenza/richieste/${idRichiesta}/messaggi`, { mittente: 'operatore', testo }),

  // Parcheggio / posizioni
  verificaParcheggio: () => http.get<ParcheggioItem[]>('/monitoraggio/parcheggio'),   // OP.04
  posizioniFineNoleggio: () => http.get<PosizioneFine[]>('/monitoraggio/posizioni-fine-noleggio'), // OP.05
};
