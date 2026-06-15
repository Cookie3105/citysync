// Componente: Gestione Utenti e Profili.
// Autenticazione (autenticarsi) e gestione profilo (UT.07 base).
// NB: per il primo increment le password sono in chiaro nel seed; in produzione
// andrebbero salate/hashate (es. bcrypt). Vedi docs/CHANGES.md (sicurezza).
const { all, get, run } = require('../../persistence/db');
const { genId, badRequest, notFound } = require('../../lib/util');

function publicUser(u) {
  if (!u) return null;
  const { password, ...rest } = u;
  return rest;
}

// registrarsi() - crea un nuovo account utente (+ portafoglio).
function registrarsi({ nome, cognome, email, telefono, password }) {
  if (!nome || !cognome || !email || !password) {
    throw badRequest('nome, cognome, email e password sono obbligatori');
  }
  if (String(password).length < 4) throw badRequest('La password deve avere almeno 4 caratteri');
  const norm = String(email).trim().toLowerCase();
  if (get(`SELECT idUtente FROM Utente WHERE lower(email) = ?`, norm)) {
    throw badRequest('Email già registrata');
  }
  const id = genId('UT');
  run(`INSERT INTO Utente (idUtente, nome, cognome, email, telefono, password, statoAccount)
       VALUES (?,?,?,?,?,?,?)`,
    id, nome.trim(), cognome.trim(), norm, telefono || null, password, 'attivo');
  run(`INSERT INTO PortafoglioDigitale (idPortafoglio, saldo, idUtente) VALUES (?,?,?)`, genId('PRT'), 0, id);
  return getProfilo(id);
}

// autenticarsi()
function login({ email, password }) {
  if (!email || !password) throw badRequest('email e password obbligatorie');
  const u = get(`SELECT * FROM Utente WHERE lower(email) = ?`, String(email).trim().toLowerCase());
  if (!u || u.password !== password) throw badRequest('Credenziali non valide');
  if (u.statoAccount !== 'attivo') throw badRequest(`Account ${u.statoAccount}`);
  return publicUser(u);
}

function getProfilo(idUtente) {
  const u = get(`SELECT * FROM Utente WHERE idUtente = ?`, idUtente);
  if (!u) throw notFound('Utente non trovato');
  return publicUser(u);
}

// aggiornareProfilo()
function aggiornaProfilo(idUtente, { nome, cognome, telefono }) {
  const u = get(`SELECT idUtente FROM Utente WHERE idUtente = ?`, idUtente);
  if (!u) throw notFound('Utente non trovato');
  run(`UPDATE Utente SET nome = COALESCE(?, nome), cognome = COALESCE(?, cognome), telefono = COALESCE(?, telefono) WHERE idUtente = ?`,
    nome || null, cognome || null, telefono || null, idUtente);
  return getProfilo(idUtente);
}

// autenticarsi() per l'Operatore del servizio (client web Operatore).
function loginOperatore({ email, password }) {
  if (!email || !password) throw badRequest('email e password obbligatorie');
  const o = get(`SELECT * FROM Operatore WHERE email = ?`, email);
  if (!o || o.password !== password) throw badRequest('Credenziali non valide');
  return publicUser(o);
}

function getOperatore(idOperatore) {
  const o = get(`SELECT * FROM Operatore WHERE idOperatore = ?`, idOperatore);
  if (!o) throw notFound('Operatore non trovato');
  return publicUser(o);
}

// autenticarsi() per l'Amministrazione Comunale (client integrato nell'app).
function loginAmministrazione({ email, password }) {
  if (!email || !password) throw badRequest('email e password obbligatorie');
  const a = get(`SELECT * FROM AmministrazioneComunale WHERE email = ?`, email);
  if (!a || a.password !== password) throw badRequest('Credenziali non valide');
  return publicUser(a);
}

function getAmministrazione(idAmministrazione) {
  const a = get(`SELECT * FROM AmministrazioneComunale WHERE idAmministrazione = ?`, idAmministrazione);
  if (!a) throw notFound('Amministrazione non trovata');
  return publicUser(a);
}

// ===== Patente (UT.07) =====

function getPatente(idUtente) {
  return get(`SELECT idPatente, numeroPatente, categoria, dataScadenza, statoVerifica
              FROM Patente WHERE idUtente = ? ORDER BY rowid DESC LIMIT 1`, idUtente) || null;
}

// caricaPatente() + verificaValidita() (verifica simulata su scadenza).
function salvaPatente(idUtente, { numeroPatente, categoria, dataScadenza }) {
  if (!get(`SELECT idUtente FROM Utente WHERE idUtente = ?`, idUtente)) throw notFound('Utente non trovato');
  if (!numeroPatente || String(numeroPatente).trim().length < 5) throw badRequest('Numero patente non valido');
  let stato = 'in_attesa';
  if (dataScadenza) {
    const scad = new Date(dataScadenza);
    stato = !isNaN(scad.getTime()) && scad.getTime() < Date.now() ? 'rifiutata' : 'verificata';
  }
  const esistente = getPatente(idUtente);
  if (esistente) {
    run(`UPDATE Patente SET numeroPatente = ?, categoria = ?, dataScadenza = ?, statoVerifica = ? WHERE idPatente = ?`,
      numeroPatente.trim(), categoria || null, dataScadenza || null, stato, esistente.idPatente);
  } else {
    run(`INSERT INTO Patente (idPatente, numeroPatente, categoria, dataScadenza, statoVerifica, idUtente)
         VALUES (?,?,?,?,?,?)`, genId('PAT'), numeroPatente.trim(), categoria || null, dataScadenza || null, stato, idUtente);
  }
  return getPatente(idUtente);
}

// ===== Gestione account utente da parte dell'Operatore (OP.09) =====

function listaUtenti(q) {
  let sql = `SELECT idUtente, nome, cognome, email, telefono, statoAccount FROM Utente`;
  const params = [];
  if (q) {
    const t = `%${String(q).toLowerCase()}%`;
    sql += ` WHERE lower(email) LIKE ? OR lower(nome) LIKE ? OR lower(cognome) LIKE ?`;
    params.push(t, t, t);
  }
  sql += ` ORDER BY cognome, nome`;
  return all(sql, ...params);
}

// OP.09 - sospendere/bloccare/riattivare un account.
function aggiornaStatoAccount(idUtente, { statoAccount }) {
  if (!['attivo', 'sospeso', 'bloccato'].includes(statoAccount)) throw badRequest('Stato account non valido');
  if (!get(`SELECT idUtente FROM Utente WHERE idUtente = ?`, idUtente)) throw notFound('Utente non trovato');
  run(`UPDATE Utente SET statoAccount = ? WHERE idUtente = ?`, statoAccount, idUtente);
  return getProfilo(idUtente);
}

module.exports = {
  registrarsi, login, getProfilo, aggiornaProfilo,
  getPatente, salvaPatente,
  listaUtenti, aggiornaStatoAccount,
  loginOperatore, getOperatore,
  loginAmministrazione, getAmministrazione,
};
