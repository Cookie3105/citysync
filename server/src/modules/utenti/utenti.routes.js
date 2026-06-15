const { Router } = require('express');
const svc = require('./utenti.service');
const { asyncHandler } = require('../../lib/util');

const router = Router();

// POST /api/auth/register { nome, cognome, email, telefono, password }
router.post('/register', asyncHandler((req, res) => res.status(201).json(svc.registrarsi(req.body))));

// POST /api/auth/login { email, password }
router.post('/login', asyncHandler((req, res) => res.json(svc.login(req.body))));

// GET /api/auth/profilo/:id
router.get('/profilo/:id', asyncHandler((req, res) => res.json(svc.getProfilo(req.params.id))));

// PATCH /api/auth/profilo/:id { nome, cognome, telefono }
router.patch('/profilo/:id', asyncHandler((req, res) => res.json(svc.aggiornaProfilo(req.params.id, req.body))));

// UT.07 - Patente
router.get('/profilo/:id/patente', asyncHandler((req, res) => res.json(svc.getPatente(req.params.id))));
router.post('/profilo/:id/patente', asyncHandler((req, res) => res.status(201).json(svc.salvaPatente(req.params.id, req.body))));

// OP.09 - gestione account utenti (operatore)
router.get('/utenti', asyncHandler((req, res) => res.json(svc.listaUtenti(req.query.q))));
router.patch('/utenti/:id/stato', asyncHandler((req, res) => res.json(svc.aggiornaStatoAccount(req.params.id, req.body))));

// POST /api/auth/operatore/login { email, password } (client web Operatore)
router.post('/operatore/login', asyncHandler((req, res) => res.json(svc.loginOperatore(req.body))));

// GET /api/auth/operatore/:id
router.get('/operatore/:id', asyncHandler((req, res) => res.json(svc.getOperatore(req.params.id))));

// POST /api/auth/amministrazione/login { email, password } (client Amm. Comunale)
router.post('/amministrazione/login', asyncHandler((req, res) => res.json(svc.loginAmministrazione(req.body))));

// GET /api/auth/amministrazione/:id
router.get('/amministrazione/:id', asyncHandler((req, res) => res.json(svc.getAmministrazione(req.params.id))));

module.exports = router;
