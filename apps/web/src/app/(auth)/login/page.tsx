'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api, { saveSession, getSession, API_URL } from '@/lib/api';
import Logo from '@/components/Logo';

type Role = 'passenger' | 'driver';

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role>('passenger');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const s = getSession();
    if (s && s.user && s.user.role) {
      if (s.user.role === 'driver') {
        router.push('/driver');
      } else {
        router.push('/passenger');
      }
    }
  }, [router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    let success = false;
    try {
      const endpoint = role === 'driver' ? '/auth/driver/login'
          : '/auth/passenger/login';

      const res = await api.post(endpoint, { email, password });
      const userData = res.data.user || res.data.driver;

      saveSession(res.data.accessToken, { ...userData, role });
      success = true;
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e.response?.data?.error || 'Error al iniciar sesión');
      setLoading(false);
    }

    if (success) {
      if (role === 'driver') router.push('/driver');
      else router.push('/passenger');
    }
  }

  return (
    <div className="app-container" style={{ background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '24px' }}>

      <div style={{ position: 'absolute', top: '24px', left: '24px' }}>
        <Link href="/" style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
          ← REGRESAR AL INICIO
        </Link>
      </div>

      <div className="card" style={{ width: '100%', maxWidth: '420px', padding: '40px 32px', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
          <Logo width="160" height="60" />
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Bienvenido de vuelta</p>
        </div>

        {/* Role selector */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px',
          padding: '4px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius)',
          marginBottom: '32px'
        }}>
          {([
            { key: 'passenger', label: 'Pasajero' },
            { key: 'driver', label: 'Conductor' },
          ] as { key: Role; label: string }[]).map(r => (
            <button
              key={r.key}
              id={`role-${r.key}`}
              onClick={() => setRole(r.key)}
              style={{
                padding: '9px 4px', border: 'none', borderRadius: 'calc(var(--radius) - 4px)',
                cursor: 'pointer', fontWeight: 600, fontSize: '0.78rem', transition: 'var(--transition)',
                background: role === r.key ? 'var(--accent)' : 'transparent',
                color: role === r.key ? '#09090F' : 'var(--text-muted)',
              }}
            >
              {r.label}
            </button>
          ))}
        </div>

        {error && <div className="alert alert-error" style={{ marginBottom: '24px' }}>⚠️ {error}</div>}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              id="login-email"
              className="form-input"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <input
              id="login-password"
              className="form-input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            id="login-submit"
            type="submit"
            className={`btn btn-primary btn-lg btn-block ${loading ? 'btn-loading' : ''}`}
            disabled={loading}
            style={{ marginTop: '12px' }}
          >
            {loading ? '' : 'Iniciar sesión →'}
          </button>
        </form>

        <div className="divider" style={{ margin: '32px 0', color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center', position: 'relative' }}>
          <span style={{ background: 'var(--bg-card)', padding: '0 12px', position: 'relative', zIndex: 1 }}>o</span>
          <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: 'var(--border)', zIndex: 0 }} />
        </div>

        <p className="text-center" style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          ¿No tienes cuenta?{' '}
          <Link href="/register" style={{ color: 'var(--accent)', fontWeight: 600 }}>Regístrate gratis</Link>
        </p>
        <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.65rem', color: 'var(--text-muted)', opacity: 0.4 }}>
          API: {API_URL}
        </div>
      </div>
    </div>
  );
}
