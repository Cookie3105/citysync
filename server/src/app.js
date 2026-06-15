// API Server (componente del Server). Configura l'app Express, espone l'API REST
// e gestisce in modo centralizzato gli errori (RispostaClient di errore).
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const routes = require('./routes');
const { HttpError } = require('./lib/util');

function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(morgan('dev'));

  app.get('/', (_req, res) =>
    res.json({ service: 'CitySync API Server', version: '2.0', api: '/api' }));

  app.use('/api', routes);

  // 404
  app.use((req, res) => {
    res.status(404).json({ error: 'Not Found', path: req.path });
  });

  // Error handler centralizzato.
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, _next) => {
    const status = err instanceof HttpError ? err.status : (err.status || 500);
    if (status >= 500) console.error(err);
    res.status(status).json({ error: err.message || 'Errore interno', code: err.code });
  });

  return app;
}

module.exports = { createApp };
