// Componente Persistenza (interfaccia IPersistenza).
// Connessione al DBMS tramite il modulo nativo node:sqlite (nessuna dipendenza nativa).
const { DatabaseSync } = require('node:sqlite');
const fs = require('node:fs');
const path = require('node:path');

const DB_PATH = process.env.CITYSYNC_DB || path.join(__dirname, '..', '..', 'citysync.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA journal_mode = WAL;');

// Applica lo schema (idempotente: usa CREATE TABLE IF NOT EXISTS) e poi le
// migrazioni incrementali per i DB già esistenti (le nuove colonne non vengono
// aggiunte da CREATE TABLE IF NOT EXISTS).
function initSchema() {
  const sql = fs.readFileSync(SCHEMA_PATH, 'utf8');
  db.exec(sql);
  runMigrations();
}

// Aggiunge una colonna solo se non esiste già (ALTER TABLE non è idempotente).
function ensureColumn(table, column, ddl) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all();
  if (!cols.some((c) => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${ddl}`);
  }
}

function runMigrations() {
  // [EXT] Tempo attivo del noleggio (esclude le pause) — vedi UT.15.
  ensureColumn('Noleggio', 'secondiAccumulati', 'secondiAccumulati INTEGER NOT NULL DEFAULT 0');
  ensureColumn('Noleggio', 'ultimaRipresaTs', 'ultimaRipresaTs TEXT');
  // Backfill: i noleggi in corso prima della migrazione partono dal loro inizio.
  db.exec(`UPDATE Noleggio SET ultimaRipresaTs = inizioTs
           WHERE statoNoleggio = 'in_corso' AND ultimaRipresaTs IS NULL`);
  // [EXT] Unità del valore dell'incentivo (€ sconto diretto / % percentuale).
  ensureColumn('Incentivo', 'unitaValore', "unitaValore TEXT NOT NULL DEFAULT 'euro'");
}

// Helper di accesso uniforme alle tabelle.
const all = (sql, ...params) => db.prepare(sql).all(...params);
const get = (sql, ...params) => db.prepare(sql).get(...params);
const run = (sql, ...params) => db.prepare(sql).run(...params);

// Esegue una funzione all'interno di una transazione.
function tx(fn) {
  db.exec('BEGIN');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
}

module.exports = { db, DB_PATH, initSchema, all, get, run, tx };
