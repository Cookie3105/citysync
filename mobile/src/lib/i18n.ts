// Internazionalizzazione (IUI.02). Approccio "italiano-come-chiave": le stringhe
// italiane sono le chiavi; per l'inglese si cerca nel dizionario `en` e, se manca,
// si ricade sull'italiano (nessuna stringa resta vuota). t() supporta semplici
// segnaposto {nome} sostituiti dai valori passati.
//
// Il dizionario è composto da blocchi tematici uniti con lo spread: eventuali
// chiavi ripetute fra blocchi diversi non danno errore (vince l'ultima).

export type Lingua = 'it' | 'en';

const comuni: Record<string, string> = {
  'Annulla': 'Cancel',
  'Conferma': 'Confirm',
  'Indietro': 'Back',
  'Salva': 'Save',
  'Errore': 'Error',
  'Riprova': 'Retry',
  'Chiudi': 'Close',
  'Fatto': 'Done',
  'Rimuovi': 'Remove',
  'Termina': 'End',
  'Avvia': 'Start',
  'Prenota': 'Book',
  'al minuto': 'per minute',
  'min': 'min',
  // Stati
  'concluso': 'completed',
  'in corso': 'in progress',
  'in pausa': 'paused',
  'annullato': 'cancelled',
  'aperta': 'open',
  'in gestione': 'in progress',
  'chiusa': 'closed',
  'completato': 'completed',
  'verificata': 'verified',
  'in attesa': 'pending',
  'rifiutata': 'rejected',
};

const nav: Record<string, string> = {
  'Mappa': 'Map',
  'Storico': 'History',
  'Assistenza': 'Support',
  'Profilo': 'Profile',
};

const profilo: Record<string, string> = {
  'Modifica profilo': 'Edit profile',
  'Patente di guida': 'Driving licence',
  'Metodo di pagamento': 'Payment method',
  'Promozioni e bonus': 'Promotions & bonuses',
  'Lingua e tema': 'Language & theme',
  'Portafoglio digitale': 'Digital wallet',
  'Ricarica ›': 'Top up ›',
  'Esci': 'Log out',
};

const impostazioni: Record<string, string> = {
  'Impostazioni': 'Settings',
  'Lingua': 'Language',
  'Tema': 'Theme',
  'Italiano': 'Italian',
  'Inglese': 'English',
  'Chiaro': 'Light',
  'Scuro': 'Dark',
  'Aspetto': 'Appearance',
  'Anteprima': 'Preview',
  'Scegli la lingua dell’app': 'Choose the app language',
  'Scegli l’aspetto dell’app': 'Choose the app appearance',
  'Le preferenze vengono salvate sul dispositivo.': 'Preferences are saved on this device.',
};

const mappa: Record<string, string> = {
  'Scegli un mezzo': 'Choose a vehicle',
  'Seleziona i mezzi': 'Select vehicles',
  'Mostra elenco mezzi': 'Show vehicle list',
  'Mostra dettaglio': 'Show details',
  'Percorso': 'Route',
  'Multi': 'Multi',
  'Consigliato': 'Recommended',
  'Più vicino': 'Nearest',
  'Economico': 'Cheapest',
  'Nessun mezzo disponibile nelle vicinanze': 'No vehicles available nearby',
  'Corsa in corso': 'Ride in progress',
  'Prenotato': 'Booked',
  'Riservato per te': 'Reserved for you',
  'Avvia noleggio': 'Start rental',
  'Prenotazione confermata': 'Booking confirmed',
  'Prenotazione non riuscita': 'Booking failed',
  'Impossibile avviare': 'Unable to start',
  'Autonomia residua': 'Remaining range',
  'Caratteristiche': 'Specs',
  'Segnala un guasto su questo mezzo': 'Report a fault on this vehicle',
  'nelle vicinanze': 'nearby',
  'Seleziona almeno un mezzo': 'Select at least one vehicle',
  'Prenotazione multipla': 'Multiple booking',
  '{v} riservato per te per 15 minuti.': '{v} reserved for you for 15 minutes.',
  '{ok}/{tot} mezzi prenotati.': '{ok}/{tot} vehicles booked.',
  'Stima corsa (~{n} min)': 'Ride estimate (~{n} min)',
  'Prenota {n} mezzi': 'Book {n} vehicles',
  'Vel. max': 'Top speed',
  'Autonomia': 'Range',
  'Posti': 'Seats',
  'Peso': 'Weight',
  'Cambio': 'Gearbox',
  'Modello': 'Model',
};

