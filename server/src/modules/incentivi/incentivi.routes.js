const { Router } = require('express');
const svc = require('./incentivi.service');
const { asyncHandler } = require('../../lib/util');

const router = Router();

// AP07 - GET /api/incentivi
router.get('/', asyncHandler((_req, res) => res.json(svc.lista())));

// UT.09 - GET /api/incentivi/utente/:id (incentivi/promozioni visibili dall'utente)
router.get('/utente/:id', asyncHandler((req, res) => res.json(svc.incentiviUtente(req.params.id))));

// OP.08 - POST /api/incentivi/assegna { idUtente, tipoIncentivo?, valore?, descrizione? }
router.post('/assegna', asyncHandler((req, res) => res.status(201).json(svc.assegna(req.body))));

// AP07 - POST /api/incentivi { tipoIncentivo, valore, descrizione, idAmministrazione? }
router.post('/', asyncHandler((req, res) => res.status(201).json(svc.crea(req.body))));

// AP07 - PATCH /api/incentivi/:id
router.patch('/:id', asyncHandler((req, res) => res.json(svc.aggiorna(req.params.id, req.body))));

module.exports = router;
