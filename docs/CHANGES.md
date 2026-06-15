# Modifiche proposte ai diagrammi (Sprint 2 — Increment 1)

Durante l'implementazione sono emerse alcune lacune/ambiguità rispetto al
**Diagramma delle Classi**, al **Modello logico del DB** e al **Diagramma delle
Componenti**. Di seguito le modifiche apportate o **proposte**, da recepire nei
diagrammi. Nel codice e nello schema SQL i punti aggiunti sono marcati con `[EXT]`.

---

## 1. Nuova entità `Messaggio` (chat) — **da aggiungere**

Il caso d'uso **UT.10 "Avviare chat con il servizio clienti"** e l'operazione
`RichiestAssistenza.avviaChatAssistenza()` richiedono di memorizzare i messaggi
scambiati, ma **non esiste un'entità Messaggio** né nel diagramma delle classi né
nel modello logico.

**Proposta** — aggiungere l'entità, associata 1..* a `RichiestAssistenza`
(componente *Gestione Assistenza e Segnalazioni*):

```
Messaggio (idMessaggio PK; idRichiesta FK → RichiestAssistenza; mittente;
           testo; timestamp)
```

Implementata in `schema.sql` (tabella `Messaggio`) e in
`modules/assistenza/assistenza.service.js`.

---

## 2. `AreaLimitata.raggioMetri` — **attributo aggiunto**

Per i casi **UT.04** (termine in area consentita) e **OP.04** (verifica
parcheggio) serve una geometria dell'area. Il modello collega `AreaLimitata` a una
sola `PosizioneGeografica` (un punto), insufficiente a definire una zona.

**Scelta implementativa** — area modellata come **cerchio** (centro = posizione,
+ `raggioMetri`). Aggiunto l'attributo `raggioMetri` ad `AreaLimitata`.
In futuro si può sostituire con una geometria poligonale (GeoJSON).

---

## 3. `Noleggio.inizioTs` / `Noleggio.fineTs` — **campi tecnici aggiunti**

Il dominio modella inizio/fine come coppie `dataInizio`+`oraInizio` /
`dataFine`+`oraFine`. Per il calcolo preciso di durata e costo (UT.05) sono stati
aggiunti due campi timestamp ISO ausiliari (`inizioTs`, `fineTs`).
Sono **derivabili** dai campi data/ora di dominio: opzionali, non alterano il
modello concettuale.

---

## 4. Stati aggiuntivi negli enum — **da recepire**

- `Mezzo.statOperativo`: aggiunto il valore **`bloccato`**, necessario per
  **OP.10 "Bloccare mezzo da remoto"** (distinto da `fuori_servizio` e
  `in_manutenzione`). Il Glossario elenca disponibile/prenotato/in uso/in
  manutenzione/fuori servizio: si propone di aggiungere *bloccato*.
- `Prenotazione.statoPrenotazione`: aggiunto **`convertita`** (prenotazione
  trasformata in noleggio all'avvio), oltre ad attiva/scaduta/annullata.

---

## 5. Diagramma delle Componenti — nessuna modifica strutturale

La realizzazione rispetta il diagramma:

- L'**API Server** è realizzato con Express; le interfacce *RichiestaClient*/
  *RispostaClient* corrispondono alle rotte REST `/api/**` e alle risposte JSON.
- I **moduli di business** mappano 1:1 le componenti applicative
  (`server/src/modules/{mezzi,prenotazioni,noleggi,pagamenti,assistenza,
  manutenzione,monitoraggio,aree,utenti}`).
- I **Servizi Esterni** sono isolati dietro le interfacce *IMapProvider*,
  *IPaymentGateway*, *IServiziMezzo* (`server/src/external/*`).
- I sotto-componenti Client **Operatore** e **Amministrazione Comunale** sono
  rinviati a un increment successivo (i relativi endpoint server esistono già).

---

## 6. Nota di sicurezza (non è una modifica ai diagrammi)

Le password degli attori sono in chiaro nel seed dimostrativo. In produzione
vanno **salate e hashate** (es. bcrypt) e l'autenticazione dovrebbe emettere un
token (es. JWT). Da pianificare quando si consoliderà *Gestione Utenti e Profili*.

---

## 7. AP05 "Analizzare tratte frequenti" — approssimazione

Il caso d'uso AP05 parla di "tratte e strade percorse con maggiore frequenza". Il
modello dati **non traccia i percorsi puntuali** dei noleggi (il campo
`Noleggio.idPercorso` resta in genere NULL nel flusso utente). Pertanto l'analisi
delle tratte è stata **approssimata** aggregando i noleggi per **fascia oraria** e
**tipologia di mezzo** (`GET /api/report/tratte`). Per tratte/strade reali servirebbe
il tracciamento GPS del percorso (item Sprint 3, UT.08 percorso consigliato).

## Stato di realizzazione delle entità (aggiornato)

Con il completamento dello **Sprint 3**, tutte le entità principali hanno un modulo
di business: `Report`/`Incentivo`/`AreaLimitata`/`ZonaCritica` (AP.*), `Patente`
(UT.07), `Percorso` (UT.08, con stazioni UT.17 e aree UT.18), `StazioneRicarica`
(UT.17, in lettura), `PortafoglioDigitale` (ricarica UT.19).

Le tabelle ponte `Percorso_AreaLimitata` / `Percorso_ZonaCritica` /
`Percorso_StazioneRicarica` esistono nello schema ma **non vengono persistite**: il
percorso è calcolato live (le aree/stazioni vicine sono restituite nella risposta,
non salvate come associazioni). È una semplificazione, non una mancanza funzionale.
