// Componente: Gestione Pagamenti ed Incentivi.
// Caso d'uso: UT.14 (gestire metodo di pagamento) + portafoglio e storico pagamenti.
const { all, get, run } = require('../../persistence/db');
const { genId, badRequest, notFound } = require('../../lib/util');
const { IPaymentGateway } = require('../../external/paymentGateway');

// UT.14 punto 2 - metodo di pagamento registrato (se presente).
function getMetodi(idUtente) {
  return all(`SELECT idMetodo, tipoMetodo, intestatario, scadenza, statoMetodo FROM MetodoPagamento WHERE idUtente = ?`, idUtente);
}

// UT.14 - registra/aggiorna metodo di pagamento (con verifica dati, scenario A1).
function salvaMetodo(idUtente, dati) {
  if (!idUtente) throw badRequest('idUtente obbligatorio');
  // verificaMetodo() tramite gateway (scenario A1: dati non validi).
  const verifica = IPaymentGateway.verificaMetodo(dati);
  if (!verifica.valido) {
    throw badRequest(`Dati del metodo di pagamento non validi: ${verifica.errori.join('; ')}`);
  }
  const intestatario = dati.intestatario.trim();
  if (dati.idMetodo) {
    const esiste = get(`SELECT idMetodo FROM MetodoPagamento WHERE idMetodo = ? AND idUtente = ?`, dati.idMetodo, idUtente);
    if (!esiste) throw notFound('Metodo di pagamento non trovato');
    run(`UPDATE MetodoPagamento SET tipoMetodo = ?, intestatario = ?, scadenza = ?, statoMetodo = 'attivo' WHERE idMetodo = ?`,
      dati.tipoMetodo, intestatario, dati.scadenza || null, dati.idMetodo);
    return get(`SELECT idMetodo, tipoMetodo, intestatario, scadenza, statoMetodo FROM MetodoPagamento WHERE idMetodo = ?`, dati.idMetodo);
  }
  const id = genId('MET');
  run(`INSERT INTO MetodoPagamento (idMetodo, tipoMetodo, intestatario, scadenza, statoMetodo, idUtente)
       VALUES (?,?,?,?,?,?)`, id, dati.tipoMetodo, intestatario, dati.scadenza || null, 'attivo', idUtente);
  return get(`SELECT idMetodo, tipoMetodo, intestatario, scadenza, statoMetodo FROM MetodoPagamento WHERE idMetodo = ?`, id);
}

function rimuoviMetodo(idUtente, idMetodo) {
  const esiste = get(`SELECT idMetodo FROM MetodoPagamento WHERE idMetodo = ? AND idUtente = ?`, idMetodo, idUtente);
  if (!esiste) throw notFound('Metodo di pagamento non trovato');
  run(`DELETE FROM MetodoPagamento WHERE idMetodo = ?`, idMetodo);
  return { rimosso: true, idMetodo };
}

function getPortafoglio(idUtente) {
  let p = get(`SELECT idPortafoglio, saldo FROM PortafoglioDigitale WHERE idUtente = ?`, idUtente);
  if (!p) {
    const id = genId('PRT');
    run(`INSERT INTO PortafoglioDigitale (idPortafoglio, saldo, idUtente) VALUES (?,?,?)`, id, 0, idUtente);
    p = { idPortafoglio: id, saldo: 0 };
  }
  return p;
}

function storicoPagamenti(idUtente) {
  return all(
    `SELECT idPagamento, importo, dataPagamento, oraPagamento, statoPagamento, tipoPagamento, idNoleggio
     FROM Pagamento WHERE idUtente = ? ORDER BY dataPagamento DESC, oraPagamento DESC`, idUtente);
}

// UT.19 - ricaricare() il portafoglio digitale tramite gateway (placeholder).
async function ricaricaPortafoglio(idUtente, importo) {
  const imp = Number(importo);
  if (!(imp > 0)) throw badRequest('Importo non valido');
  const p = getPortafoglio(idUtente);
  const esito = await IPaymentGateway.ricaricaPortafoglio({ importo: imp });
  if (!esito.ok) throw badRequest(esito.motivo || 'Ricarica non riuscita');
  const nuovoSaldo = +(p.saldo + imp).toFixed(2);
  run(`UPDATE PortafoglioDigitale SET saldo = ? WHERE idUtente = ?`, nuovoSaldo, idUtente);
  return { idPortafoglio: p.idPortafoglio, saldo: nuovoSaldo, transazione: esito.transazioneId };
}

module.exports = { getMetodi, salvaMetodo, rimuoviMetodo, getPortafoglio, storicoPagamenti, ricaricaPortafoglio };
