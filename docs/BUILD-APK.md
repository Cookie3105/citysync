# Creare un APK dell'app utente (Android)

Sul PC non è installato l'Android SDK, quindi usiamo **EAS Build**: la build avviene
nel **cloud di Expo** (gratis) e produce un APK installabile sul telefono. Non serve
Android Studio.

## Prerequisiti
- Un account Expo gratuito → https://expo.dev/signup
- Node.js (già presente)

---

## Passo 1 — Installa EAS CLI ed effettua il login
```bash
cd mobile
npm install -g eas-cli      # oppure usa "npx eas-cli@latest <comando>"
eas login                   # inserisci le credenziali Expo
```

## Passo 2 — Collega il progetto al tuo account
```bash
eas init
```
Crea il progetto su Expo e scrive `extra.eas.projectId` in `app.json`. Conferma quando chiede.

## Passo 3 — Controlla l'indirizzo del server
L'APK gira **senza Metro**, quindi deve sapere dove trovare il server. In
[`eas.json`](../mobile/eas.json) ci sono due profili:
- **`preview`** → server pubblico Fly.io: `"EXPO_PUBLIC_API_URL": "https://citysync-server.fly.dev"`
  (consigliato: funziona da qualsiasi rete, anche dati mobili). Prima fai il deploy:
  vedi [`DEPLOY-FLY.md`](DEPLOY-FLY.md).
- **`preview-locale`** → server sul tuo PC in LAN: `http://192.168.1.102:4000`
  (richiede stessa Wi-Fi; se l'IP cambia aggiornalo, `ipconfig` → "Indirizzo IPv4").

Scegli il profilo nel Passo 5.

## Passo 4 — (Mappa) Nessuna chiave necessaria ✅
La mappa usa **Leaflet + OpenStreetMap** dentro una WebView ([`AppMap.tsx`](../mobile/src/components/AppMap.tsx)),
quindi **non serve alcuna chiave Google Maps**. Richiede solo connessione internet sul
telefono (per scaricare i tile OSM).

## Passo 5 — Avvia la build dell'APK
```bash
eas build -p android --profile preview          # server pubblico Fly.io (consigliato)
# oppure, per il server sul tuo PC in LAN:
eas build -p android --profile preview-locale
```
La build parte nel cloud (~10–15 min). Al termine ottieni un **link** (e un QR) per
scaricare l'`.apk`.

## Passo 6 — Installa sul telefono
1. Apri il link/QR sul telefono e scarica l'APK.
2. Consenti "Installa da origini sconosciute" se richiesto.
3. Installa e apri l'app.

## Passo 7 — Collega al server
- **Profilo `preview` (Fly.io)**: nessuna configurazione — l'APK parla col server pubblico
  da qualsiasi rete (Wi-Fi o dati mobili), anche a PC spento. Basta aver fatto il deploy.
- **Profilo `preview-locale` (PC in LAN)**: avvia `cd server && npm start`, telefono e PC
  sulla **stessa Wi-Fi**, e consenti Node nel firewall di Windows.

---

## Riepilogo limiti
- Con `preview` (Fly.io) l'URL è fisso: niente da aggiornare se cambi rete.
- Con `preview-locale` l'IP del PC è "incollato" al momento della build: cambi rete → ricostruisci.
- La mappa (Leaflet/OSM) richiede internet sul telefono per i tile.

## Alternative
- **iOS**: `eas build -p ios --profile preview` richiede un account Apple Developer; in
  alternativa usa Expo Go o un simulatore su Mac.
- **Build locale** (richiede Android SDK + JDK): `npx expo prebuild` poi
  `cd android && ./gradlew assembleRelease` → APK in `android/app/build/outputs/apk/`.
