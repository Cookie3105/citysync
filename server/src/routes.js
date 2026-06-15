// API Server - montaggio delle rotte dei moduli applicativi sotto /api.
// Le rotte costituiscono l'interfaccia RichiestaClient (ingresso) e
// restituiscono l'esito tramite RispostaClient (JSON in uscita).
const { Router } = require('express');

const router = Router();

router.use('/auth', require('./modules/utenti/utenti.routes'));
router.use('/mezzi', require('./modules/mezzi/mezzi.routes'));
router.use('/prenotazioni', require('./modules/prenotazioni/prenotazioni.routes'));
router.use('/noleggi', require('./modules/noleggi/noleggi.routes'));
router.use('/pagamenti', require('./modules/pagamenti/pagamenti.routes'));
router.use('/assistenza', require('./modules/assistenza/assistenza.routes'));
router.use('/manutenzione', require('./modules/manutenzione/manutenzione.routes'));
router.use('/monitoraggio', require('./modules/monitoraggio/monitoraggio.routes'));
router.use('/aree', require('./modules/aree/aree.routes'));
router.use('/percorsi', require('./modules/percorsi/percorsi.routes'));
router.use('/report', require('./modules/report/report.routes'));
router.use('/incentivi', require('./modules/incentivi/incentivi.routes'));

// Health check
router.get('/health', (_req, res) => res.json({ ok: true, service: 'CitySync API', version: '2.0' }));

module.exports = router;
