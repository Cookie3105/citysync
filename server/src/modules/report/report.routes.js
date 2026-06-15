const { Router } = require('express');
const svc = require('./report.service');
const { asyncHandler } = require('../../lib/util');

const router = Router();

// AP01 - GET /api/report  -> elenco report disponibili
router.get('/', asyncHandler((_req, res) => res.json(svc.reportDisponibili())));

// AP01 - GET /api/report/mobilita
router.get('/mobilita', asyncHandler((_req, res) => res.json(svc.reportMobilita())));

// AP05 - GET /api/report/tratte
router.get('/tratte', asyncHandler((_req, res) => res.json(svc.reportTratte())));

// AP03 - GET /api/report/stato-mezzi
router.get('/stato-mezzi', asyncHandler((_req, res) => res.json(svc.statoMezzi())));

module.exports = router;
