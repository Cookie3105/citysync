// Client API verso l'API Server (interfacce RichiestaClient / RispostaClient).
export const API_BASE =
  (import.meta.env.VITE_API_URL || 'http://localhost:4000') + '/api';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE';

async function request<T>(method: Method, path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'Server non raggiungibile. Avvia il server CitySync (porta 4000).');
  }
  const text = await res.text();
  const data = text ? safeParse(text) : null;
  if (!res.ok) {
    throw new ApiError(res.status, (data && (data.error || data.message)) || `Errore ${res.status}`);
  }
  return data as T;
}

function safeParse(t: string): any {
  try { return JSON.parse(t); } catch { return { error: t }; }
}

export const http = {
  get: <T>(p: string) => request<T>('GET', p),
  post: <T>(p: string, b?: unknown) => request<T>('POST', p, b),
  patch: <T>(p: string, b?: unknown) => request<T>('PATCH', p, b),
  del: <T>(p: string) => request<T>('DELETE', p),
};