const corsa: Record<string, string> = {
  'Costo attuale': 'Current cost',
  'durata corsa': 'ride duration',
  'Sblocco': 'Unlock fee',
  'Metti in pausa': 'Pause',
  'Riprendi la corsa': 'Resume ride',
  'Termina noleggio': 'End rental',
  'In pausa': 'Paused',
  'Attiva': 'Active',
  'Terminare la corsa?': 'End the ride?',
  'Il mezzo verrà bloccato e riceverai il riepilogo del costo.': 'The vehicle will be locked and you will get the cost summary.',
  'Operazione non riuscita': 'Operation failed',
};

const riepilogo: Record<string, string> = {
  'Corsa conclusa': 'Ride completed',
  'Riepilogo corsa': 'Ride summary',
  'Dettaglio costo': 'Cost breakdown',
  'Totale': 'Total',
  'Corsa': 'Ride',
  'Inizio': 'Start',
  'Fine': 'End',
  'Durata': 'Duration',
  'Posizione finale': 'Final position',
  'Pagamento': 'Payment',
  'Completato': 'Completed',
  'In attesa': 'Pending',
  'Torna alla mappa': 'Back to map',
  'Riepilogo non disponibile': 'Summary not available',
  'Tempo ({n} min × {p})': 'Time ({n} min × {p})',
};

const storico: Record<string, string> = {
  'Storico noleggi': 'Rental history',
  'Nessun noleggio': 'No rentals',
  'Le tue corse appariranno qui': 'Your rides will appear here',
  'Totale speso ({n} corse)': 'Total spent ({n} rides)',
};

const assistenza: Record<string, string> = {
  'Le tue richieste': 'Your requests',
  'Nuova richiesta': 'New request',
  'Raccontaci il problema, ti risponderemo in chat': 'Tell us the problem, we will reply in chat',
  'Descrivi il problema…': 'Describe the problem…',
  'Invia la mia posizione': 'Send my location',
  '(non disponibile)': '(not available)',
  'Invia e apri chat': 'Send and open chat',
  'Nessuna richiesta inviata.': 'No requests sent.',
  'Descrizione mancante': 'Missing description',
  'Descrivi il problema.': 'Describe the problem.',
  'Invio non riuscito': 'Sending failed',
  'Chat assistenza': 'Support chat',
  'Scrivi un messaggio per iniziare la conversazione.': 'Write a message to start the conversation.',
  'Scrivi un messaggio…': 'Write a message…',
};

const portafoglio: Record<string, string> = {
  'Saldo disponibile': 'Available balance',
  'Ricarica': 'Top up',
  'Importo': 'Amount',
  'Importo non valido': 'Invalid amount',
  'Inserisci un importo maggiore di zero.': 'Enter an amount greater than zero.',
  'Ricarica effettuata': 'Top up successful',
  'Nuovo saldo: {v}.': 'New balance: {v}.',
  'Ricarica non riuscita': 'Top up failed',
  'Pagamento gestito tramite gateway esterno (IPaymentGateway).': 'Payment handled by an external gateway (IPaymentGateway).',
  'Storico pagamenti': 'Payment history',
  'Nessun pagamento registrato.': 'No payments recorded.',
};

const promo: Record<string, string> = {
  'Nessuna promozione': 'No promotions',
  'Qui vedrai bonus e convenzioni attive': 'Active bonuses and offers will appear here',
  'Valore: {v}': 'Value: {v}',
  'Tuo': 'Yours',
  'Promo': 'Promo',
};

const pagamenti: Record<string, string> = {
  'Aggiungi metodo': 'Add method',
  'Nessun metodo registrato.': 'No methods registered.',
  'Salva metodo': 'Save method',
  'Pagamenti gestiti tramite gateway esterno (IPaymentGateway).': 'Payments handled by an external gateway (IPaymentGateway).',
  'Intestatario': 'Cardholder',
  'Numero carta': 'Card number',
  'Carta': 'Card',
  'Salvato': 'Saved',
  'Metodo di pagamento registrato.': 'Payment method registered.',
  'Dati non validi': 'Invalid data',
  'Verifica i dati inseriti': 'Check the entered data',
  'Rimuovere il metodo?': 'Remove the method?',
  'Scad. {v}': 'Exp. {v}',
};

