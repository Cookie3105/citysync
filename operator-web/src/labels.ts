import type { StatoMezzo, TipoMezzo } from './types';

export const tipoLabel: Record<TipoMezzo, string> = { bici: 'Bici', escooter: 'E-Scooter', auto: 'Auto' };
export const tipoEmoji: Record<TipoMezzo, string> = { bici: '🚲', escooter: '🛴', auto: '🚗' };

export const statoMezzoLabel: Record<StatoMezzo, string> = {
  disponibile: 'Disponibile', prenotato: 'Prenotato', in_uso: 'In uso',
  in_manutenzione: 'In manutenzione', fuori_servizio: 'Fuori servizio', bloccato: 'Bloccato',
};

export const statoMezzoColor: Record<StatoMezzo, string> = {
  disponibile: '#23A455', prenotato: '#1B7E9C', in_uso: '#E0992A',
  in_manutenzione: '#8A6FB0', fuori_servizio: '#E04848', bloccato: '#5A6B76',
};

export const statoGenericoColor: Record<string, string> = {
  aperta: '#1B7E9C', in_gestione: '#E0992A', chiusa: '#23A455',
  in_corso: '#E0992A', attiva: '#1B7E9C',
};

export function energyColor(l: number) {
  if (l >= 50) return '#23A455';
  if (l >= 20) return '#E0992A';
  return '#E04848';
}

export const eur = (n: number | null | undefined) => (n == null ? '—' : `€ ${Number(n).toFixed(2)}`);
export const dataBreve = (d?: string) => (d ? d.split('-').reverse().join('/') : '');
export const ora = (t?: string) => (t ? t.slice(0, 5) : '');
export function oraIso(iso?: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
}
