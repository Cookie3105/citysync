// Servizio Esterno: Dispositivi IoT a bordo dei mezzi - interfaccia IServiziMezzo.
// PLACEHOLDER (modulo difficile, da completare in un increment successivo).
// Simula i comandi smart-lock (sblocco/blocco) e la telemetria (posizione,
// livello batteria) che nella realtà transitano via Bluetooth/rete dai veicoli.

const IServiziMezzo = {
  // Comando di sblocco rapido (UT.13, smart lock).
  async sblocca(idMezzo) {
    return { ok: true, idMezzo, comando: 'unlock', eseguitoIl: new Date().toISOString() };
  },

  // Comando di blocco (UT.15 pausa, OP.10 blocco remoto).
  async blocca(idMezzo) {
    return { ok: true, idMezzo, comando: 'lock', eseguitoIl: new Date().toISOString() };
  },

  // Telemetria: lettura livello energia residuo (UT.12, OP.12).
  async leggiTelemetria(idMezzo) {
    return { idMezzo, livelloEnergia: null, online: true };
  },
};

module.exports = { IServiziMezzo };
