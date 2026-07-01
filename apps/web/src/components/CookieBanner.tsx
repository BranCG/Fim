'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Verificar si estamos en la App nativa (Capacitor) para no mostrar el banner
    // @ts-ignore
    const isCapacitor = typeof window !== 'undefined' && window.Capacitor?.isNative;
    if (isCapacitor) return;

    // Verificar si ya tomó una decisión sobre las cookies
    const hasDecision = localStorage.getItem('fim_cookies_decision');
    if (!hasDecision) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('fim_cookies_decision', 'accepted');
    setIsVisible(false);
  };

  const handleReject = () => {
    localStorage.setItem('fim_cookies_decision', 'rejected');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'var(--bg-secondary)',
        borderTop: '1px solid var(--accent)',
        padding: '16px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        zIndex: 9999,
        boxShadow: '0 -4px 20px rgba(0,0,0,0.2)'
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
          Utilizamos cookies y tecnologías similares para garantizar el correcto funcionamiento de nuestra plataforma, 
          recordar tus preferencias y proteger tu cuenta. FIM <strong>no utiliza cookies de seguimiento a través de aplicaciones (Cross-App Tracking)</strong> de terceros. 
          Puedes elegir aceptar todas las cookies para una mejor experiencia o rechazarlas (solo se usarán las estrictamente necesarias). 
          Al continuar, aceptas nuestra <Link href="/legal/privacy" style={{ color: 'var(--accent)' }}>Política de Privacidad y Uso de Cookies</Link>.
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button 
            onClick={handleReject}
            style={{
              background: 'transparent',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
              padding: '10px 24px',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            Rechazar
          </button>
          <button 
            onClick={handleAccept}
            style={{
              background: 'var(--accent)',
              color: 'var(--bg-primary)',
              border: 'none',
              padding: '10px 24px',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
}
