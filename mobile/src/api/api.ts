// Funzioni API tipizzate, una per ciascun caso d'uso lato utente (Sprint 2).
import { http } from './client';
import type {
  Mezzo, Utente, Prenotazione, StimaCosto, Noleggio, RiepilogoNoleggio,
  StoricoItem, MetodoPagamento, Portafoglio, AreaLimitata, RichiestaAssistenza, Messaggio,
  Patente, Percorso, Incentivo, PrenotazioneMultiplaEsito,
} from '../models/types';

export const api = {
  // --- Auth / profilo ---
  register: (dati: { nome: string; cognome: string; email: string; telefono?: string; password: string }) =>
    http.post<Utente>('/auth/register', dati),
  login: (email: string, password: string) =>
    http.post<Utente>('/auth/login', { email, password }),
  getProfilo: (id: string) => http.get<Utente>(`/auth/profilo/${id}`),
  aggiornaProfilo: (id: string, b: Partial<Utente>) => http.patch<Utente>(`/auth/profilo/${id}`, b),

  // --- UT.01 / UT.06 / UT.12 - Mezzi ---
  // Senza `raggio` restituisce l'intera flotta disponibile (con distanze per l'ordinamento).
  mezziVicini: (lat: number, lon: number, raggio?: number, tipo?: string) =>
    http.get<Mezzo[]>(`/mezzi?lat=${lat}&lon=${lon}${raggio != null ? `&raggio=${raggio}` : ''}${tipo ? `&tipo=${tipo}` : ''}`),
  mezzo: (id: string) => http.get<Mezzo>(`/mezzi/${id}`),

  // --- UT.02 - Prenotazioni ---
  prenota: (idUtente: string, idMezzo: string) =>
    http.post<Prenotazione>('/prenotazioni', { idUtente, idMezzo }),
  prenotazioniUtente: (idUtente: string) =>
    http.get<Prenotazione[]>(`/prenotazioni?utente=${idUtente}`),
  annullaPrenotazione: (id: string) => http.del<Prenotazione>(`/prenotazioni/${id}`),

  // --- UT.03 / UT.13 / UT.15 / UT.04 / UT.05 / UT.20 - Noleggi ---
  stima: (idMezzo: string, destinazione?: { lat: number; lon: number }) =>
    http.post<StimaCosto>('/noleggi/stima', { idMezzo, destinazione }),
  avviaNoleggio: (idUtente: string, idMezzo: string, idPrenotazione?: string) =>
    http.post<Noleggio>('/noleggi', { idUtente, idMezzo, idPrenotazione }),
  noleggioAttivo: (idUtente: string) =>
    http.get<Noleggio | null>(`/noleggi?utente=${idUtente}&attivo=true`),
  pausaNoleggio: (id: string) => http.post<Noleggio>(`/noleggi/${id}/pausa`),
  riprendiNoleggio: (id: string) => http.post<Noleggio>(`/noleggi/${id}/riprendi`),
  terminaNoleggio: (id: string, pos?: { lat: number; lon: number; indirizzo?: string }) =>
    http.post<RiepilogoNoleggio>(`/noleggi/${id}/termina`, pos || {}),
  riepilogo: (id: string) => http.get<RiepilogoNoleggio>(`/noleggi/${id}/riepilogo`),
  storico: (idUtente: string) => http.get<StoricoItem[]>(`/noleggi?utente=${idUtente}`),

  // --- UT.14 - Pagamenti ---
  metodi: (idUtente: string) => http.get<MetodoPagamento[]>(`/pagamenti/metodi?utente=${idUtente}`),
  salvaMetodo: (b: Record<string, unknown>) => http.post<MetodoPagamento>('/pagamenti/metodi', b),
  rimuoviMetodo: (idUtente: string, id: string) =>
    http.del<{ rimosso: boolean }>(`/pagamenti/metodi/${id}?utente=${idUtente}`),
  portafoglio: (idUtente: string) => http.get<Portafoglio>(`/pagamenti/portafoglio?utente=${idUtente}`),
  storicoPagamenti: (idUtente: string) =>
    http.get<{ idPagamento: string; importo: number; statoPagamento: string; tipoPagamento: string; dataPagamento: string; oraPagamento: string }[]>(`/pagamenti?utente=${idUtente}`),

  // --- UT.11 - Segnalazioni ---
  segnalaGuasto: (idUtente: string, idMezzo: string, descrizione: string) =>
    http.post('/assistenza/segnalazioni', { idUtente, idMezzo, descrizione }),

  // --- UT.21 / UT.10 - Assistenza + chat ---
  richiediAssistenza: (idUtente: string, descrizione: string, posizione?: { lat: number; lon: number }) =>
    http.post<RichiestaAssistenza>('/assistenza/richieste', { idUtente, descrizione, posizione }),
  richiesteUtente: (idUtente: string) =>
    http.get<RichiestaAssistenza[]>(`/assistenza/richieste?utente=${idUtente}`),
  messaggi: (idRichiesta: string) =>
    http.get<Messaggio[]>(`/assistenza/richieste/${idRichiesta}/messaggi`),
  inviaMessaggio: (idRichiesta: string, testo: string, mittente: 'utente' | 'operatore' = 'utente') =>
    http.post<Messaggio>(`/assistenza/richieste/${idRichiesta}/messaggi`, { mittente, testo }),

  // --- Aree (mappa) ---
  aree: () => http.get<AreaLimitata[]>('/aree'),

  // --- UT.07 - Patente ---
  getPatente: (idUtente: string) => http.get<Patente | null>(`/auth/profilo/${idUtente}/patente`),
  salvaPatente: (idUtente: string, b: { numeroPatente: string; categoria?: string; dataScadenza?: string }) =>
    http.post<Patente>(`/auth/profilo/${idUtente}/patente`, b),

  // --- UT.19 - Ricarica portafoglio ---
  ricaricaPortafoglio: (idUtente: string, importo: number) =>
    http.post<Portafoglio & { transazione: string }>('/pagamenti/portafoglio/ricarica', { idUtente, importo }),

  // --- UT.09 - Promozioni / incentivi visibili ---
  incentiviUtente: (idUtente: string) => http.get<Incentivo[]>(`/incentivi/utente/${idUtente}`),

  // --- UT.08 / UT.17 / UT.18 - Percorso consigliato ---
  calcolaPercorso: (partenza: { lat: number; lon: number }, arrivo: { lat: number; lon: number }, tipoMezzo?: string) =>
    http.post<Percorso>('/percorsi', { partenza, arrivo, tipoMezzo }),

  // --- UT.16 - Prenotazione multipla ---
  prenotaMultipla: (idUtente: string, idMezzi: string[]) =>
    http.post<PrenotazioneMultiplaEsito[]>('/prenotazioni/multipla', { idUtente, idMezzi }),
};
