const { Router } = require('express');
const svc = require('./manutenzione.service');
const { asyncHandler } = require('../../lib/util');

const router = Router();

// OP.06 - GET /api/manutenzione/da-manutenere
router.get('/da-manutenere', asyncHandler((_req, res) => res.json(svc.mezziDaManutenere())));

// GET /api/manutenzione?stato=
router.get('/', asyncHandler((req, res) => res.json(svc.listaInterventi(req.query.stato))));

// OP.06 - POST /api/manutenzione { idMezzo, descrizione, idOperatore?, idSegnalazione? }
router.post('/', asyncHandler((req, res) => res.status(201).json(svc.apriIntervento(req.body))));

// OP.06 - PATCH /api/manutenzione/:id { statoManutenzione, descrizione }
router.patch('/:id', asyncHandler((req, res) => res.json(svc.aggiornaIntervento(req.params.id, req.body))));

module.exports = router;
