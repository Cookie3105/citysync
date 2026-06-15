# CitySync — Smart Mobility (Sprint 2)

Ecosistema digitale per la mobilità condivisa (bike / e-scooter / car sharing) del
Comune di Zootropolis. Progetto del corso di **Ingegneria del Software A.A. 2025-2026** —
team *Bit & Polpette*.

Questo repository contiene l'**Increment 1 dello Sprint 2**: l'app mobile utente
(Android/iOS) e il server con API REST e database, realizzati rispettando il
**diagramma delle componenti** e il **diagramma delle classi** della documentazione.

```
CitySync/
├── server/        Componente "Server": API Server + moduli di business + Persistenza (SQLite)
├── mobile/        Componente "Client": app Expo con login a ruolo — Utente, Operatore (src/operator/) e Amministrazione (src/admin/)
├── operator-web/  Componente "Client / Operatore": dashboard web alternativa (Vite + React)
└── docs/          Note di architettura e modifiche proposte ai diagrammi
```

L'estetica dell'app segue la reference "rider" (palette petrol/teal su sfondo chiaro,
card arrotondate, bottom sheet "Scegli un mezzo").

---

## Architettura

Architettura **Client-Server** come da sez. 2.3 della documentazione.

| Componente (diagramma) | Realizzazione |
|---|---|
| Client · Utente | `mobile/` — app Expo React Native (login come Utente) |
| Client · Operatore | `mobile/src/operator/` — dashboard nativa nell'app (login come Operatore); in alternativa `operator-web/` |
| Client · Amm. Comunale | `mobile/src/admin/` — dashboard nativa nell'app (login come Comune) |
| API Server (RichiestaClient / RispostaClient) | `server/src/app.js` + `server/src/routes.js` |
| Moduli di business (Gestione Mezzi, Noleggi, …) | `server/src/modules/*` |
| EntitaMobility | `server/src/domain/*` + entità persistite |
| Persistenza (IPersistenza) | `server/src/persistence/*` (SQLite via `node:sqlite`) |
| Servizio Mappe/GPS (IMapProvider) | `server/src/external/mapProvider.js` (OSM) |
| Gateway Pagamenti (IPaymentGateway) | `server/src/external/paymentGateway.js` *(placeholder)* |
| Dispositivi IoT (IServiziMezzo) | `server/src/external/serviziMezzo.js` *(placeholder)* |

> Le modifiche apportate ai diagrammi (es. entità `Messaggio` per la chat) sono
> elencate in [`docs/CHANGES.md`](docs/CHANGES.md).

---

## Prerequisiti

- **Node.js ≥ 22.5** (usa il modulo nativo `node:sqlite`, nessuna dipendenza nativa da compilare).
- Per provare l'app su telefono: app **Expo Go** (Android/iOS) e PC + telefono sulla **stessa rete Wi-Fi**.

---

## 1) Avvio del Server

```bash
cd server
npm install
npm run seed     # crea e popola il database (solo la prima volta)
npm start        # avvia l'API Server su http://localhost:4000
```

- API base: `http://localhost:4000/api` — health check: `GET /api/health`
- Per ripopolare il DB da zero: `npm run reset`

Credenziali demo:
- **Utente**: `mario.rossi@example.com` / `password`
- **Operatore**: `operatore@citysync.it` / `password`
- **Amministrazione Comunale**: `admin@comune.bari.it` / `password`

### Server pubblico (raggiungibile ovunque)

Per usare l'app da qualsiasi rete (es. APK su dati mobili) senza dipendere dall'IP del PC,
il server si può pubblicare su **Fly.io** con database **persistente**: URL fisso
(`https://citysync-server.fly.dev`), online anche a PC spento. Guida passo-passo:
[`docs/DEPLOY-FLY.md`](docs/DEPLOY-FLY.md). I client leggono l'URL da
`EXPO_PUBLIC_API_URL` (mobile) / `VITE_API_URL` (web).

## 2) Avvio dell'App mobile

```bash
cd mobile
npm install
npm start        # avvia Expo: mostra un QR code
```

Poi:
- **Telefono**: apri **Expo Go** e inquadra il QR. L'app rileva automaticamente
  l'IP del PC (deve essere avviato il server al punto 1).
- **Emulatore**: premi `a` (Android) o `i` (iOS) nel terminale Expo.

