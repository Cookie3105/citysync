const { Router } = require('express');
const svc = require('./prenotazioni.service');
const { asyncHandler } = require('../../lib/util');

const router = Router();

// UT.02 - POST /api/prenotazioni { idUtente, idMezzo }
router.post('/', asyncHandler((req, res) => {
  res.status(201).json(svc.crea(req.body));
}));

// UT.16 - POST /api/prenotazioni/multipla { idUtente, idMezzi: [...] }
router.post('/multipla', asyncHandler((req, res) => {
  res.status(201).json(svc.creaMultipla(req.body));
}));

// GET /api/prenotazioni?utente=...  -> prenotazioni dell'utente
// OP.11 - GET /api/prenotazioni?attive=true -> prenotazioni attive con anomalie
router.get('/', asyncHandler((req, res) => {
  if (req.query.attive === 'true') return res.json(svc.listaAttiveConAnomalie());
  if (req.query.utente) return res.json(svc.prenotazioniUtente(req.query.utente));
  res.json(svc.listaAttiveConAnomalie());
}));

// DELETE /api/prenotazioni/:id -> annulla prenotazione
router.delete('/:id', asyncHandler((req, res) => {
  res.json(svc.annulla(req.params.id));
}));

module.exports = router;
