const { Router } = require('express');
const svc = require('./pagamenti.service');
const { asyncHandler } = require('../../lib/util');

const router = Router();

// UT.14 - GET /api/pagamenti/metodi?utente=...
router.get('/metodi', asyncHandler((req, res) => res.json(svc.getMetodi(req.query.utente))));

// UT.14 - POST /api/pagamenti/metodi { idUtente, tipoMetodo, intestatario, numero, scadenza, cvv }
router.post('/metodi', asyncHandler((req, res) => {
  const { idUtente, ...dati } = req.body;
  res.status(201).json(svc.salvaMetodo(idUtente, dati));
}));

// DELETE /api/pagamenti/metodi/:id?utente=...
router.delete('/metodi/:id', asyncHandler((req, res) => {
  res.json(svc.rimuoviMetodo(req.query.utente, req.params.id));
}));

// GET /api/pagamenti/portafoglio?utente=...
router.get('/portafoglio', asyncHandler((req, res) => res.json(svc.getPortafoglio(req.query.utente))));

// UT.19 - POST /api/pagamenti/portafoglio/ricarica { idUtente, importo }
router.post('/portafoglio/ricarica', asyncHandler(async (req, res) => {
  res.json(await svc.ricaricaPortafoglio(req.body.idUtente, req.body.importo));
}));

// GET /api/pagamenti?utente=... -> storico pagamenti
router.get('/', asyncHandler((req, res) => res.json(svc.storicoPagamenti(req.query.utente))));

module.exports = router;
