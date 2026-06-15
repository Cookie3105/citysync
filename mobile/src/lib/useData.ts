import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ApiError } from '../api/client';

// Hook di fetch: gestisce loading/errore, ricarica al focus della schermata.
export function useData<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const reload = useCallback(() => {
    setLoading(true);
    return fn()
      .then((d) => { setData(d); setError(null); })
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Errore di caricamento'))
      .finally(() => setLoading(false));
  }, deps);

  useFocusEffect(useCallback(() => { reload(); }, [reload]));

  return { data, loading, error, reload, setData };
}
