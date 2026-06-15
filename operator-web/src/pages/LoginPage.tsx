import { useState } from 'react';
import { MapPin, LogIn } from 'lucide-react';
import { useAuth } from '../auth';
import { ApiError } from '../api/client';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('operatore@citysync.it');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Accesso non riuscito');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={submit}>
        <div className="login-brand">
          <div className="login-logo"><MapPin size={30} color="#fff" /></div>
          <h2 style={{ fontSize: 24 }}>CitySync</h2>
          <div className="small">Console Operatore · Bit &amp; Polpette</div>
        </div>

        <div className="field">
          <label>Email</label>
          <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="username" />
        </div>
        <div className="field">
          <label>Password</label>
          <input className="input" value={password} onChange={(e) => setPassword(e.target.value)} type="password" autoComplete="current-password" />
        </div>

        {error && <p className="error-text">{error}</p>}

        <button className="btn" type="submit" disabled={busy} style={{ width: '100%', marginTop: 6 }}>
          <LogIn size={18} /> {busy ? 'Accesso…' : 'Accedi'}
        </button>
        <p className="small" style={{ textAlign: 'center', marginTop: 16 }}>
          Demo: operatore@citysync.it / password
        </p>
      </form>
    </div>
  );
}
