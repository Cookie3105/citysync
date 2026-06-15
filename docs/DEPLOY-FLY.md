# Deploy del Server su Fly.io (pubblico, con DB persistente)

Rende il server **raggiungibile da ovunque** con un URL fisso (es.
`https://citysync-server.fly.dev`), online anche a PC spento. Il database SQLite vive
su un **volume persistente**, quindi registrazioni e noleggi non si perdono.

> Nota costi: Fly.io è pay-as-you-go. Un'app piccola come questa con `auto_stop` consuma
> pochissimo; i nuovi account hanno un credito di prova. Tienilo a mente.

File già pronti in `server/`: [`Dockerfile`](../server/Dockerfile), [`fly.toml`](../server/fly.toml),
[`.dockerignore`](../server/.dockerignore). Il server legge il path del DB da
`CITYSYNC_DB` (impostato a `/data/citysync.db`, sul volume).

---

## Passo 1 — Installa flyctl e accedi
Windows (PowerShell):
```powershell
iwr https://fly.io/install.ps1 -useb | iex
```
Poi:
```powershell
fly auth signup    # oppure: fly auth login
```
(Se `fly` non è riconosciuto, chiudi e riapri il terminale.)

## Passo 2 — Crea l'app e il volume
```powershell
cd server
fly apps create citysync-server
fly volumes create citysync_data -a citysync-server -r fra -n 1 -s 1 -y
```
> Se il nome `citysync-server` è già in uso, scegline un altro e **aggiornalo** in
> `server/fly.toml` (riga `app = "..."`) e in `mobile/eas.json`.

## Passo 3 — Deploy
```powershell
fly deploy -a citysync-server
```
La build avviene nel cloud (non serve Docker installato). Al termine il server è online.

## Passo 4 — Verifica
```powershell
fly open -a citysync-server          # apre l'URL nel browser
```
Controlla `https://citysync-server.fly.dev/api/health` → `{"ok":true,...}`.
Log in tempo reale: `fly logs -a citysync-server`.

---

## Collegare i client all'URL pubblico

### App mobile (APK)
In [`mobile/eas.json`](../mobile/eas.json), profilo `preview`, è già impostato:
```json
"env": { "EXPO_PUBLIC_API_URL": "https://citysync-server.fly.dev" }
```
(adegua l'URL se hai usato un altro nome app). Poi ricostruisci l'APK:
```powershell
cd mobile
eas build -p android --profile preview
```
L'APK così parlerà col server pubblico **da qualsiasi rete** (Wi-Fi o dati mobili),
anche a PC spento.

### App in sviluppo (Expo Go) verso il server pubblico
```powershell
cd mobile
$env:EXPO_PUBLIC_API_URL = "https://citysync-server.fly.dev"; npm start
```
(senza questa variabile, in locale l'app punta automaticamente al server sul tuo PC.)

### Client web operatore (opzionale)
```powershell
cd operator-web
$env:VITE_API_URL = "https://citysync-server.fly.dev"; npm run dev
```

---

## Comandi utili
| Comando | Cosa fa |
|---|---|
| `fly deploy -a citysync-server` | ridistribuisce dopo modifiche al codice |
| `fly logs -a citysync-server` | log in tempo reale |
| `fly status -a citysync-server` | stato macchine/volume |
| `fly ssh console -a citysync-server` | shell nel container |
| `fly scale memory 1024 -a citysync-server` | aumenta la RAM se serve |

## Ripopolare il DB sul server
Il DB si seed-a automaticamente solo se vuoto. Per forzare un reset:
```powershell
fly ssh console -a citysync-server -C "node --experimental-sqlite src/persistence/seed.js --reset"
```
