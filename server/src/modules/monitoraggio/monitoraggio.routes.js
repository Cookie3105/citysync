const { Router } = require('express');
const svc = require('./monitoraggio.service');
const { asyncHandler } = require('../../lib/util');

const router = Router();

// OP.01 - GET /api/monitoraggio/flotta
router.get('/flotta', asyncHandler((_req, res) => res.json(svc.flotta())));

// OP.12 - GET /api/monitoraggio/batteria
router.get('/batteria', asyncHandler((_req, res) => res.json(svc.livelliBatteria())));

// OP.04 - GET /api/monitoraggio/parcheggio
router.get('/parcheggio', asyncHandler((_req, res) => res.json(svc.verificaParcheggioFlotta())));

// OP.05 - GET /api/monitoraggio/posizioni-fine-noleggio
router.get('/posizioni-fine-noleggio', asyncHandler((_req, res) => res.json(svc.posizioniFineNoleggio())));

// OP.08 - GET /api/monitoraggio/bonus-eligibili
router.get('/bonus-eligibili', asyncHandler((_req, res) => res.json(svc.noleggiBonusEligibili())));

// OP.10 - POST /api/monitoraggio/blocco-remoto { idMezzo, forza? }
router.post('/blocco-remoto', asyncHandler(async (req, res) => {
  res.json(await svc.bloccaRemoto(req.body.idMezzo, { forza: req.body.forza === true }));
}));

module.exports = router;