const editProfilo: Record<string, string> = {
  'Nome': 'First name',
  'Cognome': 'Last name',
  'Email': 'Email',
  'Telefono': 'Phone',
  'Salva modifiche': 'Save changes',
  'Salvataggio non riuscito': 'Save failed',
  'Profilo aggiornato.': 'Profile updated.',
  'Email: {v} (non modificabile)': 'Email: {v} (not editable)',
};

const patente: Record<string, string> = {
  'Numero patente': 'Licence number',
  'Categoria': 'Category',
  'Numero non valido': 'Invalid number',
  'Inserisci un numero patente valido.': 'Enter a valid licence number.',
  'Patente caricata': 'Licence uploaded',
  'Stato verifica: {v}.': 'Verification status: {v}.',
  'Caricamento non riuscito': 'Upload failed',
  'Aggiorna patente': 'Update licence',
  'Carica la patente': 'Upload your licence',
  'Carica patente': 'Upload licence',
  'Data di scadenza (AAAA-MM-GG)': 'Expiry date (YYYY-MM-DD)',
  'La verifica è simulata: una patente con scadenza futura risulta "verificata".': 'Verification is simulated: a licence with a future expiry is "verified".',
  'Scade il {v}': 'Expires on {v}',
  'Senza scadenza': 'No expiry',
};

const segnalazione: Record<string, string> = {
  'Segnala guasto': 'Report fault',
  'Descrivi brevemente il guasto.': 'Briefly describe the fault.',
  'Segnalazione inviata': 'Report sent',
  'Grazie! L\'operatore prenderà in carico il guasto.': 'Thank you! The operator will handle the fault.',
  'Mezzo {v}': 'Vehicle {v}',
  'Descrivi il problema riscontrato': 'Describe the issue found',
  'Descrizione del guasto': 'Fault description',
  'Es. il freno posteriore non risponde…': 'E.g. the rear brake does not respond…',
  'Invia segnalazione': 'Send report',
  'Freni difettosi': 'Faulty brakes',
  'Batteria non carica': 'Battery not charging',
  'Pneumatico a terra': 'Flat tyre',
  'Display non funziona': 'Display not working',
  'Danno alla carrozzeria': 'Body damage',
};

const percorso: Record<string, string> = {
  'Percorso consigliato': 'Suggested route',
  'Tocca la mappa per scegliere la destinazione': 'Tap the map to choose the destination',
  'Distanza': 'Distance',
  'Con avvisi': 'With warnings',
  '{n} stazioni di ricarica lungo il percorso': '{n} charging stations along the route',
  'Da: {da} → A: {a}': 'From: {da} → To: {a}',
  'Impossibile calcolare il percorso.': 'Unable to compute the route.',
  'Bici': 'Bike',
  'Scooter': 'Scooter',
  'Auto': 'Car',
};

const login: Record<string, string> = {
  'Accedi': 'Sign in',
  'Entra per trovare i mezzi vicino a te': 'Sign in to find vehicles near you',
  'Accesso Operatore': 'Operator access',
  'Console di gestione della flotta': 'Fleet management console',
  'Entra nella console': 'Enter the console',
  'Accesso Comune': 'City access',
  'Report e gestione della mobilità urbana': 'Urban mobility reports & management',
  'Entra': 'Enter',
  'Utente': 'User',
  'Operatore': 'Operator',
  'Comune': 'City',
  'Non hai un account?': "Don't have an account?",
  'Registrati': 'Sign up',
  'Hai già un account?': 'Already have an account?',
  'Crea account': 'Create account',
  'Registrati come utente CitySync': 'Sign up as a CitySync user',
  'Telefono (opzionale)': 'Phone (optional)',
  'Password': 'Password',
  'Demo: {v} / password': 'Demo: {v} / password',
  'Accesso non riuscito': 'Sign in failed',
  'Registrazione non riuscita': 'Sign up failed',
};

const en: Record<string, string> = {
  ...comuni, ...nav, ...profilo, ...impostazioni, ...mappa, ...corsa, ...riepilogo,
  ...storico, ...assistenza, ...portafoglio, ...promo, ...pagamenti, ...editProfilo,
  ...patente, ...segnalazione, ...percorso, ...login,
};

export function translate(lang: Lingua, key: string, params?: Record<string, string | number>): string {
  let s = lang === 'en' ? (en[key] ?? key) : key;
  if (params) {
    for (const k of Object.keys(params)) {
      s = s.replace(new RegExp(`\\{${k}\\}`, 'g'), String(params[k]));
    }
  }
  return s;
}
