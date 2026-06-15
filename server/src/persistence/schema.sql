-- =============================================================================
-- CitySync - Struttura fisica del Database (Sprint 2)
-- Derivata dal "Modello logico del Database" (sez. 2.5.1).
-- DBMS: SQLite (componente Persistenza, interfaccia IPersistenza).
-- =============================================================================

PRAGMA foreign_keys = ON;

-- --- Anagrafiche attori --------------------------------------------------------

CREATE TABLE IF NOT EXISTS Utente (
  idUtente      TEXT PRIMARY KEY,
  nome          TEXT NOT NULL,
  cognome       TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  telefono      TEXT,
  password      TEXT NOT NULL,
  statoAccount  TEXT NOT NULL DEFAULT 'attivo'   -- attivo | sospeso | bloccato
);

CREATE TABLE IF NOT EXISTS Operatore (
  idOperatore   TEXT PRIMARY KEY,
  ragioneSociale TEXT NOT NULL,
  partitaIVA    TEXT,
  codiceFiscale TEXT,
  personaFisica TEXT,
  email         TEXT NOT NULL UNIQUE,
  password      TEXT NOT NULL,
  codiceSDI     TEXT
);

CREATE TABLE IF NOT EXISTS AmministrazioneComunale (
  idAmministrazione TEXT PRIMARY KEY,
  nomeComune    TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password      TEXT NOT NULL
);

-- --- Profilo utente ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS Patente (
  idPatente     TEXT PRIMARY KEY,
  numeroPatente TEXT NOT NULL,
  categoria     TEXT,
  dataScadenza  TEXT,
  statoVerifica TEXT NOT NULL DEFAULT 'in_attesa', -- verificata | in_attesa | rifiutata
  idUtente      TEXT NOT NULL REFERENCES Utente(idUtente)
);

CREATE TABLE IF NOT EXISTS MetodoPagamento (
  idMetodo      TEXT PRIMARY KEY,
  tipoMetodo    TEXT NOT NULL,                 -- carta | paypal | ...
  intestatario  TEXT NOT NULL,
  scadenza      TEXT,
  statoMetodo   TEXT NOT NULL DEFAULT 'attivo',-- attivo | scaduto | non_valido
  idUtente      TEXT NOT NULL REFERENCES Utente(idUtente)
);

CREATE TABLE IF NOT EXISTS PortafoglioDigitale (
  idPortafoglio TEXT PRIMARY KEY,
  saldo         REAL NOT NULL DEFAULT 0,
  idUtente      TEXT NOT NULL UNIQUE REFERENCES Utente(idUtente)
);

-- --- Geografia -----------------------------------------------------------------

CREATE TABLE IF NOT EXISTS PosizioneGeografica (
  idPosizione   TEXT PRIMARY KEY,
  latitudine    REAL NOT NULL,
  longitudine   REAL NOT NULL,
  indirizzo     TEXT,
  comune        TEXT,
  provincia     TEXT,
  nazione       TEXT,
  ISOnazione    TEXT
);

-- --- Flotta --------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS Mezzo (
  idMezzo                TEXT PRIMARY KEY,
  tipoMezzo              TEXT NOT NULL,         -- bici | escooter | auto
  statOperativo          TEXT NOT NULL DEFAULT 'disponibile', -- disponibile | prenotato | in_uso | in_manutenzione | fuori_servizio | bloccato
  codiceMezzo            TEXT NOT NULL UNIQUE,
  livelloEnergia         INTEGER NOT NULL DEFAULT 100, -- % batteria o carburante
  caratteristicheTecniche TEXT,                -- JSON
  idPosizione            TEXT REFERENCES PosizioneGeografica(idPosizione)
);

-- --- Percorsi ------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS Percorso (
  idPercorso      TEXT PRIMARY KEY,
  puntoPartenza   TEXT,
  puntoArrivo     TEXT,
  distanzaStimata REAL,
  durataStimata   REAL,
  statoPercorso   TEXT DEFAULT 'disponibile'
);

CREATE TABLE IF NOT EXISTS StazioneRicarica (
  idStazione     TEXT PRIMARY KEY,
  disponibilita  TEXT NOT NULL DEFAULT 'disponibile',
  tipoConnettore TEXT,
  idPosizione    TEXT REFERENCES PosizioneGeografica(idPosizione)
);

