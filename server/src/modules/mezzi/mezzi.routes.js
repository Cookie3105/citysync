const { Router } = require('express');
const svc = require('./mezzi.service');
const { asyncHandler, notFound } = require('../../lib/util');

const router = Router();

// UT.01 - GET /api/mezzi?lat=&lon=&raggio=&tipo=&tutti=
router.get('/', asyncHandler((req, res) => {
  const { lat, lon, raggio, tipo, tutti } = req.query;
  if (tutti === 'true') return res.json(svc.listaTutti());
  const mezzi = svc.listaDisponibili({
    lat: lat != null ? Number(lat) : undefined,
    lon: lon != null ? Number(lon) : undefined,
    raggioMetri: raggio != null ? Number(raggio) : undefined,
    tipoMezzo: tipo || undefined,
  });
  res.json(mezzi);
}));

// UT.06 / UT.12 - GET /api/mezzi/:id (caratteristiche tecniche + livello energia)
router.get('/:id', asyncHandler((req, res) => {
  const mezzo = svc.getById(req.params.id);
  if (!mezzo) throw notFound('Mezzo non trovato');
  res.json(mezzo);
}));

// OP.14 - POST /api/mezzi (registrare nuovo mezzo)
router.post('/', asyncHandler((req, res) => {
  res.status(201).json(svc.registra(req.body));
}));

// OP.13 - PATCH /api/mezzi/:id/stato { statOperativo }
router.patch('/:id/stato', asyncHandler((req, res) => {
  res.json(svc.aggiornaStato(req.params.id, req.body.statOperativo));
}));

// PATCH /api/mezzi/:id/posizione { lat, lon, indirizzo }
router.patch('/:id/posizione', asyncHandler((req, res) => {
  res.json(svc.aggiornaPosizione(req.params.id, req.body));
}));

module.exports = router;
