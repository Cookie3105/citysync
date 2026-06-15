const { Router } = require('express');
const svc = require('./aree.service');
const { asyncHandler } = require('../../lib/util');

const router = Router();

// GET /api/aree -> aree limitate/consentite (per disegnarle sulla mappa)
router.get('/', asyncHandler((_req, res) => res.json(svc.listaAree())));

// GET /api/aree/stazioni -> stazioni di ricarica
router.get('/stazioni', asyncHandler((_req, res) => res.json(svc.listaStazioni())));

// GET /api/aree/verifica-parcheggio?lat=&lon= (OP.04 puntuale)
router.get('/verifica-parcheggio', asyncHandler((req, res) => {
  res.json(svc.verificaParcheggio(Number(req.query.lat), Number(req.query.lon)));
}));

// AP06 - POST /api/aree { nomeArea, tipoLimitazione, descrizione, posizione, raggioMetri }
router.post('/', asyncHandler((req, res) => res.status(201).json(svc.creaAreaLimitata(req.body))));

// AP04 - GET/POST/DELETE /api/aree/zone-critiche
router.get('/zone-critiche', asyncHandler((_req, res) => res.json(svc.listaZoneCritiche())));
router.post('/zone-critiche', asyncHandler((req, res) => res.status(201).json(svc.creaZonaCritica(req.body))));
router.delete('/zone-critiche/:id', asyncHandler((req, res) => res.json(svc.eliminaZonaCritica(req.params.id))));

// AP06 - DELETE /api/aree/:id (elimina zona limitata)
router.delete('/:id', asyncHandler((req, res) => res.json(svc.eliminaAreaLimitata(req.params.id))));

module.exports = router;
