// Servizio Esterno: Servizio Mappe/GPS - interfaccia IMapProvider.
// In questo increment usa OpenStreetMap (OSM) per il geocoding inverso ed un
// calcolo locale di distanza/percorso. È isolato dietro un'interfaccia così da
// poter essere sostituito con un provider reale (Google Maps / OSRM) senza
// impattare i moduli applicativi.
const { distanzaMetri } = require('../lib/util');

const VELOCITA_MEDIA_KMH = { bici: 15, escooter: 18, auto: 30 };

const IMapProvider = {
  /**
   * Geocoding inverso: coordinate -> indirizzo testuale.
   * Placeholder: usa l'API pubblica Nominatim di OSM se disponibile, altrimenti
   * ritorna una descrizione sintetica (così il server resta funzionante offline).
   */
  async reverseGeocode(lat, lon) {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'CitySync/2.0 (educational project)' },
        signal: AbortSignal.timeout(1500),
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.display_name) return data.display_name;
      }
    } catch {
      /* offline / timeout -> fallback */
    }
    return `Posizione (${lat.toFixed(5)}, ${lon.toFixed(5)})`;
  },

  /**
   * Stima distanza (m) e durata (min) di un tragitto punto-punto.
   * Placeholder: distanza in linea d'aria con fattore di tortuosità urbana 1.3.
   */
  stimaPercorso(from, to, tipoMezzo = 'bici') {
    const lineare = distanzaMetri(from.lat, from.lon, to.lat, to.lon);
    const distanzaStradale = Math.round(lineare * 1.3);
    const kmh = VELOCITA_MEDIA_KMH[tipoMezzo] || 15;
    const durataMin = Math.max(1, Math.round((distanzaStradale / 1000 / kmh) * 60));
    return { distanzaMetri: distanzaStradale, durataMin };
  },
};

module.exports = { IMapProvider };
