// Entry point del Server CitySync.
// Inizializza la persistenza (schema + seed se vuoto) e avvia l'API Server.
const { createApp } = require('./app');
const { initSchema, get, run, DB_PATH } = require('./persistence/db');
const { genId } = require('./lib/util');

const PORT = process.env.PORT || 4000;

function ensureSeed() {
  initSchema();
  const demo = get(`SELECT idUtente FROM Utente WHERE idUtente = 'UT-demo'`);
  if (!demo) {
    console.log('Database vuoto: eseguo il seed iniziale...');
    // Riutilizza lo script di seed.
    require('./persistence/seed');
  }
}

ensureSeed();

const app = createApp();
app.listen(PORT, () => {
  console.log('========================================');
  console.log(' CitySync API Server avviato');
  console.log(`  URL:  http://localhost:${PORT}`);
  console.log(`  API:  http://localhost:${PORT}/api`);
  console.log(`  DB:   ${DB_PATH}`);
  console.log('========================================');
});