CREATE TABLE IF NOT EXISTS AreaLimitata (
  idArea          TEXT PRIMARY KEY,
  nomeArea        TEXT NOT NULL,
  tipoLimitazione TEXT,                        -- vietata | consentita_parcheggio | ztl
  descrizione     TEXT,
  statoArea       TEXT NOT NULL DEFAULT 'attiva',
  idAmministrazione TEXT REFERENCES AmministrazioneComunale(idAmministrazione),
  idPosizione     TEXT REFERENCES PosizioneGeografica(idPosizione),
  raggioMetri     REAL DEFAULT 200             -- [EXT] semplificazione: area circolare
);

CREATE TABLE IF NOT EXISTS ZonaCritica (
  idZonaCritica   TEXT PRIMARY KEY,
  tipoCriticita   TEXT,
  descrizione     TEXT,
  dataInizio      TEXT,
  dataFine        TEXT,
  idPosizione     TEXT REFERENCES PosizioneGeografica(idPosizione),
  idAmministrazione TEXT REFERENCES AmministrazioneComunale(idAmministrazione)
);

-- --- Prenotazioni / Noleggi ----------------------------------------------------

CREATE TABLE IF NOT EXISTS Prenotazione (
  idPrenotazione    TEXT PRIMARY KEY,
  dataInizio        TEXT NOT NULL,
  oraInizio         TEXT NOT NULL,
  dataFine          TEXT,
  oraFine           TEXT,
  statoPrenotazione TEXT NOT NULL DEFAULT 'attiva', -- attiva | scaduta | annullata | convertita
  idUtente          TEXT NOT NULL REFERENCES Utente(idUtente),
  idMezzo           TEXT NOT NULL REFERENCES Mezzo(idMezzo)
);

CREATE TABLE IF NOT EXISTS Noleggio (
  idNoleggio     TEXT PRIMARY KEY,
  dataInizio     TEXT NOT NULL,
  oraInizio      TEXT NOT NULL,
  dataFine       TEXT,
  oraFine        TEXT,
  statoNoleggio  TEXT NOT NULL DEFAULT 'in_corso', -- in_corso | in_pausa | concluso | annullato
  costoFinale    REAL,
  idUtente       TEXT NOT NULL REFERENCES Utente(idUtente),
  idMezzo        TEXT NOT NULL REFERENCES Mezzo(idMezzo),
  idPrenotazione TEXT REFERENCES Prenotazione(idPrenotazione),
  idPercorso     TEXT REFERENCES Percorso(idPercorso),
  inizioTs       TEXT,    -- [EXT] timestamp ISO per calcolo durata/costo
  fineTs         TEXT,    -- [EXT] timestamp ISO
  secondiAccumulati INTEGER NOT NULL DEFAULT 0, -- [EXT] tempo attivo accumulato (esclude le pause)
  ultimaRipresaTs   TEXT                          -- [EXT] inizio del segmento attivo corrente (NULL se in pausa)
);

-- --- Pagamenti / Incentivi -----------------------------------------------------

CREATE TABLE IF NOT EXISTS Pagamento (
  idPagamento    TEXT PRIMARY KEY,
  importo        REAL NOT NULL,
  dataPagamento  TEXT,
  oraPagamento   TEXT,
  statoPagamento TEXT NOT NULL DEFAULT 'in_attesa', -- completato | in_attesa | rifiutato
  tipoPagamento  TEXT,
  idUtente       TEXT NOT NULL REFERENCES Utente(idUtente),
  idMetodo       TEXT REFERENCES MetodoPagamento(idMetodo),
  idNoleggio     TEXT REFERENCES Noleggio(idNoleggio)
);

CREATE TABLE IF NOT EXISTS Incentivo (
  idIncentivo    TEXT PRIMARY KEY,
  tipoIncentivo  TEXT,
  valore         REAL,
  unitaValore    TEXT NOT NULL DEFAULT 'euro', -- [EXT] 'euro' (sconto diretto) | 'percentuale'
  statoIncentivo TEXT NOT NULL DEFAULT 'attivo',
  descrizione    TEXT,
  idUtente       TEXT REFERENCES Utente(idUtente),
  idAmministrazione TEXT REFERENCES AmministrazioneComunale(idAmministrazione)
);

