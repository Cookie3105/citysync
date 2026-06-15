import type { ReactNode } from 'react';
import { X, Loader2 } from 'lucide-react';
import { energyColor } from '../labels';

export function Badge({ text, color }: { text: string; color: string }) {
  return (
    <span className="badge" style={{ background: `${color}1A`, color }}>
      <span className="badge-dot" style={{ background: color }} />
      {text}
    </span>
  );
}

export function EnergyBar({ level }: { level: number }) {
  const c = energyColor(level);
  return (
    <span className="flex" style={{ gap: 6 }}>
      <span className="energy"><span style={{ width: `${Math.max(4, level)}%`, background: c }} /></span>
      <span style={{ color: c, fontWeight: 700, fontSize: 13 }}>{level}%</span>
    </span>
  );
}

export function Spinner() {
  return (
    <div className="empty">
      <Loader2 size={28} className="spin" color="var(--accent)" />
    </div>
  );
}

export function StatCard({ icon, label, value, color }: { icon: ReactNode; label: string; value: ReactNode; color: string }) {
  return (
    <div className="stat">
      <div className="stat-top">
        <span className="stat-value">{value}</span>
        <span className="stat-icon" style={{ background: `${color}1A`, color }}>{icon}</span>
      </div>
      <span className="stat-label">{label}</span>
    </div>
  );
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
