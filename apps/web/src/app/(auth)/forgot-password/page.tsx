'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import Logo from '@/components/Logo';

type Role = 'passenger' | 'driver';
type Step = 1 | 2;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [role, setRole] = useState<Role>('passenger');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Enviar código de recuperación
  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validación local simple de formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Por favor, ingresa un correo electrónico válido.');
      setLoading(false);
      return;
    }

    try {
      await api.post('/auth/forgot-password', { email, role });
      setStep(2);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Hubo un problema al solicitar el código. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  // Restablecer contraseña
  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (code.length !== 6) {
      setError('El código debe tener 6 dígitos.');
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres.');
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      setLoading(false);
      return;
    }

    try {
      const res = await api.post('/auth/reset-password', {
        email,
        role,
        code,
        newPassword
      });
      setSuccess(res.data.message || 'Contraseña restablecida con éxito.');
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Código incorrecto, expirado o inválido.');
      setLoading(false);
    }
  }

  return (
    <div className="app-container" style={{ background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '24px' }}>

      <div style={{ position: 'absolute', top: '24px', left: '24px' }}>
        <Link href="/login" style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          REGRESAR AL LOGIN
        </Link>
      </div>

      <div className="card" style={{ width: '100%', maxWidth: '420px', padding: '40px 32px', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
          <Logo width="160" height="60" />
          <h2 style={{ color: 'var(--text-primary)', fontWeight: 800, fontSize: '1.4rem', margin: 0, textAlign: 'center' }}>
            {step === 1 ? 'Recuperar Contraseña' : 'Nueva Contraseña'}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', margin: 0, lineHeight: 1.4 }}>
            {step === 1 
              ? 'Te enviaremos un código de seguridad para restablecer tu contraseña.'
              : `Ingresa el código enviado a tu correo e ingresa tu nueva contraseña.`
            }
          </p>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="alert alert-success" style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#10B981', padding: '12px', borderRadius: 'var(--radius)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <span>{success}</span>
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleSendCode} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Role selector */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px',
              padding: '4px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius)',
              marginBottom: '12px'
            }}>
              {([
                { key: 'passenger', label: 'Pasajero' },
                { key: 'driver', label: 'Conductor' },
              ] as { key: Role; label: string }[]).map(r => (
                <button
                  key={r.key}
                  type="button"
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

            <div className="form-group">
              <label className="form-label">Correo Electrónico</label>
              <input
                id="forgot-email"
                className="form-input"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <button
              id="forgot-submit"
              type="submit"
              className={`btn btn-primary btn-lg btn-block ${loading ? 'btn-loading' : ''}`}
              disabled={loading}
              style={{
                marginTop: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.88rem',
                lineHeight: '1.2',
                padding: '10px 16px',
                height: 'auto',
                minHeight: '44px',
                textAlign: 'center'
              }}
            >
              {loading ? '' : 'Enviar código de recuperación →'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <div className="form-group">
              <label className="form-label" style={{ textAlign: 'center', display: 'block', marginBottom: '8px' }}>Código de 6 dígitos</label>
              <input
                id="reset-code"
                className="form-input text-center"
                type="text"
                maxLength={6}
                placeholder="000000"
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                style={{
                  fontSize: '1.8rem',
                  letterSpacing: '8px',
                  textAlign: 'center',
                  fontWeight: 700,
                  padding: '10px',
                  background: 'var(--bg-secondary)',
                  borderRadius: '12px',
                  border: '2px solid var(--border)'
                }}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Nueva Contraseña</label>
              <input
                id="reset-password"
                className="form-input"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Confirmar Contraseña</label>
              <input
                id="reset-confirm-password"
                className="form-input"
                type="password"
                placeholder="Repite la contraseña"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button
              id="reset-submit"
              type="submit"
              className={`btn btn-primary btn-lg btn-block ${loading ? 'btn-loading' : ''}`}
              disabled={loading}
              style={{
                marginTop: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.88rem',
                lineHeight: '1.2',
                padding: '10px 16px',
                height: 'auto',
                minHeight: '44px',
                textAlign: 'center'
              }}
            >
              {loading ? '' : 'Restablecer contraseña →'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
