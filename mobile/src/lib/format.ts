import type { TipoMezzo, StatoMezzo } from '../models/types';

export const eur = (n: number | null | undefined) =>
  n == null ? '—' : `€ ${Number(n).toFixed(2)}`;

// Valore di un incentivo/bonus con il simbolo corretto: € (sconto diretto sul
// prezzo) oppure % (sconto percentuale), in base all'unità scelta in creazione.
export function valoreIncentivo(valore: number | null | undefined, unita?: string | null) {
  if (valore == null) return '—';
  return unita === 'percentuale'
    ? `${Number(valore)}%`
    : `€ ${Number(valore).toFixed(2)}`;
}

export const tipoLabel: Record<TipoMezzo, string> = {
  bici: 'Bici',
  escooter: 'E-Scooter',
  auto: 'Auto',
};

export const tipoSubtitle: Record<TipoMezzo, string> = {
  bici: 'Pedalata assistita',
  escooter: 'Veloce e agile',
  auto: 'Comfort e spazio',
};

// Icona (MaterialCommunityIcons) per tipo di mezzo.
export const tipoIcon: Record<TipoMezzo, string> = {
  bici: 'bicycle',
  escooter: 'scooter',
  auto: 'car',
};

export const statoMezzoLabel: Record<StatoMezzo, string> = {
  disponibile: 'Disponibile',
  prenotato: 'Prenotato',
  in_uso: 'In uso',
  in_manutenzione: 'In manutenzione',
  fuori_servizio: 'Fuori servizio',
  bloccato: 'Bloccato',
};

// Emoji per tipo mezzo (usate nei marker WebView/Leaflet).
export const tipoEmoji: Record<TipoMezzo, string> = {
  bici: '🚲',
  escooter: '🛴',
  auto: '🚗',
};

// Colori di stato (lato operatore).
export const statoMezzoColor: Record<StatoMezzo, string> = {
  disponibile: '#23A455',
  prenotato: '#1B7E9C',
  in_uso: '#E0992A',
  in_manutenzione: '#8A6FB0',
  fuori_servizio: '#E04848',
  bloccato: '#5A6B76',
};

export const statoGenericoColor: Record<string, string> = {
  aperta: '#1B7E9C',
  in_gestione: '#E0992A',
  chiusa: '#23A455',
  in_corso: '#E0992A',
  attiva: '#1B7E9C',
};

export const ora = (t?: string) => (t ? t.slice(0, 5) : '');

export function distanzaLabel(m?: number | null) {
  if (m == null) return '';
  if (m < 1000) return `${m} m`;
  return `${(m / 1000).toFixed(1)} km`;
}

// Tempo a piedi stimato (~80 m/min) per la distanza dal mezzo.
export function tempoAPiedi(m?: number | null) {
  if (m == null) return '';
  return `${Math.max(1, Math.round(m / 80))} min`;
}

export function oraBreve(iso: string | null | undefined) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
}

export function dataBreve(data?: string) {
  if (!data) return '';
  const [y, m, g] = data.split('-');
  return `${g}/${m}/${y}`;
}
