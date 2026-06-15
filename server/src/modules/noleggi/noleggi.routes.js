const { Router } = require('express');
const svc = require('./noleggi.service');
const { asyncHandler, badRequest } = require('../../lib/util');

const router = Router();

// UT.03 - POST /api/noleggi/stima { idMezzo, destinazione?, durataMin? }
router.post('/stima', asyncHandler((req, res) => {
  res.json(svc.stimaCosto(req.body));
}));

// GET /api/noleggi?utente=... -> storico (UT.20); &attivo=true -> noleggio attivo
router.get('/', asyncHandler((req, res) => {
  const { utente, attivo } = req.query;
  if (!utente) throw badRequest('parametro "utente" obbligatorio');
  if (attivo === 'true') return res.json(svc.noleggioAttivo(utente));
  res.json(svc.storicoUtente(utente));
}));

// UT.05 - GET /api/noleggi/:id/riepilogo
router.get('/:id/riepilogo', asyncHandler((req, res) => {
  res.json(svc.riepilogo(req.params.id));
}));

// GET /api/noleggi/:id
router.get('/:id', asyncHandler((req, res) => {
  const n = svc.getById(req.params.id);
  if (!n) throw badRequest('Noleggio non trovato');
  res.json(n);
}));

// UT.13 - POST /api/noleggi { idUtente, idMezzo, idPrenotazione? } (avvia)
router.post('/', asyncHandler(async (req, res) => {
  res.status(201).json(await svc.avvia(req.body));
}));

// UT.15 - POST /api/noleggi/:id/pausa  e  /riprendi
router.post('/:id/pausa', asyncHandler(async (req, res) => {
  res.json(await svc.mettiInPausa(req.params.id));
}));
router.post('/:id/riprendi', asyncHandler(async (req, res) => {
  res.json(await svc.riprendi(req.params.id));
}));

// UT.04 - POST /api/noleggi/:id/termina { lat?, lon?, indirizzo? }
router.post('/:id/termina', asyncHandler(async (req, res) => {
  res.json(await svc.termina(req.params.id, req.body || {}));
}));

module.exports = router;