> **Login a ruolo**: nella schermata di accesso scegli **Utente**, **Operatore** o **Comune**.
> Utente → esperienza di noleggio; Operatore → dashboard flotta (OP.*); Comune → report e
> gestione mobilità (AP.*). Tutto dentro la stessa app, senza servizi esterni.

> **Multi-utente e dati condivisi**: dalla schermata Utente puoi **Registrarti** e creare
> più account. Tutti i client (più telefoni, web, ruoli diversi) leggono lo **stesso stato**
> dal server e la mappa si **aggiorna dal vivo** ogni pochi secondi: se un utente prenota un
> mezzo, sparisce subito dalla mappa degli altri e dalla console Operatore. La mappa mostra
> sempre l'intera flotta condivisa (non più solo i mezzi entro un raggio dalla tua posizione).

> L'app deriva l'indirizzo del server dall'host del dev-server Expo. Per forzarlo
> manualmente: `EXPO_PUBLIC_API_URL=http://<IP-PC>:4000 npm start`.

### Eseguire sul PC a dimensioni "telefono" (senza emulatore)

Se non riesci ad avviarla sul telefono, puoi provarla nel **browser** del PC:

```bash
cd mobile
npm run web        # apre http://localhost:8081 nel browser
```

Poi apri gli **strumenti per sviluppatori** del browser e attiva la vista mobile:
- Chrome/Edge: `F12` → icona "Toggle device toolbar" (`Ctrl + Shift + M`) → scegli un
  telefono (es. *iPhone 12 Pro* o *Pixel 7*).

Note sulla modalità web:
- La mappa usa **Leaflet/OpenStreetMap** (come sul telefono): su web tramite
  `react-leaflet`, su dispositivo tramite WebView. Nessuna chiave Google necessaria.
- Sul web l'API è raggiunta su `http://localhost:4000` (server sullo stesso PC).

### Problemi a connettere il telefono?

Quasi sempre è il firewall di Windows o la rete che blocca la connessione tra
telefono e PC. Soluzione più affidabile (funziona anche su reti diverse):

```bash
cd mobile
npm run tunnel     # = expo start --tunnel  (la prima volta installa @expo/ngrok)
```

In alternativa, con la modalità normale: PC e telefono sulla **stessa Wi-Fi** e
consenti a Node.js nel firewall di Windows. Con il tunnel l'app non riesce a
dedurre l'IP del PC: imposta il server con
`EXPO_PUBLIC_API_URL=http://<IP-PC>:4000` (vedi sopra).

## 3) Avvio del Client web Operatore

Dashboard web per l'Operatore del servizio (gira nel browser sul PC).

```bash
cd operator-web
npm install
npm run dev        # http://localhost:5173
```

Richiede il **server avviato** (punto 1). Login con le credenziali operatore
(`operatore@citysync.it` / `password`). Sezioni: Dashboard (mappa flotta + batteria),
Flotta, Prenotazioni, Segnalazioni, Manutenzione, Assistenza, Parcheggi.

> Se il server non è su `localhost:4000`, imposta `VITE_API_URL` (es.
> `VITE_API_URL=http://192.168.1.10:4000 npm run dev`).

---

## Copertura Sprint 2

Tutti gli item dello Sprint Backlog hanno endpoint nel server, con UI nell'app
utente (UT.*) o nella dashboard Operatore (OP.*).