-- --- Assistenza / Segnalazioni / Manutenzione ----------------------------------

CREATE TABLE IF NOT EXISTS RichiestAssistenza (
  idRichiesta    TEXT PRIMARY KEY,
  descrizione    TEXT NOT NULL,
  statoRichiesta TEXT NOT NULL DEFAULT 'aperta', -- aperta | in_gestione | chiusa
  dataInvio      TEXT,
  oraInvio       TEXT,
  idUtente       TEXT NOT NULL REFERENCES Utente(idUtente),
  idOperatore    TEXT REFERENCES Operatore(idOperatore),
  idPosizione    TEXT REFERENCES PosizioneGeografica(idPosizione)
);

CREATE TABLE IF NOT EXISTS SegnalazioneGuasto (
  idSegnalazione   TEXT PRIMARY KEY,
  dataSegnalazione TEXT,
  oraSegnalazione  TEXT,
  statoSegnalazione TEXT NOT NULL DEFAULT 'aperta', -- aperta | in_gestione | chiusa
  descrizione      TEXT NOT NULL,
  idUtente         TEXT NOT NULL REFERENCES Utente(idUtente),
  idMezzo          TEXT NOT NULL REFERENCES Mezzo(idMezzo),
  idOperatore      TEXT REFERENCES Operatore(idOperatore)
);

CREATE TABLE IF NOT EXISTS Manutenzione (
  idManutenzione   TEXT PRIMARY KEY,
  statoManutenzione TEXT NOT NULL DEFAULT 'aperta', -- aperta | in_corso | chiusa
  descrizione      TEXT,
  dataApertura     TEXT,
  dataChiusura     TEXT,
  idMezzo          TEXT NOT NULL REFERENCES Mezzo(idMezzo),
  idOperatore      TEXT REFERENCES Operatore(idOperatore),
  idSegnalazione   TEXT REFERENCES SegnalazioneGuasto(idSegnalazione)
);

-- --- Report --------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS Report (
  idReport        TEXT PRIMARY KEY,
  tipoReport      TEXT,
  periodoRiferimento TEXT,
  dataGenerazione TEXT,
  risultatiAnalisi TEXT,
  idAmministrazione TEXT REFERENCES AmministrazioneComunale(idAmministrazione)
);

-- --- Associazioni N:N percorso -------------------------------------------------

CREATE TABLE IF NOT EXISTS Percorso_AreaLimitata (
  idPercorso TEXT NOT NULL REFERENCES Percorso(idPercorso),
  idArea     TEXT NOT NULL REFERENCES AreaLimitata(idArea),
  PRIMARY KEY (idPercorso, idArea)
);

CREATE TABLE IF NOT EXISTS Percorso_ZonaCritica (
  idPercorso    TEXT NOT NULL REFERENCES Percorso(idPercorso),
  idZonaCritica TEXT NOT NULL REFERENCES ZonaCritica(idZonaCritica),
  PRIMARY KEY (idPercorso, idZonaCritica)
);

CREATE TABLE IF NOT EXISTS Percorso_StazioneRicarica (
  idPercorso TEXT NOT NULL REFERENCES Percorso(idPercorso),
  idStazione TEXT NOT NULL REFERENCES StazioneRicarica(idStazione),
  PRIMARY KEY (idPercorso, idStazione)
);

-- --- [EXT] Estensione non presente nel modello logico --------------------------
-- Messaggio: necessario per la chat assistenza (UC "Avviare chat assistenza", UT.10).
-- Proposta di modifica al diagramma delle classi / modello logico (vedi docs/CHANGES.md).
CREATE TABLE IF NOT EXISTS Messaggio (
  idMessaggio  TEXT PRIMARY KEY,
  idRichiesta  TEXT NOT NULL REFERENCES RichiestAssistenza(idRichiesta),
  mittente     TEXT NOT NULL,    -- 'utente' | 'operatore'
  testo        TEXT NOT NULL,
  timestamp    TEXT NOT NULL
);
