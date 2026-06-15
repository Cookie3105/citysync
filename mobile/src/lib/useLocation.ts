import { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import { DEFAULT_REGION } from '../api/config';

// Acquisizione della posizione utente (Servizio GPS). In assenza di permesso o
// posizione, si usa un centro di default (Bari) così la mappa è sempre utile.
export function useLocation() {
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          if (mounted) setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        }
      } catch {
        /* posizione non disponibile -> default */
      } finally {
        if (mounted) setReady(true);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const center = coords || { lat: DEFAULT_REGION.latitude, lon: DEFAULT_REGION.longitude };
  return { coords, center, ready };
}
