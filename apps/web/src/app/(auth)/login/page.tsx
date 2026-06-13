'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script';
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
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isMobileApp = (window as any).Capacitor ||
        window.location.origin.includes('capacitor://') ||
        ((window.location.hostname === 'localhost' || window.location.hostname === '') && window.location.port === '');
      setIsMobile(!!isMobileApp);
    }
  }, []);

  useEffect(() => {
    const s = getSession();
    if (s && s.user && s.user.role) {
      if (s.user.role === 'admin') {
        router.push('/admin');
      } else if (s.user.role === 'driver') {
        router.push('/driver');
      } else {
        router.push('/passenger');
      }
    }
  }, [router]);

  useEffect(() => {
    if (isMobile) return;

    const handleCredentialResponse = async (response: any) => {
      setLoading(true);
      setError('');
      try {
        const res = await api.post('/auth/google/check', {
          credential: response.credential,
        });

        if (res.data.exists) {
          const userData = res.data.user || res.data.driver;
          saveSession(res.data.accessToken, { ...userData, role: res.data.role });

          if (res.data.role === 'admin') router.push('/admin');
          else if (res.data.role === 'driver') router.push('/driver');
          else router.push('/passenger');
        } else {
          const params = new URLSearchParams({
            google: 'true',
            email: res.data.email || '',
            name: res.data.name || '',
            credential: response.credential,
          });
          router.push(`/register?${params.toString()}`);
        }
      } catch (err: any) {
        const e = err as { response?: { status?: number; data?: { error?: string } } };
        const status = e.response?.status;
        const errorMsg = e.response?.data?.error;
        let friendlyError = '';
        if (status === 401) {
          friendlyError = 'La cuenta de Google no es válida o ha expirado. Por favor, inicia sesión de nuevo.';
        } else if (!e.response) {
          friendlyError = 'No pudimos conectar con el servidor. Verifica tu conexión a internet.';
        } else {
          friendlyError = errorMsg || 'Error al iniciar sesión con Google';
        }
        setError(friendlyError);
        setLoading(false);
      }
    };

    const initGoogle = () => {
      if (typeof window !== 'undefined' && (window as any).google?.accounts?.id) {
        const client_id = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '1047712170366-g8kvdh9cbrp0h9o9dghfsq7g8r0f6u1a.apps.googleusercontent.com';
        (window as any).google.accounts.id.initialize({
          client_id,
          callback: handleCredentialResponse,
        });

        const btnContainer = document.getElementById('google-btn-container');
        if (btnContainer) {
          (window as any).google.accounts.id.renderButton(
            btnContainer,
            { theme: 'outline', size: 'large', type: 'standard', shape: 'rectangular', text: 'continue_with', logo_alignment: 'left' }
          );
        }
      }
    };

    const interval = setInterval(() => {
      if (typeof window !== 'undefined' && (window as any).google?.accounts?.id) {
        initGoogle();
        clearInterval(interval);
      }
    }, 200);

    const timeout = setTimeout(() => {
      clearInterval(interval);
    }, 15000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [isMobile, router]);

  const handleNativeGoogleLogin = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth');
      await GoogleAuth.initialize({
        clientId: '974516739677-bvnm3kh8fn6qv6u59rqga6scbpdqtl4a.apps.googleusercontent.com',
        scopes: ['profile', 'email'],
        grantOfflineAccess: true,
      });
      const user = await GoogleAuth.signIn();
      if (user && user.authentication && user.authentication.idToken) {
        const res = await api.post('/auth/google/check', {
          credential: user.authentication.idToken,
        });

        if (res.data.exists) {
          const userData = res.data.user || res.data.driver;
          saveSession(res.data.accessToken, { ...userData, role: res.data.role });

          if (res.data.role === 'admin') router.push('/admin');
          else if (res.data.role === 'driver') router.push('/driver');
          else router.push('/passenger');
        } else {
          const params = new URLSearchParams({
            google: 'true',
            email: res.data.email || '',
            name: res.data.name || '',
            credential: user.authentication.idToken,
          });
          router.push(`/register?${params.toString()}`);
        }
      } else {
        setError('No se pudo obtener el token de autenticación de Google');
        setLoading(false);
      }
    } catch (err: any) {
      console.error('Native Google Error:', err);
      const errMsg = err?.message || err?.errorMessage || (typeof err === 'string' ? err : JSON.stringify(err));
      let friendlyError = 'Error al iniciar sesión con Google.';
      if (errMsg && errMsg.toLowerCase().includes('cancel')) {
        friendlyError = 'Inicio de sesión con Google cancelado por el usuario.';
      } else if (errMsg) {
        friendlyError = `Error al iniciar sesión con Google: ${errMsg}`;
      }
      setError(friendlyError);
      setLoading(false);
    }
  };

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validación de formato de email local
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Por favor, ingresa un correo electrónico válido (ejemplo: usuario@dominio.com).');
      setLoading(false);
      return;
    }

    let success = false;
    try {
      const endpoint = role === 'driver' ? '/auth/driver/login'
        : '/auth/passenger/login';

      const res = await api.post(endpoint, { email, password });
      const userData = res.data.user || res.data.driver;

      if (userData && userData.role === 'admin') {
        saveSession(res.data.accessToken, userData);
      } else {
        saveSession(res.data.accessToken, { ...userData, role });
      }
      success = true;
    } catch (err: unknown) {
      const e = err as { response?: { status?: number; data?: { error?: string } } };
      const status = e.response?.status;
      const errorMsg = e.response?.data?.error;

      let friendlyError = '';
      if (status === 401) {
        friendlyError = 'El correo o la contraseña son incorrectos. Por favor, verifica tus datos e inténtalo de nuevo.';
      } else if (status === 404) {
        friendlyError = 'Esta cuenta no está registrada. Por favor, regístrate si aún no tienes una cuenta.';
      } else if (status === 500) {
        friendlyError = 'Hubo un problema interno en el servidor. Por favor, inténtalo de nuevo más tarde.';
      } else if (!e.response) {
        friendlyError = 'No pudimos conectar con el servidor. Verifica tu conexión a internet.';
      } else {
        friendlyError = errorMsg || 'Error al iniciar sesión. Por favor, inténtalo de nuevo.';
      }

      setError(friendlyError);
      setLoading(false);
    }

    if (success) {
      const s = getSession();
      if (s && s.user) {
        if (s.user.role === 'admin') router.push('/admin');
        else if (s.user.role === 'driver') router.push('/driver');
        else router.push('/passenger');
      }
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

        {error && (
          <div className="alert alert-error" style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
            <span>{error}</span>
          </div>
        )}

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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label className="form-label" style={{ margin: 0 }}>Contraseña</label>
            </div>
            <input
              id="login-password"
              className="form-input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            <Link href="/forgot-password" style={{ color: 'var(--accent)', fontSize: '0.8rem', fontWeight: 600 }}>
              ¿Olvidaste tu contraseña?
            </Link>
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

        <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
          {isMobile ? (
            <button
              type="button"
              onClick={handleNativeGoogleLogin}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                width: '100%',
                maxWidth: '356px',
                height: '44px',
                background: '#ffffff',
                border: '1px solid #dadce0',
                borderRadius: '4px',
                color: '#3c4043',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background-color .218s, border-color .218s',
                boxShadow: 'none',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continuar con Google
            </button>
          ) : (
            <div id="google-btn-container" style={{ width: '100%', minHeight: '44px', display: 'flex', justifyContent: 'center' }}></div>
          )}
        </div>

        <div className="divider" style={{ margin: '32px 0', color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center', position: 'relative' }}>
          <span style={{ background: 'var(--bg-card)', padding: '0 12px', position: 'relative', zIndex: 1 }}>o</span>
          <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: 'var(--border)', zIndex: 0 }} />
        </div>

        <p className="text-center" style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          ¿No tienes cuenta?{' '}
          <Link href="/register" style={{ color: 'var(--accent)', fontWeight: 600 }}>Regístrate gratis</Link>
        </p>
      </div>
      {!isMobile && <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />}
    </div>
  );
}
