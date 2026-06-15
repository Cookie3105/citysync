// API per i casi d'uso dell'Amministrazione Comunale (AP.*), integrate nell'app.
// Usano lo STESSO API Server (nessun servizio esterno).
import { http } from './client';
import type {
  Amministrazione, ReportInfo, ReportMobilita, ReportTratte, StatoMezziResponse,
  AreaLimitata, ZonaCritica, Incentivo,
} from '../models/types';

export const adminApi = {
  // Auth
  login: (email: string, password: string) =>
    http.post<Amministrazione>('/auth/amministrazione/login', { email, password }),

  // Report (AP01, AP05, AP03)
  reportDisponibili: () => http.get<ReportInfo[]>('/report'),
  reportMobilita: () => http.get<ReportMobilita>('/report/mobilita'),         // AP01
  reportTratte: () => http.get<ReportTratte>('/report/tratte'),               // AP05
  statoMezzi: () => http.get<StatoMezziResponse>('/report/stato-mezzi'),      // AP03

  // Zone (AP06 aree limitate, AP04 criticità)
  aree: () => http.get<AreaLimitata[]>('/aree'),
  creaAreaLimitata: (b: Record<string, unknown>) => http.post<AreaLimitata>('/aree', b),          // AP06
  eliminaAreaLimitata: (id: string) => http.del<{ eliminato: boolean }>(`/aree/${id}`),            // AP06
  zoneCritiche: () => http.get<ZonaCritica[]>('/aree/zone-critiche'),
  creaZonaCritica: (b: Record<string, unknown>) => http.post<ZonaCritica>('/aree/zone-critiche', b), // AP04
  eliminaZonaCritica: (id: string) => http.del<{ eliminato: boolean }>(`/aree/zone-critiche/${id}`), // AP04

  // Incentivi (AP07)
  incentivi: () => http.get<Incentivo[]>('/incentivi'),
  creaIncentivo: (b: Record<string, unknown>) => http.post<Incentivo>('/incentivi', b),
  aggiornaIncentivo: (id: string, b: Record<string, unknown>) => http.patch<Incentivo>(`/incentivi/${id}`, b),
};
