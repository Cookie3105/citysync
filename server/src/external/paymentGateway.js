// Servizio Esterno: Gateway Pagamenti - interfaccia IPaymentGateway.
// PLACEHOLDER (modulo difficile, da completare in un increment successivo).
// Simula verifica metodo, addebito e ricarica del portafoglio in modo
// deterministico, così da non bloccare i flussi che dipendono dal pagamento.
const { genId } = require('../lib/util');

const IPaymentGateway = {
  // Verifica formale del metodo di pagamento (UT.14, scenario A1 "dati non validi").
  verificaMetodo({ tipoMetodo, intestatario, numero, scadenza, cvv }) {
    const errori = [];
    if (!tipoMetodo) errori.push('tipoMetodo mancante');
    if (!intestatario || intestatario.trim().length < 2) errori.push('intestatario non valido');

    if (tipoMetodo === 'carta') {
      const num = String(numero || '').replace(/\s+/g, '');
      if (!/^\d{13,19}$/.test(num) || !luhnValido(num)) errori.push('numero carta non valido');
      if (!/^\d{2}\/\d{2}$/.test(String(scadenza || ''))) errori.push('scadenza non valida (MM/YY)');
      if (!/^\d{3,4}$/.test(String(cvv || ''))) errori.push('cvv non valido');
    }
    return { valido: errori.length === 0, errori };
  },

  // Esegue un addebito. Placeholder: sempre autorizzato (salvo importo non valido).
  async eseguiAddebito({ importo }) {
    if (!(importo >= 0)) return { ok: false, motivo: 'importo non valido' };
    return { ok: true, transazioneId: genId('TXN'), autorizzato: true };
  },

  // Ricarica del portafoglio digitale (IF-UT.19, Sprint 3). Placeholder.
  async ricaricaPortafoglio({ importo }) {
    if (!(importo > 0)) return { ok: false, motivo: 'importo non valido' };
    return { ok: true, transazioneId: genId('TXN') };
  },
};

// Algoritmo di Luhn per validazione numero carta.
function luhnValido(num) {
  let somma = 0;
  let alt = false;
  for (let i = num.length - 1; i >= 0; i--) {
    let n = Number(num[i]);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    somma += n;
    alt = !alt;
  }
  return somma % 10 === 0;
}

module.exports = { IPaymentGateway };
