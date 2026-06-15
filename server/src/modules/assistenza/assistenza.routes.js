const { Router } = require('express');
const svc = require('./assistenza.service');
const { asyncHandler } = require('../../lib/util');

const router = Router();

// ---- Segnalazioni guasto ----
// UT.11 - POST /api/assistenza/segnalazioni { idUtente, idMezzo, descrizione }
router.post('/segnalazioni', asyncHandler((req, res) => {
  res.status(201).json(svc.creaSegnalazione(req.body));
}));
// OP.03 - GET /api/assistenza/segnalazioni?stato=
router.get('/segnalazioni', asyncHandler((req, res) => {
  res.json(svc.listaSegnalazioni(req.query.stato));
}));
router.get('/segnalazioni/:id', asyncHandler((req, res) => {
  res.json(svc.getSegnalazione(req.params.id));
}));
// OP.03 - PATCH /api/assistenza/segnalazioni/:id { statoSegnalazione, idOperatore }
router.patch('/segnalazioni/:id', asyncHandler((req, res) => {
  res.json(svc.aggiornaSegnalazione(req.params.id, req.body));
}));

// ---- Richieste assistenza ----
// UT.21 - POST /api/assistenza/richieste { idUtente, descrizione, posizione? }
router.post('/richieste', asyncHandler((req, res) => {
  res.status(201).json(svc.creaRichiesta(req.body));
}));
// OP.07 - GET /api/assistenza/richieste?stato=&utente=
router.get('/richieste', asyncHandler((req, res) => {
  res.json(svc.listaRichieste({ stato: req.query.stato, idUtente: req.query.utente }));
}));
router.get('/richieste/:id', asyncHandler((req, res) => {
  res.json(svc.getRichiesta(req.params.id));
}));
// OP.07 - PATCH /api/assistenza/richieste/:id { statoRichiesta, idOperatore }
router.patch('/richieste/:id', asyncHandler((req, res) => {
  res.json(svc.aggiornaRichiesta(req.params.id, req.body));
}));

// ---- Chat (UT.10) ----
router.get('/richieste/:id/messaggi', asyncHandler((req, res) => {
  res.json(svc.getMessaggi(req.params.id));
}));
router.post('/richieste/:id/messaggi', asyncHandler((req, res) => {
  res.status(201).json(svc.inviaMessaggio(req.params.id, req.body));
}));

module.exports = router;
