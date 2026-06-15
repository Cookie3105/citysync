# CitySync API — riferimento endpoint (Sprint 2)

Base URL: `http://localhost:4000/api` · Formato: JSON.
Le rotte realizzano le interfacce *RichiestaClient* (richiesta) e *RispostaClient*
(risposta) del diagramma delle componenti.

## Auth / Profilo (Gestione Utenti e Profili)
| Metodo | Path | Descrizione |
|---|---|---|
| POST | `/auth/register` | Registrazione nuovo utente `{ nome, cognome, email, telefono?, password }` |
| POST | `/auth/login` | Autenticazione `{ email, password }` (case-insensitive) |
| GET | `/auth/profilo/:id` | Dati profilo |
| PATCH | `/auth/profilo/:id` | Aggiorna profilo |

## Mezzi (Gestione Mezzi)
| Metodo | Path | UC |
|---|---|---|
| GET | `/mezzi?lat=&lon=&raggio=&tipo=` | UT.01 — disponibili nelle vicinanze |
| GET | `/mezzi?tutti=true` | tutti i mezzi (operatore) |
| GET | `/mezzi/:id` | UT.06 / UT.12 — dettaglio + energia |
| POST | `/mezzi` | OP.14 — registra nuovo mezzo |
| PATCH | `/mezzi/:id/stato` | OP.13 — aggiorna stato operativo |
| PATCH | `/mezzi/:id/posizione` | aggiorna posizione (telemetria) |

## Prenotazioni (Gestione Prenotazioni)
| Metodo | Path | UC |
|---|---|---|
| POST | `/prenotazioni` | UT.02 — prenota `{ idUtente, idMezzo }` |
| GET | `/prenotazioni?utente=` | prenotazioni dell'utente |
| GET | `/prenotazioni?attive=true` | OP.11 — attive + anomalie |
| DELETE | `/prenotazioni/:id` | annulla |

## Noleggi (Gestione Noleggi)
| Metodo | Path | UC |
|---|---|---|
| POST | `/noleggi/stima` | UT.03 — stima costo `{ idMezzo, destinazione? }` |
| POST | `/noleggi` | UT.13 — avvia `{ idUtente, idMezzo, idPrenotazione? }` |
| POST | `/noleggi/:id/pausa` | UT.15 — pausa |
| POST | `/noleggi/:id/riprendi` | UT.15 — riprendi |
| POST | `/noleggi/:id/termina` | UT.04 — termina `{ lat?, lon? }` |
| GET | `/noleggi/:id/riepilogo` | UT.05 — riepilogo |
| GET | `/noleggi?utente=` | UT.20 — storico |
| GET | `/noleggi?utente=&attivo=true` | noleggio attivo |

## Pagamenti (Gestione Pagamenti ed Incentivi)
| Metodo | Path | UC |
|---|---|---|
| GET | `/pagamenti/metodi?utente=` | UT.14 — metodi registrati |
| POST | `/pagamenti/metodi` | UT.14 — registra/aggiorna (verifica gateway) |
| DELETE | `/pagamenti/metodi/:id?utente=` | rimuovi metodo |
| GET | `/pagamenti/portafoglio?utente=` | saldo portafoglio |
| GET | `/pagamenti?utente=` | storico pagamenti |

## Assistenza e Segnalazioni
| Metodo | Path | UC |
|---|---|---|
| POST | `/assistenza/segnalazioni` | UT.11 — segnala guasto |
| GET | `/assistenza/segnalazioni?stato=` | OP.03 — elenco segnalazioni |
| PATCH | `/assistenza/segnalazioni/:id` | OP.03 — aggiorna |
| POST | `/assistenza/richieste` | UT.21 — richiedi assistenza (+posizione) |
| GET | `/assistenza/richieste?stato=&utente=` | OP.07 — elenco richieste |
| PATCH | `/assistenza/richieste/:id` | OP.07 — aggiorna |
| GET | `/assistenza/richieste/:id/messaggi` | UT.10 — chat (lettura) |
| POST | `/assistenza/richieste/:id/messaggi` | UT.10 — invia messaggio |

## Manutenzione (Gestione Manutenzione)
| Metodo | Path | UC |
|---|---|---|
| GET | `/manutenzione/da-manutenere` | OP.06 — mezzi da manutenere |
| GET | `/manutenzione?stato=` | interventi |
| POST | `/manutenzione` | OP.06 — apri intervento |
| PATCH | `/manutenzione/:id` | OP.06 — aggiorna/chiudi |

## Monitoraggio e Controllo
| Metodo | Path | UC |
|---|---|---|
| GET | `/monitoraggio/flotta` | OP.01 — distribuzione flotta |
| GET | `/monitoraggio/batteria` | OP.12 — livelli batteria |
| GET | `/monitoraggio/parcheggio` | OP.04 — verifica parcheggio |
| GET | `/monitoraggio/posizioni-fine-noleggio` | OP.05 |
| POST | `/monitoraggio/blocco-remoto` | OP.10 — blocco remoto `{ idMezzo }` |

## Aree e Percorsi
| Metodo | Path | Descrizione |
|---|---|---|
| GET | `/aree` | aree limitate/consentite (mappa) |
| GET | `/aree/stazioni` | stazioni di ricarica |
| GET | `/aree/verifica-parcheggio?lat=&lon=` | verifica puntuale |
| POST | `/aree` | AP06 — definire zona limitata |
| GET | `/aree/zone-critiche` | elenco criticità urbane |
| POST | `/aree/zone-critiche` | AP04 — segnalare criticità urbana |

## Amministrazione Comunale (Gestione Report / Incentivi)
| Metodo | Path | UC |
|---|---|---|
| POST | `/auth/amministrazione/login` | autenticazione amministrazione |
| GET | `/report` | AP01 — report disponibili |
| GET | `/report/mobilita` | AP01 — KPI mobilità |
| GET | `/report/tratte` | AP05 — fasce orarie / tipologie |
| GET | `/report/stato-mezzi` | AP03 — stato operativo flotta |
| GET | `/incentivi` | AP07 — elenco incentivi |
| POST | `/incentivi` | AP07 — crea incentivo |
| PATCH | `/incentivi/:id` | AP07 — aggiorna/attiva/disattiva |

## Sprint 3
| Metodo | Path | UC |
|---|---|---|
| GET | `/auth/profilo/:id/patente` | UT.07 — patente caricata |
| POST | `/auth/profilo/:id/patente` | UT.07 — carica/aggiorna patente |
| POST | `/percorsi` | UT.08/17/18 — percorso consigliato, stazioni, aree `{ partenza, arrivo, tipoMezzo? }` |
| POST | `/pagamenti/portafoglio/ricarica` | UT.19 — ricarica `{ idUtente, importo }` |
| GET | `/incentivi/utente/:id` | UT.09 — promozioni/incentivi visibili dall'utente |
| POST | `/prenotazioni/multipla` | UT.16 — prenota più mezzi `{ idUtente, idMezzi:[] }` |
| GET | `/monitoraggio/bonus-eligibili` | OP.08 — noleggi idonei a bonus parcheggio |
| POST | `/incentivi/assegna` | OP.08 — assegna bonus `{ idUtente, tipoIncentivo?, valore? }` |
| GET | `/auth/utenti?q=` | OP.09 — ricerca account utenti |
| PATCH | `/auth/utenti/:id/stato` | OP.09 — sospendi/blocca/riattiva `{ statoAccount }` |
