const { Router } = require('express');
const svc = require('./percorsi.service');
const { asyncHandler } = require('../../lib/util');

const router = Router();

// UT.08 - POST /api/percorsi { partenza:{lat,lon}, arrivo:{lat,lon}, tipoMezzo? }
router.post('/', asyncHandler(async (req, res) => res.json(await svc.calcola(req.body))));

module.exports = router;
