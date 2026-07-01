'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const reason = localStorage.getItem('admin_logout_reason');
      if (reason === 'duplicate_session') {
        setError('Tu sesión ha sido abierta en otro dispositivo. Por favor, vuelve a iniciar sesión.');
        localStorage.removeItem('admin_logout_reason');
      }
    }
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await api.post('/auth/admin/login', { email, password });
      localStorage.setItem('fim_admin_token', res.data.accessToken);
      localStorage.setItem('fim_admin_user', JSON.stringify(res.data.user));
      router.push('/dashboard');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e.response?.data?.error || 'Credenciales incorrectas');
    } finally { setLoading(false); }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-primary)', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }} className="animate-in">
          <div style={{ fontSize: '2.8rem', fontWeight: 900, letterSpacing: '-0.05em', marginBottom: '8px', color: 'var(--text-primary)' }}>
            Fim<span style={{ color: 'var(--accent)' }}>.</span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.3em', fontWeight: 700 }}>CONTROL CENTER</p>
        </div>

        <div className="card card-glass animate-in" style={{ animationDelay: '0.1s', padding: '40px 32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
            <div style={{ width: '40px', height: '40px', background: 'var(--accent-light)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Acceso Seguro</h2>
          </div>

          {error && (
            <div style={{ 
              padding: '12px 16px', 
              background: 'rgba(255,69,96,0.1)', 
              border: '1px solid rgba(255,69,96,0.2)', 
              borderRadius: 'var(--radius)', 
              color: 'var(--danger)', 
              fontSize: '0.85rem', 
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontWeight: 600
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="admin-email">CORREO AUTORIZADO</label>
              <input 
                id="admin-email" 
                type="email" 
                className="form-input"
                placeholder="admin@fimchile.cl" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="admin-password">CLAVE MAESTRA</label>
              <input 
                id="admin-password" 
                type="password" 
                className="form-input"
                placeholder="••••••••" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
              />
            </div>
            <button 
              id="admin-login-btn" 
              type="submit" 
              className={`btn btn-primary btn-block ${loading ? 'btn-loading' : ''}`} 
              disabled={loading} 
              style={{ marginTop: '12px', padding: '16px' }}
            >
              {!loading && (
                <>
                  INGRESAR AL PANEL
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