| Item | Caso d'uso | Server (modulo) | Client |
|---|---|---|---|
| UT.01 | Visualizzare mezzi disponibili | mezzi | 📱 Mappa |
| UT.06 | Caratteristiche tecniche | mezzi | 📱 Dettaglio mezzo |
| UT.12 | Stato batteria/carburante | mezzi | 📱 Dettaglio mezzo |
| UT.02 | Prenotare mezzo | prenotazioni | 📱 |
| UT.03 | Stima costo corsa | noleggi | 📱 Dettaglio mezzo |
| UT.13 | Avviare noleggio (sblocco) | noleggi | 📱 |
| UT.15 | Mettere in pausa la corsa | noleggi | 📱 Corsa in corso |
| UT.04 | Terminare noleggio | noleggi | 📱 |
| UT.05 | Riepilogo costo | noleggi | 📱 |
| UT.20 | Storico noleggi | noleggi | 📱 Storico |
| UT.14 | Gestire metodo di pagamento | pagamenti | 📱 Profilo › Pagamenti |
| UT.11 | Segnalare guasto | assistenza | 📱 |
| UT.21 | Richiedere assistenza | assistenza | 📱 Assistenza |
| UT.10 | Chat servizio clienti | assistenza | 📱 Chat ↔ 🖥️ Assistenza |
| OP.14 | Registrare nuovo mezzo | mezzi | 🖥️ Flotta |
| OP.13 | Aggiornare stato mezzo | mezzi | 🖥️ Flotta |
| OP.11 | Controllare prenotazioni | prenotazioni | 🖥️ Prenotazioni |
| OP.04 | Verificare parcheggio | monitoraggio | 🖥️ Parcheggi |
| OP.05 | Posizione fine noleggio | monitoraggio | 🖥️ Parcheggi |
| OP.03 | Gestire segnalazioni | assistenza | 🖥️ Segnalazioni |
| OP.06 | Gestire manutenzione | manutenzione | 🖥️ Manutenzione |
| OP.12 | Monitorare batteria flotta | monitoraggio | 🖥️ Dashboard |
| OP.01 | Monitorare flotta | monitoraggio | 🖥️ Dashboard |
| OP.07 | Gestire richieste assistenza | assistenza | 🖥️ Assistenza |
| OP.10 | Bloccare mezzo da remoto | monitoraggio | 🖥️ Flotta |

Item **Amministrazione Comunale** (AP.*, anticipati dallo Sprint 3):

| Item | Caso d'uso | Server (modulo) | Client |
|---|---|---|---|
| AP01 | Consultare report mobilità | report | 🏛️ Report |
| AP05 | Analizzare tratte/fasce | report | 🏛️ Report |
| AP03 | Analizzare stato mezzi | report | 🏛️ Mezzi |
| AP04 | Segnalare criticità urbane | aree | 🏛️ Zone |
| AP06 | Definire zone limitate | aree | 🏛️ Zone |
| AP07 | Gestire incentivi | incentivi | 🏛️ Incentivi |

Item **Sprint 3** (completati):

| Item | Caso d'uso | Server (modulo) | Client |
|---|---|---|---|
| UT.07 | Gestire profilo + patente | utenti | 📱 Profilo › Modifica/Patente |
| UT.08 | Percorso consigliato | percorsi | 📱 Mappa › Percorso |
| UT.18 | Aree limitate sulla mappa | percorsi/aree | 📱 Mappa/Percorso |
| UT.17 | Stazioni di ricarica sul percorso | percorsi | 📱 Percorso |
| UT.16 | Prenotazione multipla | prenotazioni | 📱 Mappa › Multi |
| UT.19 | Portafoglio + ricarica | pagamenti | 📱 Profilo › Portafoglio |
| UT.09 | Promozioni e bonus | incentivi | 📱 Profilo › Promozioni |
| OP.08 | Assegnare bonus parcheggio | incentivi/monitoraggio | 🖥️ Altro › Bonus |
| OP.09 | Sospendere/bloccare account | utenti | 🖥️ Altro › Account |

Legenda: 📱 app utente · 🖥️ dashboard Operatore · 🏛️ dashboard Comune (tutte nell'app mobile).

Vedi l'elenco completo degli endpoint in [`docs/API.md`](docs/API.md).

---

## Placeholder e correzioni successive

Moduli volutamente lasciati come **placeholder** (segnalati nel codice):

- `IPaymentGateway` — verifica/addebito/ricarica simulati (validazione carta con Luhn reale).
- `IServiziMezzo` (IoT) — comandi smart-lock e telemetria simulati.
- Chat: l'Operatore risponde realmente (dashboard nell'app o `operator-web`); l'app utente
  mantiene una risposta automatica di cortesia come fallback demo.
- Percorso (UT.08): tracciato in linea d'aria con fattore urbano; le "tratte" dei report
  (AP05) sono approssimate da fasce orarie (no tracciamento GPS dei percorsi). Vedi
  [`docs/CHANGES.md`](docs/CHANGES.md).

**Tutti gli item del Product Backlog (Sprint 2 e Sprint 3) sono implementati.** Le attività
successive riguardano correzioni e migliorie (integrazione reale di pagamenti/IoT, rifiniture
UI, test).
